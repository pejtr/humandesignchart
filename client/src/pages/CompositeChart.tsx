import { useState, useMemo } from "react";
import { useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  ArrowLeft, Sparkles, Zap, Users, Heart, GitCompare,
  Loader2, Info, Star, Shield, TrendingUp, ChevronDown, ChevronUp,
} from "lucide-react";
import PremiumPaywall from "@/components/PremiumPaywall";

// ─── Center name translations ─────────────────────────────────────────────────
const CENTER_CS: Record<string, string> = {
  Head: "Hlava", Ajna: "Ajna", Throat: "Hrdlo", G: "G-centrum",
  Heart: "Srdce", Sacral: "Sakrální", "Solar Plexus": "Solární Plexus",
  Spleen: "Slezina", Root: "Kořen",
};

// ─── Compatibility Score Ring ─────────────────────────────────────────────────
function ScoreRing({ score, nameA, nameB }: { score: number; nameA: string; nameB: string }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 75 ? "#a78bfa" : score >= 50 ? "#f59e0b" : "#6b7280";
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-36 h-36">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
          <circle
            cx="60" cy="60" r={r} fill="none"
            stroke={color} strokeWidth="8"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1.2s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold" style={{ color }}>{score}</span>
          <span className="text-xs text-muted-foreground">/ 100</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold">{nameA} <span className="text-muted-foreground">×</span> {nameB}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {score >= 75 ? "Silná kompatibilita" : score >= 50 ? "Dobrá kompatibilita" : "Výzva k růstu"}
        </p>
      </div>
    </div>
  );
}

// ─── Electromagnetic Channel Card ─────────────────────────────────────────────
function EmChannelCard({ ch, nameA, nameB }: { ch: { gate1: number; gate2: number; fromA: number; fromB: number }; nameA: string; nameB: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="p-3 rounded-lg border border-violet-500/30 bg-violet-500/5 cursor-pointer hover:bg-violet-500/10 transition-colors"
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-violet-400" />
          <span className="font-semibold text-sm">Kanál {ch.gate1}–{ch.gate2}</span>
          <Badge variant="outline" className="text-[10px] border-violet-400/40 text-violet-400">EM</Badge>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </div>
      {open && (
        <div className="mt-2 pt-2 border-t border-violet-500/20 text-xs text-muted-foreground space-y-1">
          <p><span className="text-violet-300 font-medium">{nameA}</span> přináší Bránu {ch.fromA}</p>
          <p><span className="text-rose-300 font-medium">{nameB}</span> přináší Bránu {ch.fromB}</p>
          <p className="text-violet-200 mt-1">Elektromagnetické spojení vytváří silnou přitažlivost a vzájemné doplňování energie.</p>
        </div>
      )}
    </div>
  );
}

// ─── Center Compatibility Grid ────────────────────────────────────────────────
function CenterGrid({ centers, nameA, nameB, locale }: {
  centers: Array<{ name: string; aState: boolean; bState: boolean; interaction: string }>;
  nameA: string; nameB: string; locale: string;
}) {
  const interactionColor = (i: string) =>
    i === "amplification" ? "text-amber-400" : i === "conditioning" ? "text-rose-400" : "text-muted-foreground";
  const interactionLabel = (i: string) => {
    if (locale === "cs") {
      return i === "amplification" ? "Zesílení" : i === "conditioning" ? "Kondicionování" : "Otevřeno";
    }
    return i === "amplification" ? "Amplification" : i === "conditioning" ? "Conditioning" : "Open";
  };
  return (
    <div className="grid grid-cols-3 gap-2">
      {centers.map(c => (
        <div key={c.name} className="p-2 rounded-lg border border-border/40 bg-muted/10 text-center">
          <p className="text-[10px] font-medium text-muted-foreground mb-1">{locale === "cs" ? (CENTER_CS[c.name] || c.name) : c.name}</p>
          <div className="flex items-center justify-center gap-1 mb-1">
            <div className={`w-2.5 h-2.5 rounded-full ${c.aState ? "bg-violet-400" : "bg-muted-foreground/30"}`} title={nameA} />
            <div className={`w-2.5 h-2.5 rounded-full ${c.bState ? "bg-rose-400" : "bg-muted-foreground/30"}`} title={nameB} />
          </div>
          <p className={`text-[9px] font-medium ${interactionColor(c.interaction)}`}>{interactionLabel(c.interaction)}</p>
        </div>
      ))}
    </div>
  );
}

// ─── SVG Composite Diagram ────────────────────────────────────────────────────
function CompositeSVG({ nameA, nameB, emCount, sharedCount, score }: {
  nameA: string; nameB: string; emCount: number; sharedCount: number; score: number;
}) {
  const color = score >= 75 ? "#a78bfa" : score >= 50 ? "#f59e0b" : "#6b7280";
  return (
    <svg viewBox="0 0 300 180" className="w-full max-w-sm mx-auto" xmlns="http://www.w3.org/2000/svg">
      {/* Background */}
      <defs>
        <radialGradient id="cgA" cx="35%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="cgB" cx="65%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#e11d48" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#e11d48" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Glow circles */}
      <circle cx="105" cy="90" r="70" fill="url(#cgA)" />
      <circle cx="195" cy="90" r="70" fill="url(#cgB)" />
      {/* Person A circle */}
      <circle cx="105" cy="90" r="55" fill="none" stroke="#7c3aed" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6" />
      {/* Person B circle */}
      <circle cx="195" cy="90" r="55" fill="none" stroke="#e11d48" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6" />
      {/* Intersection highlight */}
      <ellipse cx="150" cy="90" rx="22" ry="45" fill={color} fillOpacity="0.12" />
      {/* EM lightning bolts */}
      {Array.from({ length: Math.min(emCount, 5) }).map((_, i) => (
        <text key={i} x={145 + (i % 2 === 0 ? -4 : 4)} y={65 + i * 14} fontSize="10" fill={color} opacity="0.8">⚡</text>
      ))}
      {/* Labels */}
      <text x="105" y="158" textAnchor="middle" fontSize="9" fill="#a78bfa" fontWeight="600">{nameA.slice(0, 12)}</text>
      <text x="195" y="158" textAnchor="middle" fontSize="9" fill="#fb7185" fontWeight="600">{nameB.slice(0, 12)}</text>
      {/* Center score */}
      <text x="150" y="87" textAnchor="middle" fontSize="16" fill={color} fontWeight="bold">{score}</text>
      <text x="150" y="100" textAnchor="middle" fontSize="7" fill="#94a3b8">skóre</text>
    </svg>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CompositeChart() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const preselectedId = params.get("chartId") ? parseInt(params.get("chartId")!) : null;

  const { isAuthenticated } = useAuth();
  const { locale } = useLanguage();
  const [chartIdA, setChartIdA] = useState<number | null>(preselectedId);
  const [chartIdB, setChartIdB] = useState<number | null>(null);
  const [aiReading, setAiReading] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  const localePath = (p: string) => `/${locale}${p}`;

  const chartsQuery = trpc.chart.list.useQuery(undefined, { enabled: isAuthenticated });
  const charts = chartsQuery.data || [];

  const analyzeQuery = trpc.composite.analyze.useQuery(
    { chartIdA: chartIdA!, chartIdB: chartIdB! },
    { enabled: !!chartIdA && !!chartIdB }
  );

  const aiMutation = trpc.composite.aiReading.useMutation({
    onSuccess: (data) => {
      setAiReading(typeof data.content === "string" ? data.content : "");
      setAiLoading(false);
    },
    onError: (err) => {
      setAiLoading(false);
      if (err.data?.code === "PAYMENT_REQUIRED") {
        setShowPaywall(true);
      } else {
        toast.error("AI výklad selhal: " + err.message);
      }
    },
  });

  const handleAiReading = () => {
    if (!isAuthenticated) { window.location.href = getLoginUrl(); return; }
    if (!chartIdA || !chartIdB) return;
    setAiLoading(true);
    setAiReading(null);
    aiMutation.mutate({ chartIdA, chartIdB, locale });
  };

  const result = analyzeQuery.data;
  const nameA = result?.chartA.name || charts.find(c => c.id === chartIdA)?.name || "Osoba A";
  const nameB = result?.chartB.name || charts.find(c => c.id === chartIdB)?.name || "Osoba B";

  // Group charts by category
  const selfCharts = charts.filter(c => c.category === "self");
  const otherCharts = charts.filter(c => c.category !== "self");

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Navbar />
        <main className="flex-1 flex items-center justify-center pt-24">
          <div className="text-center max-w-md px-4">
            <GitCompare className="w-12 h-12 text-primary mx-auto mb-4 opacity-60" />
            <h1 className="font-serif text-2xl font-bold mb-2">
              {locale === "cs" ? "Composite Chart — Analýza vztahu" : "Composite Chart — Relationship Analysis"}
            </h1>
            <p className="text-muted-foreground mb-6">
              {locale === "cs" ? "Pro analýzu vztahu se přihlaste." : "Please log in to analyze relationships."}
            </p>
            <Button onClick={() => window.location.href = getLoginUrl()}>
              {locale === "cs" ? "Přihlásit se" : "Log in"}
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      {showPaywall && <PremiumPaywall onClose={() => setShowPaywall(false)} />}

      <main className="flex-1 pt-24 pb-16">
        <div className="container max-w-5xl">
          <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate(localePath("/dashboard"))}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            {locale === "cs" ? "Dashboard" : "Dashboard"}
          </Button>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm mb-4">
              <GitCompare className="w-4 h-4" />
              {locale === "cs" ? "Composite Chart" : "Composite Chart"}
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold mb-3">
              {locale === "cs" ? "Analýza vztahu dvou map" : "Relationship Analysis"}
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {locale === "cs"
                ? "Odhalte elektromagnetická spojení, sdílené kanály a dynamiku vztahu mezi dvěma lidmi."
                : "Discover electromagnetic connections, shared channels, and relationship dynamics between two people."}
            </p>
          </div>

          {/* Chart Selection */}
          <Card className="bg-card border-border/50 mb-8">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                {locale === "cs" ? "Vyberte dvě mapy pro porovnání" : "Select two charts to compare"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Chart A */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-violet-400" />
                    {locale === "cs" ? "Osoba A" : "Person A"}
                  </label>
                  <Select
                    value={chartIdA?.toString() || ""}
                    onValueChange={(v) => setChartIdA(parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={locale === "cs" ? "Vyberte mapu..." : "Select chart..."} />
                    </SelectTrigger>
                    <SelectContent>
                      {selfCharts.length > 0 && (
                        <>
                          <div className="px-2 py-1 text-[10px] text-muted-foreground uppercase tracking-widest">
                            {locale === "cs" ? "Moje mapy" : "My charts"}
                          </div>
                          {selfCharts.map(c => (
                            <SelectItem key={c.id} value={c.id.toString()}>
                              <div className="flex items-center gap-2">
                                <span>👤</span> {c.name}
                              </div>
                            </SelectItem>
                          ))}
                        </>
                      )}
                      {otherCharts.length > 0 && (
                        <>
                          <div className="px-2 py-1 text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
                            {locale === "cs" ? "Ostatní osoby" : "Other people"}
                          </div>
                          {otherCharts.map(c => (
                            <SelectItem key={c.id} value={c.id.toString()}>
                              <div className="flex items-center gap-2">
                                <span>{c.category === "family" ? "❤️" : c.category === "friend" ? "👥" : c.category === "client" ? "💼" : "⭐"}</span>
                                {c.name}
                              </div>
                            </SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Chart B */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-rose-400" />
                    {locale === "cs" ? "Osoba B" : "Person B"}
                  </label>
                  <Select
                    value={chartIdB?.toString() || ""}
                    onValueChange={(v) => setChartIdB(parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={locale === "cs" ? "Vyberte mapu..." : "Select chart..."} />
                    </SelectTrigger>
                    <SelectContent>
                      {charts.filter(c => c.id !== chartIdA).map(c => (
                        <SelectItem key={c.id} value={c.id.toString()}>
                          <div className="flex items-center gap-2">
                            <span>{c.category === "self" ? "👤" : c.category === "family" ? "❤️" : c.category === "friend" ? "👥" : c.category === "client" ? "💼" : "⭐"}</span>
                            {c.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {charts.length < 2 && (
                <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-amber-600">
                  💡 {locale === "cs"
                    ? "Pro Composite analýzu potřebujete alespoň 2 uložené mapy. Vypočítejte a uložte mapy z "
                    : "You need at least 2 saved charts for Composite analysis. Calculate and save charts from "}
                  <button className="underline" onClick={() => navigate(localePath("/calculate"))}>
                    {locale === "cs" ? "stránky výpočtu" : "the calculator page"}
                  </button>.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results */}
          {analyzeQuery.isLoading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {result && (
            <div className="space-y-6">
              {/* Score + SVG Diagram */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-card border-border/50">
                  <CardContent className="pt-6 flex items-center justify-center">
                    <ScoreRing score={result.compatibilityScore} nameA={nameA} nameB={nameB} />
                  </CardContent>
                </Card>
                <Card className="bg-card border-border/50">
                  <CardContent className="pt-6">
                    <CompositeSVG
                      nameA={nameA} nameB={nameB}
                      emCount={result.electromagnetic.length}
                      sharedCount={result.sharedChannels.length}
                      score={result.compatibilityScore}
                    />
                    <div className="flex items-center justify-center gap-4 mt-3">
                      <div className="flex items-center gap-1.5 text-xs">
                        <div className="w-2.5 h-2.5 rounded-full bg-violet-400" />
                        <span className="text-muted-foreground">{nameA}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                        <span className="text-muted-foreground">{nameB}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-card border-border/50 text-center">
                  <CardContent className="pt-4 pb-4">
                    <Zap className="w-5 h-5 text-violet-400 mx-auto mb-1" />
                    <p className="text-2xl font-bold">{result.electromagnetic.length}</p>
                    <p className="text-xs text-muted-foreground">{locale === "cs" ? "EM spojení" : "EM connections"}</p>
                  </CardContent>
                </Card>
                <Card className="bg-card border-border/50 text-center">
                  <CardContent className="pt-4 pb-4">
                    <Star className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                    <p className="text-2xl font-bold">{result.sharedChannels.length}</p>
                    <p className="text-xs text-muted-foreground">{locale === "cs" ? "Sdílené kanály" : "Shared channels"}</p>
                  </CardContent>
                </Card>
                <Card className="bg-card border-border/50 text-center">
                  <CardContent className="pt-4 pb-4">
                    <TrendingUp className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                    <p className="text-2xl font-bold">{result.summary.totalConnections}</p>
                    <p className="text-xs text-muted-foreground">{locale === "cs" ? "Celkem spojení" : "Total connections"}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Electromagnetic Channels */}
              {result.electromagnetic.length > 0 && (
                <Card className="bg-card border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Zap className="w-4 h-4 text-violet-400" />
                      {locale === "cs" ? "Elektromagnetická spojení" : "Electromagnetic Connections"}
                      <Badge variant="outline" className="ml-auto border-violet-400/40 text-violet-400">
                        {result.electromagnetic.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground mb-3">
                      {locale === "cs"
                        ? "Elektromagnetické spojení vzniká, když jedna osoba má jednu bránu kanálu a druhá má druhou bránu — vytváří silnou přitažlivost a vzájemné doplňování."
                        : "Electromagnetic connections occur when one person has one gate of a channel and the other has the complementary gate — creating strong attraction and mutual completion."}
                    </p>
                    <div className="space-y-2">
                      {result.electromagnetic.map((ch, i) => (
                        <EmChannelCard key={i} ch={ch} nameA={nameA} nameB={nameB} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Shared Channels */}
              {result.sharedChannels.length > 0 && (
                <Card className="bg-card border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-400" />
                      {locale === "cs" ? "Sdílené kanály" : "Shared Channels"}
                      <Badge variant="outline" className="ml-auto border-amber-400/40 text-amber-400">
                        {result.sharedChannels.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground mb-3">
                      {locale === "cs"
                        ? "Sdílené kanály zesilují energii — oba lidé mají stejnou definici, což vytváří silné vzájemné pochopení a rezonanci."
                        : "Shared channels amplify energy — both people have the same definition, creating deep mutual understanding and resonance."}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {result.sharedChannels.map((ch, i) => (
                        <Badge key={i} variant="outline" className="border-amber-400/40 text-amber-400 bg-amber-400/5">
                          ⭐ {ch.gate1}–{ch.gate2}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Center Compatibility */}
              <Card className="bg-card border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    {locale === "cs" ? "Kompatibilita center" : "Center Compatibility"}
                  </CardTitle>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-violet-400" /> {nameA}</div>
                    <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-rose-400" /> {nameB}</div>
                    <div className="flex items-center gap-1"><span className="text-amber-400">●</span> {locale === "cs" ? "Zesílení" : "Amplification"}</div>
                    <div className="flex items-center gap-1"><span className="text-rose-400">●</span> {locale === "cs" ? "Kondicionování" : "Conditioning"}</div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CenterGrid centers={result.centerCompatibility} nameA={nameA} nameB={nameB} locale={locale} />
                </CardContent>
              </Card>

              {/* AI Reading */}
              <Card className="bg-card border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    {locale === "cs" ? "AI výklad vztahu" : "AI Relationship Reading"}
                    <Badge variant="outline" className="ml-auto border-primary/40 text-primary text-[10px]">👑 Premium</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!aiReading && !aiLoading && (
                    <div className="text-center py-6">
                      <Heart className="w-10 h-10 text-rose-400 mx-auto mb-3 opacity-60" />
                      <p className="text-sm text-muted-foreground mb-4">
                        {locale === "cs"
                          ? "Nechte AI analyzovat dynamiku vašeho vztahu — elektromagnetická přitažlivost, výzvy, kondicionování a doporučení."
                          : "Let AI analyze your relationship dynamics — electromagnetic attraction, challenges, conditioning, and recommendations."}
                      </p>
                      <Button onClick={handleAiReading} className="gap-2">
                        <Sparkles className="w-4 h-4" />
                        {locale === "cs" ? "Generovat AI výklad vztahu" : "Generate AI Relationship Reading"}
                      </Button>
                    </div>
                  )}
                  {aiLoading && (
                    <div className="flex items-center justify-center py-8 gap-3">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">
                        {locale === "cs" ? "Analyzuji vztah..." : "Analyzing relationship..."}
                      </span>
                    </div>
                  )}
                  {aiReading && (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <Streamdown>{aiReading}</Streamdown>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Empty state */}
          {!result && !analyzeQuery.isLoading && chartIdA && chartIdB && analyzeQuery.error && (
            <div className="text-center py-12">
              <Info className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">{locale === "cs" ? "Nepodařilo se načíst data map." : "Could not load chart data."}</p>
            </div>
          )}

          {!chartIdA || !chartIdB ? (
            <div className="text-center py-12 text-muted-foreground">
              <GitCompare className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-sm">
                {locale === "cs" ? "Vyberte dvě mapy pro zahájení analýzy." : "Select two charts to start the analysis."}
              </p>
            </div>
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  );
}
