import { useEffect } from "react";
import { useLocation } from "wouter";

/**
 * useUTM — Captures UTM parameters from the URL and stores them in localStorage
 * so they persist across the session and can be attached to conversion events.
 *
 * Supported parameters:
 *   utm_source, utm_medium, utm_campaign, utm_term, utm_content, utm_id, fbclid
 *
 * Also captures META's fbclid param (required for Conversions API matching).
 */
const UTM_KEY = "hd-utm-params";

export interface UtmParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  utm_id?: string;
  fbclid?: string;
}

/** Read stored UTM params from localStorage. */
export function getUtmParams(): UtmParams {
  try {
    const raw = localStorage.getItem(UTM_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as UtmParams;
  } catch {
    return {};
  }
}

/** Get a specific UTM value. */
export function getUtm(key: keyof UtmParams): string | undefined {
  return getUtmParams()[key];
}

/** Manually store UTM params (e.g. from a server-rendered page). */
export function setUtmParams(params: Partial<UtmParams>) {
  const existing = getUtmParams();
  const merged = { ...existing, ...params };
  localStorage.setItem(UTM_KEY, JSON.stringify(merged));
  return merged;
}

/**
 * Hook to capture UTM params on first load and persist them.
 * Place once at the app root (e.g. in App.tsx).
 */
export function useUTM() {
  const [location] = useLocation();

  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const params: Partial<UtmParams> = {};
      const keys: (keyof UtmParams)[] = [
        "utm_source",
        "utm_medium",
        "utm_campaign",
        "utm_term",
        "utm_content",
        "utm_id",
        "fbclid",
      ];
      for (const key of keys) {
        const val = url.searchParams.get(key);
        if (val) params[key] = val;
      }

      if (Object.keys(params).length > 0) {
        const merged = setUtmParams(params);
        if (import.meta.env.DEV) console.log("[UTM] captured:", merged);
      }
    } catch {
      // ignore parse errors
    }
  }, [location]);
}

/** Build a query string from stored UTM params for appending to links. */
export function appendUtmToUrl(url: string): string {
  const params = getUtmParams();
  const keys = Object.keys(params) as (keyof UtmParams)[];
  if (keys.length === 0) return url;
  try {
    const target = new URL(url, window.location.href);
    for (const key of keys) {
      if (params[key]) target.searchParams.set(key, params[key] as string);
    }
    return target.toString();
  } catch {
    return url;
  }
}
