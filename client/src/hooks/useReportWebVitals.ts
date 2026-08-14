import { useEffect } from "react";

interface Metric {
  name: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
}

function rating(value: number, thresholds: [number, number]): Metric["rating"] {
  if (value <= thresholds[0]) return "good";
  if (value <= thresholds[1]) return "needs-improvement";
  return "poor";
}

export function useReportWebVitals(enabled = true) {
  useEffect(() => {
    if (!enabled || !("PerformanceObserver" in window)) return;

    const metrics: Metric[] = [];

    // LCP
    try {
      const lcpObs = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1];
        metrics.push({
          name: "LCP",
          value: last.startTime,
          rating: rating(last.startTime, [2500, 4000]),
        });
      });
      lcpObs.observe({ type: "largest-contentful-paint", buffered: true });
    } catch {
      // Observer is not supported by every browser.
    }

    // FID
    try {
      const fidObs = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const fidEntry = entry as PerformanceEventTiming;
          metrics.push({
            name: "FID",
            value: fidEntry.processingStart - fidEntry.startTime,
            rating: rating(fidEntry.processingStart - fidEntry.startTime, [100, 300]),
          });
        }
      });
      fidObs.observe({ type: "first-input", buffered: true });
    } catch {
      // Observer is not supported by every browser.
    }

    // CLS
    try {
      let clsValue = 0;
      const clsObs = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value || 0;
          }
        }
      });
      clsObs.observe({ type: "layout-shift", buffered: true });

      // Report CLS on pagehide
      window.addEventListener("pagehide", () => {
        metrics.push({
          name: "CLS",
          value: clsValue,
          rating: rating(clsValue, [0.1, 0.25]),
        });
        sendMetrics(metrics);
      });
    } catch {
      // Observer is not supported by every browser.
    }

    // Report on pagehide (for LCP/FID)
    window.addEventListener("pagehide", () => {
      if (metrics.length > 0) sendMetrics(metrics);
    });

    function sendMetrics(ms: Metric[]) {
      if (ms.length === 0) return;
      const payload = ms.map((m) => `${m.name}=${m.value.toFixed(2)}(${m.rating})`).join(", ");
      console.log("[Web Vitals]", payload);
      // Send to backend via beacon
      try {
        const blob = new Blob([JSON.stringify({ metrics: ms, url: location.pathname, ua: navigator.userAgent.slice(0, 80) })], {
          type: "application/json",
        });
        navigator.sendBeacon?.("/api/analytics/web-vitals", blob);
      } catch {
        // Analytics must never interrupt the page lifecycle.
      }
    }
  }, [enabled]);
}
