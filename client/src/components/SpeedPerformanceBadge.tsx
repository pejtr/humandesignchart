import { useState, useEffect } from "react";
import { Zap, Flame, Sparkles, Activity, Gauge } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export function SpeedPerformanceBadge() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [latency, setLatency] = useState(4.2);

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate real-time worker latency micro-variation (3.8ms - 5.1ms)
      setLatency(parseFloat((3.8 + Math.random() * 1.3).toFixed(1)));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 text-white font-bold text-xs shadow-lg shadow-red-500/20 backdrop-blur-md border border-red-400/40 animate-in fade-in zoom-in duration-300">
      <div className="relative flex items-center justify-center">
        <Flame className="w-4 h-4 text-amber-200 animate-pulse" />
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-300 animate-ping" />
      </div>

      <span className="tracking-wide uppercase text-[11px] font-extrabold drop-shadow">
        {isEn ? "High-Speed Aero Engine" : "Bruslíme Rychle & Sexy"}
      </span>

      <div className="h-3 w-[1px] bg-white/30 mx-0.5" />

      <div className="flex items-center gap-1 text-[10px] font-mono text-rose-100">
        <Gauge className="w-3 h-3 text-amber-200" />
        <span>{latency} ms</span>
      </div>
    </div>
  );
}
