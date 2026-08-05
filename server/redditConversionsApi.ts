import { createHash } from "crypto";
import { ENV } from "./_core/env";

export type RedditTrackingType =
  | "PAGE_VISIT"
  | "VIEW_CONTENT"
  | "SEARCH"
  | "ADD_TO_CART"
  | "LEAD"
  | "SIGN_UP"
  | "PURCHASE";

export interface RedditConversionOptions {
  trackingType: RedditTrackingType;
  email?: string;
  userId?: number;
  clickId?: string;
  conversionId?: string;
  value?: number;
  currency?: string;
  contentIds?: string[];
  contentName?: string;
  contentCategory?: string;
  ip?: string;
  userAgent?: string;
  eventSourceUrl?: string;
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** Reddit requires canonical email normalization before optional SHA-256 hashing. */
function canonicalizeEmail(email: string): string {
  const [rawLocal, rawDomain] = email.trim().toLowerCase().split("@");
  if (!rawLocal || !rawDomain) return email.trim().toLowerCase();
  const local = rawLocal.split("+")[0].replace(/\./g, "");
  return `${local}@${rawDomain}`;
}

/** Best-effort CAPI v3 dispatch. Tracking can never block a product flow. */
export async function sendRedditConversionEvent(opts: RedditConversionOptions): Promise<boolean> {
  const pixelId = ENV.redditPixelId;
  const accessToken = ENV.redditConversionToken;
  if (!pixelId || !accessToken) {
    if (!ENV.isProduction) console.log(`[Reddit CAPI] ${opts.trackingType} skipped (not configured)`);
    return false;
  }

  if (!ENV.isProduction) {
    console.log("[Reddit CAPI] Would send (dev):", opts.trackingType, opts.value, opts.currency);
    return true;
  }

  const event = {
    event_at: Math.floor(Date.now() / 1000),
    event_source_url: opts.eventSourceUrl ?? "https://www.humandesignmapa.cz",
    action_source: "WEBSITE",
    type: { tracking_type: opts.trackingType },
    click_id: opts.clickId,
    user: {
      ip_address: opts.ip,
      user_agent: opts.userAgent,
      email: opts.email ? sha256(canonicalizeEmail(opts.email)) : undefined,
      external_id: opts.userId ? sha256(`hdm:${opts.userId}`) : undefined,
    },
    metadata: {
      currency: opts.currency ?? "CZK",
      value: opts.value,
      item_count: opts.contentIds?.length,
      conversion_id: opts.conversionId,
      products: opts.contentIds?.map(id => ({
        id,
        name: opts.contentName,
        category: opts.contentCategory,
        quantity: 1,
        item_price: opts.value,
      })),
    },
  };

  try {
    const response = await fetch(
      `https://ads-api.reddit.com/api/v3/pixels/${encodeURIComponent(pixelId)}/conversion_events`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ events: [event] }),
      },
    );
    if (!response.ok) {
      console.warn("[Reddit CAPI] Non-OK response:", response.status, await response.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Reddit CAPI] Send failed:", (error as Error).message);
    return false;
  }
}

