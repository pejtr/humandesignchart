import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Gift, Crown, Trophy, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";

const REWARDS = [
  { label: "+1 AI Kredit", credits: 1, color: "#8b5cf6" },
  { label: "+2 AI Kredity", credits: 2, color: "#f59e0b" },
  { label: "+3 AI Kredity", credits: 3, color: "#ec4899" },
  { label: "Sleva 30%", credits: 0, color: "#10b981" },
  { label: "+1 AI Kredit", credits: 1, color: "#6366f1" },
  { label: "Denní Moudrost", credits: 0, color: "#3b82f6" },
];

export function DailyWheelOfFortune({ compact = false }: { compact?: boolean }) {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wonReward, setWonReward] = useState<string | null>(null);

  const claimMutation = trpc.gamification.claimDailyReward.useMutation({
    onSuccess: (data) => {
      toast.success(
        isEn
          ? `You won +${data.creditsAwarded || 1} AI Credits! 🔥`
          : `Získáváte +${data.creditsAwarded || 1} AI Kredity! 🔥`
      );
    },
  });

  const handleSpin = () => {
    if (spinning || wonReward) return;
    setSpinning(true);

    const randomIndex = Math.floor(Math.random() * REWARDS.length);
    const extraDegree = 360 * 5 + randomIndex * (360 / REWARDS.length);
    setRotation(extraDegree);

    setTimeout(() => {
      setSpinning(false);
      const prize = REWARDS[randomIndex];
      setWonReward(prize.label);
      claimMutation.mutate();
    }, 4000);
  };

  return (
    <Card className={`border border-purple-300/40 dark:border-purple-800/40 bg-gradient-to-br from-purple-950/20 via-background to-amber-950/10 rounded-2xl overflow-hidden shadow-lg ${compact ? "p-4" : "p-6"}`}>
      <div className={`flex items-center justify-between ${compact ? "gap-3" : "flex-col md:flex-row gap-6"}`}>
        <div className={`${compact ? "min-w-0 space-y-1" : "space-y-2 text-center md:text-left max-w-md"}`}>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 text-xs font-semibold">
            <Trophy className="w-3.5 h-3.5" />
            {isEn ? "Daily Wheel of Fortune" : "Denní Kolo Odměn"}
          </div>
          <h3 className={`font-serif font-bold text-foreground ${compact ? "text-base" : "text-xl"}`}>
            {isEn ? "Your daily reward" : "Dnešní odměna"}
          </h3>
          <p className={`text-xs text-muted-foreground leading-relaxed ${compact ? "line-clamp-2" : ""}`}>
            {isEn
              ? "Spin the cosmic wheel once every 24 hours to earn free AI reading credits and keep your daily streak alive!"
              : "Zatočte si vesmírným kolem jednou za 24 hodin, získejte kredity zdarma a udržte svou denní sérii!"}
          </p>
        </div>

        <div className={`flex flex-col items-center shrink-0 ${compact ? "gap-2" : "gap-4"}`}>
          <div className={`relative flex items-center justify-center ${compact ? "w-20 h-20" : "w-40 h-40"}`}>
            {/* Pointer */}
            <div className="absolute -top-2 z-20 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[14px] border-t-amber-400 drop-shadow-md" />

            {/* Spinning Wheel SVG */}
            <motion.div
              animate={{ rotate: rotation }}
              transition={{ duration: 4, ease: [0.15, 0.9, 0.2, 1] }}
              className="w-full h-full rounded-full border-4 border-amber-400/40 shadow-inner overflow-hidden relative"
            >
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {REWARDS.map((r, i) => {
                  const angle = 360 / REWARDS.length;
                  const startAngle = i * angle;
                  const endAngle = (i + 1) * angle;
                  const x1 = 50 + 50 * Math.cos((Math.PI * startAngle) / 180);
                  const y1 = 50 + 50 * Math.sin((Math.PI * startAngle) / 180);
                  const x2 = 50 + 50 * Math.cos((Math.PI * endAngle) / 180);
                  const y2 = 50 + 50 * Math.sin((Math.PI * endAngle) / 180);

                  return (
                    <path
                      key={i}
                      d={`M50,50 L${x1},${y1} A50,50 0 0,1 ${x2},${y2} Z`}
                      fill={r.color}
                      opacity={0.85}
                    />
                  );
                })}
              </svg>
            </motion.div>
          </div>

          <Button
            onClick={handleSpin}
            disabled={spinning || !!wonReward}
            className={`bg-amber-500 hover:bg-amber-400 text-purple-950 font-bold text-xs rounded-xl shadow-md gap-2 ${compact ? "h-8 px-3" : "px-6 py-2"}`}
          >
            <Sparkles className="w-4 h-4" />
            {spinning
              ? isEn ? "Spinning..." : "Točí se..."
              : wonReward
                ? isEn ? `Won: ${wonReward}` : `Vyhráno: ${wonReward}`
                : isEn ? "Spin" : "Zatočit"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
