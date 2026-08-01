import { ENV } from "./_core/env";
import crypto from "crypto";

interface CapiUserData {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
  fbc?: string;
  fbp?: string;
}

interface CapiCustomData {
  currency?: string;
  value?: number;
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  [key: string]: unknown;
}

/** Helper to hash user PII using SHA256 as required by Meta CAPI */
function hashSha256(value?: string): string | undefined {
  if (!value) return undefined;
  const clean = value.trim().toLowerCase();
  if (!clean) return undefined;
  return crypto.createHash("sha256").update(clean).digest("hex");
}

/**
 * Send a server-side event to Meta Conversions API (CAPI)
 */
export async function sendMetaCapiEvent({
  eventName,
  eventSourceUrl = "https://www.humandesignmapa.cz",
  userData = {},
  customData,
  eventId,
}: {
  eventName: string;
  eventSourceUrl?: string;
  userData?: CapiUserData;
  customData?: CapiCustomData;
  eventId?: string;
}): Promise<boolean> {
  const pixelId = ENV.metaPixelIdServer;
  const accessToken = ENV.metaAccessToken;

  if (!pixelId || !accessToken) {
    console.log(`[Meta CAPI] Event "${eventName}" skipped (CAPI token or Pixel ID not configured)`);
    return false;
  }

  try {
    const hashedEmail = hashSha256(userData.email);
    const hashedFirstName = hashSha256(userData.firstName);
    const hashedLastName = hashSha256(userData.lastName);

    const payload = {
      data: [
        {
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          event_id: eventId || `ev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          event_source_url: eventSourceUrl,
          action_source: "website",
          user_data: {
            em: hashedEmail ? [hashedEmail] : undefined,
            fn: hashedFirstName ? [hashedFirstName] : undefined,
            ln: hashedLastName ? [hashedLastName] : undefined,
            client_ip_address: userData.clientIpAddress,
            client_user_agent: userData.clientUserAgent,
            fbc: userData.fbc,
            fbp: userData.fbp,
          },
          custom_data: customData,
        },
      ],
    };

    const url = `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[Meta CAPI] API returned error (${res.status}):`, errText);
      return false;
    }

    console.log(`[Meta CAPI] Successfully sent "${eventName}" event`);
    return true;
  } catch (err) {
    console.error("[Meta CAPI] Dispatch error:", err);
    return false;
  }
}
