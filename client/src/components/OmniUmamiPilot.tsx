/**
 * OMNI Umami pilot — consent-gated, PII-minimal and disabled until configured.
 * Requires VITE_UMAMI_ENABLED=true + VITE_UMAMI_SCRIPT_URL + VITE_UMAMI_WEBSITE_ID.
 * One Umami Website ID per domain; NEVER reuse payment/user identities.
 * No automatic pageviews, URL search params, SPA route hooks or auto click capture.
 * See https://docs.umami.is/docs/tracker-configuration
 */
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";

type UmamiApi = { track: (payload: { website: string; url: string; title: string } | string) => void };
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
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.defer = true;
    script.src = config!.source;
    script.dataset.websiteId = config!.website;
    script.dataset.autoTrack = "false";
    script.dataset.excludeSearch = "true";
    script.dataset.excludeHash = "true";
    script.dataset.doNotTrack = "true";
    script.dataset.domains = SITE_DOMAINS;
    script.addEventListener("load", () => { wasLoaded.current = true; send(); }, { once: true });
    document.head.appendChild(script);
  }, [route, consentRevision, hasConsent, isPublicPath]);
  return null;
}
