import { useState, useEffect } from "react";
import { Cookie, X, Settings2 } from "lucide-react";

const CONSENT_KEY = "hd-cookie-consent";

type ConsentState = {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  accepted: boolean;
};

export function CookieConsent() {
  const [show, setShow] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [consent, setConsent] = useState<ConsentState>({
    necessary: true,
    analytics: false,
    marketing: false,
    accepted: false,
  });

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) {
      // Delay showing banner for better UX
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptAll = () => {
    const state: ConsentState = { necessary: true, analytics: true, marketing: true, accepted: true };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(state));
    setShow(false);
  };

  const acceptSelected = () => {
    const state: ConsentState = { ...consent, accepted: true };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(state));
    setShow(false);
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
              Souhlas s cookies / Cookie Consent
            </h3>
          </div>
          <button onClick={rejectAll} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Description */}
        <p className="text-xs md:text-sm text-muted-foreground mb-4 leading-relaxed">
          Používáme cookies pro zajištění funkčnosti webu, analýzu návštěvnosti a personalizaci obsahu.
          Můžete si vybrat, které kategorie povolíte.
        </p>

        {/* Details toggle */}
        {showDetails && (
          <div className="mb-4 space-y-2 text-xs">
            <label className="flex items-center gap-2 text-muted-foreground">
              <input type="checkbox" checked disabled className="accent-purple-600 rounded" />
              <span className="font-medium text-foreground">Nezbytné</span> — přihlášení, bezpečnost
            </label>
            <label className="flex items-center gap-2 text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={consent.analytics}
                onChange={(e) => setConsent({ ...consent, analytics: e.target.checked })}
                className="accent-purple-600 rounded"
              />
              <span className="font-medium text-foreground">Analytické</span> — návštěvnost, chování
            </label>
            <label className="flex items-center gap-2 text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={consent.marketing}
                onChange={(e) => setConsent({ ...consent, marketing: e.target.checked })}
                className="accent-purple-600 rounded"
              />
              <span className="font-medium text-foreground">Marketingové</span> — personalizace reklam
            </label>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={acceptAll}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs md:text-sm font-medium rounded-lg transition-colors"
          >
            Přijmout vše
          </button>
          {showDetails ? (
            <button
              onClick={acceptSelected}
              className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground text-xs md:text-sm font-medium rounded-lg transition-colors"
            >
              Uložit výběr
            </button>
          ) : (
            <button
              onClick={() => setShowDetails(true)}
              className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground text-xs md:text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Settings2 className="w-3.5 h-3.5" />
              Nastavení
            </button>
          )}
          <button
            onClick={rejectAll}
            className="px-4 py-2 text-muted-foreground hover:text-foreground text-xs md:text-sm font-medium transition-colors"
          >
            Odmítnout
          </button>
        </div>
      </div>
    </div>
  );
}
