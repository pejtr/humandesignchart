import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Timer, Zap, ArrowRight, X, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

export function WelcomeBonusBanner() {
  const { locale, localePath } = useLanguage();
  const isEn = locale === "en";
  const [timeLeft, setTimeLeft] = useState<number>(900); // 15 minutes
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Persistent timer start in localStorage
    const savedStart = localStorage.getItem("welcomeBonusStart");
    const startTime = savedStart ? parseInt(savedStart, 10) : Date.now();
    if (!savedStart) {
      localStorage.setItem("welcomeBonusStart", startTime.toString());
    }

    const updateTimer = () => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, 900 - elapsed);
      setTimeLeft(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  if (isDismissed || timeLeft <= 0) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <div className="bg-gradient-to-r from-amber-600 via-purple-700 to-indigo-700 text-white py-2.5 px-4 relative shadow-md z-30">
      <div className="container max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium">
          <span className="flex items-center gap-1 bg-amber-400/20 text-amber-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px]">
            <Zap className="w-3 h-3 text-amber-300" />
            {isEn ? "Welcome Offer" : "Uvítací bonus"}
          </span>
          <span>
            {isEn
              ? "Unlock full PDF Blueprint with 30% discount!"
              : "Získejte kompletní 40-stránkový rozbor se slevou 30 %!"}
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-lg text-amber-300 font-mono font-bold text-xs sm:text-sm">
            <Timer className="w-3.5 h-3.5" />
            <span>{formattedTime}</span>
          </div>

          <Button
            size="sm"
            className="bg-amber-400 hover:bg-amber-300 text-purple-950 font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-sm gap-1 transition-all hover:scale-105"
            asChild
          >
            <Link href={localePath("/pricing")}>
              {isEn ? "Claim 30% Off" : "Využít 30% slevu"}
              <ArrowRight className="w-3 h-3" />
            </Link>
          </Button>

          <button
            onClick={() => setIsDismissed(true)}
            className="text-white/60 hover:text-white transition-colors p-1"
            aria-label="Zavřít"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
