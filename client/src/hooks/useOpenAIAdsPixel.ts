import { useEffect } from "react";
import { useLocation } from "wouter";

const CONSENT_KEY = "hd-cookie-consent";
const CONSENT_EVENT = "hd:marketing-consent-changed";
const OPPREF_STORAGE_KEY = "hd:openai-ads-oppref";
const PIXEL_SDK = "https://bzrcdn.openai.com/sdk/oaiq.min.js";

type PixelFn = (...args: unknown[]) => void;
type WindowWithOaiq = Window & { oaiq?: PixelFn; __hdOpenAiPixelId?: string };

export function isOpenAIAdsConsentGranted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const data = JSON.parse(localStorage.getItem(CONSENT_KEY) || "{}");
    return data.accepted === true && data.marketing === true;
  } catch {
    return false;
  }
}

function pixelId(): string {
  return String((import.meta as any).env?.VITE_OPENAI_ADS_PIXEL_ID || "").trim();
}

/** Capture the OpenAI Ads click reference only AFTER marketing consent.
 * It is session-scoped, cleared on withdrawal and never forwarded with birth data.
 */
export function getOpenAIAdsClickRef(): string | undefined {
  if (typeof window === "undefined") return undefined;
  if (!isOpenAIAdsConsentGranted()) {
    try { sessionStorage.removeItem(OPPREF_STORAGE_KEY); } catch { /* unavailable */ }
    return undefined;
  }
  try {
    const candidate = new URLSearchParams(window.location.search).get("oppref");
    if (candidate && candidate.length <= 255 && !Array.from(candidate).some(char => char.charCodeAt(0) < 32)) {
      sessionStorage.setItem(OPPREF_STORAGE_KEY, candidate);
    }
    return sessionStorage.getItem(OPPREF_STORAGE_KEY) || undefined;
  } catch { return undefined; }
}

/** Never load the SDK or submit measurement events before marketing consent. */
export function initOpenAIAdsPixelAfterConsent(): boolean {
  const id = pixelId();
  if (!id || typeof window === "undefined" || !isOpenAIAdsConsentGranted()) return false;
  const w = window as WindowWithOaiq;
  if (w.__hdOpenAiPixelId === id) return true;
  if (!w.oaiq) {
    const queue = ((...args: unknown[]) => {
      ((queue as PixelFn & { q: unknown[][] }).q).push(args);
    }) as PixelFn & { q: unknown[][] };
    queue.q = [];
    w.oaiq = queue;
    const script = document.createElement("script");
    script.async = true;
    script.src = PIXEL_SDK;
    script.dataset.hdOpenaiPixel = id;
    document.head.appendChild(script);
  }
  // Explicit deny first: the SDK's default is consent=true.
  w.oaiq("consent", false);
  w.oaiq("init", { pixelId: id });
  w.oaiq("consent", true);
  w.__hdOpenAiPixelId = id;
  return true;
}

export function syncOpenAIAdsPixelConsent(): void {
  if (typeof window === "undefined") return;
  if (isOpenAIAdsConsentGranted()) {
    getOpenAIAdsClickRef();
    initOpenAIAdsPixelAfterConsent();
  } else {
    getOpenAIAdsClickRef(); // Clears persisted click reference on withdrawal.
    (window as WindowWithOaiq).oaiq?.("consent", false);
  }
}

/**
 * No birth data, email, chart details, user identifier or unverified purchase
 * values are ever sent through this client-side pixel.
 */
export function measureOpenAIAdsEvent(
  event: "page_viewed" | "contents_viewed" | "checkout_started" | "registration_completed",
  data?: { type: "contents" | "customer_action"; amount?: number; currency?: string; contents?: Array<{ id: string; content_type?: string }> },
  eventId?: string,
): boolean {
  if (!initOpenAIAdsPixelAfterConsent()) return false;
  const payload = data || { type: event === "registration_completed" ? "customer_action" : "contents" };
  const w = window as WindowWithOaiq;
  if (eventId) w.oaiq?.("measure", event, payload, { event_id: eventId });
  else w.oaiq?.("measure", event, payload);
  return true;
}

export function measureOpenAIAdsPage(path: string) {
  if (!measureOpenAIAdsEvent("page_viewed")) return;
  if (/^\/(?:cs|en)\/(?:calculate|pricing|honorace)(?:\/|$)/.test(path)) {
    measureOpenAIAdsEvent("contents_viewed", { type: "contents" });
  }
}

export function useOpenAIAdsPageViews() {
  const [location] = useLocation();
  useEffect(() => {
    getOpenAIAdsClickRef();
    measureOpenAIAdsPage(location);
    const onConsentChange = () => {
      syncOpenAIAdsPixelConsent();
      if (isOpenAIAdsConsentGranted()) measureOpenAIAdsPage(location);
    };
    window.addEventListener(CONSENT_EVENT, onConsentChange);
    return () => window.removeEventListener(CONSENT_EVENT, onConsentChange);
  }, [location]);
}
