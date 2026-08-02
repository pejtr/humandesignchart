import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Palette, Download, Crown, Frame, Check } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface PosterGeneratorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chartName?: string;
  chartType?: string;
}

export function PosterGeneratorModal({ open, onOpenChange, chartName, chartType }: PosterGeneratorModalProps) {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [selectedTheme, setSelectedTheme] = useState<"cosmic" | "minimal" | "gold">("cosmic");

  const handleDownloadPoster = () => {
    toast.success(
      isEn
        ? "Generating high-resolution printable A3 vector poster..."
        : "Generuji plno-barevný vektorový A3 plakát v tiskové kvalitě..."
    );
    setTimeout(() => {
      onOpenChange(false);
      toast.success(isEn ? "Poster download started!" : "Stažení plakátu zahájeno!");
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-background border border-purple-300/40 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <DialogHeader className="text-center space-y-2">
          <div className="mx-auto inline-flex p-3 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300">
            <Frame className="w-6 h-6" />
          </div>
          <DialogTitle className="text-2xl font-serif font-bold text-foreground">
            {isEn ? "Printable Wall Art Poster (A3/A2)" : "Luxusní Plakát Vaší Mapy na Zeď"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {isEn
              ? "Download high-resolution vector artwork of your Human Design chart, personalized with sacred geometry and your name for framing."
              : "Stáhněte si vektorovou grafiku vaší mapy v tiskovém rozlišení s posvátnou geometrií a vaším jménem k zarámování na zeď."}
          </DialogDescription>
        </DialogHeader>

        {/* Poster Theme Preview */}
        <div className="space-y-4 my-2">
          <div className="relative aspect-[3/4] max-w-[200px] mx-auto rounded-2xl border-4 border-amber-400/60 shadow-xl overflow-hidden bg-slate-950 flex flex-col items-center justify-between p-4 text-white text-center">
            <div className="text-[10px] uppercase font-mono tracking-widest text-amber-300">HUMAN DESIGN MAPA</div>
            <div className="space-y-1">
              <div className="font-serif text-sm font-bold">{chartName || "Osobní Mapa"}</div>
              <div className="text-[10px] text-purple-200">{chartType || "Generátor 3/5"}</div>
            </div>
            <div className="w-16 h-20 rounded-full border border-amber-400/40 flex items-center justify-center text-[9px] text-amber-300">
              [BODYGRAPH]
            </div>
            <div className="text-[8px] text-muted-foreground font-mono">AVANITO HUMAN DESIGN · 300 DPI A3</div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-purple-500" />
              {isEn ? "Select Color Theme" : "Vyberte Barevný Styl"}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "cosmic", label: "Vesmírná Noc", color: "bg-slate-900 text-purple-300" },
                { id: "gold", label: "Zlatá Geometrie", color: "bg-amber-950 text-amber-300" },
                { id: "minimal", label: "Čistý Minimalist", color: "bg-stone-100 text-stone-900 border" },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTheme(t.id as any)}
                  className={`p-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-between ${t.color} ${
                    selectedTheme === t.id ? "ring-2 ring-purple-500 shadow-md" : "opacity-80 hover:opacity-100"
                  }`}
                >
                  <span>{t.label}</span>
                  {selectedTheme === t.id && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleDownloadPoster}
            className="w-full bg-gradient-to-r from-amber-500 via-purple-600 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white font-bold text-xs h-11 rounded-xl shadow-lg gap-2 mt-2"
          >
            <Download className="w-4 h-4" />
            {isEn ? "Stáhnout Vektorový Plakát A3 (+290 CZK)" : "Stáhnout Vektorový Plakát A3 (+290 Kč)"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
