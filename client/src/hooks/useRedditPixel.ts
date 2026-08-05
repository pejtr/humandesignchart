import { useEffect } from "react";
import { useLocation } from "wouter";

const CONSENT_KEY = "hd-cookie-consent";
const SCRIPT_ID = "hd-reddit-pixel";

type RedditEventName =
  | "PageVisit"
  | "ViewContent"
  | "Search"
  | "AddToCart"
  | "Lead"
  | "SignUp"
  | "Purchase";

type RedditEventParams = {
  currency?: string;
  value?: number;
  itemCount?: number;
  conversionId?: string;
  products?: Array<{ id: string; name?: string; category?: string }>;
};

type MarketingEventName =
  | "PageView"
  | "ViewContent"
  | "Search"
  | "AddToCart"
  | "InitiateCheckout"
  | "AddPaymentInfo"
  | "Purchase"
  | "Lead"
  | "CompleteRegistration"
  | "Subscribe";

type MarketingEventParams = {
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  value?: number;
  currency?: string;
  num_items?: number;
  order_id?: unknown;
  [key: string]: unknown;
};

function hasMarketingConsent(): boolean {
  try {
    return Boolean(JSON.parse(localStorage.getItem(CONSENT_KEY) || "{}").marketing);
  } catch {
    return false;
  }
}

function getPixelId(): string | undefined {
  return (import.meta as any).env?.VITE_REDDIT_PIXEL_ID as string | undefined;
}

function rdt(): ((...args: unknown[]) => void) | undefined {
  return (window as any).rdt as ((...args: unknown[]) => void) | undefined;
}

/** Load Reddit Pixel only after marketing consent. Safe to call repeatedly. */
export function initRedditPixelAfterConsent(): void {
  if (!hasMarketingConsent()) return;
  const pixelId = getPixelId();
  if (!pixelId) return;

  if (!(window as any).rdt) {
    const queue = function (...args: unknown[]) {
      const fn = queue as typeof queue & {
        callQueue: unknown[][];
        sendEvent?: (...eventArgs: unknown[]) => void;
      };
      if (fn.sendEvent) fn.sendEvent(...args);
      else fn.callQueue.push(args);
    } as ((...args: unknown[]) => void) & {
      callQueue: unknown[][];
      sendEvent?: (...eventArgs: unknown[]) => void;
    };
    queue.callQueue = [];
    (window as any).rdt = queue;
  }

  if (!document.getElementById(SCRIPT_ID)) {
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.async = true;
    script.src = "https://www.redditstatic.com/ads/pixel.js";
    document.head.appendChild(script);
  }

  if (!(window as any).__hdRedditPixelInitialized) {
    rdt()?.("init", pixelId, { optOut: false, useDecimalCurrencyValues: true });
    (window as any).__hdRedditPixelInitialized = true;
    (window as any).__hdRedditLastPath = window.location.pathname;
    trackRedditEvent("PageVisit");
  }
}

/** Return rdt_cid only when the visitor explicitly allowed marketing storage. */
export function getRedditClickIdForCapi(): string | undefined {
  if (!hasMarketingConsent()) return undefined;
  try {
    const stored = JSON.parse(localStorage.getItem("hd-utm-params") || "{}") as { rdt_cid?: string };
    return stored.rdt_cid;
  } catch {
    return undefined;
  }
}

export function trackRedditEvent(name: RedditEventName, params?: RedditEventParams): void {
  if (!hasMarketingConsent() || !getPixelId()) return;
  initRedditPixelAfterConsent();
  rdt()?.("track", name, params);
  if (import.meta.env.DEV) console.log("[Reddit Pixel] track", name, params);
}

/** Mirror the existing commerce funnel into Reddit's supported standard events. */
export function trackRedditEventFromMarketingEvent(
  name: MarketingEventName,
  params: MarketingEventParams = {},
): void {
  const eventMap: Partial<Record<MarketingEventName, RedditEventName>> = {
    ViewContent: "ViewContent",
    Search: "Search",
    AddToCart: "AddToCart",
    Purchase: "Purchase",
    Lead: "Lead",
    // This event currently represents chart/account intent before OAuth.
    CompleteRegistration: "Lead",
  };
  const redditEvent = eventMap[name];
  if (!redditEvent) return;

  const contentIds = Array.isArray(params.content_ids) ? params.content_ids : [];
  trackRedditEvent(redditEvent, {
    currency: params.currency,
    value: params.value,
    itemCount: params.num_items ?? (contentIds.length || undefined),
    conversionId: typeof params.order_id === "string" ? params.order_id : undefined,
    products: contentIds.map(id => ({
      id,
      name: params.content_name,
      category: params.content_category,
    })),
  });
}

/** Track SPA page changes and persist Reddit's click id for future CAPI events. */
export function useRedditPageViews(): void {
  const [location] = useLocation();

  useEffect(() => {
    if (!hasMarketingConsent()) return;
    initRedditPixelAfterConsent();
    if ((window as any).__hdRedditLastPath !== location) {
      (window as any).__hdRedditLastPath = location;
      trackRedditEvent("PageVisit");
    }
  }, [location]);
}
