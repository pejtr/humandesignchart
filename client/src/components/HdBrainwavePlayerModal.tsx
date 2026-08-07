import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Play, Pause, Headphones, Sparkles, Volume2, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

interface HdBrainwavePlayerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  centerName?: string;
}

export function HdBrainwavePlayerModal({ open, onOpenChange, centerName = "Otevřená Centra" }: HdBrainwavePlayerModalProps) {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(720); // 12 minutes (720s)
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsPlaying(false);
            clearInterval(timerRef.current);
            toast.success(isEn ? "12-minute session completed!" : "12minutové de-kondicionování bylo dokončeno!");
            return 720;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isPlaying, isEn]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      toast.info(
        isEn
          ? "Playing 528Hz Solfeggio & Gamma Brainwave Audio for HD Center De-conditioning"
          : "Spouštím 528Hz Solfeggio a Gamma Binaurální zvuky pro de-kondicionování vaší mapy..."
      );
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-slate-950 text-white border border-purple-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
        <DialogHeader className="text-center space-y-2">
          <div className="mx-auto inline-flex p-3 rounded-2xl bg-gradient-to-r from-amber-500 to-purple-600 text-white shadow-lg">
            <Headphones className="w-6 h-6 animate-pulse" />
          </div>
          <DialogTitle className="text-2xl font-serif font-bold text-white">
            {isEn ? "12-Minute HD Brainwave De-conditioning" : "12-Minutové HD Binaurální De-kondicionování"}
          </DialogTitle>
          <DialogDescription className="text-xs text-purple-200/80">
            {isEn
              ? "Neuroscience meets Human Design — 528Hz Solfeggio & 40Hz Gamma soundscapes tuned specifically for your Open Centers."
              : "Neurověda a Human Design — 528Hz Solfeggio & 40Hz Gamma Binaurální frekvence vyladěné pro uvolnění stresu ve vašich Otevřených Centrech."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 my-2">
          {/* Animated Brainwave Audio Visualizer */}
          <div className="relative p-6 rounded-3xl bg-gradient-to-br from-purple-900/40 via-slate-900 to-amber-950/40 border border-purple-400/30 text-center space-y-4 shadow-inner">
            <div className="flex justify-center items-center gap-1.5 h-12">
              {[40, 65, 30, 85, 45, 95, 55, 75, 35, 90, 50, 70].map((h, idx) => (
                <div
                  key={idx}
                  className={`w-1.5 rounded-full bg-gradient-to-t from-amber-400 to-purple-400 transition-all duration-300 ${
                    isPlaying ? "animate-bounce" : "opacity-40"
                  }`}
                  style={{ height: isPlaying ? `${h}%` : "30%", animationDelay: `${idx * 0.1}s` }}
                />
              ))}
            </div>

            <div className="space-y-1">
              <div className="text-3xl font-mono font-bold text-amber-300 tracking-wider">
                {timeFormatted}
              </div>
              <div className="text-[10px] uppercase font-mono text-purple-200/70 tracking-widest">
                528 HZ SOLFEGGIO · FREKVENCE PRO: {centerName.toUpperCase()}
              </div>
            </div>

            <Button
              onClick={togglePlay}
              size="lg"
              className="w-full bg-gradient-to-r from-amber-400 via-purple-500 to-indigo-600 hover:scale-105 transition-all text-slate-950 font-extrabold text-sm h-12 rounded-2xl shadow-xl gap-2"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
              {isPlaying
                ? (isEn ? "Pause Session" : "Pozastavit Zvukovou Terapii")
                : (isEn ? "Start 12-Minute Brain Song" : "Spustit 12-Minutové Binaurální Zvuky")}
            </Button>
          </div>

          {/* Brainsong Style Feature Badges */}
          <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
              <span className="font-bold text-white block">{isEn ? "12-Min Daily" : "12-Min Denně"}</span>
              <span className="text-[9px] text-muted-foreground">{isEn ? "Simple Routine" : "Snadná rutina"}</span>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <Sparkles className="w-4 h-4 text-amber-400 mx-auto" />
              <span className="font-bold text-white block">{isEn ? "Gamma 40Hz" : "Gamma 40Hz"}</span>
              <span className="text-[9px] text-muted-foreground">{isEn ? "Neuroscience" : "Neurověda"}</span>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <ShieldCheck className="w-4 h-4 text-purple-400 mx-auto" />
              <span className="font-bold text-white block">{isEn ? "100% Digital" : "100% Digitální"}</span>
              <span className="text-[9px] text-muted-foreground">{isEn ? "Instant Access" : "Ihned v mobilu"}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
