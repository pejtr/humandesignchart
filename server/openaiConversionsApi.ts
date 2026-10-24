/**
 * OpenAI Ads Conversions API — confirmed server-side purchases only.
 * Data source and key are provisioned separately in the selected Ads Manager
 * account, and injected as server-only OPENAI_ADS_PIXEL_ID and
 * OPENAI_CONVERSIONS_API_KEY. Never bundle the API key in VITE_* variables.
 *
 * The billing webhook is the authority. The return/success page MUST NOT send
 * order_created: a redirect, refresh or forged URL does not prove a purchase.
 * Marketing consent is captured when the order is initiated; without it we
 * do not forward any ad-attribution events.
 */
export type OpenAIOrder = {
  id: string;
  amountMinor: number;
  currency: "CZK" | "EUR";
  oppref?: string;
  consent: boolean;
};

type OpenAIOrderEvent = {
  id: string;
  type: "order_created";
  timestamp_ms: number;
  action_source: "web";
  source_url: string;
  oppref?: string;
  data: { type: "contents"; amount: number; currency: string };
};

export function buildConfirmedOrderEvent(
  order: OpenAIOrder,
  timestampMs = Date.now(),
): OpenAIOrderEvent | null {
  if (!order.consent) return null;
  if (!/^(?:cs_|pi_|in_|sub_|[a-zA-Z0-9_-]{8,255})/.test(order.id)) return null;
  if (!Number.isSafeInteger(order.amountMinor) || order.amountMinor < 1) return null;
  if (!Number.isSafeInteger(timestampMs) || timestampMs <= 0) return null;
  const locale = order.currency === "CZK" ? "cs" : "en";
  const host = locale === "cs" ? "https://humandesignmapa.cz" : "https://humandesignchart.app";
  const event: OpenAIOrderEvent = {
    id: order.id,
    type: "order_created",
    timestamp_ms: timestampMs,
    action_source: "web",
    source_url: host + "/" + locale + "/payment/success",
    data: { type: "contents", amount: order.amountMinor, currency: order.currency },
  };
  if (order.oppref && order.oppref.length <= 255 && !Array.from(order.oppref).some(char => char.charCodeAt(0) < 32)) {
    event.oppref = order.oppref;
  }
  return event;
}

export type VerifiedCloudflareBlueprint = {
  id: string;
  payment_status: string;
  fulfillment_status: string;
  amount_minor: number | string;
  currency: string;
  consent_record_json: string | null;
  is_test?: number | boolean;
};

/** Only a persisted fulfilled order may become an ad conversion. */
export function buildVerifiedCloudflareOrderEvent(
  order: VerifiedCloudflareBlueprint,
  timestampMs = Date.now(),
): OpenAIOrderEvent | null {
  if (order.payment_status !== "PAID" || order.fulfillment_status !== "FULFILLED") return null;
  if (order.is_test === 1 || Boolean(order.is_test)) return null;
  let consent: Record<string, unknown>;
  try {
    consent = JSON.parse(order.consent_record_json || "{}");
    if (!consent || typeof consent !== "object" || Array.isArray(consent)) return null;
  } catch {
    return null;
  }
  if (consent.openAIAdsMarketingConsent !== true) return null;
  if (order.currency !== "CZK" && order.currency !== "EUR") return null;
  const ref = consent.openAIAdsOppref;
  const oppref = typeof ref === "string" && ref.length <= 255 && !Array.from(ref).some(ch => ch.charCodeAt(0) < 32)
    ? ref : undefined;
  return buildConfirmedOrderEvent({
    id: order.id,
    amountMinor: Number(order.amount_minor),
    currency: order.currency,
    oppref,
    consent: true,
  }, timestampMs);
}

/** Used by the Cloudflare Pages runtime, which has env bindings (not process.env). */
export async function sendVerifiedOpenAIEventWithSecrets(
  event: NonNullable<ReturnType<typeof buildConfirmedOrderEvent>>,
  secrets: { OPENAI_ADS_PIXEL_ID?: string; OPENAI_CONVERSIONS_API_KEY?: string },
): Promise<boolean> {
  const pid = secrets.OPENAI_ADS_PIXEL_ID?.trim();
  const key = secrets.OPENAI_CONVERSIONS_API_KEY?.trim();
  if (!pid || !key) return false;
  const response = await fetch("https://bzr.openai.com/v1/events?pid=" + encodeURIComponent(pid), {
    method: "POST",
    headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
    body: JSON.stringify({ integration_source: "optimateo-hdm-cloudflare-v1", events: [event] }),
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) {
    console.warn("[OpenAI CAPI] Event rejected; HTTP", response.status);
    return false;
  }
  return true;
}

export type CapiOutboxClaimResult =
  | { status: "CLAIMED"; order: VerifiedCloudflareBlueprint }
  | { status: "ALREADY_SENT" }
  | { status: "IN_FLIGHT" }
  | { status: "INELIGIBLE" }
  | { status: "DB_ERROR"; error: string };

/**
 * Atomically attempts to claim the CAPI conversion dispatch lease in D1.
 * Uses atomic CAS (Compare-And-Swap) on consent_record_json so concurrent
 * callbacks or polling requests cannot claim or send duplicate events.
 */
export async function claimCapiOutboxLock(
  d1: any,
  paymentRef: string,
): Promise<CapiOutboxClaimResult> {
  const order: any = await d1
    .prepare(
      `SELECT id, payment_status, fulfillment_status, amount_minor, currency, consent_record_json, is_test
       FROM hd_orders WHERE payment_ref = ? LIMIT 1`
    )
    .bind(paymentRef)
    .first();

  if (!order) return { status: "INELIGIBLE" };
  if (order.payment_status !== "PAID" || order.fulfillment_status !== "FULFILLED") {
    return { status: "INELIGIBLE" };
  }
  if (order.is_test === 1 || Boolean(order.is_test)) {
    return { status: "INELIGIBLE" };
  }

  let consent: Record<string, any>;
  try {
    consent = JSON.parse(order.consent_record_json || "{}");
    if (!consent || typeof consent !== "object" || Array.isArray(consent)) {
      return { status: "INELIGIBLE" };
    }
  } catch {
    return { status: "INELIGIBLE" };
  }

  if (consent.openAIAdsMarketingConsent !== true) return { status: "INELIGIBLE" };
  if (consent.openAIAdsCapiSentAt || consent.openAIAdsCapiStatus === "SENT") {
    return { status: "ALREADY_SENT" };
  }

  // Atomic lease claim via CAS UPDATE:
  // Only succeeds if still not SENT, and either uncommitted, FAILED, or stale lease (> 300s).
  try {
    const claimRes = await d1
      .prepare(
        `UPDATE hd_orders
         SET consent_record_json = json_set(
               coalesce(consent_record_json, '{}'),
               '$.openAIAdsCapiStatus', 'IN_FLIGHT',
               '$.openAIAdsCapiClaimedAt', datetime('now')
             ),
             updated_at = CURRENT_TIMESTAMP
         WHERE payment_ref = ?
           AND payment_status = 'PAID'
           AND fulfillment_status = 'FULFILLED'
           AND json_extract(consent_record_json, '$.openAIAdsCapiSentAt') IS NULL
           AND (
             json_extract(consent_record_json, '$.openAIAdsCapiStatus') IS NULL
             OR json_extract(consent_record_json, '$.openAIAdsCapiStatus') = 'FAILED'
             OR (
               json_extract(consent_record_json, '$.openAIAdsCapiStatus') = 'IN_FLIGHT'
               AND (strftime('%s', 'now') - strftime('%s', coalesce(json_extract(consent_record_json, '$.openAIAdsCapiClaimedAt'), '1970-01-01'))) > 300
             )
           )`
      )
      .bind(paymentRef)
      .run();

    const changes = claimRes?.meta?.changes ?? (claimRes?.success ? 1 : 0);
    if (!claimRes?.success || changes === 0) {
      // Another worker won the claim concurrently
      return { status: "IN_FLIGHT" };
    }

    return { status: "CLAIMED", order };
  } catch (err: any) {
    return { status: "DB_ERROR", error: err?.message || "CLAIM_FAILED" };
  }
}

/**
 * Finalizes the CAPI transactional outbox entry.
 * On success: records SENT and openAIAdsCapiSentAt timestamp.
 * On failure: marks FAILED so future callback retries can re-attempt.
 */
export async function finalizeCapiOutboxLock(
  d1: any,
  paymentRef: string,
  success: boolean,
): Promise<void> {
  if (success) {
    await d1
      .prepare(
        `UPDATE hd_orders
         SET consent_record_json = json_set(
               consent_record_json,
               '$.openAIAdsCapiStatus', 'SENT',
               '$.openAIAdsCapiSentAt', CURRENT_TIMESTAMP
             ),
             updated_at = CURRENT_TIMESTAMP
         WHERE payment_ref = ?
           AND json_extract(consent_record_json, '$.openAIAdsCapiStatus') = 'IN_FLIGHT'`
      )
      .bind(paymentRef)
      .run();
  } else {
    await d1
      .prepare(
        `UPDATE hd_orders
         SET consent_record_json = json_set(
               consent_record_json,
               '$.openAIAdsCapiStatus', 'FAILED'
             ),
             updated_at = CURRENT_TIMESTAMP
         WHERE payment_ref = ?
           AND json_extract(consent_record_json, '$.openAIAdsCapiStatus') = 'IN_FLIGHT'`
      )
      .bind(paymentRef)
      .run();
  }
}

/**
 * End-to-end transactional outbox dispatch for Cloudflare Pages Worker runtime.
 * Guarantees exactly-once dispatch semantics even under concurrent callbacks.
 */
export async function executeTransactionalCapiOutbox(
  d1: any,
  env: { OPENAI_ADS_PIXEL_ID?: string; OPENAI_CONVERSIONS_API_KEY?: string },
  paymentRef: string,
): Promise<"SENT" | "ALREADY_SENT" | "IN_FLIGHT" | "INELIGIBLE" | "FAILED"> {
  const claim = await claimCapiOutboxLock(d1, paymentRef);
  if (claim.status !== "CLAIMED") {
    return claim.status === "ALREADY_SENT"
      ? "ALREADY_SENT"
      : claim.status === "IN_FLIGHT"
      ? "IN_FLIGHT"
      : "INELIGIBLE";
  }

  const conversion = buildVerifiedCloudflareOrderEvent(claim.order);
  if (!conversion) {
    await finalizeCapiOutboxLock(d1, paymentRef, false);
    return "INELIGIBLE";
  }

  const accepted = await sendVerifiedOpenAIEventWithSecrets(conversion, env);
  await finalizeCapiOutboxLock(d1, paymentRef, accepted);

  return accepted ? "SENT" : "FAILED";
}

export async function sendConfirmedOpenAIOrder(order: OpenAIOrder): Promise<boolean> {
  const event = buildConfirmedOrderEvent(order);
  if (!event) return false;

  const pixelId = process.env.OPENAI_ADS_PIXEL_ID?.trim();
  const apiKey = process.env.OPENAI_CONVERSIONS_API_KEY?.trim();
  if (!pixelId || !apiKey || process.env.NODE_ENV !== "production") return false;

  const response = await fetch("https://bzr.openai.com/v1/events?pid=" + encodeURIComponent(pixelId), {
    method: "POST",
    headers: {
      Authorization: "Bearer " + apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ integration_source: "optimateo-hdm-v1", events: [event] }),
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) {
    // Do not log an API key, cookie, billing reference or private response body.
    console.warn("[OpenAI CAPI] Event not accepted; HTTP", response.status);
    return false;
  }
  return true;
}
