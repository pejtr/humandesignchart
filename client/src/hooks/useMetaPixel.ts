import { useCallback, useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * META Pixel tracking hook.
 *
 * Provides typed wrappers for standard META Pixel events and helper utilities to
 * read/store the META cookie + fbp/fbc parameters (needed for Conversions API).
 *
 * All tracking is gated behind the `marketing` consent category from CookieConsent.
 * If marketing cookies are not accepted, no events are fired.
 */

const PIXEL_ID_KEY = "hd-meta-pixel-id";
const CONSENT_KEY = "hd-cookie-consent";

type MetaEventName =
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

type MetaEventParams = {
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  content_type?: string;
  value?: number;
  currency?: string;
  num_items?: number;
  predicted_ltv?: number;
  status?: boolean;
  [key: string]: unknown;
};

/** Read and parse the stored cookie consent state. */
function getConsent(): { marketing: boolean } {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return { marketing: false };
    const parsed = JSON.parse(raw) as { marketing?: boolean };
    return { marketing: !!parsed.marketing };
  } catch {
    return { marketing: false };
  }
}

/** Get the META pixel ID from env (Vite injects import.meta.env.VITE_META_PIXEL_ID). */
function getPixelId(): string | undefined {
  return (import.meta as any).env?.VITE_META_PIXEL_ID as string | undefined;
}

/** Access the global fbq function if it exists. */
function fbq(): ((...args: unknown[]) => void) | undefined {
  return (window as any).fbq as ((...args: unknown[]) => void) | undefined;
}

/** Track a standard META Pixel event (client-side). */
function trackEvent(name: MetaEventName, params?: MetaEventParams) {
  const consent = getConsent();
  if (!consent.marketing) return;
  const pixelId = getPixelId();
  if (!pixelId) {
    if (import.meta.env.DEV) console.warn("[META] No pixel ID configured");
    return;
  }
  // Standard event
  fbq()?.("track", name, params);
  // PageView is fired with trackSingle automatically by base code; for other events use track.
  if (import.meta.env.DEV) console.log("[META] track", name, params);
}

/** Manually fire PageView (called once after consent or route change). */
function trackPageView() {
  const consent = getConsent();
  if (!consent.marketing) return;
  const pixelId = getPixelId();
  if (!pixelId) return;
  fbq()?.("track", "PageView");
  if (import.meta.env.DEV) console.log("[META] PageView");
}

/**
 * Called by CookieConsent after marketing consent is granted. Initializes the
 * pixel and fires an initial PageView. Safe to call multiple times.
 */
export function initPixelAfterConsent() {
  initPixel();
}

/**
 * Initialize the META Pixel script. Called once on app mount and after consent
 * is granted (so the pixel only loads when marketing cookies are accepted).
 */
function initPixel() {
  const consent = getConsent();
  if (!consent.marketing) return;
  const pixelId = getPixelId();
  if (!pixelId) return;
  if ((window as any).fbq) return; // already loaded

  /* eslint-disable */
  (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = "2.0";
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(
    window,
    document,
    "script",
    "https://connect.facebook.net/en_US/fbevents.js"
  );
  /* eslint-enable */

  fbq()?.("init", pixelId);
  trackPageView();
}

/** Read the _fbp cookie (browser-assigned pixel id for Conversions API). */
function getFbp(): string | undefined {
  const match = document.cookie.match(/_fbp=([^;]+)/);
  return match ? match[1] : undefined;
}

/** Read the fbc cookie (click id from FB click, set when landing via FB ad). */
function getFbc(): string | undefined {
  const match = document.cookie.match(/_fbc=([^;]+)/);
  return match ? match[1] : undefined;
}

/** Save fbc from fbclid query param if present (META Click ID from ad click). */
function captureFbclid() {
  try {
    const url = new URL(window.location.href);
    const fbclid = url.searchParams.get("fbclid");
    if (fbclid) {
      const fbc = `fb.1.${Date.now()}.${fbclid}`;
      // META recommends 90-day expiry
      const expires = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
      document.cookie = `_fbc=${fbc}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
    }
  } catch {
    /* ignore */
  }
}

export function useMetaPixel() {
  const { locale } = useLanguage();
  const initialized = useRef(false);

  useEffect(() => {
    captureFbclid();
    if (getConsent().marketing) {
      initPixel();
      initialized.current = true;
    }
  }, []);

  const pageView = useCallback(() => {
    trackPageView();
  }, []);

  const viewContent = useCallback(
    (params?: MetaEventParams) => {
      trackEvent("ViewContent", {
        content_category: "human_design",
        currency: locale === "cs" ? "CZK" : "EUR",
        ...params,
      });
    },
    [locale]
  );

  const addToCart = useCallback(
    (value?: number, params?: MetaEventParams) => {
      trackEvent("AddToCart", {
        content_name: "AI Reading Discount",
        currency: locale === "cs" ? "CZK" : "EUR",
        value: value ?? 0,
        ...params,
      });
    },
    [locale]
  );

  const initiateCheckout = useCallback(
    (value?: number, params?: MetaEventParams) => {
      trackEvent("InitiateCheckout", {
        content_name: "Premium Subscription",
        currency: locale === "cs" ? "CZK" : "EUR",
        value: value ?? 0,
        ...params,
      });
    },
    [locale]
  );

  const addPaymentInfo = useCallback((params?: MetaEventParams) => {
    trackEvent("AddPaymentInfo", params);
  }, []);

  const purchase = useCallback(
    (value: number, params?: MetaEventParams) => {
      trackEvent("Purchase", {
        content_name: "Premium Subscription",
        currency: locale === "cs" ? "CZK" : "EUR",
        value,
        ...params,
      });
    },
    [locale]
  );

  const lead = useCallback((params?: MetaEventParams) => {
    trackEvent("Lead", {
      content_category: "newsletter",
      ...params,
    });
  }, []);

  const completeRegistration = useCallback((params?: MetaEventParams) => {
    trackEvent("CompleteRegistration", {
      content_name: "Account Created",
      ...params,
    });
  }, []);

  const subscribe = useCallback((value: number, params?: MetaEventParams) => {
    trackEvent("Subscribe", {
      content_name: "Premium Subscription",
      currency: locale === "cs" ? "CZK" : "EUR",
      value,
      ...params,
    });
  }, [locale]);

  return {
    pageView,
    viewContent,
    addToCart,
    initiateCheckout,
    addPaymentInfo,
    purchase,
    lead,
    completeRegistration,
    subscribe,
    getFbp,
    getFbc,
    initPixel,
  };
}

export type MetaPixel = ReturnType<typeof useMetaPixel>;
