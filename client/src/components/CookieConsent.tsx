import { useState, useEffect } from "react";
import { Cookie, X, Settings2 } from "lucide-react";
import { initPixelAfterConsent } from "@/hooks/useMetaPixel";
import { useLanguage } from "@/contexts/LanguageContext";

const CONSENT_KEY = "hd-cookie-consent";

type ConsentState = {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  accepted: boolean;
};

/** Initialize Google Analytics 4 page view tracking. Safe to call multiple times. */
function ga4PageView(path: string) {
  if (!(window as any).gtag) return;
  (window as any).gtag("event", "page_view", { page_path: path });
}

/** Initialize Google Analytics 4 script after consent. */
function initGA4() {
  const gaId = (import.meta as any).env?.VITE_GA_MEASUREMENT_ID as string | undefined;
  if (!gaId || (window as any).gtag) return;
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  document.head.appendChild(script);
  (window as any).dataLayer = (window as any).dataLayer || [];
  function gtag(...args: any[]) { (window as any).dataLayer.push(args); }
  (window as any).gtag = gtag;
  gtag("js", new Date());
  gtag("config", gaId);
}

/** Initialize Microsoft Clarity after consent. Safe to call multiple times. */
function initClarity() {
  const clarityId = (import.meta as any).env?.VITE_CLARITY_ID as string | undefined;
  if (!clarityId || (window as any).clarity) return;
  (function(c: any, l: any, a: any, r: any, i: any) {
    (c[a] = c[a] || function() { (c[a].q = c[a].q || []).push(arguments); });
    const s = l.createElement(r); s.async = 1; s.src = "https://www.clarity.ms/tag/" + i;
    const t = l.getElementsByTagName(r)[0]; t.parentNode?.insertBefore(s, t);
  })(window, document, "clarity", "script", clarityId);
}

export function CookieConsent() {
  const [show, setShow] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const { locale } = useLanguage();
  const isCs = locale === "cs";
  const [consent, setConsent] = useState<ConsentState>({
    necessary: true,
    analytics: false,
    marketing: false,
    accepted: false,
  });

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored) {
      // Consent already given — initialize analytics on page load
      try {
        const parsed = JSON.parse(stored) as ConsentState;
        if (parsed.marketing) initPixelAfterConsent();
        if (parsed.analytics) { initGA4(); initClarity(); }
      } catch { /* ignore */ }
      return;
    }
    // Delay showing banner for better UX
    const timer = setTimeout(() => setShow(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const acceptAll = () => {
    const state: ConsentState = { necessary: true, analytics: true, marketing: true, accepted: true };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(state));
    setShow(false);
    initPixelAfterConsent();
    initGA4();
    ga4PageView(window.location.pathname);
    initClarity();
  };

  const acceptSelected = () => {
    const state: ConsentState = { ...consent, accepted: true };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(state));
    setShow(false);
    if (state.marketing) initPixelAfterConsent();
    if (state.analytics) {
      initGA4();
      ga4PageView(window.location.pathname);
      initClarity();
    }
  };

  const rejectAll = () => {
    const state: ConsentState = { necessary: true, analytics: false, marketing: false, accepted: true };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(state));
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6">
      <div className="max-w-2xl mx-auto bg-card border border-border rounded-2xl shadow-2xl p-5 md:p-6 animate-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Cookie className="w-5 h-5 text-purple-500 shrink-0" />
            <h3 className="font-semibold text-foreground text-sm md:text-base">
              {isCs ? "Souhlas s cookies" : "Cookie Consent"}
            </h3>
          </div>
          <button onClick={rejectAll} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Description */}
        <p className="text-xs md:text-sm text-muted-foreground mb-4 leading-relaxed">
          {isCs
            ? "Používáme cookies pro zajištění funkčnosti webu, analýzu návštěvnosti a personalizaci obsahu. Můžete si vybrat, které kategorie povolíte."
            : "We use cookies to ensure website functionality, analyze traffic, and personalize content. You can choose which categories to allow."}
        </p>

        {/* Details toggle */}
        {showDetails && (
          <div className="mb-4 space-y-2 text-xs">
            <label className="flex items-center gap-2 text-muted-foreground">
              <input type="checkbox" checked disabled className="accent-purple-600 rounded" />
              <span className="font-medium text-foreground">{isCs ? "Nezbytné" : "Necessary"}</span> — {isCs ? "přihlášení, bezpečnost" : "login, security"}
            </label>
            <label className="flex items-center gap-2 text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={consent.analytics}
                onChange={(e) => setConsent({ ...consent, analytics: e.target.checked })}
                className="accent-purple-600 rounded"
              />
              <span className="font-medium text-foreground">{isCs ? "Analytické" : "Analytics"}</span> — {isCs ? "návštěvnost, chování" : "traffic, behavior"}
            </label>
            <label className="flex items-center gap-2 text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={consent.marketing}
                onChange={(e) => setConsent({ ...consent, marketing: e.target.checked })}
                className="accent-purple-600 rounded"
              />
              <span className="font-medium text-foreground">{isCs ? "Marketingové" : "Marketing"}</span> — {isCs ? "personalizace reklam" : "ad personalization"}
            </label>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={acceptAll}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs md:text-sm font-medium rounded-lg transition-colors"
          >
            {isCs ? "Přijmout vše" : "Accept all"}
          </button>
          {showDetails ? (
            <button
              onClick={acceptSelected}
              className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground text-xs md:text-sm font-medium rounded-lg transition-colors"
            >
              {isCs ? "Uložit výběr" : "Save selection"}
            </button>
          ) : (
            <button
              onClick={() => setShowDetails(true)}
              className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground text-xs md:text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Settings2 className="w-3.5 h-3.5" />
              {isCs ? "Nastavení" : "Settings"}
            </button>
          )}
          <button
            onClick={rejectAll}
            className="px-4 py-2 text-muted-foreground hover:text-foreground text-xs md:text-sm font-medium transition-colors"
          >
            {isCs ? "Odmítnout" : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}
