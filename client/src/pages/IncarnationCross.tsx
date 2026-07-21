import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import {
  ArrowLeft, Sparkles, Loader2, Sun,
  Target, Compass, BookOpen, Lock, Download,
  Star, Zap, Eye, Heart, Flame,
} from "lucide-react";
import type { HumanDesignChartData } from "@shared/types";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { useSEO, OG_IMAGES } from "@/hooks/useSEO";
import { translateCrossName, CROSS_TYPE_CS } from "@/lib/hdConstants";

// ─── Sacred Geometry Cross SVG Diagram ────────────────────────────────────────
interface DiagramGate {
  label: string;
  gate?: number;
  color: string;
  position: "top" | "bottom" | "left" | "right";
}

function CrossDiagram({
  gates,
  crossColor,
  locale,
}: {
  gates: DiagramGate[];
  crossColor: string;
  locale: string;
}) {
  return (
    <div className="relative w-full aspect-square max-w-[260px] mx-auto select-none">
      <svg viewBox="0 0 280 280" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        {/* Outer sacred circles */}
        <circle cx="140" cy="140" r="130" fill="none" stroke={crossColor} strokeWidth="0.5" strokeOpacity="0.15" />
        <circle cx="140" cy="140" r="110" fill="none" stroke={crossColor} strokeWidth="0.5" strokeOpacity="0.1" />
        <circle cx="140" cy="140" r="90" fill="none" stroke={crossColor} strokeWidth="0.5" strokeOpacity="0.08" />
        {/* Flower of Life petals */}
        {[0, 60, 120, 180, 240, 300].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const cx = 140 + 35 * Math.cos(rad);
          const cy = 140 + 35 * Math.sin(rad);
          return (
            <circle key={i} cx={cx} cy={cy} r="35" fill="none" stroke={crossColor} strokeWidth="0.4" strokeOpacity="0.12" />
          );
        })}
        <circle cx="140" cy="140" r="35" fill="none" stroke={crossColor} strokeWidth="0.4" strokeOpacity="0.12" />
        {/* Cross arms */}
        <line x1="140" y1="10" x2="140" y2="270" stroke={crossColor} strokeWidth="1.5" strokeOpacity="0.3" />
        <line x1="10" y1="140" x2="270" y2="140" stroke={crossColor} strokeWidth="1.5" strokeOpacity="0.3" />
        {/* Diagonal lines */}
        <line x1="40" y1="40" x2="240" y2="240" stroke={crossColor} strokeWidth="0.5" strokeOpacity="0.1" />
        <line x1="240" y1="40" x2="40" y2="240" stroke={crossColor} strokeWidth="0.5" strokeOpacity="0.1" />
        {/* Center mandala */}
        <circle cx="140" cy="140" r="22" fill={`${crossColor}18`} stroke={crossColor} strokeWidth="1" strokeOpacity="0.4" />
        <circle cx="140" cy="140" r="14" fill={`${crossColor}25`} stroke={crossColor} strokeWidth="0.8" strokeOpacity="0.5" />
        <circle cx="140" cy="140" r="6" fill={crossColor} fillOpacity="0.7" />
        {/* 4 gate nodes */}
        <circle cx="140" cy="40" r="20" fill={`${gates[0]?.color || crossColor}20`} stroke={gates[0]?.color || crossColor} strokeWidth="1.5" />
        <circle cx="140" cy="240" r="20" fill={`${gates[1]?.color || crossColor}20`} stroke={gates[1]?.color || crossColor} strokeWidth="1.5" />
        <circle cx="40" cy="140" r="20" fill={`${gates[2]?.color || crossColor}20`} stroke={gates[2]?.color || crossColor} strokeWidth="1.5" />
        <circle cx="240" cy="140" r="20" fill={`${gates[3]?.color || crossColor}20`} stroke={gates[3]?.color || crossColor} strokeWidth="1.5" />
        {/* Gate numbers */}
        <text x="140" y="45" textAnchor="middle" dominantBaseline="middle" fontSize="11" fontWeight="bold" fill={gates[0]?.color || crossColor} fillOpacity="0.9">{gates[0]?.gate ?? "?"}</text>
        <text x="140" y="245" textAnchor="middle" dominantBaseline="middle" fontSize="11" fontWeight="bold" fill={gates[1]?.color || crossColor} fillOpacity="0.9">{gates[1]?.gate ?? "?"}</text>
        <text x="40" y="145" textAnchor="middle" dominantBaseline="middle" fontSize="11" fontWeight="bold" fill={gates[2]?.color || crossColor} fillOpacity="0.9">{gates[2]?.gate ?? "?"}</text>
        <text x="240" y="145" textAnchor="middle" dominantBaseline="middle" fontSize="11" fontWeight="bold" fill={gates[3]?.color || crossColor} fillOpacity="0.9">{gates[3]?.gate ?? "?"}</text>
        {/* Symbols */}
        <text x="140" y="22" textAnchor="middle" fontSize="9" fill={gates[0]?.color || "#f59e0b"} fillOpacity="0.7">☀</text>
        <text x="140" y="266" textAnchor="middle" fontSize="9" fill={gates[1]?.color || "#6b7280"} fillOpacity="0.7">⊕</text>
        <text x="22" y="144" textAnchor="middle" fontSize="9" fill={gates[2]?.color || "#ef4444"} fillOpacity="0.7">☀</text>
        <text x="258" y="144" textAnchor="middle" fontSize="9" fill={gates[3]?.color || "#9ca3af"} fillOpacity="0.7">⊕</text>
      </svg>
      {/* Labels */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-0.5 text-center pointer-events-none">
        <span className="text-[8px] font-medium text-muted-foreground whitespace-nowrap">
          {locale === "cs" ? "Osobnost ☀" : "Personality ☀"}
        </span>
      </div>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-0.5 text-center pointer-events-none">
        <span className="text-[8px] font-medium text-muted-foreground whitespace-nowrap">
          {locale === "cs" ? "Osobnost ⊕" : "Personality ⊕"}
        </span>
      </div>
    </div>
  );
}

// ─── Deep Gate Card ────────────────────────────────────────────────────────────
function GateDetailCard({
  gateNumber,
  label,
  color,
  icon,
  locale,
  hdData,
}: {
  gateNumber: number | undefined;
  label: string;
  color: string;
  icon: React.ReactNode;
  locale: string;
  hdData: any;
}) {
  const [expanded, setExpanded] = useState(false);
  if (!gateNumber) return null;
  const gateDesc = hdData?.gates[gateNumber];
  if (!gateDesc) return null;
  const isCs = locale === "cs";
  const name = isCs ? gateDesc.name : gateDesc.nameEn;
  const theme = isCs ? gateDesc.theme : gateDesc.themeEn;
  const description = isCs ? gateDesc.description : gateDesc.descriptionEn;
  const gift = isCs ? gateDesc.giftKeyword : gateDesc.giftKeywordEn;
  const shadow = isCs ? gateDesc.shadowKeyword : gateDesc.shadowKeywordEn;
  return (
    <div
      className="rounded-xl border border-border/50 overflow-hidden cursor-pointer hover:border-primary/30 transition-all"
      style={{ background: `linear-gradient(135deg, ${color}08, ${color}04)` }}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="p-3 flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold"
          style={{ background: `${color}18`, color }}
        >
          {gateNumber}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            {icon}
            <span className="text-[10px] text-muted-foreground font-medium">{label}</span>
          </div>
          <p className="text-sm font-semibold leading-tight">{name}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{gateDesc.iChing} {gateDesc.hexagram}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span
            className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
            style={{ background: `${color}20`, color }}
          >
            {gift}
          </span>
          <span className="text-[9px] text-muted-foreground px-1.5 py-0.5 rounded-full bg-muted/50">
            {shadow}
          </span>
        </div>
      </div>
      {expanded && (
        <div className="px-3 pb-3 pt-0 border-t border-border/30 mt-1">
          <div className="flex flex-wrap gap-1.5 mb-2 mt-2">
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground">
              {isCs ? "Centrum:" : "Center:"} {gateDesc.center}
            </span>
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground">
              {isCs ? "Okruh:" : "Circuit:"} {gateDesc.circuit}
            </span>
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground">
              {isCs ? "Téma:" : "Theme:"} {theme}
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        </div>
      )}
      <div className="px-3 pb-2 flex items-center justify-end">
        <span className="text-[9px] text-muted-foreground/60">
          {expanded ? (isCs ? "▲ Skrýt" : "▲ Hide") : (isCs ? "▼ Více" : "▼ More")}
        </span>
      </div>
    </div>
  );
}

// ─── How to Live Your Cross Section ────────────────────────────────────────────
function HowToLiveSection({
  crossType,
  crossColor,
  locale,
}: {
  crossType: string;
  crossColor: string;
  locale: string;
}) {
  const isCs = locale === "cs";
  type TipSection = { title: string; items: string[] };
  const tips: Record<string, { cs: TipSection[]; en: TipSection[] }> = {
    "Right Angle Cross": {
      cs: [
        { title: "Osobní zkušenost", items: ["Žij plně svůj osobní příběh", "Každá zkušenost je součástí tvého osudu", "Nezkoušej měnit ostatní — měň sebe"] },
        { title: "Vztahy a setkání", items: ["Hledej lidi, kteří tě inspirují k růstu", "Buď otevřený karmickým setkáním", "Tvé vztahy jsou zrcadlem tvého vývoje"] },
        { title: "Kariéra a naplnění", items: ["Sleduj svou autoritu při rozhodování", "Hledej práci, která rezonuje s tvými bránami", "Osobní naplnění je klíčem k úspěchu"] },
      ],
      en: [
        { title: "Personal Experience", items: ["Live your personal story fully", "Every experience is part of your destiny", "Don't try to change others — change yourself"] },
        { title: "Relationships", items: ["Seek people who inspire your growth", "Be open to karmic encounters", "Your relationships mirror your evolution"] },
        { title: "Career & Fulfillment", items: ["Follow your authority in decisions", "Find work that resonates with your gates", "Personal fulfillment is the key to success"] },
      ],
    },
    "Left Angle Cross": {
      cs: [
        { title: "Komunita a kolektiv", items: ["Tvé poslání se naplňuje skrze druhé", "Hledej komunitu, kde můžeš sloužit", "Transpersonální setkání jsou tvým palivem"] },
        { title: "Vliv a vedení", items: ["Sdílej svou moudrost s ostatními", "Buď průvodcem, ne zachráncem", "Tvá přítomnost sama o sobě léčí"] },
        { title: "Každodenní praxe", items: ["Vytvářej prostor pro setkávání", "Buď otevřený neočekávaným setkáním", "Tvůj vliv roste přirozeně"] },
      ],
      en: [
        { title: "Community & Collective", items: ["Your mission fulfills through others", "Seek community where you can serve", "Transpersonal encounters are your fuel"] },
        { title: "Influence & Leadership", items: ["Share your wisdom with others", "Be a guide, not a savior", "Your presence itself heals"] },
        { title: "Daily Practice", items: ["Create space for encounters", "Be open to unexpected meetings", "Your influence grows naturally"] },
      ],
    },
    "Juxtaposition Cross": {
      cs: [
        { title: "Přijetí fixního osudu", items: ["Tvé poslání je pevně dané — přijmi ho", "Neodporuj svému přirozenému toku", "Tvá jedinečnost je tvou silou"] },
        { title: "Autentičnost", items: ["Buď věrný svému designu za každých okolností", "Ostatní tě potřebují takového, jaký jsi", "Tvá konzistence inspiruje druhé"] },
        { title: "Rituály a reflexe", items: ["Praktikuj každodenní rituály v souladu s bránami", "Meditace a reflexe posilují tvůj kříž", "Sleduj synchronicity ve svém životě"] },
      ],
      en: [
        { title: "Accepting Fixed Destiny", items: ["Your mission is fixed — accept it", "Don't resist your natural flow", "Your uniqueness is your strength"] },
        { title: "Authenticity", items: ["Stay true to your design in all circumstances", "Others need you exactly as you are", "Your consistency inspires others"] },
        { title: "Rituals & Reflection", items: ["Practice daily rituals aligned with your gates", "Meditation and reflection strengthen your cross", "Watch for synchronicities in your life"] },
      ],
    },
  };
  const crossTips = tips[crossType] || tips["Right Angle Cross"];
  const tipList = isCs ? crossTips.cs : crossTips.en;
  const icons = [<Zap className="w-4 h-4" />, <Heart className="w-4 h-4" />, <Flame className="w-4 h-4" />];
  return (
    <Card className="overflow-hidden">
      <div className="h-1" style={{ background: `linear-gradient(90deg, ${crossColor}, #2a9d8f, ${crossColor})` }} />
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Eye className="w-4 h-4 text-primary" />
          {isCs ? "Jak žít svůj kříž" : "How to Live Your Cross"}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {isCs
            ? "Praktické vedení pro naplnění vašeho životního poslání"
            : "Practical guidance for fulfilling your life purpose"}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {tipList.map((section, i) => (
          <div key={i}>
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center"
                style={{ background: `${crossColor}20`, color: crossColor }}
              >
                {icons[i] || <Star className="w-3 h-3" />}
              </div>
              <p className="text-sm font-semibold">{section.title}</p>
            </div>
            <ul className="space-y-1 ml-8">
              {section.items.map((item, j) => (
                <li key={j} className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <span style={{ color: crossColor }} className="mt-0.5 shrink-0">◆</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function IncarnationCross() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const { t, locale, localePath } = useLanguage();
  const tp = t.incarnationCrossPage;

  const hdContentQuery = trpc.content.getHdContent.useQuery();
  const hdData = hdContentQuery.data;

  const [chart, setChart] = useState<HumanDesignChartData | null>(null);
  const [chartMeta, setChartMeta] = useState<any>(null);
  const [aiContent, setAiContent] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const isCs = locale === "cs";

  // SEO
  useSEO({
    title: isCs
      ? "Inkarnační Kříž — Životní Poslání, Brány a AI Výklad Human Designu"
      : "Incarnation Cross — Life Purpose, Gates & Human Design AI Reading",
    description: isCs
      ? "Objevte význam svého Inkarnačního kříže v Human Designu. Prozkoumejte 4 definující brány, témata životního poslání a získejte personalizovaný AI výklad vašeho jedinečného kříže."
      : "Discover the meaning of your Incarnation Cross in Human Design. Explore your 4 defining gates, life purpose themes, and get a personalized AI-generated reading of your unique cross.",
    ogImage: OG_IMAGES.calculator,
    ogUrl: isCs
      ? "https://www.humandesignmapa.cz/cs/incarnation-cross"
      : "https://humandesignchart.app/en/incarnation-cross",
    locale: isCs ? "cs_CZ" : "en_US",
    keywords: isCs
      ? "inkarnační kříž, human design, životní poslání, 4 brány, pravý úhlový kříž, levý úhlový kříž, juxtapoziční kříž, AI výklad"
      : "incarnation cross, human design, life purpose, 4 gates, right angle cross, left angle cross, juxtaposition cross, AI reading",
  });

  useEffect(() => {
    const stored = sessionStorage.getItem("chartResult");
    const meta = sessionStorage.getItem("chartMeta");
    if (stored) setChart(JSON.parse(stored));
    if (meta) setChartMeta(JSON.parse(meta));
  }, []);

  const handleAiAnalysis = async () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    if (!chart) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setAiContent("");
    setIsStreaming(true);
    try {
      const chartEncoded = encodeURIComponent(JSON.stringify(chart));
      const url = `/api/ai/stream?chartData=${chartEncoded}&readingType=incarnation_cross&locale=${locale}`;
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok || !response.body) {
        throw new Error("Stream failed");
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (!data) continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.token) setAiContent(prev => prev + parsed.token);
            if (parsed.done) setIsStreaming(false);
            if (parsed.error) throw new Error(parsed.error);
          } catch { /* skip malformed */ }
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        toast.error(isCs ? "AI analýza selhala" : "AI analysis failed");
      }
    } finally {
      setIsStreaming(false);
    }
  };

  const handleDownload = () => {
    if (!aiContent) return;
    const crossName = chart?.incarnationCross?.name || "cross";
    const blob = new Blob([aiContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${isCs ? "inkarnacni-kriz" : "incarnation-cross"}-${crossName.toLowerCase().replace(/\s+/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── Empty state ────────────────────────────────────────────────────────────
  if (!chart) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Navbar />
        <main className="flex-1 pt-24 pb-16 flex items-center justify-center">
          <div className="text-center max-w-md px-4">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-spin" style={{ animationDuration: "20s" }} />
              <div className="absolute inset-2 rounded-full border border-primary/15 animate-spin" style={{ animationDuration: "15s", animationDirection: "reverse" }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <Target className="w-10 h-10 text-primary/60" />
              </div>
            </div>
            <h2 className="font-serif text-2xl font-bold mb-3">{tp.calculateFirst}</h2>
            <p className="text-muted-foreground mb-6">{tp.calculateFirstDesc}</p>
            <Button onClick={() => navigate(localePath("/calculate"))}>
              <Compass className="w-4 h-4 mr-2" />
              {tp.calculateButton}
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ─── Derived data ────────────────────────────────────────────────────────────
  const crossData = chart.incarnationCross;
  const crossName = crossData?.name || "Unknown Cross";
  const displayCrossName = translateCrossName(crossName, locale);
  const crossType = (Object.keys(CROSS_TYPE_CS) as string[]).find(k => crossName.includes(k)) || "Right Angle Cross";
  const crossTypeInfo = (tp.crossTypes as any)[crossType];
  const crossColor = crossType === "Right Angle Cross"
    ? "#7c3aed"
    : crossType === "Left Angle Cross"
      ? "#2a9d8f"
      : "#d4af37";

  const sunGate = chart.personalityActivations?.find((p: any) => p.planet === "Sun")?.gate;
  const earthGate = chart.personalityActivations?.find((p: any) => p.planet === "Earth")?.gate;
  const designSunGate = chart.designActivations?.find((p: any) => p.planet === "Sun")?.gate;
  const designEarthGate = chart.designActivations?.find((p: any) => p.planet === "Earth")?.gate;
  const crossGateNumbers = crossData?.gates || [];

  const diagramGates: DiagramGate[] = [
    { label: tp.personalitySun, gate: sunGate || crossGateNumbers[0], color: "#f59e0b", position: "top" },
    { label: tp.personalityEarth, gate: earthGate || crossGateNumbers[1], color: "#6b7280", position: "bottom" },
    { label: tp.designSun, gate: designSunGate || crossGateNumbers[2], color: "#ef4444", position: "left" },
    { label: tp.designEarth, gate: designEarthGate || crossGateNumbers[3], color: "#9ca3af", position: "right" },
  ];

  const gateCardData = [
    { label: tp.personalitySun, gate: sunGate || crossGateNumbers[0], color: "#f59e0b", icon: <Sun className="w-3.5 h-3.5" style={{ color: "#f59e0b" }} /> },
    { label: tp.personalityEarth, gate: earthGate || crossGateNumbers[1], color: "#6b7280", icon: <span className="text-sm" style={{ color: "#6b7280" }}>⊕</span> },
    { label: tp.designSun, gate: designSunGate || crossGateNumbers[2], color: "#ef4444", icon: <Sun className="w-3.5 h-3.5" style={{ color: "#ef4444" }} /> },
    { label: tp.designEarth, gate: designEarthGate || crossGateNumbers[3], color: "#9ca3af", icon: <span className="text-sm" style={{ color: "#9ca3af" }}>⊕</span> },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container max-w-5xl">
          {/* Back button */}
          <Button
            variant="ghost"
            size="sm"
            className="mb-6 -ml-2"
            onClick={() => navigate(localePath("/calculate"))}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            {tp.backToChart}
          </Button>

          {/* ─── Hero Header ─────────────────────────────────────────────── */}
          <div
            className="relative mb-8 rounded-2xl overflow-hidden p-6 md:p-8"
            style={{
              background: `linear-gradient(135deg, ${crossColor}15 0%, ${crossColor}08 50%, transparent 100%)`,
              borderLeft: `3px solid ${crossColor}`,
            }}
          >
            {/* Hermetic background pattern — animated sacred geometry */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {/* Breathing glow orb */}
              <div
                className="sacred-glow-breathe absolute right-0 top-0 w-64 h-64 rounded-full"
                style={{ background: `radial-gradient(circle, ${crossColor}30 0%, ${crossColor}10 40%, transparent 70%)`, transform: 'translate(25%, -25%)' }}
              />
              <svg viewBox="0 0 400 200" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
                {/* Outer rotating ring group */}
                <g className="sacred-rotate-cw" style={{ transformOrigin: '350px 100px' }}>
                  <circle cx="350" cy="100" r="120" fill="none" stroke={crossColor} strokeWidth="0.8" className="sacred-ring-1" />
                  {/* Hexagonal points on outer ring */}
                  {[0, 60, 120, 180, 240, 300].map((deg, i) => {
                    const rad = (deg * Math.PI) / 180;
                    const x = 350 + 120 * Math.cos(rad);
                    const y = 100 + 120 * Math.sin(rad);
                    return <circle key={i} cx={x} cy={y} r="2.5" fill={crossColor} fillOpacity="0.25" />;
                  })}
                </g>
                {/* Middle counter-rotating ring */}
                <g className="sacred-rotate-ccw" style={{ transformOrigin: '350px 100px' }}>
                  <circle cx="350" cy="100" r="90" fill="none" stroke={crossColor} strokeWidth="0.5" className="sacred-ring-2" />
                  {/* Diamond points on middle ring */}
                  {[45, 135, 225, 315].map((deg, i) => {
                    const rad = (deg * Math.PI) / 180;
                    const x = 350 + 90 * Math.cos(rad);
                    const y = 100 + 90 * Math.sin(rad);
                    return <circle key={i} cx={x} cy={y} r="1.8" fill={crossColor} fillOpacity="0.2" />;
                  })}
                </g>
                {/* Inner static ring */}
                <circle cx="350" cy="100" r="60" fill="none" stroke={crossColor} strokeWidth="0.4" className="sacred-ring-3" />
                {/* Cross lines — pulsing */}
                <line x1="230" y1="100" x2="470" y2="100" stroke={crossColor} strokeWidth="0.6" className="sacred-cross-line" />
                <line x1="350" y1="-20" x2="350" y2="220" stroke={crossColor} strokeWidth="0.6" className="sacred-cross-line" />
                {/* Diagonal lines for Star of David effect */}
                <line x1="246" y1="31" x2="454" y2="169" stroke={crossColor} strokeWidth="0.3" className="sacred-ring-3" />
                <line x1="246" y1="169" x2="454" y2="31" stroke={crossColor} strokeWidth="0.3" className="sacred-ring-3" />
                {/* Center dot */}
                <circle cx="350" cy="100" r="3" fill={crossColor} fillOpacity="0.35" className="sacred-ring-1" />
              </svg>
            </div>
            <div className="relative flex items-start gap-4">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center shadow-md shrink-0"
                style={{ background: `${crossColor}20`, color: crossColor }}
              >
                <Target className="w-7 h-7" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <p className="text-sm text-muted-foreground font-medium">{tp.title}</p>
                  <Badge
                    className="text-white text-xs px-2 py-0.5"
                    style={{ background: crossColor }}
                  >
                    {crossTypeInfo?.theme || tp.badge}
                  </Badge>
                </div>
                <h1 className="font-serif text-2xl md:text-3xl font-bold leading-tight">{displayCrossName}</h1>
                {chartMeta?.name && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {isCs ? `pro ${chartMeta.name}` : `for ${chartMeta.name}`}
                  </p>
                )}
                {crossTypeInfo && (
                  <p className="text-sm text-muted-foreground mt-2 max-w-2xl leading-relaxed">
                    {crossTypeInfo.desc}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ─── Main Grid ─────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

            {/* ─── Left Panel (2 cols) ──────────────────────────────────────── */}
            <div className="lg:col-span-2 space-y-5">

              {/* Sacred Geometry Cross Diagram */}
              <Card className="overflow-hidden">
                <div className="h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${crossColor}, transparent)` }} />
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground font-medium">
                    <Star className="w-3.5 h-3.5" style={{ color: crossColor }} />
                    {isCs ? "Diagram kříže" : "Cross Diagram"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <CrossDiagram
                    gates={diagramGates}
                    crossColor={crossColor}
                    locale={locale}
                  />
                </CardContent>
              </Card>

              {/* What is Incarnation Cross */}
              <Card style={{ background: `linear-gradient(135deg, ${crossColor}08, transparent)` }}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-2">
                    <BookOpen className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold mb-1">{tp.whatIs}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {tp.whatIsDesc}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* How to Live Your Cross */}
              <HowToLiveSection
                crossType={crossType}
                crossColor={crossColor}
                locale={locale}
              />
            </div>

            {/* ─── Right Panel (3 cols) ─────────────────────────────────────── */}
            <div className="lg:col-span-3 space-y-5">

              {/* The 4 Gates — Deep Cards */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Star className="w-4 h-4 text-primary" />
                    {tp.fourGates}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {isCs
                      ? "Klikněte na bránu pro zobrazení podrobností"
                      : "Click a gate to see details"}
                  </p>
                </CardHeader>
                <CardContent className="space-y-2">
                  {gateCardData.map((g, i) => (
                    <GateDetailCard
                      key={i}
                      gateNumber={g.gate}
                      label={g.label}
                      color={g.color}
                      icon={g.icon}
                      locale={locale}
                      hdData={hdData}
                    />
                  ))}
                  {gateCardData.every(g => !g.gate) && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {isCs ? "Data bran nejsou dostupná." : "Gate data not available."}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* AI Analysis Card */}
              <Card className="overflow-hidden">
                <div className="h-1" style={{ background: `linear-gradient(90deg, ${crossColor}, #2a9d8f, ${crossColor})` }} />
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    {tp.aiTitle}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {tp.aiDesc}
                    {chartMeta?.name ? (isCs ? ` pro ${chartMeta.name}` : ` for ${chartMeta.name}`) : ""}
                  </p>
                </CardHeader>
                <CardContent>
                  {/* Not started */}
                  {!aiContent && !isStreaming && (
                    <div className="text-center py-8">
                      <div className="relative w-24 h-24 mx-auto mb-5">
                        <div className="absolute inset-0 rounded-full animate-spin" style={{ animationDuration: "25s", border: `1px solid ${crossColor}30` }} />
                        <div className="absolute inset-2 rounded-full animate-spin" style={{ animationDuration: "18s", animationDirection: "reverse", border: `1px solid ${crossColor}20` }} />
                        <div
                          className="absolute inset-0 rounded-full flex items-center justify-center"
                          style={{ background: `${crossColor}10`, color: crossColor }}
                        >
                          <Target className="w-10 h-10" />
                        </div>
                      </div>
                      <h3 className="font-serif text-xl font-bold mb-2">{displayCrossName}</h3>
                      <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                        {isCs
                          ? "Nechte AI odhalit hlubší smysl vašeho inkarnačního kříže — vaše životní téma, výzvy a dary, které přinášíte světu."
                          : "Let AI reveal the deeper meaning of your Incarnation Cross — your life theme, challenges, and gifts you bring to the world."}
                      </p>
                      {isAuthenticated ? (
                        <Button
                          onClick={handleAiAnalysis}
                          size="lg"
                          className="text-white px-8"
                          style={{ background: `linear-gradient(135deg, ${crossColor}, #2a9d8f)`, border: "none" }}
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          {tp.aiButton}
                        </Button>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
                            <Lock className="w-4 h-4" />
                            {tp.aiLoginRequired}
                          </div>
                          <a href={getLoginUrl()}>
                            <Button
                              size="lg"
                              className="text-white px-8"
                              style={{ background: `linear-gradient(135deg, ${crossColor}, #2a9d8f)`, border: "none" }}
                            >
                              <Sparkles className="w-4 h-4 mr-2" />
                              {tp.aiLoginButton}
                            </Button>
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                  {/* Streaming in progress */}
                  {isStreaming && !aiContent && (
                    <div className="flex flex-col items-center justify-center py-12 gap-4">
                      <div className="relative">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ background: crossColor }} />
                      </div>
                      <p className="text-sm text-muted-foreground">{tp.aiGenerating}</p>
                    </div>
                  )}
                  {/* Streaming content */}
                  {(aiContent || isStreaming) && aiContent && (
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <Streamdown>{aiContent}</Streamdown>
                      {isStreaming && (
                        <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-0.5 align-middle" />
                      )}
                      {!isStreaming && (
                        <>
                          <Separator className="my-4" />
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={handleAiAnalysis}>
                              <Sparkles className="w-4 h-4 mr-1.5" />
                              {tp.aiRegenerate}
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleDownload}>
                              <Download className="w-4 h-4 mr-1.5" />
                              {t.common.download}
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
