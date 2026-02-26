import { useState, useEffect, useMemo } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Bodygraph from "@/components/Bodygraph";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import { useTranslation } from "@/hooks/useTranslation";
import {
  Save, Sparkles, ArrowLeft, Brain, Compass, Star, Sun, Moon,
  Loader2, Eye, Zap, Shield, Target, FileText, Download,
  ChevronRight, Info, Hexagon, CircleDot, Globe,
} from "lucide-react";
import { generateChartPDF } from "@/lib/pdfExport";
import type { HumanDesignChartData } from "@shared/types";
import {
  GATE_DESCRIPTIONS, CHANNEL_DESCRIPTIONS, CENTER_DESCRIPTIONS,
  TYPE_DESCRIPTIONS, AUTHORITY_DESCRIPTIONS, PROFILE_DESCRIPTIONS,
} from "@shared/hdContent";

// Czech cross type translations
const CROSS_TYPE_CS: Record<string, string> = {
  "Right Angle Cross": "Pravý Úhlový Kříž",
  "Left Angle Cross": "Levý Úhlový Kříž",
  "Juxtaposition Cross": "Juxtapoziční Kříž",
};

function translateCrossName(name: string): string {
  let result = name;
  for (const [en, cz] of Object.entries(CROSS_TYPE_CS)) {
    result = result.replace(en, cz);
  }
  return result;
}

const PLANET_SYMBOLS: Record<string, string> = {
  Sun: "☉", Earth: "⊕", Moon: "☽", "North Node": "☊", "South Node": "☋",
  Mercury: "☿", Venus: "♀", Mars: "♂", Jupiter: "♃", Saturn: "♄",
  Uranus: "♅", Neptune: "♆", Pluto: "♇",
};

const TYPE_COLORS: Record<string, string> = {
  Manifestor: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Generator: "bg-amber-50 text-amber-700 border-amber-200",
  "Manifesting Generator": "bg-orange-50 text-orange-700 border-orange-200",
  Projector: "bg-violet-50 text-violet-700 border-violet-200",
  Reflector: "bg-slate-100 text-slate-700 border-slate-200",
};

interface DetailModalState {
  type: "gate" | "channel" | "center" | "type" | "profile" | "authority" | null;
  id: string | number | null;
}

export default function ChartResult() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();

  const [chart, setChart] = useState<HumanDesignChartData | null>(null);
  const [chartMeta, setChartMeta] = useState<any>(null);
  const [savedChartId, setSavedChartId] = useState<number | null>(null);
  const [detailModal, setDetailModal] = useState<DetailModalState>({ type: null, id: null });
  const [aiReading, setAiReading] = useState<string | null>(null);
  const [showTransits, setShowTransits] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const transitQuery = trpc.transit.current.useQuery(undefined, {
    enabled: showTransits,
    refetchInterval: showTransits ? 60000 : false,
  });

  const transitGateNumbers = useMemo(() => {
    if (!transitQuery.data) return [];
    return transitQuery.data.transitGates.map(tg => tg.gate);
  }, [transitQuery.data]);

  const isNewChart = params.id === "new";
  const savedChartQuery = trpc.chart.get.useQuery(
    { id: parseInt(params.id || "0") },
    { enabled: !isNewChart && !!params.id }
  );

  useEffect(() => {
    if (isNewChart) {
      const stored = sessionStorage.getItem("chartResult");
      const meta = sessionStorage.getItem("chartMeta");
      if (stored) setChart(JSON.parse(stored));
      if (meta) setChartMeta(JSON.parse(meta));
    }
  }, [isNewChart]);

  useEffect(() => {
    if (savedChartQuery.data) {
      setChart(savedChartQuery.data.chartData as HumanDesignChartData);
      setChartMeta({
        name: savedChartQuery.data.name,
        birthDate: savedChartQuery.data.birthDate,
        birthTime: savedChartQuery.data.birthTime,
        birthPlace: savedChartQuery.data.birthPlace,
      });
      setSavedChartId(savedChartQuery.data.id);
    }
  }, [savedChartQuery.data]);

  const saveMutation = trpc.chart.save.useMutation({
    onSuccess: (data) => {
      setSavedChartId(data.id);
      toast.success(t.chart.savedToCollection);
    },
    onError: (err) => toast.error(err.message),
  });

  const aiMutation = trpc.ai.generateReading.useMutation({
    onSuccess: (data) => setAiReading(data.content),
    onError: (err) => toast.error("AI čtení selhalo: " + err.message),
  });

  const handleSave = () => {
    if (!isAuthenticated) { window.location.href = getLoginUrl(); return; }
    if (!chart || !chartMeta) return;
    saveMutation.mutate({
      name: chartMeta.name,
      birthDate: chartMeta.birthDate || chart.birthDate,
      birthTime: chartMeta.birthTime || chart.birthTime,
      birthPlace: chartMeta.birthPlace || chart.birthPlace,
      latitude: String(chartMeta.latitude || "0"),
      longitude: String(chartMeta.longitude || "0"),
      timezone: chartMeta.timezone || chart.timezone,
      category: "self",
      chartData: chart,
    });
  };

  const handleAiReading = (type: string) => {
    if (!isAuthenticated) { window.location.href = getLoginUrl(); return; }
    setAiReading(null);
    aiMutation.mutate({ chartId: savedChartId || 0, chartData: chart, readingType: type as any });
  };

  const typeDesc = useMemo(() => chart ? TYPE_DESCRIPTIONS[chart.type] : null, [chart]);
  const profileDesc = useMemo(() => chart ? PROFILE_DESCRIPTIONS[chart.profile] : null, [chart]);
  const authorityDesc = useMemo(() => chart ? AUTHORITY_DESCRIPTIONS[chart.authority] : null, [chart]);

  // Czech type name
  const czType = chart ? (t.types as any)[chart.type] || chart.type : "";
  const czStrategy = chart ? (t.hd.strategies as any)[chart.strategy] || chart.strategy : "";
  const czSignature = chart ? (t.hd.signatures as any)[chart.signature] || chart.signature : "";
  const czNotSelf = chart ? (t.hd.notSelfs as any)[chart.notSelf] || chart.notSelf : "";
  const czDefinition = chart ? (t.hd.definitionTypes as any)[chart.definition] || chart.definition : "";

  if (!chart) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container">
          {/* Back button */}
          <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate("/calculate")}>
            <ArrowLeft className="w-4 h-4 mr-1" /> {t.chart.newCalculation}
          </Button>

          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-serif text-3xl md:text-4xl font-bold mb-2">{chartMeta?.name || t.chart.yourChart}</h1>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={TYPE_COLORS[chart.type] || "bg-primary/20 text-primary"}>{czType}</Badge>
                <Badge variant="outline">{chart.profile} {chart.profileName}</Badge>
                <Badge variant="outline">{czDefinition}</Badge>
              </div>
            </div>
            <div className="flex gap-2">
              {!savedChartId && (
                <Button onClick={handleSave} disabled={saveMutation.isPending}>
                  <Save className="w-4 h-4 mr-1.5" />
                  {saveMutation.isPending ? t.chart.saving : t.chart.saveChart}
                </Button>
              )}
              {savedChartId && <Badge variant="secondary" className="py-1.5 px-3">{t.common.saved}</Badge>}
              <Button variant="outline" size="sm" onClick={() => {
                setGeneratingPdf(true);
                setTimeout(() => {
                  try {
                    generateChartPDF(chart, chartMeta?.name || "Chart");
                  } catch (e) {
                    toast.error("PDF generování selhalo");
                  }
                  setGeneratingPdf(false);
                }, 100);
              }} disabled={generatingPdf}>
                {generatingPdf ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Download className="w-4 h-4 mr-1" />}
                {generatingPdf ? t.chart.generatingPdf : t.chart.downloadPdf}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Bodygraph Column */}
            <div className="lg:col-span-1">
              <Card className="bg-card border-border/50 shadow-sm sticky top-24">
                <CardHeader className="pb-2">
                  <CardTitle className="font-serif text-lg">{t.chart.bodygraph}</CardTitle>
                  <CardDescription>{t.chart.bodygraphDesc}</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <Bodygraph
                    chart={chart}
                    width={380}
                    height={460}
                    transitGates={showTransits ? transitGateNumbers : []}
                    onGateClick={(gate) => setDetailModal({ type: "gate", id: gate })}
                    onCenterClick={(center) => setDetailModal({ type: "center", id: center })}
                    onChannelClick={(g1, g2) => {
                      const key = CHANNEL_DESCRIPTIONS[`${g1}-${g2}`] ? `${g1}-${g2}` : `${g2}-${g1}`;
                      setDetailModal({ type: "channel", id: key });
                    }}
                  />
                </CardContent>
                {/* Legend */}
                <div className="px-6 pb-4 space-y-3">
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full" style={{ background: "#4a3a8a", border: "1px solid #7c5fc7" }} />
                      {t.chart.personality}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-red-600" />
                      {t.chart.design}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full" style={{ background: "#f0c040" }} />
                      {t.chart.both}
                    </span>
                    {showTransits && (
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full" style={{ background: "#22d3ee" }} />
                        {t.chart.transit}
                      </span>
                    )}
                  </div>
                  <Button
                    variant={showTransits ? "default" : "outline"}
                    size="sm"
                    className="w-full text-xs h-8"
                    onClick={() => setShowTransits(!showTransits)}
                  >
                    <Globe className="w-3.5 h-3.5 mr-1.5" />
                    {showTransits ? "Skrýt Tranzity" : t.transits.transitOverlay}
                  </Button>
                  {showTransits && transitQuery.data && (
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {transitQuery.data.transitGates.map((tg, i) => {
                        const czPlanet = (t.hd.planets as any)[tg.planet] || tg.planet;
                        return (
                          <div key={i} className="flex items-center justify-between text-[10px] py-0.5 px-1">
                            <span className="text-cyan-600">{czPlanet}</span>
                            <span className="text-muted-foreground font-mono">Brána {tg.gate}.{tg.line}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Details Column */}
            <div className="lg:col-span-2 space-y-6">

              {/* ─── Type & Strategy Card ─── */}
              <Card className="bg-card border-border/50 shadow-sm overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="font-serif text-xl flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" /> {t.chart.typeStrategy}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">{t.chart.type}</p>
                      <p className="font-serif font-semibold text-sm">{czType}</p>
                      {typeDesc && <p className="text-[10px] text-muted-foreground mt-0.5">{typeDesc.percentage} {t.home.ofPopulation}</p>}
                    </div>
                    <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">{t.chart.strategy}</p>
                      <p className="font-serif font-semibold text-sm">{czStrategy}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">{t.chart.signature}</p>
                      <p className="font-serif font-semibold text-sm text-green-600">{czSignature}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">{t.chart.notSelf}</p>
                      <p className="font-serif font-semibold text-sm text-red-600">{czNotSelf}</p>
                    </div>
                  </div>
                  {typeDesc && (
                    <div className="text-sm text-muted-foreground leading-relaxed">
                      <p>{typeDesc.description}</p>
                      <Button variant="ghost" size="sm" className="mt-2 text-primary text-xs h-7 px-2"
                        onClick={() => setDetailModal({ type: "type", id: chart.type })}>
                        <Eye className="w-3 h-3 mr-1" /> {t.chart.readFullDescription}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* ─── Profile Card ─── */}
              <Card className="bg-card border-border/50 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="font-serif text-xl flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" /> {t.chart.profile}: {chart.profile} {chart.profileName}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {profileDesc && (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground leading-relaxed">{profileDesc.description}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">{t.chart.conscious}</p>
                          <p className="text-xs leading-relaxed">{profileDesc.conscious}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                          <p className="text-[10px] text-red-600 uppercase tracking-widest mb-1">{t.chart.unconscious}</p>
                          <p className="text-xs leading-relaxed">{profileDesc.unconscious}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* ─── Authority Card ─── */}
              <Card className="bg-card border-border/50 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="font-serif text-xl flex items-center gap-2">
                    <Compass className="w-5 h-5 text-primary" /> {t.chart.authority}: {chart.authority}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {authorityDesc && (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground leading-relaxed">{authorityDesc.description}</p>
                      <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                        <p className="text-[10px] text-primary uppercase tracking-widest mb-1.5">{t.chart.howToUseAuthority}</p>
                        <p className="text-xs leading-relaxed">{authorityDesc.howToUse}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* ─── Incarnation Cross ─── */}
              <Card className="bg-card border-border/50 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="font-serif text-xl flex items-center gap-2">
                    <Star className="w-5 h-5 text-primary" /> {t.chart.incarnationCross}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-serif font-semibold mb-1">{translateCrossName(chart.incarnationCross.name)}</p>
                  <p className="text-sm text-muted-foreground mb-4">{CROSS_TYPE_CS[chart.incarnationCross.type] || chart.incarnationCross.type}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {chart.incarnationCross.gates.map((g, i) => {
                      const gateDesc = GATE_DESCRIPTIONS[g];
                      return (
                        <button key={i} onClick={() => setDetailModal({ type: "gate", id: g })}
                          className="p-3 rounded-lg text-left transition-colors hover:bg-primary/10 border border-border/30 bg-muted/20">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                            {i < 2 ? t.chart.personalitySun : t.chart.designSun}
                          </p>
                          <p className="font-serif font-semibold text-sm mt-0.5">{t.chart.gates.slice(0, -1)} {g}</p>
                          {gateDesc && <p className="text-[10px] text-muted-foreground mt-0.5">{gateDesc.name}</p>}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* ─── Detailed Tabs ─── */}
              <Tabs defaultValue="activations" className="w-full">
                <TabsList className="w-full grid grid-cols-5 bg-muted/30">
                  <TabsTrigger value="activations" className="text-xs">{t.chart.activations}</TabsTrigger>
                  <TabsTrigger value="channels" className="text-xs">{t.chart.channels}</TabsTrigger>
                  <TabsTrigger value="centers" className="text-xs">{t.chart.centers}</TabsTrigger>
                  <TabsTrigger value="variables" className="text-xs">{t.chart.variables}</TabsTrigger>
                  <TabsTrigger value="gates" className="text-xs">{t.chart.gates}</TabsTrigger>
                </TabsList>

                {/* Planetary Activations */}
                <TabsContent value="activations" className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="bg-card border-border/50 shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Sun className="w-4 h-4" /> {t.chart.personalityConscious}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-1">
                          {(chart.personalityActivations || []).map((a, i) => {
                            const czPlanet = (t.hd.planets as any)[a.planet] || a.planet;
                            return (
                              <button key={i} onClick={() => setDetailModal({ type: "gate", id: a.gate })}
                                className="w-full flex items-center justify-between text-sm py-1.5 px-2 rounded hover:bg-muted/30 transition-colors border-b border-border/20 last:border-0">
                                <span className="flex items-center gap-2">
                                  <span className="text-base w-5 text-center">{PLANET_SYMBOLS[a.planet]}</span>
                                  <span className="text-muted-foreground text-xs">{czPlanet}</span>
                                </span>
                                <span className="flex items-center gap-2">
                                  <span className="font-mono font-medium text-xs">Brána {a.gate}.{a.line}</span>
                                  <span className="text-[10px] text-muted-foreground">B{a.color} T{a.tone}</span>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-card border-border/50 shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Moon className="w-4 h-4 text-red-500" /> {t.chart.designUnconscious}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-1">
                          {(chart.designActivations || []).map((a, i) => {
                            const czPlanet = (t.hd.planets as any)[a.planet] || a.planet;
                            return (
                              <button key={i} onClick={() => setDetailModal({ type: "gate", id: a.gate })}
                                className="w-full flex items-center justify-between text-sm py-1.5 px-2 rounded hover:bg-muted/30 transition-colors border-b border-border/20 last:border-0">
                                <span className="flex items-center gap-2">
                                  <span className="text-base w-5 text-center">{PLANET_SYMBOLS[a.planet]}</span>
                                  <span className="text-muted-foreground text-xs">{czPlanet}</span>
                                </span>
                                <span className="flex items-center gap-2">
                                  <span className="font-mono font-medium text-xs text-red-600">Brána {a.gate}.{a.line}</span>
                                  <span className="text-[10px] text-muted-foreground">B{a.color} T{a.tone}</span>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Channels */}
                <TabsContent value="channels" className="mt-4">
                  <Card className="bg-card border-border/50 shadow-sm">
                    <CardContent className="pt-6">
                      {(chart.channels || []).length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">Žádné definované kanály (typ Reflektor)</p>
                      ) : (
                        <div className="space-y-2">
                          {(chart.channels || []).map((ch, i) => {
                            const key = CHANNEL_DESCRIPTIONS[`${ch.gate1}-${ch.gate2}`] ? `${ch.gate1}-${ch.gate2}` : `${ch.gate2}-${ch.gate1}`;
                            const desc = CHANNEL_DESCRIPTIONS[key];
                            const czCircuit = desc ? (t.hd.circuits as any)[desc.circuit] || desc.circuit : "";
                            return (
                              <button key={i} onClick={() => setDetailModal({ type: "channel", id: key })}
                                className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30 hover:bg-primary/5 hover:border-primary/30 transition-all text-left">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-primary shrink-0" />
                                    <span className="font-medium text-sm">Kanál {ch.gate1}-{ch.gate2}</span>
                                    {desc && <span className="text-xs text-muted-foreground truncate">({desc.name})</span>}
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-0.5 ml-6">
                                    {(t.hd.centerNames as any)[ch.centerA] || ch.centerA} → {(t.hd.centerNames as any)[ch.centerB] || ch.centerB}
                                  </p>
                                  {desc && <p className="text-xs text-muted-foreground mt-0.5 ml-6">{desc.theme}</p>}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  {desc && <Badge variant="outline" className="text-[10px]">{czCircuit}</Badge>}
                                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Centers */}
                <TabsContent value="centers" className="mt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {(chart.centers || []).map(center => {
                      const desc = CENTER_DESCRIPTIONS[center.name];
                      const czCenterName = (t.hd.centerNames as any)[center.name] || center.name;
                      return (
                        <button key={center.name} onClick={() => setDetailModal({ type: "center", id: center.name })}
                          className={`text-left p-4 rounded-lg border transition-all hover:scale-[1.02] ${
                            center.defined
                              ? "border-primary/40 bg-primary/5 hover:bg-primary/10"
                              : "border-border/30 bg-muted/10 hover:bg-muted/20"
                          }`}>
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-serif font-medium text-sm">{czCenterName}</p>
                            <Badge variant={center.defined ? "default" : "outline"} className="text-[10px]">
                              {center.defined ? t.chart.defined : t.chart.open}
                            </Badge>
                          </div>
                          {desc && <p className="text-[10px] text-muted-foreground mb-2">{desc.theme}</p>}
                          <div className="flex flex-wrap gap-1">
                            {center.gates.map(g => (
                              <span key={g} className={`text-[10px] px-1.5 py-0.5 rounded ${
                                center.activatedGates.includes(g)
                                  ? "bg-primary/20 text-primary font-medium"
                                  : "bg-muted/30 text-muted-foreground"
                              }`}>{g}</span>
                            ))}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </TabsContent>

                {/* Variables */}
                <TabsContent value="variables" className="mt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {chart.variables && Object.entries(chart.variables).map(([key, v]) => {
                      const labels: Record<string, { icon: typeof Compass; desc: string }> = {
                        digestion: { icon: Hexagon, desc: t.chart.digestionDesc },
                        environment: { icon: Compass, desc: t.chart.environmentDesc },
                        perspective: { icon: Eye, desc: t.chart.perspectiveDesc },
                        awareness: { icon: Brain, desc: t.chart.awarenessDesc },
                      };
                      const czLabels: Record<string, string> = {
                        digestion: t.chart.digestion,
                        environment: t.chart.environment,
                        perspective: t.chart.perspective,
                        awareness: t.chart.awareness,
                      };
                      const meta = labels[key];
                      const Icon = meta?.icon || Info;
                      return (
                        <Card key={key} className="bg-card border-border/50 shadow-sm">
                          <CardContent className="pt-4 pb-4">
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                                <Icon className="w-4 h-4 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                                  {czLabels[key] || key}
                                </p>
                                <p className="font-serif font-semibold text-base">{v.type}</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">{meta?.desc}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="outline" className="text-[10px]">{t.chart.color} {v.color}</Badge>
                                  <Badge variant="outline" className="text-[10px]">{t.chart.tone} {v.tone}</Badge>
                                  <Badge variant="outline" className="text-[10px]">{v.arrow} {t.chart.arrow}</Badge>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </TabsContent>

                {/* All Activated Gates */}
                <TabsContent value="gates" className="mt-4">
                  <Card className="bg-card border-border/50 shadow-sm">
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(chart.activatedGates || []).sort((a, b) => a - b).map(gate => {
                          const desc = GATE_DESCRIPTIONS[gate];
                          const isPers = (chart.personalityActivations || []).some(a => a.gate === gate);
                          const isDes = (chart.designActivations || []).some(a => a.gate === gate);
                          return (
                            <button key={gate} onClick={() => setDetailModal({ type: "gate", id: gate })}
                              className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/20 border border-border/30 hover:bg-primary/5 hover:border-primary/30 transition-all text-left">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                                style={{
                                  background: isPers && isDes ? "#f0c040" : isPers ? "#1a1a2e" : "#dc2626",
                                  color: "white",
                                  border: isPers && !isDes ? "1px solid #666" : "none",
                                }}>
                                {gate}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-xs">{desc?.name || `Brána ${gate}`}</p>
                                <p className="text-[10px] text-muted-foreground truncate">{desc?.iChing} • {(t.hd.centerNames as any)[desc?.center] || desc?.center}</p>
                              </div>
                              <div className="flex gap-1 shrink-0">
                                {isPers && <span className="text-[9px] px-1 py-0.5 rounded bg-foreground/10">O</span>}
                                {isDes && <span className="text-[9px] px-1 py-0.5 rounded bg-red-100 text-red-600">D</span>}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* ─── AI Reading Section ─── */}
              <Card className="bg-card border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="font-serif text-xl flex items-center gap-2">
                    <Brain className="w-5 h-5 text-primary" /> {t.chart.aiReading}
                  </CardTitle>
                  <CardDescription>{t.chart.aiReadingDesc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 mb-4">
                    {[
                      { key: "overview", label: t.chart.aiTypes.overview, icon: Sparkles },
                      { key: "type_strategy", label: t.chart.aiTypes.type_strategy, icon: Shield },
                      { key: "profile", label: t.chart.aiTypes.profile, icon: Target },
                      { key: "authority", label: t.chart.aiTypes.authority, icon: Compass },
                      { key: "incarnation_cross", label: t.chart.aiTypes.incarnation_cross, icon: Star },
                      { key: "channels", label: t.chart.aiTypes.channels, icon: Zap },
                      { key: "gates", label: t.chart.aiTypes.gates, icon: CircleDot },
                      { key: "variables", label: t.chart.aiTypes.variables, icon: Eye },
                      { key: "relationships", label: t.chart.aiTypes.relationships, icon: Zap },
                      { key: "career", label: t.chart.aiTypes.career, icon: Target },
                    ].map(item => {
                      const Icon = item.icon;
                      return (
                        <Button key={item.key} variant="outline" size="sm"
                          onClick={() => handleAiReading(item.key)} disabled={aiMutation.isPending}
                          className="text-xs h-9 justify-start">
                          <Icon className="w-3 h-3 mr-1 shrink-0" /> {item.label}
                        </Button>
                      );
                    })}
                  </div>

                  {aiMutation.isPending && (
                    <div className="flex items-center gap-3 py-8 justify-center">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      <span className="text-muted-foreground">{t.chart.generatingReading}</span>
                    </div>
                  )}

                  {aiReading && (
                    <div className="mt-4">
                      <div className="flex justify-end mb-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs gap-1.5 h-8"
                          onClick={() => {
                            const blob = new Blob([aiReading], { type: 'text/plain;charset=utf-8' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `HD-rozbor-${chartMeta?.name || 'chart'}.txt`;
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                        >
                          <Download className="w-3 h-3" /> Stáhnout rozbor (.txt)
                        </Button>
                      </div>
                      <div className="prose prose-sm max-w-none p-4 rounded-lg bg-muted/20 border border-border/30">
                        <Streamdown>{aiReading}</Streamdown>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* ─── Detail Modal ─── */}
      <Dialog open={detailModal.type !== null} onOpenChange={(open) => { if (!open) setDetailModal({ type: null, id: null }); }}>
        <DialogContent className="max-w-lg max-h-[85vh]">
          <ScrollArea className="max-h-[75vh]">
            <DialogHeader>
              {detailModal.type === "gate" && detailModal.id !== null && (() => {
                const g = GATE_DESCRIPTIONS[detailModal.id as number];
                return g ? (
                  <>
                    <DialogTitle className="font-serif text-xl">
                      Brána {detailModal.id}: {g.name}
                    </DialogTitle>
                    <DialogDescription className="text-sm">{g.iChing} {g.hexagram}</DialogDescription>
                    <div className="space-y-4 pt-4">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">{(t.hd.centerNames as any)[g.center] || g.center}</Badge>
                        <Badge variant="outline">{(t.hd.circuits as any)[g.circuit] || g.circuit} {t.chart.circuit}</Badge>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">{t.chart.theme}</p>
                        <p className="text-sm font-medium">{g.theme}</p>
                      </div>
                      <Separator />
                      <p className="text-sm leading-relaxed">{g.description}</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                          <p className="text-[10px] text-green-600 uppercase tracking-widest mb-1">{t.chart.gift}</p>
                          <p className="text-sm font-medium">{g.giftKeyword}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                          <p className="text-[10px] text-red-600 uppercase tracking-widest mb-1">{t.chart.shadow}</p>
                          <p className="text-sm font-medium">{g.shadowKeyword}</p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <DialogTitle>Brána {detailModal.id}</DialogTitle>
                );
              })()}

              {detailModal.type === "channel" && detailModal.id !== null && (() => {
                const ch = CHANNEL_DESCRIPTIONS[detailModal.id as string];
                return ch ? (
                  <>
                    <DialogTitle className="font-serif text-xl">{ch.name}</DialogTitle>
                    <DialogDescription>Brány {ch.gates[0]} - {ch.gates[1]}</DialogDescription>
                    <div className="space-y-4 pt-4">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">{(t.hd.centerNames as any)[ch.centers[0]] || ch.centers[0]} → {(t.hd.centerNames as any)[ch.centers[1]] || ch.centers[1]}</Badge>
                        <Badge variant="outline">{(t.hd.circuits as any)[ch.circuit] || ch.circuit} {t.chart.circuit}</Badge>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">{t.chart.theme}</p>
                        <p className="text-sm font-medium">{ch.theme}</p>
                      </div>
                      <Separator />
                      <p className="text-sm leading-relaxed">{ch.description}</p>
                    </div>
                  </>
                ) : (
                  <DialogTitle>Kanál {detailModal.id}</DialogTitle>
                );
              })()}

              {detailModal.type === "center" && detailModal.id !== null && (() => {
                const c = CENTER_DESCRIPTIONS[detailModal.id as string];
                const centerData = (chart.centers || []).find(ct => ct.name === detailModal.id);
                return c ? (
                  <>
                    <DialogTitle className="font-serif text-xl">{(t.hd.centerNames as any)[detailModal.id] || c.name}</DialogTitle>
                    <DialogDescription>{c.biologicalCorrelation}</DialogDescription>
                    <div className="space-y-4 pt-4">
                      <div className="flex items-center gap-2">
                        <Badge variant={centerData?.defined ? "default" : "outline"}>
                          {centerData?.defined ? t.chart.defined : t.chart.open}
                        </Badge>
                        <Badge variant="outline">{c.theme}</Badge>
                      </div>
                      <Separator />
                      <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
                        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
                          {centerData?.defined ? t.chart.definedMeaning : t.chart.openMeaning}
                        </p>
                        <p className="text-sm leading-relaxed">
                          {centerData?.defined ? c.definedMeaning : c.openMeaning}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                        <p className="text-[10px] text-yellow-400 uppercase tracking-widest mb-1">{t.chart.notSelfQuestion}</p>
                        <p className="text-sm italic">{c.notSelfQuestion}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <DialogTitle>{detailModal.id}</DialogTitle>
                );
              })()}

              {detailModal.type === "type" && detailModal.id !== null && (() => {
                const tp = TYPE_DESCRIPTIONS[detailModal.id as string];
                return tp ? (
                  <>
                    <DialogTitle className="font-serif text-xl">{(t.types as any)[detailModal.id] || tp.name}</DialogTitle>
                    <DialogDescription>{tp.percentage} {t.home.ofPopulation}</DialogDescription>
                    <div className="space-y-4 pt-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">{t.chart.strategy}</p>
                          <p className="text-sm font-medium">{(t.hd.strategies as any)[tp.strategy] || tp.strategy}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">{t.chart.aura}</p>
                          <p className="text-sm font-medium">{tp.aura}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                          <p className="text-[10px] text-green-600 uppercase tracking-widest mb-1">{t.chart.signature}</p>
                          <p className="text-sm font-medium">{(t.hd.signatures as any)[tp.signature] || tp.signature}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                          <p className="text-[10px] text-red-600 uppercase tracking-widest mb-1">{t.chart.notSelf}</p>
                          <p className="text-sm font-medium">{(t.hd.notSelfs as any)[tp.notSelf] || tp.notSelf}</p>
                        </div>
                      </div>
                      <Separator />
                      <p className="text-sm leading-relaxed">{tp.description}</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">{t.chart.strengths}</p>
                          <ul className="text-xs space-y-1">
                            {tp.strengths.map((s, i) => <li key={i} className="flex items-center gap-1"><span className="text-green-600">+</span> {s}</li>)}
                          </ul>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">{t.chart.challenges}</p>
                          <ul className="text-xs space-y-1">
                            {tp.challenges.map((c, i) => <li key={i} className="flex items-center gap-1"><span className="text-yellow-400">!</span> {c}</li>)}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <DialogTitle>{detailModal.id}</DialogTitle>
                );
              })()}
            </DialogHeader>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
