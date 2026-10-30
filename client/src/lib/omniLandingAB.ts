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
  return import.meta.env.VITE_OMNI_AB_PILOT_ENABLED === "true" &&
    import.meta.env.VITE_UMAMI_ENABLED === "true";
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
  // A is the existing content and the safe fallback if config is not active.
  const [variant, setVariant] = useState<OmniVariant>("A");

  useEffect(() => {
    if (!enabled() || !VALID_EXPERIMENTS.has(experiment)) return;
    const key = "omni-ab:" + experiment;
    let current: OmniVariant = select();
    try {
      const stored = window.sessionStorage.getItem(key);
      if (stored === "A" || stored === "B" || stored === "C") current = stored;
    } catch { /* session storage is optional */ }
    setVariant(current);
    const keepAssignment = () => {
      if (!hasConsent()) return;
      try { window.sessionStorage.setItem(key, current); } catch { /* optional */ }
    };
    keepAssignment();
    window.addEventListener(consentEvent, keepAssignment);
    return () => window.removeEventListener(consentEvent, keepAssignment);
    // The consent callback reads current storage on each event; do not make
    // function identity a dependency or rerenders would re-randomize variants.
  }, [experiment, consentEvent]);

  return variant;
}

export function abCopy<T>(variant: OmniVariant, copies: { A: T; B: T; C: T }): T {
  return copies[variant];
}
