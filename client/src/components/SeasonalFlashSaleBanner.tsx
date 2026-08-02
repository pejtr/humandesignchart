import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Timer, ArrowRight, X, Gift } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

export function SeasonalFlashSaleBanner() {
  const { locale, localePath } = useLanguage();
  const isEn = locale === "en";
  const [dismissed, setDismissed] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(7200); // 2 hours

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (dismissed || secondsLeft <= 0) return null;

  const hours = Math.floor(secondsLeft / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = secondsLeft % 60;
  const timerStr = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <div className="bg-gradient-to-r from-purple-900 via-pink-800 to-amber-700 text-white py-2 px-4 shadow-lg relative z-20">
      <div className="container max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="flex items-center gap-1 bg-amber-400 text-purple-950 px-2 py-0.5 rounded-full font-bold uppercase text-[10px]">
            <Gift className="w-3 h-3" />
            {isEn ? "Special Offer" : "Sezónní Akce 40% Sleva"}
          </span>
          <span>
            {isEn
              ? "New Year & Planetary Transit Sale — Claim your discounted Blueprint!"
              : "Sezónní akce: Získejte plný rozbor s AI Marií se slevou 40 %!"}
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-lg text-amber-300 font-mono font-bold text-xs">
            <Timer className="w-3.5 h-3.5" />
            <span>{timerStr}</span>
          </div>

          <Button
            size="sm"
            className="bg-amber-400 hover:bg-amber-300 text-purple-950 font-bold text-xs px-3.5 py-1 rounded-lg shadow-sm gap-1"
            asChild
          >
            <Link href={localePath("/pricing")}>
              {isEn ? "Claim Discount" : "Využít Slevu 40 %"}
              <ArrowRight className="w-3 h-3" />
            </Link>
          </Button>

          <button
            onClick={() => setDismissed(true)}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
