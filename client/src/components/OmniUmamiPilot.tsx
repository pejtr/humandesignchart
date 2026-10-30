/**
 * OMNI Umami pilot — consent-gated, PII-minimal and disabled until configured.
 * Requires VITE_UMAMI_ENABLED=true + VITE_UMAMI_SCRIPT_URL + VITE_UMAMI_WEBSITE_ID.
 * One Umami Website ID per domain; NEVER reuse payment/user identities.
 * No automatic pageviews, URL search params, SPA route hooks or auto click capture.
 * See https://docs.umami.is/docs/tracker-configuration
 */
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";

type UmamiApi = { track: (payload: { website: string; url: string; title: string; name?: string; data?: Record<string, string> }) => void };
type Props = {
  consentEvent: string;
  hasConsent: () => boolean;
  isPublicPath: (path: string) => boolean;
};
const SCRIPT_ID = "omni-umami-pilot";
const SITE_TITLE = "HUMAN DESIGN";
const SITE_DOMAINS = "humandesignchart.app,www.humandesignchart.app";

function privacyBlocked(): boolean {
  return navigator.doNotTrack === "1" ||
    (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;
}
function validatedConfig() {
  const vars = import.meta.env;
  if (vars.VITE_UMAMI_ENABLED !== "true") return null;
  const website = vars.VITE_UMAMI_WEBSITE_ID;
  const source = vars.VITE_UMAMI_SCRIPT_URL;
  if (typeof website !== "string" || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(website) ||
      typeof source !== "string") return null;
  try {
    const url = new URL(source);
    if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash ||
        !url.pathname.endsWith("/script.js")) return null;
    return { website, source: url.href };
  } catch { return null; }
}
function tracker(): UmamiApi | undefined {
  return (window as Window & { umami?: UmamiApi }).umami;
}
function isAllowedHost() {
  return SITE_DOMAINS.split(",").includes(window.location.hostname.toLowerCase());
}

/** Keep only public, static routes; no full URLs, query strings, user inputs or properties. */
export default function OmniUmamiPilot({ consentEvent, hasConsent, isPublicPath }: Props) {
  const [route] = useLocation();
  const [consentRevision, setConsentRevision] = useState(0);
  const lastPath = useRef<string | null>(null);
  const wasLoaded = useRef(false);

  useEffect(() => {
    const changed = () => setConsentRevision(v => v + 1);
    window.addEventListener(consentEvent, changed);
    return () => window.removeEventListener(consentEvent, changed);
  }, [consentEvent]);

  useEffect(() => {
    const config = validatedConfig();
    const allowed = !!config && isAllowedHost() && !privacyBlocked() && hasConsent();
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (!allowed) {
      existing?.remove();
      if (wasLoaded.current) {
        // The Umami SDK has no supported unload API. Reload once after withdrawal
        // to terminate any script already evaluated in this document.
        wasLoaded.current = false;
        window.location.reload();
      }
      lastPath.current = null;
      return;
    }
    // Never collect private account, payment, property or chart URL paths.
    if (!isPublicPath(route)) return;
    const safePath = route.split("?")[0].split("#")[0];
    if (safePath !== window.location.pathname || !/^\/[a-zA-Z0-9_/-]*$/.test(safePath)) return;
    const send = () => {
      if (!hasConsent() || privacyBlocked() || !isPublicPath(window.location.pathname) ||
          window.location.pathname !== safePath || lastPath.current === safePath) return;
      const umami = tracker();
      if (!umami) return;
      umami.track({ website: config!.website, url: safePath, title: SITE_TITLE });
      lastPath.current = safePath;
    };
    if (existing) { send(); return; }
    // Deny all automatic / unexpected telemetry. Only manually curated
    // pageviews + static UI taxonomy may leave the browser.
    const beforeSend = (_type: string, raw: unknown): unknown => {
      if (!hasConsent() || privacyBlocked() || !isAllowedHost()) return false;
      if (!raw || typeof raw !== "object") return false;
      const payload = raw as Record<string, unknown>;
      const url = payload.url;
      if (typeof url !== "string" || !/^\/[a-zA-Z0-9_/-]*$/.test(url) ||
          !isPublicPath(url) || payload.website !== config!.website) return false;
      if (payload.name === undefined) {
        return payload.title === SITE_TITLE ? payload : false;
      }
      if (payload.name !== "ui_interest") return false;
      const data = payload.data;
      if (!data || typeof data !== "object" || Array.isArray(data)) return false;
      const values = data as Record<string, unknown>;
      const allowedInterests = ["catalog_open", "devices_open", "audit_open", "ebook_offer",
        "pricing_open", "report_offer", "chart_start", "quiz_open"];
      if (!allowedInterests.includes(String(values.interest)) ||
          !["nav", "hero", "pricing", "content", "footer"].includes(String(values.zone)) ||
          Object.keys(values).some(k => k !== "interest" && k !== "zone")) return false;
      return payload;
    };
    const exposed = window as Window & { __omniUmamiBeforeSend?: typeof beforeSend };
    exposed.__omniUmamiBeforeSend = beforeSend;
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.defer = true;
    script.src = config!.source;
    script.dataset.websiteId = config!.website;
    script.dataset.beforeSend = "__omniUmamiBeforeSend";
    // Auto pageviews OFF; tracker stays initialized for manual, sanitized events.
    script.dataset.autoPageview = "false";
    script.dataset.excludeSearch = "true";
    script.dataset.excludeHash = "true";
    script.dataset.doNotTrack = "true";
    script.dataset.domains = SITE_DOMAINS;
    script.addEventListener("load", () => { wasLoaded.current = true; send(); }, { once: true });
    document.head.appendChild(script);
  }, [route, consentRevision, hasConsent, isPublicPath]);
  // Marketing research measures interest in an explicit, static taxonomy only.
  // Never harvest form values, link URLs, text, coordinates, birth dates or property references.
  useEffect(() => {
    const config = validatedConfig();
    if (!config || !hasConsent() || privacyBlocked() || !isAllowedHost() || !isPublicPath(route)) return;
    const allowedInterest = new Set([
      "catalog_open", "devices_open", "audit_open", "ebook_offer",
      "pricing_open", "report_offer", "chart_start", "quiz_open",
    ]);
    const allowedZones = new Set(["nav", "hero", "pricing", "content", "footer"]);
    const onClick = (event: MouseEvent) => {
      if (!hasConsent() || privacyBlocked() || !isAllowedHost() || !isPublicPath(window.location.pathname)) return;
      if (!(event.target instanceof Element)) return;
      const item = event.target.closest<HTMLElement>("[data-omni-interest]");
      if (!item || !item.matches('a,button,[role="button"]')) return;
      const interest = item.dataset.omniInterest || "";
      if (!allowedInterest.has(interest)) return;
      const zoneValue = item.dataset.omniZone || "content";
      const zone = allowedZones.has(zoneValue) ? zoneValue : "content";
      const umami = tracker();
      if (!umami) return;
      try {
        umami.track({
          website: config.website,
          url: window.location.pathname,
          title: SITE_TITLE,
          name: "ui_interest",
          data: { interest, zone },
        });
      } catch { /* Optional research must not block navigation. */ }
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [route, consentRevision, hasConsent, isPublicPath]);

  return null;
}
