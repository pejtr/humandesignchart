import { useState, useEffect, useCallback } from "react";
import { X, Sparkles, Gift } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMetaPixel } from "@/hooks/useMetaPixel";
import { Link } from "wouter";

export default function ExitIntentPopup() {
  const { t, locale, localePath } = useLanguage();
  const [show, setShow] = useState(false);
  const isCs = locale === "cs";
  const meta = useMetaPixel();

  const handleMouseLeave = useCallback((e: MouseEvent) => {
    // Only trigger when mouse leaves from the top of the viewport
    if (e.clientY <= 5 && !show) {
      const dismissed = localStorage.getItem("hd_exit_popup_dismissed");
      if (!dismissed) {
        setShow(true);
        // Track AddToCart (discount offer shown = strong intent signal)
        meta.addToCart(isCs ? 188 : 7.49, {
          content_name: "Exit Intent Discount 10%",
          content_ids: ["exit_discount_10"],
          content_type: "product",
        });
      }
    }
  }, [show]);

  useEffect(() => {
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
  }, [handleMouseLeave]);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem("hd_exit_popup_dismissed", "true");
  };

  if (!show) return null;

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
        <div className="relative bg-gradient-to-br from-amber-600 via-amber-500 to-yellow-400 p-8 text-center">
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
              <Gift className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-serif font-bold text-white mb-1">
              {isCs ? "Počkejte! Máme pro vás dárek" : "Wait! We have a gift for you"}
            </h3>
            <p className="text-white/90 text-sm">
              {isCs ? "Exkluzivní nabídka jen pro vás" : "Exclusive offer just for you"}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white p-8 text-center">
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-4 py-2 mb-4">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span className="text-amber-800 font-semibold text-sm">
                {isCs ? "10% SLEVA" : "10% OFF"}
              </span>
            </div>
            <h4 className="text-xl font-serif font-bold text-gray-900 mb-2">
              {isCs 
                ? "Na váš první AI rozbor Human Designu" 
                : "On your first AI Human Design reading"}
            </h4>
            <p className="text-gray-600 text-sm leading-relaxed">
              {isCs
                ? "Získejte personalizovaný rozbor vaší mapy od AI s 10% slevou. Odhalte svůj jedinečný design a životní strategii."
                : "Get a personalized AI reading of your chart with 10% off. Discover your unique design and life strategy."}
            </p>
          </div>

          <div className="space-y-3">
            <Link href={localePath("/calculate")} onClick={dismiss}>
              <button className="w-full py-3 px-6 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-semibold rounded-xl transition-all hover:scale-[1.02] shadow-lg shadow-amber-200/50">
                {isCs ? "Získat mapu se slevou 10 %" : "Get chart with 10% off"}
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
