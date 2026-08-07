import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Headphones, Sparkles, ShieldCheck, CheckCircle2, ArrowRight, Zap } from "lucide-react";
import { HdBrainwavePlayerModal } from "./HdBrainwavePlayerModal";
import { useLanguage } from "@/contexts/LanguageContext";

export function BrainwaveSalesCard() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [showPlayer, setShowPlayer] = useState(false);

  return (
    <>
      <Card className="border-2 border-amber-400/80 bg-gradient-to-br from-slate-950 via-purple-950/80 to-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden relative my-8">
        <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold border border-amber-400/40">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            {isEn ? "Neuroscience Meets Human Design" : "Když Neurověda Potkává Human Design"}
          </div>

          <div className="space-y-2">
            <h3 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white leading-snug">
              {isEn
                ? "The 12-Minute Brain Song: Activate Your Brainwaves for Deep De-conditioning"
                : "12-Minutové Binaurální Zvuky: Aktivujte Své Mozkové Vlny pro Hloubkové De-kondicionování"}
            </h3>
            <p className="text-sm text-purple-200/80 leading-relaxed">
              {isEn
                ? "528Hz Solfeggio frequencies and 40Hz Gamma brainwave audio specifically engineered to release mental pressure and emotional conditioning from your open centers."
                : "528Hz Solfeggio frekvence a 40Hz Gamma binaurální auditory vyvinuté pro rychlé uvolnění mentálního tlaku a emočního stresu z vašich otevřených centr."}
            </p>
          </div>

          {/* 3 Brainsong Benefit Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-400/20 text-amber-300 shrink-0">
                <Headphones className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-white block">{isEn ? "12-Min Routine" : "12minutová rutina"}</span>
                <span className="text-[10px] text-purple-200/70">{isEn ? "Daily audio relaxation" : "Denní reprodukce do sluchátek"}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-400/20 text-purple-300 shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-white block">{isEn ? "528Hz & Gamma" : "528Hz & Gamma"}</span>
                <span className="text-[9px] text-purple-200/70">{isEn ? "Vibrational Tuning" : "Vibrace pro otevřená centra"}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-400/20 text-emerald-300 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-white block">{isEn ? "Instant Access" : "Ihned v mobilu"}</span>
                <span className="text-[9px] text-purple-200/70">{isEn ? "100% Digital Delivery" : "Digitální nahrávka v HD"}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-white/10">
            <div className="text-center sm:text-left">
              <div className="text-[11px] text-muted-foreground uppercase font-mono tracking-wider">
                {isEn ? "Today's Special Price" : "Dnešní Akční Cena"}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-amber-300">390 Kč</span>
                <span className="text-xs text-muted-foreground line-through">790 Kč</span>
              </div>
            </div>

            <Button
              onClick={() => setShowPlayer(true)}
              size="lg"
              className="w-full sm:w-auto bg-gradient-to-r from-amber-400 via-purple-500 to-indigo-600 hover:from-amber-500 hover:to-indigo-700 text-slate-950 font-extrabold text-xs sm:text-sm h-12 px-6 rounded-2xl shadow-xl gap-2"
            >
              <Headphones className="w-4 h-4 fill-current" />
              {isEn ? "Listen to 12-Min Audio Demo" : "Spustit 12-Minutové Audio (Ukázka)"}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </Card>

      <HdBrainwavePlayerModal open={showPlayer} onOpenChange={setShowPlayer} />
    </>
  );
}
