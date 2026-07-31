import { useEffect } from "react";
import { useLocation } from "wouter";

const CONSENT_KEY = "hd-cookie-consent";
let loading = false;
let loaded = false;
let lastPageView = "";

type SemEvent = "PageView" | "ViewContent" | "Search" | "AddToCart" | "InitiateCheckout" | "AddPaymentInfo" | "Purchase" | "Lead" | "CompleteRegistration" | "Subscribe";
type SemParams = Record<string, unknown>;

function hasMarketingConsent() {
  try {
    return !!JSON.parse(localStorage.getItem(CONSENT_KEY) || "{}").marketing;
  } catch {
    return false;
  }
}

function sem() {
  return (window as any).SEM as ((action: string, event: string | object, params?: SemParams) => void) | undefined;
}

function updateConsent() {
  sem()?.("updateConsent", {
    consent_mode: {
      ad_storage: "granted",
      ad_user_data: "granted",
      ad_personalization: "granted",
      functionality_storage: "granted",
      analytics_storage: "granted",
    },
  });
}

function loadSklik(onReady?: () => void) {
  if (!hasMarketingConsent()) return;
  const semId = (import.meta as any).env?.VITE_SEZNAM_SEM_ID as string | undefined;
  if (!semId) {
    if (import.meta.env.DEV) console.warn("[Sklik] VITE_SEZNAM_SEM_ID is not configured");
    return;
  }
  if (loaded && sem()) {
    updateConsent();
    onReady?.();
    return;
  }
  if (loading) {
    window.addEventListener("hd-sklik-ready", () => onReady?.(), { once: true });
    return;
  }
  loading = true;
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://l.seznam.cz/sul.js?id=${encodeURIComponent(semId)}`;
  script.onload = () => {
    loading = false;
    loaded = true;
    updateConsent();
    window.dispatchEvent(new Event("hd-sklik-ready"));
    onReady?.();
  };
  script.onerror = () => { loading = false; };
  document.head.appendChild(script);
}

export function initSklikAfterConsent() {
  loadSklik(() => trackSklikEvent("PageView"));
}

export function trackSklikEvent(event: SemEvent, params?: SemParams) {
  if (!hasMarketingConsent()) return;
  const pageKey = event === "PageView" ? `${window.location.pathname}${window.location.search}` : "";
  loadSklik(() => {
    if (event === "PageView" && pageKey === lastPageView) return;
    sem()?.("track", event, params);
    if (event === "PageView") lastPageView = pageKey;
  });
}

export function useSklikPageViews() {
  const [location] = useLocation();
  useEffect(() => {
    trackSklikEvent("PageView");
  }, [location]);
}
