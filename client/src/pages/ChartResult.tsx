import { useState, useEffect, useMemo, useRef } from "react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Save, Sparkles, ArrowLeft, Brain, Compass, Star, Sun, Moon,
  Loader2, Eye, Zap, Shield, Target, FileText, Download,
  ChevronRight, Info, Hexagon, CircleDot, Globe, Share2, Copy, Check,
  User, Users, Heart, Briefcase, UserCheck, HelpCircle, GitCompare,
} from "lucide-react";
import { generateChartPDF } from "@/lib/pdfExport";
import { PLANET_SYMBOLS, TYPE_COLORS, translateCrossName, CROSS_TYPE_CS } from "@/lib/hdConstants";
import type { HumanDesignChartData } from "@shared/types";
import OnboardingModal, { useOnboarding } from "@/components/OnboardingModal";
import PremiumPaywall from "@/components/PremiumPaywall";
import { motion, AnimatePresence } from "framer-motion";
import { SacredGeometry } from "@/components/SacredGeometry";
import { TiltCard } from "@/components/TiltCard";
import { SocialShareButtons } from "@/components/SocialShareButtons";
import { GeneKeysSequence } from "@/components/GeneKeysSequence";

// ─── ShareReadingButton ─────────────────────────────────────────────────────
function ShareReadingButton({ readingId }: { readingId: number }) {
  const [copied, setCopied] = useState(false);
  const shareMut = trpc.ai.shareReading.useMutation({
    onSuccess: (data) => {
      const url = `${window.location.origin}/shared/${data.token}`;
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        toast.success("Odkaz na výklad zkopírován!");
        setTimeout(() => setCopied(false), 3000);
      }).catch(() => toast.success(`Odkaz: ${url}`));
    },
    onError: () => toast.error("Sdílení se nezdařilo"),
  });
  return (
    <button
      onClick={() => !copied && shareMut.mutate({ readingId })}
      disabled={shareMut.isPending}
      className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${copied
        ? "bg-primary/10 text-primary border-primary/30"
        : "bg-muted/30 text-muted-foreground hover:bg-primary/10 hover:text-primary border-border/40"
        }`}
    >
      {shareMut.isPending ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : copied ? (
        <Check className="w-3.5 h-3.5" />
      ) : (
        <Share2 className="w-3.5 h-3.5" />
      )}
      {copied ? "Zkopírováno!" : "Sdílet výklad"}
    </button>
  );
}

// Czech cross type translations — now imported from shared constants
// translateCrossName, PLANET_SYMBOLS, TYPE_COLORS are imported above

interface DetailModalState {
  type: "gate" | "channel" | "center" | "type" | "profile" | "authority" | null;
  id: string | number | null;
}

export default function ChartResult({ id: propId }: { id?: string } = {}) {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const { t, localePath, locale } = useLanguage();

  const [chart, setChart] = useState<HumanDesignChartData | null>(null);
  const [chartMeta, setChartMeta] = useState<any>(null);
  const [savedChartId, setSavedChartId] = useState<number | null>(null);
  const [detailModal, setDetailModal] = useState<DetailModalState>({ type: null, id: null });
  const [aiReading, setAiReading] = useState<string | null>(null);
  const [aiStreaming, setAiStreaming] = useState(false);
  const [aiRating, setAiRating] = useState<"up" | "down" | null>(null);
  const [aiReadingId, setAiReadingId] = useState<number | null>(null);
  const [showTransits, setShowTransits] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [aiReadingType, setAiReadingType] = useState<string | null>(null);
  const [showAiTypes, setShowAiTypes] = useState(false);
  const [dailyTransitReading, setDailyTransitReading] = useState<string | null>(null);
  const [dailyTransitLoading, setDailyTransitLoading] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveCategory, setSaveCategory] = useState<"self" | "family" | "friend" | "client" | "celebrity" | "other">("self");
  const aiSectionRef = useRef<HTMLDivElement>(null);
  const bodygraphRef = useRef<HTMLDivElement>(null);
  const streamAbortRef = useRef<AbortController | null>(null);
  const { shouldShow: showOnboarding, triggerOnboarding, markSeen: markOnboardingSeen } = useOnboarding();
  const { data: subStatus } = trpc.subscription.status.useQuery(undefined, { enabled: isAuthenticated });

  // Fetch HD static content via tRPC
  const hdContentQuery = trpc.content.getHdContent.useQuery();
  const hdData = hdContentQuery.data;

  const shareMutation = trpc.share.createLink.useMutation({
    onSuccess: (data) => {
      const url = `${window.location.origin}/shared/${data.token}`;
      setShareUrl(url);
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        toast.success("Odkaz zkopírován do schránky!");
        setTimeout(() => setCopied(false), 3000);
      });
    },
    onError: () => toast.error("Sdílení se nezdařilo"),
  });

  const handleShare = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopied(true);
        toast.success("Odkaz zkopírován do schránky!");
        setTimeout(() => setCopied(false), 3000);
      });
      return;
    }
    if (!chart) return;
    shareMutation.mutate({
      chartData: chart,
      ownerName: chartMeta?.name,
    });
  };

  const personalizedTransitMutation = trpc.transit.personalizedByData.useMutation({
    onSuccess: (data: { interpretation: string }) => {
      setDailyTransitReading(data.interpretation);
      setDailyTransitLoading(false);
    },
    onError: () => {
      toast.error(locale === "cs" ? "Nepodařilo se vygenerovat denní výklad" : "Failed to generate daily reading");
      setDailyTransitLoading(false);
    },
  });

  const handleDailyTransitReading = () => {
    if (!isAuthenticated) { window.location.href = getLoginUrl(); return; }
    if (!chart) return;
    setDailyTransitLoading(true);
    setAiReadingType("daily_transit");
    setAiReading(null);
    setDailyTransitReading(null);
    personalizedTransitMutation.mutate({ chartData: chart as any, locale });
  };

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
      if (stored) {
        setChart(JSON.parse(stored));
        // Trigger onboarding for first-time chart viewers
        setTimeout(() => triggerOnboarding(), 1200);
      }
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

  // Keep old mutation as fallback but prefer streaming
  const aiMutation = trpc.ai.generateReading.useMutation({
    onSuccess: (data) => { setAiReading(data.content); setAiReadingId(data.id); },
    onError: (err) => toast.error("AI čtení selhalo: " + err.message),
  });

  const handleSave = () => {
    if (!isAuthenticated) { window.location.href = getLoginUrl(); return; }
    if (!chart || !chartMeta) return;
    setShowSaveDialog(true);
  };

  const confirmSave = () => {
    if (!chart || !chartMeta) return;
    saveMutation.mutate({
      name: chartMeta.name,
      birthDate: chartMeta.birthDate || chart.birthDate,
      birthTime: chartMeta.birthTime || chart.birthTime,
      birthPlace: chartMeta.birthPlace || chart.birthPlace,
      latitude: String(chartMeta.latitude || "0"),
      longitude: String(chartMeta.longitude || "0"),
      timezone: chartMeta.timezone || chart.timezone,
      category: saveCategory,
      chartData: chart as any,
    });
    setShowSaveDialog(false);
  };

  const handleAiReading = (type: string) => {
    if (!isAuthenticated) { window.location.href = getLoginUrl(); return; }
    // Low-credit warning toast
    if (subStatus && !subStatus.isPremium) {
      const totalLeft = (subStatus.freeReadingsLeft ?? 0) + (subStatus.aiReadingCredits ?? 0);
      if (totalLeft === 1) {
        toast.warning(
          locale === "cs"
            ? "⚠️ Poslední výklad! Po tomto výkladu bude potřeba dobrít kredity nebo upgradovat na Premium."
            : "⚠️ Last reading! After this you'll need to top up credits or upgrade to Premium.",
          { duration: 5000 }
        );
      }
    }
    // Abort any existing stream
    if (streamAbortRef.current) streamAbortRef.current.abort();
    setAiReading(null);
    setAiRating(null);
    setAiReadingId(null);
    setAiReadingType(type);

    const abort = new AbortController();
    streamAbortRef.current = abort;
    if (type === "daily_transit") {
      setDailyTransitLoading(true);
      setDailyTransitReading("");
    } else {
      setAiStreaming(true);
    }

    const params = new URLSearchParams({
      chartData: encodeURIComponent(JSON.stringify(chart)),
      readingType: type,
      chartId: String(savedChartId || 0),
    });

    let accumulated = "";

    fetch(`/api/ai/stream?${params}`, { signal: abort.signal })
      .then(async (res) => {
        if (res.status === 402) {
          setAiStreaming(false);
          setShowPaywall(true);
          return;
        }
        if (!res.ok || !res.body) {
          // Fallback to tRPC mutation
          setAiStreaming(false);
          aiMutation.mutate({ chartId: savedChartId || 0, chartData: chart as any, readingType: type as any });
          return;
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const data = JSON.parse(line.slice(6));
              if (data.token) {
                accumulated += data.token;
                setAiReading(accumulated);
              }
              if (data.done) {
                setAiStreaming(false);
              }
              if (data.error) {
                setAiStreaming(false);
                toast.error("AI výklad selhal");
              }
            } catch { /* skip */ }
          }
        }
        setAiStreaming(false);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setAiStreaming(false);
          // Fallback to tRPC mutation
          aiMutation.mutate({ chartId: savedChartId || 0, chartData: chart as any, readingType: type as any });
        }
      });
  };



  const handleRating = async (rating: "up" | "down") => {
    setAiRating(rating);
    if (!aiReadingId) return;
    try {
      await fetch("/api/ai/rating", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ readingId: aiReadingId, rating }),
      });
      toast.success(rating === "up" ? "Děkujeme za hodnocení! 😊" : "Děkujeme za zpětnou vazbu");
    } catch {
      toast.error("Hodnocení se nepodařilo uložit");
    }
  };

  const typeDesc = useMemo(() => (chart && hdData) ? hdData.types[chart.type] : null, [chart, hdData]);
  const profileDesc = useMemo(() => (chart && hdData) ? hdData.profiles[chart.profile] : null, [chart, hdData]);
  const authorityDesc = useMemo(() => (chart && hdData) ? hdData.authorities[chart.authority] : null, [chart, hdData]);

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
    <div className="min-h-screen flex flex-col bg-background text-foreground relative overflow-hidden">
      <SacredGeometry className="absolute inset-0 z-0" />
      <Navbar />

      {/* ─── Save Category Dialog ─── */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="bg-popover text-popover-foreground max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl flex items-center gap-2">
              <Save className="w-5 h-5 text-primary" />
              {locale === "cs" ? "Uložit mapu" : "Save Chart"}
            </DialogTitle>
            <DialogDescription>
              {locale === "cs" ? `Ukládám mapu pro: ${chartMeta?.name || ""}` : `Saving chart for: ${chartMeta?.name || ""}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {locale === "cs" ? "Komu patří tato mapa?" : "Who is this chart for?"}
              </Label>
              <Select value={saveCategory} onValueChange={(v) => setSaveCategory(v as any)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="self">
                    <div className="flex items-center gap-2"><User className="w-4 h-4 text-primary" /> {locale === "cs" ? "Já (moje vlastní mapa)" : "Myself"}</div>
                  </SelectItem>
                  <SelectItem value="family">
                    <div className="flex items-center gap-2"><Heart className="w-4 h-4 text-rose-400" /> {locale === "cs" ? "Rodina (partner, rodiče, děti)" : "Family (partner, parents, kids)"}</div>
                  </SelectItem>
                  <SelectItem value="friend">
                    <div className="flex items-center gap-2"><Users className="w-4 h-4 text-blue-400" /> {locale === "cs" ? "Přátelé" : "Friends"}</div>
                  </SelectItem>
                  <SelectItem value="client">
                    <div className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-amber-400" /> {locale === "cs" ? "Klient / Kolega" : "Client / Colleague"}</div>
                  </SelectItem>
                  <SelectItem value="celebrity">
                    <div className="flex items-center gap-2"><UserCheck className="w-4 h-4 text-violet-400" /> {locale === "cs" ? "Celebrita / Veřejná osobnost" : "Celebrity / Public figure"}</div>
                  </SelectItem>
                  <SelectItem value="other">
                    <div className="flex items-center gap-2"><HelpCircle className="w-4 h-4 text-muted-foreground" /> {locale === "cs" ? "Jiné" : "Other"}</div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {saveCategory !== "self" && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs text-muted-foreground">
                💡 {locale === "cs"
                  ? "Po uložení můžete tuto mapu porovnat se svou vlastní mapou pomocí Composite analýzy."
                  : "After saving, you can compare this chart with your own using Composite analysis."}
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>{locale === "cs" ? "Zrušit" : "Cancel"}</Button>
            <Button onClick={confirmSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
              {locale === "cs" ? "Uložit" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Onboarding modal for first-time users */}
      {showOnboarding && chart && (
        <OnboardingModal
          chartType={czType}
          chartProfile={`${chart.profile} ${chart.profileName}`}
          chartAuthority={chart.authority}
          onClose={markOnboardingSeen}
          onRequestAiReading={() => {
            markOnboardingSeen();
            setTimeout(() => {
              aiSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 300);
          }}
        />
      )}

      <AnimatePresence>
        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex-1 pt-24 pb-16 relative z-10"
        >
          <div className="container">
            {/* Back button */}
            <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate(localePath("/calculate"))}>
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
                {savedChartId && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="py-1.5 px-3">{t.common.saved}</Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(localePath("/compare") + `?chartId=${savedChartId}`)}
                      className="border-primary/30 text-primary hover:bg-primary/10"
                    >
                      <GitCompare className="w-4 h-4 mr-1.5" />
                      {locale === "cs" ? "Composite" : "Composite"}
                    </Button>
                  </div>
                )}
                {shareUrl ? (
                  <SocialShareButtons
                    url={shareUrl}
                    title={locale === "cs" ? `Moje Human Design Mapa: ${chartMeta?.name}` : `My Human Design Chart: ${chartMeta?.name}`}
                  />
                ) : (
                  <Button variant="outline" size="sm" onClick={handleShare} disabled={shareMutation.isPending}>
                    {shareMutation.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : copied ? <Check className="w-4 h-4 mr-1 text-green-500" /> : <Share2 className="w-4 h-4 mr-1" />}
                    {shareMutation.isPending ? "Sdílení..." : copied ? "Zkopírováno!" : "Sdílet mapu"}
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={async () => {
                  if (!subStatus?.isPremium) {
                    setShowPaywall(true);
                    toast.info(locale === "cs" ? "PDF report je dostupný pro Premium uživatele" : "PDF report is available for Premium users");
                    return;
                  }
                  setGeneratingPdf(true);
                  // Wait a bit for UI to settle
                  await new Promise(r => setTimeout(r, 100));
                  try {
                    await generateChartPDF(chart, chartMeta?.name || "Chart", hdData, bodygraphRef);
                  } catch (e) {
                    console.error(e);
                    toast.error("PDF generování selhalo");
                  }
                  setGeneratingPdf(false);
                }} disabled={generatingPdf}>
                  {generatingPdf ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Download className="w-4 h-4 mr-1" />}
                  {generatingPdf ? t.chart.generatingPdf : t.chart.downloadPdf}
                  {!subStatus?.isPremium && <span className="ml-1 text-xs opacity-60">👑</span>}
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
                  <CardContent className="flex justify-center" ref={bodygraphRef}>
                    <TiltCard>
                      <Bodygraph
                        chart={chart}
                        width={380}
                        height={460}
                        transitGates={showTransits ? transitGateNumbers : []}
                        onGateClick={(gate) => setDetailModal({ type: "gate", id: gate })}
                        onCenterClick={(center) => setDetailModal({ type: "center", id: center })}
                        onChannelClick={(g1, g2) => {
                          if (!hdData) return;
                          const key = hdData.channels[`${g1}-${g2}`] ? `${g1}-${g2}` : `${g2}-${g1}`;
                          setDetailModal({ type: "channel", id: key });
                        }}
                      />
                    </TiltCard>
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

                {/* ─── AI Výklad — PRIMÁRNÍ SEKCE ─── */}
                <div ref={aiSectionRef}>
                  {showPaywall ? (
                    <PremiumPaywall variant="inline" />
                  ) : !aiReading && !aiStreaming && !aiMutation.isPending ? (
                    <div className="relative overflow-hidden rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-violet-50 p-6 shadow-md">
                      {/* Decorative glow */}
                      <div className="absolute -top-8 -right-8 w-40 h-40 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
                      <div className="relative z-10">
                        <div className="flex items-start gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/30">
                            <Sparkles className="w-7 h-7 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h2 className="font-serif text-xl font-bold text-foreground">AI výklad vaší mapy</h2>
                              <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-medium">Nové</span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                              Získáte <strong>srozumitelný výklad v češtině</strong> — co váš typ znamená, jak využít svou autoritu a jaké je vaše životní poslání.
                            </p>
                            <div className="flex flex-wrap gap-2 mb-5">
                              {[
                                { key: "overview", label: "✨ Kompletní přehled", primary: true },
                                { key: "type_strategy", label: "💫 Typ & strategie", primary: false },
                                { key: "profile", label: "🎭 Profil", primary: false },
                                { key: "authority", label: "🧠 Autorita", primary: false },
                                { key: "incarnation_cross", label: "★ Životní poslání", primary: false },
                                { key: "career", label: "💼 Kariéra", primary: false },
                                { key: "relationships", label: "❤️ Vztahy", primary: false },
                                { key: "channels", label: "⚡ Kanály", primary: false },
                                { key: "daily_transit", label: "🌟 Denní výklad", primary: false },
                              ].map(item => (
                                <Button
                                  key={item.key}
                                  size={item.primary ? "default" : "sm"}
                                  variant={item.primary ? "default" : "outline"}
                                  className={item.primary
                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 font-semibold"
                                    : "text-xs h-8 bg-white/70 hover:bg-white border-border/60"}
                                  onClick={() => {
                                    if (item.key === "daily_transit") { handleDailyTransitReading(); return; }
                                    setAiReadingType(item.key);
                                    handleAiReading(item.key);
                                  }}
                                  disabled={aiStreaming || aiMutation.isPending || dailyTransitLoading}
                                >
                                  {item.label}
                                </Button>
                              ))}
                            </div>
                            {!isAuthenticated && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <Info className="w-3.5 h-3.5" />
                                Pro AI výklad se prosím{" "}
                                <a href={getLoginUrl()} className="text-primary underline underline-offset-2">přihlašte</a>.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (aiStreaming || aiMutation.isPending) && !aiReading ? (
                    <Card className="border-primary/20 bg-primary/5">
                      <CardContent className="py-8">
                        <div className="flex flex-col items-center gap-3 text-center">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{t.chart.generatingReading}</p>
                            <p className="text-xs text-muted-foreground mt-1">AI analýza vaší mapy probíhá...</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (aiReading || dailyTransitReading || dailyTransitLoading) ? (
                    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background shadow-sm">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="font-serif text-xl flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-primary" /> AI výklad vaší mapy
                          </CardTitle>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs gap-1.5 h-8"
                            onClick={() => {
                              const blob = new Blob([aiReadingType === "daily_transit" ? (dailyTransitReading || "") : (aiReading || "")], { type: 'text/plain;charset=utf-8' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `HD-rozbor-${chartMeta?.name || 'chart'}.txt`;
                              a.click();
                              URL.revokeObjectURL(url);
                            }}
                          >
                            <Download className="w-3 h-3" /> Stáhnout
                          </Button>
                        </div>
                        {/* Reading type selector — always visible */}
                        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border/30">
                          {[
                            { key: "overview", label: "✨ Kompletní přehled" },
                            { key: "type_strategy", label: "💫 Typ & strategie" },
                            { key: "profile", label: "🎭 Profil" },
                            { key: "authority", label: "🧠 Autorita" },
                            { key: "incarnation_cross", label: "★ Životní poslání" },
                            { key: "career", label: "💼 Kariéra" },
                            { key: "relationships", label: "❤️ Vztahy" },
                            { key: "channels", label: "⚡ Kanály" },
                            { key: "daily_transit", label: "🌟 Denní výklad" },
                          ].map(item => (
                            <Button
                              key={item.key}
                              size="sm"
                              variant={aiReadingType === item.key ? "default" : "outline"}
                              className={aiReadingType === item.key
                                ? "text-xs h-7 bg-primary text-primary-foreground font-semibold"
                                : "text-xs h-7 bg-white/70 hover:bg-white border-border/60"}
                              onClick={() => {
                                if (item.key === "daily_transit") { handleDailyTransitReading(); return; }
                                setAiReadingType(item.key);
                                handleAiReading(item.key);
                              }}
                              disabled={aiStreaming || aiMutation.isPending || dailyTransitLoading}
                            >
                              {item.label}
                            </Button>
                          ))}
                        </div>
                      </CardHeader>
                      <CardContent>
                        {dailyTransitLoading && aiReadingType === "daily_transit" ? (
                          <div className="flex flex-col items-center gap-3 py-8 text-center">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Loader2 className="w-5 h-5 animate-spin text-primary" />
                            </div>
                            <p className="text-sm text-muted-foreground">{locale === "cs" ? "Generuji denní výklad tranzitů..." : "Generating daily transit reading..."}</p>
                          </div>
                        ) : (
                          <div className="prose prose-sm max-w-none p-4 rounded-lg bg-white/60 border border-border/30 relative">
                            <Streamdown>{aiReadingType === "daily_transit" ? (dailyTransitReading || "") : (aiReading || "")}</Streamdown>
                            {aiStreaming && aiReadingType !== "daily_transit" && (
                              <span className="inline-block w-1.5 h-4 bg-primary/70 animate-pulse ml-0.5 align-middle rounded-sm" />
                            )}
                          </div>
                        )}
                        {/* Thumbs up/down feedback + share reading */}
                        {!aiStreaming && (
                          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/20 flex-wrap">
                            <span className="text-xs text-muted-foreground mr-1">Byl tento výklad užitečný?</span>
                            <button
                              onClick={() => handleRating("up")}
                              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${aiRating === "up"
                                ? "bg-green-100 text-green-700 border border-green-300"
                                : "bg-muted/30 text-muted-foreground hover:bg-green-50 hover:text-green-600 border border-border/40"
                                }`}
                            >
                              👍 {aiRating === "up" ? "Děkujeme!" : "Ano"}
                            </button>
                            <button
                              onClick={() => handleRating("down")}
                              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${aiRating === "down"
                                ? "bg-red-100 text-red-700 border border-red-300"
                                : "bg-muted/30 text-muted-foreground hover:bg-red-50 hover:text-red-600 border border-border/40"
                                }`}
                            >
                              👎 {aiRating === "down" ? "Děkujeme" : "Ne"}
                            </button>
                            {/* Share reading button */}
                            {aiReadingId && isAuthenticated && (
                              <ShareReadingButton readingId={aiReadingId} />
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ) : null}
                </div>

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
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-lg font-serif font-semibold">{translateCrossName(chart.incarnationCross.name, locale)}</p>
                        <p className="text-sm text-muted-foreground">{CROSS_TYPE_CS[chart.incarnationCross.type] || chart.incarnationCross.type}</p>
                      </div>
                      <a href={localePath("/incarnation-cross")}>
                        <Button size="sm" variant="outline" className="text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10">
                          <Sparkles className="w-3.5 h-3.5" />
                          {locale === "en" ? "AI Analysis" : "AI analýza"}
                          <ChevronRight className="w-3 h-3" />
                        </Button>
                      </a>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {chart.incarnationCross.gates.map((g, i) => {
                        const gateDesc = hdData?.gates[g];
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
                  <ScrollArea className="w-full max-w-full">
                    <TabsList className="w-full flex h-auto flex-nowrap bg-muted/30 justify-start pb-2">
                      <TabsTrigger value="activations" className="text-xs whitespace-nowrap">{t.chart.activations}</TabsTrigger>
                      <TabsTrigger value="channels" className="text-xs whitespace-nowrap">{t.chart.channels}</TabsTrigger>
                      <TabsTrigger value="centers" className="text-xs whitespace-nowrap">{t.chart.centers}</TabsTrigger>
                      <TabsTrigger value="variables" className="text-xs whitespace-nowrap">{t.chart.variables}</TabsTrigger>
                      <TabsTrigger value="gates" className="text-xs whitespace-nowrap">{t.chart.gates}</TabsTrigger>
                      <TabsTrigger value="genekeys" className="text-xs whitespace-nowrap flex gap-1"><Sparkles className="w-3 h-3 text-amber-500" /> Zlatá Cesta</TabsTrigger>
                      <TabsTrigger value="dreamrave" className="text-xs whitespace-nowrap flex gap-1"><Moon className="w-3 h-3 text-indigo-400" /> Spánek a Sny</TabsTrigger>
                    </TabsList>
                  </ScrollArea>

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
                              const key = hdData?.channels[`${ch.gate1}-${ch.gate2}`] ? `${ch.gate1}-${ch.gate2}` : `${ch.gate2}-${ch.gate1}`;
                              const desc = hdData?.channels[key];
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
                        const desc = hdData?.centers[center.name];
                        const czCenterName = (t.hd.centerNames as any)[center.name] || center.name;
                        return (
                          <button key={center.name} onClick={() => setDetailModal({ type: "center", id: center.name })}
                            className={`text-left p-4 rounded-lg border transition-all hover:scale-[1.02] ${center.defined
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
                              {center.gates.map((g: any) => (
                                <span key={g} className={`text-[10px] px-1.5 py-0.5 rounded ${center.activatedGates.includes(g)
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

                  {/* Gene Keys Sequence */}
                  <TabsContent value="genekeys" className="mt-4">
                    {subStatus?.isPremium ? (
                      <GeneKeysSequence chart={chart} />
                    ) : (
                      <PremiumPaywall
                        variant="inline"
                        title={locale === "cs" ? "Zlatá Cesta k dispozici v Premium" : "Golden Path available in Premium"}
                        description={locale === "cs" ? "Získejte okamžitý přístup k detailní analýze svých Genových Klíčů a všem dalším Premium funkcím platformy." : "Get instant access to detailed Gene Keys analysis and all other Premium features."}
                      />
                    )}
                  </TabsContent>

                  {/* All Activated Gates */}
                  <TabsContent value="gates" className="mt-4">
                    <Card className="bg-card border-border/50 shadow-sm">
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(chart.activatedGates || []).sort((a, b) => a - b).map(gate => {
                            const desc = hdData?.gates[gate];
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
                                  <p className="text-[10px] text-muted-foreground truncate">{desc?.iChing} • {desc?.center ? (t.hd.centerNames as any)[desc.center] : ""}</p>
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

                  {/* Gene Keys (Zlatá Cesta) */}
                  <TabsContent value="genekeys" className="mt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {["pe", "ps", "de", "ds"].map((type) => {
                        let planet = type[1] === "s" ? "Sun" : "Earth";
                        let isPers = type[0] === "p";
                        let title = isPers && planet === "Sun" ? "Životní dílo (Life's Work)" :
                          isPers && planet === "Earth" ? "Evoluce (Evolution)" :
                            !isPers && planet === "Sun" ? "Vyzařování (Radiance)" : "Cíl (Purpose)";
                        let activation = (isPers ? chart.personalityActivations : chart.designActivations || [])
                          .find(a => a.planet === planet);
                        if (!activation) return null;

                        let gateData = hdData?.gates[activation.gate];
                        return (
                          <Card key={type} className="bg-card border-border/50 shadow-sm overflow-hidden">
                            <CardHeader className={`pb-2 ${isPers ? "bg-muted/10 border-b border-border/30" : "bg-red-500/5 border-b border-red-500/10"}`}>
                              <CardTitle className="text-sm font-serif font-semibold">{title}</CardTitle>
                              <CardDescription className="text-xs">
                                {isPers ? "Personality" : "Design"} {planet === "Sun" ? "Slunce" : "Země"} (Klíč {activation.gate}.{activation.line})
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-4">
                              {gateData ? (
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between text-sm border-b border-border/20 pb-2">
                                    <span className="text-red-500 font-medium w-1/3 text-xs uppercase tracking-wider">Stín</span>
                                    <span className="text-right text-muted-foreground w-2/3">{gateData.shadowKeyword} <span className="opacity-50 text-[10px]">({gateData.shadowKeywordEn})</span></span>
                                  </div>
                                  <div className="flex items-center justify-between text-sm border-b border-border/20 pb-2">
                                    <span className="text-green-600 font-medium w-1/3 text-xs uppercase tracking-wider">Dar</span>
                                    <span className="text-right w-2/3">{gateData.giftKeyword} <span className="opacity-50 text-[10px]">({gateData.giftKeywordEn})</span></span>
                                  </div>
                                  <div className="flex items-center justify-between text-sm pb-1">
                                    <span className="text-amber-500 font-medium w-1/3 text-xs uppercase tracking-wider flex items-center gap-1"><Sparkles className="w-3 h-3" /> Siddhi</span>
                                    <span className="text-right font-serif w-2/3">{gateData.siddhiKeyword || "---"} <span className="opacity-50 text-[10px]">({gateData.siddhiKeywordEn || "---"})</span></span>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">Data nedostupná</span>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </TabsContent>

                  {/* Dream Rave (Spánek a Sny) */}
                  <TabsContent value="dreamrave" className="mt-4">
                    {(chart as any).dreamRave ? (
                      <Card className="bg-card border-border/50 shadow-sm">
                        <CardHeader className="pb-3 border-b border-border/30 bg-muted/20">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="font-serif text-xl flex items-center gap-2">
                                <Moon className="w-5 h-5 text-indigo-400" /> Snová Matice (Dream Rave)
                              </CardTitle>
                              <CardDescription className="mt-1">
                                Váš energetický stav během neuvědomělého spánku (tzv. Mammalian Design / 15-ti bránová matice).
                              </CardDescription>
                            </div>
                            <Badge variant="outline" className="text-sm bg-indigo-500/10 text-indigo-400 border-indigo-500/20 px-3 py-1">
                              Snový Typ: {(t.types as any)[(chart as any).dreamRave.type] || (chart as any).dreamRave.type}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                          {/* Light Field */}
                          <div>
                            <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-2 text-amber-500"><Sun className="w-4 h-4" /> Světelná Složka (Light Field)</h3>
                            <p className="text-xs text-muted-foreground mb-3 border-l-2 border-amber-500/30 pl-2">Vztahuje se k programování osobnosti a mentálních aspektů během spánku.</p>
                            <div className="flex flex-wrap gap-2">
                              {(chart as any).dreamRave.activeRealms.lightField.length > 0 ? (chart as any).dreamRave.activeRealms.lightField.map((g: any) => (
                                <Badge key={g} variant="outline" className="border-amber-500/30 bg-amber-500/5 text-amber-600">Brána {g} - {hdData?.gates[g]?.name}</Badge>
                              )) : <span className="text-xs text-muted-foreground italic">Žádné brány aktivní</span>}
                            </div>
                          </div>

                          {/* Earth Plane */}
                          <div>
                            <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-2 text-emerald-500"><Globe className="w-4 h-4" /> Pozemská Rovina (Earth Plane)</h3>
                            <p className="text-xs text-muted-foreground mb-3 border-l-2 border-emerald-500/30 pl-2">Vztahuje se k přežití, komunitě a materiálizaci kolektivních zkušeností z ostatních časových pásem.</p>
                            <div className="flex flex-wrap gap-2">
                              {(chart as any).dreamRave.activeRealms.earthPlane.length > 0 ? (chart as any).dreamRave.activeRealms.earthPlane.map((g: any) => (
                                <Badge key={g} variant="outline" className="border-emerald-500/30 bg-emerald-500/5 text-emerald-600">Brána {g} - {hdData?.gates[g]?.name}</Badge>
                              )) : <span className="text-xs text-muted-foreground italic">Žádné brány aktivní</span>}
                            </div>
                          </div>

                          {/* Demon Realm */}
                          <div>
                            <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-2 text-rose-500"><Target className="w-4 h-4" /> Sféra stínů (Demon Realm)</h3>
                            <p className="text-xs text-muted-foreground mb-3 border-l-2 border-rose-500/30 pl-2">Vztahuje se k nevědomému podmiňování, hlubokým strachům a přežití formy.</p>
                            <div className="flex flex-wrap gap-2">
                              {(chart as any).dreamRave.activeRealms.demonRealm.length > 0 ? (chart as any).dreamRave.activeRealms.demonRealm.map((g: any) => (
                                <Badge key={g} variant="outline" className="border-rose-500/30 bg-rose-500/5 text-rose-600">Brána {g} - {hdData?.gates[g]?.name}</Badge>
                              )) : <span className="text-xs text-muted-foreground italic">Žádné brány aktivní</span>}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="p-8 text-center text-muted-foreground">Data pro Dream Rave nejsou u této mapy dostupná. Zkuste ji vygenerovat znovu.</div>
                    )}
                  </TabsContent>
                </Tabs>


              </div>
            </div>
          </div>
        </motion.main>
      </AnimatePresence>
      <Footer />

      {/* ─── Detail Modal ─── */}
      <Dialog open={detailModal.type !== null} onOpenChange={(open) => { if (!open) setDetailModal({ type: null, id: null }); }}>
        <DialogContent className="max-w-lg max-h-[85vh]">
          <ScrollArea className="max-h-[75vh]">
            <DialogHeader>
              {detailModal.type === "gate" && detailModal.id !== null && (() => {
                const g = hdData?.gates[detailModal.id as number];
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
                const ch = hdData?.channels[detailModal.id as string];
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
                const c = hdData?.centers[detailModal.id as string];
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
                const tp = hdData?.types[detailModal.id as string];
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
