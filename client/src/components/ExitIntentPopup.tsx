import { useState, useEffect, useCallback } from "react";
import { X, Sparkles, Compass } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMetaPixel } from "@/hooks/useMetaPixel";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";

export default function ExitIntentPopup() {
  const { t, locale, localePath } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [show, setShow] = useState(false);
  const isCs = locale === "cs";
  const meta = useMetaPixel();

  const handleMouseLeave = useCallback((e: MouseEvent) => {
    if (isAuthenticated) return;
    // Exclude calculation & chart result pages to avoid disturbing users
    const path = window.location.pathname;
    if (path.includes("/calculate") || path.includes("/chart")) return;

    if (e.clientY <= 5 && !show) {
      const dismissed = localStorage.getItem("hd_exit_popup_dismissed");
      if (dismissed) {
        const ts = Number(dismissed);
        if (isNaN(ts) || Date.now() - ts < 90 * 24 * 60 * 60 * 1000) {
          return;
        }
      }
      setShow(true);
      meta.viewContent({
        content_name: "Exit Intent Engagement",
        content_ids: ["exit_engagement"],
      });
    }
  }, [show, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    
    // Wait 45 seconds before enabling exit intent
    const timer = setTimeout(() => {
      document.addEventListener("mouseleave", handleMouseLeave);
    }, 45000);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [handleMouseLeave, isAuthenticated]);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem("hd_exit_popup_dismissed", String(Date.now()));
  };

  if (isAuthenticated || !show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={dismiss}>
      {/* Soft Backdrop */}
      <div className="absolute inset-0 bg-black/35" />
      
      {/* Decorative ripples extend past the popup, without blocking dismissal. */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[min(95vw,550px)] w-[min(95vw,550px)] -translate-x-1/2 -translate-y-1/2" aria-hidden="true">
        <span className="sacral-ripple-ring sacral-popup-ripple" />
        <span className="sacral-ripple-ring sacral-popup-ripple sacral-ripple-ring--two" />
      </div>
      {/* Modal */}
      <div
        className="sacral-sunset-field sacral-sunset-field--popup relative z-10 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with mystical gradient */}
        <div className="sacral-popup-header relative px-8 pb-8 pt-10 text-center">
          {/* Sacred geometry overlay */}
          <svg className="sacral-popup-geometry pointer-events-none absolute inset-0 h-full w-full opacity-[.24]" viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
            <circle cx="200" cy="100" r="80" fill="none" stroke="white" strokeWidth="0.5" />
            <circle cx="200" cy="100" r="60" fill="none" stroke="white" strokeWidth="0.5" />
            <circle cx="200" cy="100" r="40" fill="none" stroke="white" strokeWidth="0.5" />
            <polygon points="200,20 260,100 200,180 140,100" fill="none" stroke="white" strokeWidth="0.5" />
            <polygon points="200,40 240,100 200,160 160,100" fill="none" stroke="white" strokeWidth="0.5" />
          </svg>
          
          <div className="relative z-10">
            <div className="sacral-popup-orb mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-white/40 bg-white/15 backdrop-blur-sm">
              <Compass className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-serif font-bold text-white mb-1">
              {isCs ? "Chcete znát svůj typ?" : "Curious about your type?"}
            </h3>
            <p className="text-white/90 text-sm">
              {isCs ? "Zjistěte svůj Human Design za 30 sekund" : "Discover your Human Design in 30 seconds"}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="sacral-popup-content p-8 text-center">
          <div className="mb-6">
            <h4 className="mb-2 font-serif text-xl font-bold text-white">
              {isCs 
                ? "Váš chart je zdarma a okamžitě" 
                : "Your chart is free and instant"}
            </h4>
            <p className="text-sm leading-relaxed text-white/85">
              {isCs
                ? "Zadejte datum, čas a místo narození. Zjistěte svůj typ, strategii a autoritu — zcela zdarma."
                : "Enter your birth date, time, and place. Discover your type, strategy, and authority — completely free."}
            </p>
          </div>

          <div className="space-y-3">
            <Link
              href={localePath("/calculate")}
              onClick={dismiss}
              className="sacral-popup-cta block w-full rounded-xl px-6 py-3 font-bold transition-all hover:scale-[1.015]"
            >
              {isCs ? "Vytvořit mapu zdarma" : "Create free chart"}
            </Link>
            <button
              type="button"
              onClick={dismiss}
              className="w-full py-2 text-sm text-white/70 transition-colors hover:text-white"
            >
              {isCs ? "Ne, děkuji" : "No, thanks"}
            </button>
          </div>
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-colors hover:bg-white/30" aria-label={isCs ? "Zavřít nabídku" : "Close offer"}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
