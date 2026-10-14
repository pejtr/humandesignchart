import { useEffect } from "react";
import { trackGA4Event } from "./useGA4";

const CONSENT_KEY = "hd-cookie-consent";
const CONSENT_EVENT = "hd:marketing-consent-changed";

function analyticsAllowed(): boolean {
  try {
    const consent = JSON.parse(localStorage.getItem(CONSENT_KEY) || "{}");
    return consent.accepted === true && consent.analytics === true;
  } catch {
    return false;
  }
}
type Rating = "good" | "needs-improvement" | "poor";
type Vital = { name: string; value: number; rating: Rating };
const classify = (value: number, good: number, poor: number): Rating =>
  value <= good ? "good" : value <= poor ? "needs-improvement" : "poor";

/**
 * Consent-gated page performance monitoring.
 * GA4 is the delivery transport; the old beacon pointed to a missing Cloudflare
 * handler (returning SPA HTML), so it could never persist metrics.
 *
 * INP_ESTIMATE is the highest observed event duration, NOT Google's complete
 * field INP estimator. Do not relabel it as validated Core Web Vitals INP.
 * No URL query, UA, birth data or other PII leaves this hook.
 */
export function useReportWebVitals(enabled = true) {
  useEffect(() => {
    if (!enabled || typeof window === "undefined" || !("PerformanceObserver" in window)) return;
    let started = false;
    let reported = false;
    const observers: PerformanceObserver[] = [];
    const values: Record<string, number> = {};

    function start() {
      if (started || !analyticsAllowed()) return;
      started = true;
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            values.LCP = entry.startTime;
          }
        });
        observer.observe({ type: "largest-contentful-paint", buffered: true });
        observers.push(observer);
      } catch { /* unsupported */ }

      try {
        let cls = 0;
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as PerformanceEntry & { hadRecentInput?: boolean }).hadRecentInput) {
              cls += (entry as PerformanceEntry & { value?: number }).value || 0;
            }
          }
          values.CLS = cls;
        });
        observer.observe({ type: "layout-shift", buffered: true });
        observers.push(observer);
      } catch { /* unsupported */ }

      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const duration = (entry as PerformanceEntry & { duration?: number }).duration || 0;
            values.INP_ESTIMATE = Math.max(values.INP_ESTIMATE || 0, duration);
          }
        });
        observer.observe({ type: "event", buffered: true, durationThreshold: 40 } as PerformanceObserverInit);
        observers.push(observer);
      } catch { /* unsupported */ }
    }

    function stop() {
      observers.forEach((observer) => observer.disconnect());
      observers.length = 0;
      started = false;
    }

    function flush() {
      if (reported) return;
      reported = true;
      if (!analyticsAllowed()) return;
      const metrics: Vital[] = [];
      if (Number.isFinite(values.LCP)) metrics.push({ name: "LCP", value: values.LCP, rating: classify(values.LCP, 2500, 4000) });
      if (Number.isFinite(values.CLS)) metrics.push({ name: "CLS", value: values.CLS, rating: classify(values.CLS, 0.1, 0.25) });
      if (Number.isFinite(values.INP_ESTIMATE)) metrics.push({ name: "INP_ESTIMATE", value: values.INP_ESTIMATE, rating: classify(values.INP_ESTIMATE, 200, 500) });
      for (const metric of metrics) {
        trackGA4Event("web_vital", {
          metric_name: metric.name,
          metric_value: Math.round(metric.value * 100) / 100,
          metric_rating: metric.rating,
          page_path: location.pathname,
          transport_type: "beacon",
        });
      }
    }

    const onConsent = () => {
      if (analyticsAllowed()) start();
      else stop();
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    onConsent();
    window.addEventListener(CONSENT_EVENT, onConsent);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener(CONSENT_EVENT, onConsent);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flush);
      stop();
    };
  }, [enabled]);
}
