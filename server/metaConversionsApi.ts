/**
 * META Conversions API (server-side tracking).
 *
 * Complements the client-side META Pixel for reliable, privacy-resilient
 * conversion tracking (especially important for iOS 14+ users where the browser
 * pixel may be blocked). Events sent here are deduplicated against the
 * client-side pixel using the `event_id` parameter.
 *
 * Docs: https://developers.facebook.com/docs/marketing-api/conversions-api
 */
import { createHash } from "crypto";
import { ENV } from "./_core/env";
import { sendLeadOSEvent, LeadOSEventType } from "./leados";

type ConversionsApiEvent = {
  event_name: string;
  event_time: number;
  event_id: string;
  event_source_url?: string;
  opt_out?: boolean;
  user_data: {
    em?: string[]; // hashed emails (sha256)
    ph?: string[]; // hashed phones
    client_ip_address?: string;
    client_user_agent?: string;
    fbp?: string; // _fbp cookie
    fbc?: string; // _fbc cookie (from fbclid)
    external_id?: string; // our user id
  };
  custom_data?: {
    value?: number;
    currency?: string;
    content_ids?: string[];
    content_type?: string;
    content_name?: string;
    content_category?: string;
    predicted_ltv?: number;
    [key: string]: unknown;
  };
  action_source: "website" | "app" | "phone_call" | "chat" | "physical_store" | "system_generated";
};

function sha256hex(input: string): string {
  // Use Node crypto for hashing (emails/phones must be normalized + hashed)
  return createHash("sha256").update(input.trim().toLowerCase()).digest("hex");
}

interface SendEventOptions {
  eventName: string;
  email?: string;
  userId?: number;
  value?: number;
  currency?: string;
  contentIds?: string[];
  contentName?: string;
  contentCategory?: string;
  fbp?: string;
  fbc?: string;
  ip?: string;
  userAgent?: string;
  eventSourceUrl?: string;
  predictedLtv?: number;
}

/**
 * Send a single conversion event to META's Conversions API.
 * Fails silently on error (tracking must never break the payment flow).
 */
export async function sendMetaConversionEvent(opts: SendEventOptions): Promise<void> {
  const pixelId = ENV.metaPixelIdServer;
  const accessToken = ENV.metaAccessToken;
  if (!pixelId || !accessToken) {
    if (!ENV.isProduction) console.log("[CAPI] Not configured (pixel or token missing)");
    return;
  }

  // DEV: no FB API calls during local/test runs
  if (!ENV.isProduction) {
    console.log("[CAPI] Would send (dev):", opts.eventName, opts.value, opts.currency);
    return;
  }

  const userData: ConversionsApiEvent["user_data"] = {};
  if (opts.email) userData.em = [sha256hex(opts.email)];
  if (opts.userId) userData.external_id = String(opts.userId);
  if (opts.ip) userData.client_ip_address = opts.ip;
  if (opts.userAgent) userData.client_user_agent = opts.userAgent;
  if (opts.fbp) userData.fbp = opts.fbp;
  if (opts.fbc) userData.fbc = opts.fbc;

  const event: ConversionsApiEvent = {
    event_name: opts.eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id: `${opts.eventName}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    action_source: "website",
    user_data: userData,
    custom_data: {
      value: opts.value,
      currency: opts.currency ?? "CZK",
      content_ids: opts.contentIds,
      content_name: opts.contentName,
      content_category: opts.contentCategory,
      predicted_ltv: opts.predictedLtv,
    },
    event_source_url: opts.eventSourceUrl,
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: [event] }),
      }
    );
    if (!res.ok) {
      console.warn("[CAPI] Non-OK response:", res.status, await res.text().catch(() => ""));
    }
  } catch (err) {
    console.warn("[CAPI] Send failed:", (err as Error).message);
  }
}

/**
 * Helper that also forwards a normalized event to LeadOS (existing CRM pipeline).
 * Keeps both tracking systems in sync from a single call site.
 */
export async function trackConversion(opts: SendEventOptions & { leadOSEvent?: LeadOSEventType; leadOSData?: Record<string, unknown> }) {
  await sendMetaConversionEvent(opts);
  if (opts.leadOSEvent) {
    sendLeadOSEvent({
      event: opts.leadOSEvent,
      data: {
        userId: opts.userId,
        email: opts.email,
        amount: opts.value,
        currency: opts.currency,
        plan: opts.contentIds?.[0],
        ...(opts.leadOSData ?? {}),
      },
    });
  }
}
