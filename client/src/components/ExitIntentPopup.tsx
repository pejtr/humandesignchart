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
    // Only trigger when mouse leaves from the top of the viewport
    if (e.clientY <= 5 && !show) {
      const dismissed = localStorage.getItem("hd_exit_popup_dismissed");
      if (!dismissed) {
        setShow(true);
        // Track engagement signal
        meta.viewContent({
          content_name: "Exit Intent Engagement",
          content_ids: ["exit_engagement"],
        });
      }
    }
  }, [show, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) return;
    // Don't show on mobile (no mouse leave detection)
    if (window.matchMedia("(pointer: coarse)").matches) return;
    
    // Wait 15 seconds before enabling exit intent
    const timer = setTimeout(() => {
      document.addEventListener("mouseleave", handleMouseLeave);
    }, 15000);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [handleMouseLeave, isAuthenticated]);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem("hd_exit_popup_dismissed", "true");
  };

  if (isAuthenticated || !show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={dismiss}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      {/* Modal */}
      <div
        className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with mystical gradient */}
        <div className="relative bg-gradient-to-br from-purple-700 via-violet-600 to-indigo-600 p-8 text-center">
          {/* Sacred geometry overlay */}
          <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
            <circle cx="200" cy="100" r="80" fill="none" stroke="white" strokeWidth="0.5" />
            <circle cx="200" cy="100" r="60" fill="none" stroke="white" strokeWidth="0.5" />
            <circle cx="200" cy="100" r="40" fill="none" stroke="white" strokeWidth="0.5" />
            <polygon points="200,20 260,100 200,180 140,100" fill="none" stroke="white" strokeWidth="0.5" />
            <polygon points="200,40 240,100 200,160 160,100" fill="none" stroke="white" strokeWidth="0.5" />
          </svg>
          
          <div className="relative z-10">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
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
        <div className="bg-white p-8 text-center">
          <div className="mb-6">
            <h4 className="text-xl font-serif font-bold text-gray-900 mb-2">
              {isCs 
                ? "Váš chart je zdarma a okamžitě" 
                : "Your chart is free and instant"}
            </h4>
            <p className="text-gray-600 text-sm leading-relaxed">
              {isCs
                ? "Zadejte datum, čas a místo narození. Zjistěte svůj typ, strategii a autoritu — zcela zdarma."
                : "Enter your birth date, time, and place. Discover your type, strategy, and authority — completely free."}
            </p>
          </div>

          <div className="space-y-3">
            <Link href={localePath("/calculate")} onClick={dismiss}>
              <button className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all hover:scale-[1.02] shadow-lg shadow-purple-200/50">
                {isCs ? "Vytvořit mapu zdarma" : "Create free chart"}
              </button>
            </Link>
            <button
              onClick={dismiss}
              className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              {isCs ? "Ne, děkuji" : "No, thanks"}
            </button>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
