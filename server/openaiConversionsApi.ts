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
};

/** Only a persisted fulfilled order may become an ad conversion. */
export function buildVerifiedCloudflareOrderEvent(
  order: VerifiedCloudflareBlueprint,
  timestampMs = Date.now(),
): OpenAIOrderEvent | null {
  if (order.payment_status !== "PAID" || order.fulfillment_status !== "FULFILLED") return null;
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
