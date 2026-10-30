/**
 * OMNI Landing A/B/C pilot — deterministic within a browser session.
 * Feature flag is off until the Umami instance, consent and release are verified.
 * Does not collect or generate visitor IDs; never changes URLs, pricing or offers.
 * Drafts can be prepared daily but running test allocations must remain stable.
 */
import { useEffect, useState } from "react";

export type OmniVariant = "A" | "B" | "C";

const VALID_EXPERIMENTS = new Set([
  "omni-hero-2026q4",
  "opt-audit-2026q4",
  "italy-ebook-2026q4",
  "katastr-pricing-2026q4",
  "hd-hero-2026q4",
]);

function enabled(): boolean {
  const env = import.meta.env;
  return env.VITE_OMNI_AB_PILOT_ENABLED === "true" &&
    env.VITE_UMAMI_ENABLED === "true" &&
    typeof env.VITE_UMAMI_WEBSITE_ID === "string" &&
    /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(env.VITE_UMAMI_WEBSITE_ID) &&
    typeof env.VITE_UMAMI_SCRIPT_URL === "string" &&
    /^https:\/\/[^/?#]+(?:\/[^?#]*)?\/script\.js$/i.test(env.VITE_UMAMI_SCRIPT_URL);
}

function select(): OmniVariant {
  if (typeof window === "undefined" || !window.crypto?.getRandomValues) return "A";
  const values = new Uint32Array(1);
  window.crypto.getRandomValues(values);
  // Rejection sampling removes modulo bias for a 3-way random assignment.
  const top = Math.floor(4294967296 / 3) * 3;
  if (values[0] >= top) return select();
  return (["A", "B", "C"] as const)[values[0] % 3];
}

export function useOmniLandingAB(experiment: string, hasConsent: () => boolean, consentEvent: string): OmniVariant {
  // A is the safe fallback. Selection happens during the initial render,
  // never in an effect after Umami could already register an exposure.
  const [variant] = useState<OmniVariant>(() => {
    if (!enabled() || !VALID_EXPERIMENTS.has(experiment) || typeof window === "undefined") return "A";
    if (hasConsent()) {
      try {
        const prior = window.sessionStorage.getItem("omni-ab:" + experiment);
        if (prior === "A" || prior === "B" || prior === "C") return prior;
      } catch { /* storage is optional */ }
    }
    return select();
  });
  useEffect(() => {
    if (!enabled() || !VALID_EXPERIMENTS.has(experiment)) return;
    const save = () => {
      if (!hasConsent()) return;
      try { window.sessionStorage.setItem("omni-ab:" + experiment, variant); }
      catch { /* never block page behavior */ }
    };
    save();
    window.addEventListener(consentEvent, save);
    return () => window.removeEventListener(consentEvent, save);
  }, [experiment, consentEvent, variant]);
  return variant;
}

export function abCopy<T>(variant: OmniVariant, copies: { A: T; B: T; C: T }): T {
  return copies[variant];
}
