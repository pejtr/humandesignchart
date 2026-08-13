import { useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Palette, Download, Crown, Frame, Check } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import Bodygraph from "@/components/Bodygraph";
import type { HumanDesignChartData } from "@shared/types";

type PosterTheme = "cosmic" | "minimal" | "gold";

interface PosterGeneratorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chartName?: string;
  chartType?: string;
  chart?: HumanDesignChartData;
  isPremium?: boolean;
  onUpgrade?: () => void;
}

const THEMES: Record<PosterTheme, { background: string; foreground: string; accent: string; muted: string; border: string }> = {
  cosmic: { background: "#070719", foreground: "#f8f4ff", accent: "#a970ff", muted: "#c4b5d9", border: "#7c3aed" },
  gold: { background: "#21140d", foreground: "#fff8e7", accent: "#f4c95d", muted: "#dfc99c", border: "#d69e2e" },
  minimal: { background: "#faf9f6", foreground: "#18131f", accent: "#7c3aed", muted: "#6b6470", border: "#d6cce7" },
};

function escapeXml(value: string) {
  return value.replace(/[<>&'\"]/g, char => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", "\"": "&quot;" }[char] || char));
}

export function PosterGeneratorModal({
  open,
  onOpenChange,
  chartName,
  chartType,
  chart,
  isPremium = false,
  onUpgrade,
}: PosterGeneratorModalProps) {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [selectedTheme, setSelectedTheme] = useState<PosterTheme>("cosmic");
  const previewRef = useRef<HTMLDivElement>(null);
  const theme = useMemo(() => THEMES[selectedTheme], [selectedTheme]);

  const handleDownloadPoster = () => {
    if (!isPremium) {
      onOpenChange(false);
      onUpgrade?.();
      return;
    }

    const safeName = escapeXml(chartName || (isEn ? "My chart" : "Moje mapa"));
    const safeType = escapeXml(chartType || "Human Design");
    const bodygraphNode = previewRef.current?.querySelector("svg")?.cloneNode(true) as SVGElement | undefined;
    let bodygraphMarkup = "";
    if (bodygraphNode) {
      bodygraphNode.setAttribute("x", "310");
      bodygraphNode.setAttribute("y", "390");
      bodygraphNode.setAttribute("width", "500");
      bodygraphNode.setAttribute("height", "760");
      bodygraphNode.setAttribute("preserveAspectRatio", "xMidYMid meet");
      bodygraphMarkup = new XMLSerializer().serializeToString(bodygraphNode);
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1120 1584" width="1120" height="1584">
      <rect width="1120" height="1584" rx="36" fill="${theme.background}"/>
      <g fill="none" stroke="${theme.accent}" opacity=".22">
        <circle cx="560" cy="790" r="390"/><circle cx="560" cy="790" r="300"/><circle cx="560" cy="790" r="210"/>
        <path d="M560 400 898 985 222 985Z M222 595 898 595 560 1180Z"/>
      </g>
      <text x="560" y="130" fill="${theme.accent}" text-anchor="middle" font-family="Arial" font-size="24" letter-spacing="8">HUMAN DESIGN</text>
      <text x="560" y="250" fill="${theme.foreground}" text-anchor="middle" font-family="Georgia" font-size="58" font-weight="700">${safeName}</text>
      <text x="560" y="302" fill="${theme.muted}" text-anchor="middle" font-family="Arial" font-size="26">${safeType}</text>
      ${bodygraphMarkup || `<g transform="translate(560 790)" fill="${theme.background}" stroke="${theme.accent}" stroke-width="8"><path d="M0-210 90-95 45-15-45-15-90-95Z"/><rect x="-70" y="15" width="140" height="115" rx="12"/><path d="M0 150 95 245 0 340-95 245Z"/><circle cx="0" cy="-305" r="58"/></g>`}
      <text x="560" y="1460" fill="${theme.muted}" text-anchor="middle" font-family="Arial" font-size="18" letter-spacing="4">HUMANDESIGNMAPA.CZ · PREMIUM</text>
      <rect x="22" y="22" width="1076" height="1540" rx="26" fill="none" stroke="${theme.border}" stroke-width="5"/>
    </svg>`;
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `human-design-${(chartName || "mapa").toLowerCase().replace(/[^a-z0-9]+/gi, "-")}-${selectedTheme}.svg`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(isEn ? "Premium SVG poster downloaded." : "Premium SVG plakát byl stažen.");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-background border border-purple-300/40 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <DialogHeader className="text-center space-y-2">
          <div className="mx-auto inline-flex p-3 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300">
            <Frame className="w-6 h-6" />
          </div>
          <DialogTitle className="text-2xl font-serif font-bold text-foreground">
            {isEn ? "Printable Human Design poster" : "Plakát vaší Human Design mapy"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {isEn
              ? "A personalized scalable SVG for high-quality A3 printing. Included in Premium."
              : "Personalizované vektorové SVG pro kvalitní tisk A3. Je součástí Premium."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2">
          <div
            ref={previewRef}
            className="relative aspect-[3/4] max-w-[210px] mx-auto rounded-2xl border-4 shadow-xl overflow-hidden flex flex-col items-center justify-between p-4 text-center transition-colors duration-300"
            style={{ backgroundColor: theme.background, color: theme.foreground, borderColor: theme.border }}
          >
            <div className="absolute inset-5 rounded-full border opacity-20" style={{ borderColor: theme.accent }} />
            <div className="relative text-[9px] uppercase font-mono tracking-[0.25em]" style={{ color: theme.accent }}>HUMAN DESIGN</div>
            <div className="relative space-y-1">
              <div className="font-serif text-sm font-bold">{chartName || (isEn ? "My chart" : "Moje mapa")}</div>
              <div className="text-[10px]" style={{ color: theme.muted }}>{chartType || "Human Design"}</div>
            </div>
            <div className="relative h-[118px] w-[102px] overflow-hidden flex items-center justify-center">
              {chart ? <Bodygraph chart={chart} width={102} height={118} /> : <Frame className="w-14 h-14" style={{ color: theme.accent }} />}
            </div>
            <div className="relative text-[7px] font-mono tracking-wider" style={{ color: theme.muted }}>HUMANDESIGNMAPA.CZ · PREMIUM</div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-purple-500" />
              {isEn ? "Select color style" : "Vyberte barevný styl"}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { id: "cosmic", cs: "Vesmírná noc", en: "Cosmic night" },
                { id: "gold", cs: "Zlatá geometrie", en: "Golden geometry" },
                { id: "minimal", cs: "Čistý minimal", en: "Clean minimal" },
              ] as const).map(item => {
                const colors = THEMES[item.id];
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setSelectedTheme(item.id)}
                    className={`p-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-between border ${selectedTheme === item.id ? "ring-2 ring-purple-500 shadow-md" : "opacity-80 hover:opacity-100"}`}
                    style={{ backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }}
                  >
                    <span>{isEn ? item.en : item.cs}</span>
                    {selectedTheme === item.id && <Check className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          <Button onClick={handleDownloadPoster} className="w-full h-11 rounded-xl gap-2 font-bold">
            {isPremium ? <Download className="w-4 h-4" /> : <Crown className="w-4 h-4" />}
            {isPremium
              ? (isEn ? "Download Premium SVG poster" : "Stáhnout Premium SVG plakát")
              : (isEn ? "Unlock poster with Premium" : "Odemknout plakát v Premium")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
