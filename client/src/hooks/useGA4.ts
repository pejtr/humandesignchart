import { useEffect } from "react";
import { useLocation } from "wouter";

const CONSENT_KEY = "hd-cookie-consent";
const DEFAULT_GA_MEASUREMENT_ID = "G-JMC9GGX4TH";

function hasAnalyticsConsent() {
  try {
    return Boolean(JSON.parse(localStorage.getItem(CONSENT_KEY) || "{}").analytics);
  } catch {
    return false;
  }
}

/** Load GA4 only after analytics consent. Safe to call repeatedly. */
export function initGA4() {
  if (!hasAnalyticsConsent()) return;
  const gaId = ((import.meta as any).env?.VITE_GA_MEASUREMENT_ID as string | undefined) || DEFAULT_GA_MEASUREMENT_ID;
  if ((window as any).__hdGa4Initialized) return;
  if (!document.querySelector(`script[data-hd-ga4="${gaId}"]`)) {
    const script = document.createElement("script");
    script.async = true;
    script.dataset.hdGa4 = gaId;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(script);
  }
  (window as any).dataLayer = (window as any).dataLayer || [];
  function gtag(...args: any[]) { (window as any).dataLayer.push(args); }
  (window as any).gtag = gtag;
  (window as any).__hdGa4Initialized = true;
  gtag("js", new Date());
  gtag("config", gaId, { send_page_view: false, anonymize_ip: true });
}

export function trackGA4Event(name: string, params: Record<string, unknown> = {}) {
  if (!hasAnalyticsConsent()) return;
  initGA4();
  (window as any).gtag?.("event", name, params);
}

export function ga4PageView(path: string) {
  trackGA4Event("page_view", {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  });
}

/** Track client-side route changes in this single-page application. */
export function useGA4PageViews() {
  const [location] = useLocation();
  useEffect(() => {
    ga4PageView(location);
  }, [location]);
}
