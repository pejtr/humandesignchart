import { useEffect } from "react";
import { useLocation } from "wouter";

/**
 * Canonical LEAD OS placements. Selection, fatigue, creative content and
 * click/impression reporting remain inside the shared OPTIHUB runtime.
 * Neither this component nor the app stores cross-site identity or partner ads.
 */
const RUNTIME_URL = "https://api.optihub.cz/omni-ads/runtime.js";
const CONSENT_KEY = "hd-cookie-consent";
const CONSENT_EVENT = "hd:marketing-consent-changed";
let pendingReload: ReturnType<typeof setTimeout> | null = null;
let activeScript: HTMLScriptElement | null = null;

export function isEditorialAdRoute(path: string): boolean {
  return /^\/(?:cs|en)\/(?:blog(?:\/|$)|encyclopedia(?:\/|$)|types\/|iching(?:\/|$)|andelska-cisla(?:\/|$))/.test(path);
}

export function hasAdsConsent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const consent = JSON.parse(localStorage.getItem(CONSENT_KEY) || "{}");
    return consent.accepted === true && consent.marketing === true;
  } catch {
    return false;
  }
}

function refreshSharedRuntime() {
  if (pendingReload) clearTimeout(pendingReload);
  if (!hasAdsConsent()) {
    activeScript?.remove();
    activeScript = null;
    return;
  }
  pendingReload = setTimeout(() => {
    pendingReload = null;
    if (!hasAdsConsent()) return;
    const slots = document.querySelectorAll("[data-omni-ads-slot]");
    if (!slots.length) return;
    activeScript?.remove();
    const script = document.createElement("script");
    script.async = true;
    script.src = RUNTIME_URL;
    script.dataset.omniSite = "auto";
    script.dataset.omniRuntime = "hd";
    document.body.appendChild(script);
    activeScript = script;
  }, 100);
}

export function OmniAdsSlot({
  placement,
  format,
  className = "",
}: {
  placement: "content-tail" | "article-intext";
  format: "image" | "text";
  className?: string;
}) {
  const [location] = useLocation();
  const allowed = isEditorialAdRoute(location);

  useEffect(() => {
    if (!allowed) return;
    refreshSharedRuntime();
    window.addEventListener(CONSENT_EVENT, refreshSharedRuntime);
    return () => {
      window.removeEventListener(CONSENT_EVENT, refreshSharedRuntime);
    };
  }, [allowed, location]);

  if (!allowed) return null;
  return (
    <div
      className={className}
      data-omni-ads-slot={placement}
      data-omni-ads-format={format}
    />
  );
}
