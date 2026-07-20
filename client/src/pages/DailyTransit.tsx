import { useLanguage } from "@/contexts/LanguageContext";
import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Sun, Moon, Sparkles, Zap, Star, Download, Share2, Copy, MessageCircle, Send } from "lucide-react";
import { Streamdown } from "streamdown";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import { PLANET_SYMBOLS, PLANET_COLORS } from "@/lib/hdConstants";
import { useSEO } from "@/hooks/useSEO";

export default function DailyTransit() {
  const { t, locale, localePath } = useLanguage();
  const { user, isAuthenticated, loading } = useAuth();

  useSEO(locale === "en" ? {
    title: "🌅 Daily Human Design Transit — Today's Planetary Gates 🪐",
    description: "See today's Human Design transit gates and how current planetary positions activate your bodygraph.",
    keywords: "human design daily transit, today's gates, planetary positions, bodygraph activation, daily energy",
    ogType: "website",
    locale: "en_US",
  } : {
    title: "🌅 Denní Human Design Tranzit — Dnešní Planetární Brány 🪐",
    description: "Zjistěte dnešní tranzitové brány Human Design a jak aktuální planeterní pozice aktivují váš bodygraph.",
    keywords: "human design denní tranzit, dnešní brány, planetární pozice, aktivace bodygraphu, denní energie",
    ogType: "website",
    locale: "cs_CZ",
  });

  const [selectedChartId, setSelectedChartId] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const chartsQuery = trpc.chart.list.useQuery(undefined, { enabled: isAuthenticated });
  const charts = chartsQuery.data || [];

  // Auto-select first chart
  const effectiveChartId = selectedChartId ?? (charts[0]?.id ?? null);

  const stableInput = useMemo(
    () => (effectiveChartId ? { chartId: effectiveChartId } : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [effectiveChartId, refreshKey]
  );

  // Personalized transit if they have a chart
  const transitQuery = trpc.transit.personalized.useQuery(
    stableInput!,
    { enabled: isAuthenticated && !!effectiveChartId }
  );

  // General transit if they don't have a chart or are not logged in
  const generalTransitQuery = trpc.transit.current.useQuery(undefined, {
    enabled: !isAuthenticated || !effectiveChartId
  });

  const isGeneral = !isAuthenticated || !effectiveChartId;
  const transit = isGeneral ? generalTransitQuery.data : transitQuery.data;

  const getShareText = () => {
    if (!transit) return "";
    const dateLocale = locale === "en" ? "en-US" : "cs-CZ";
    const date = new Date(transit.timestamp).toLocaleDateString(dateLocale);
    const siteUrl = locale === "cs" ? "humandesignmapa.cz" : "humandesignchart.app";
    const header = locale === "en"
      ? `🌅 DAILY TRANSIT — ${date}`
      : `🌅 DENNÍ TRANZIT — ${date}`;

    // Use optional chaining / checking since general transit lacks these
    const activatedInfo = "activatedChannels" in transit && transit.activatedChannels?.length > 0
      ? `\n${locale === "en" ? "Activated channels" : "Aktivované dráhy"}: ${transit.activatedChannels.map(ch => `${ch.gate1}–${ch.gate2}`).join(", ")}`
      : "";

    // Check if transitGates exists, otherwise fallback
    const topGates = (transit.transitGates || []).slice(0, 4).map(tg => `${PLANET_SYMBOLS[tg.planet] || tg.planet[0]} ${locale === "en" ? "Gate" : "Brána"} ${tg.gate}.${"line" in tg ? tg.line : ""}`).join(" | ");
    return `${header}\n\n${topGates}${activatedInfo}\n\n${locale === "en" ? "Get your personalized transit" : "Získej svůj personalizovaný tranzit"}: https://${siteUrl}/${locale}/daily-transit`;
  };

  const [showShareMenu, setShowShareMenu] = useState(false);

  const handleCopyShare = async () => {
    const text = getShareText();
    await navigator.clipboard.writeText(text);
    toast.success(locale === "en" ? "Copied to clipboard!" : "Zkopírováno do schránky!");
    setShowShareMenu(false);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(getShareText());
    window.open(`https://wa.me/?text=${text}`, "_blank");
    setShowShareMenu(false);
  };

  const handleTelegramShare = () => {
    const text = encodeURIComponent(getShareText());
    window.open(`https://t.me/share/url?url=${encodeURIComponent(`https://${locale === "cs" ? "humandesignmapa.cz" : "humandesignchart.app"}/${locale}/daily-transit`)}&text=${text}`, "_blank");
    setShowShareMenu(false);
  };

  const handleFacebookShare = () => {
    const url = encodeURIComponent(`https://${locale === "cs" ? "humandesignmapa.cz" : "humandesignchart.app"}/${locale}/daily-transit`);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank");
    setShowShareMenu(false);
  };

  const handleDownload = () => {
    if (!transit || !("interpretation" in transit)) return; // Only personalized can be downloaded

    const dateLocale = locale === "en" ? "en-US" : "cs-CZ";
    const date = new Date(transit.timestamp).toLocaleDateString(dateLocale);
    const siteUrl = locale === "cs" ? "humandesignmapa.cz" : "humandesignchart.app";
    const header = locale === "en"
      ? `DAILY TRANSIT — ${date}`
      : `DENNÍ TRANZIT — ${date}`;
    const content = `${header}\n${"=".repeat(50)}\n\n${t.dailyTransit.forChart}: ${transit.chartName}\n${t.chart.type}: ${transit.chartType} | ${t.chart.profile}: ${transit.chartProfile}\n\n${transit.interpretation}\n\n${"=".repeat(50)}\n${locale === "en" ? "Generated by" : "Vygenerováno"}: ${siteUrl}`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transit-${date.replace(/[./]/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t.dailyTransit.downloaded);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }


  const dateLocale = locale === "en" ? "en-US" : "cs-CZ";
  const today = new Date().toLocaleDateString(dateLocale, {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 pt-24 pb-16">
        <div className="container max-w-5xl">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sun className="w-5 h-5 text-amber-500" />
                <span className="text-sm font-medium text-muted-foreground capitalize">{today}</span>
              </div>
              <h1 className="font-serif text-3xl font-bold">{t.dailyTransit.title}</h1>
              <p className="text-muted-foreground mt-1">
                {t.dailyTransit.subtitle}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {transit && (
                <>
                  {/* Share button with dropdown */}
                  <div className="relative">
                    <Button variant="outline" size="sm" onClick={() => setShowShareMenu(!showShareMenu)}>
                      <Share2 className="w-4 h-4 mr-1.5" />
                      {locale === "en" ? "Share" : "Sdílet"}
                    </Button>
                    {showShareMenu && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowShareMenu(false)} />
                        <div className="absolute right-0 top-full mt-2 z-50 bg-card border border-border/60 rounded-xl shadow-xl p-2 min-w-[180px] animate-in fade-in slide-in-from-top-2 duration-200">
                          <button
                            onClick={handleCopyShare}
                            className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm rounded-lg hover:bg-muted transition-colors text-left"
                          >
                            <Copy className="w-4 h-4 text-muted-foreground" />
                            {locale === "en" ? "Copy text" : "Kopírovat text"}
                          </button>
                          <button
                            onClick={handleWhatsAppShare}
                            className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm rounded-lg hover:bg-muted transition-colors text-left"
                          >
                            <MessageCircle className="w-4 h-4 text-green-500" />
                            WhatsApp
                          </button>
                          <button
                            onClick={handleTelegramShare}
                            className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm rounded-lg hover:bg-muted transition-colors text-left"
                          >
                            <Send className="w-4 h-4 text-blue-500" />
                            Telegram
                          </button>
                          <button
                            onClick={handleFacebookShare}
                            className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm rounded-lg hover:bg-muted transition-colors text-left"
                          >
                            <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                            Facebook
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="w-4 h-4 mr-1.5" />
                    {t.dailyTransit.download}
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRefreshKey(k => k + 1)}
                disabled={transitQuery.isFetching}
              >
                <RefreshCw className={`w-4 h-4 mr-1.5 ${transitQuery.isFetching ? "animate-spin" : ""}`} />
                {t.dailyTransit.refresh}
              </Button>
            </div>
          </div>

          {/* Chart selector */}
          {charts.length === 0 ? (
            <Card className="mb-6 border-dashed">
              <CardContent className="py-10 text-center">
                <Moon className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">{t.dailyTransit.noCharts}</p>
                <Link href={localePath("/calculate")}>
                  <Button className="bg-primary text-primary-foreground">{t.dailyTransit.createChart}</Button>
                </Link>
              </CardContent>
            </Card>
          ) : charts.length > 1 ? (
            <div className="flex flex-wrap gap-2 mb-6">
              {charts.map((chart: any) => (
                <button
                  key={chart.id}
                  onClick={() => setSelectedChartId(chart.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${effectiveChartId === chart.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border text-muted-foreground hover:border-primary/50"
                    }`}
                >
                  {chart.name}
                </button>
              ))}
            </div>
          ) : null}

          {/* Loading state — Skeleton loader */}
          {transitQuery.isLoading && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left skeleton: planetary positions */}
              <div className="lg:col-span-1 space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-muted animate-pulse" />
                      <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-muted animate-pulse" />
                          <div className="space-y-1">
                            <div className="h-3 w-16 bg-muted animate-pulse rounded" />
                            <div className="h-2.5 w-24 bg-muted/60 animate-pulse rounded" />
                          </div>
                        </div>
                        <div className="h-5 w-14 bg-muted animate-pulse rounded-full" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
              {/* Right skeleton: AI interpretation */}
              <div className="lg:col-span-2">
                <Card className="h-full">
                  <CardHeader className="pb-3 border-b border-border/40">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary/40 animate-pulse" />
                        <div className="h-5 w-40 bg-muted animate-pulse rounded" />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-16 bg-muted animate-pulse rounded-full" />
                        <div className="h-5 w-20 bg-muted animate-pulse rounded-full" />
                      </div>
                    </div>
                    <div className="h-3 w-48 bg-muted/60 animate-pulse rounded mt-2" />
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    {/* Skeleton paragraph lines */}
                    <div className="space-y-2.5">
                      <div className="h-3.5 w-full bg-muted animate-pulse rounded" />
                      <div className="h-3.5 w-[95%] bg-muted animate-pulse rounded" />
                      <div className="h-3.5 w-[88%] bg-muted animate-pulse rounded" />
                    </div>
                    <div className="space-y-2.5">
                      <div className="h-3.5 w-full bg-muted animate-pulse rounded" />
                      <div className="h-3.5 w-[92%] bg-muted animate-pulse rounded" />
                      <div className="h-3.5 w-[85%] bg-muted animate-pulse rounded" />
                      <div className="h-3.5 w-[78%] bg-muted animate-pulse rounded" />
                    </div>
                    <div className="space-y-2.5">
                      <div className="h-3.5 w-full bg-muted animate-pulse rounded" />
                      <div className="h-3.5 w-[90%] bg-muted animate-pulse rounded" />
                      <div className="h-3.5 w-[70%] bg-muted animate-pulse rounded" />
                    </div>
                    <div className="flex items-center gap-2 pt-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 animate-pulse" />
                      <div className="h-3 w-56 bg-muted/60 animate-pulse rounded" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Error state */}
          {transitQuery.isError && (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="py-8 text-center">
                <p className="text-destructive mb-3">{t.dailyTransit.error}</p>
                <Button variant="outline" onClick={() => transitQuery.refetch()}>{t.dailyTransit.retry}</Button>
              </CardContent>
            </Card>
          )}

          {/* Transit data */}
          {transit && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Left: Planetary positions */}
              <div className="lg:col-span-1 space-y-4">

                {/* Activated channels */}
                {"activatedChannels" in transit && transit.activatedChannels.length > 0 && (
                  <Card className="border-primary/30 bg-primary/5">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Zap className="w-4 h-4 text-primary" />
                        {t.dailyTransit.activatedChannels}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {transit.activatedChannels.map((ch, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono text-xs border-primary/40 text-primary">
                              {ch.gate1}–{ch.gate2}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{t.dailyTransit.via} {ch.via}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Reinforced natal gates */}
                {"reinforcedGates" in transit && transit.reinforcedGates.length > 0 && (
                  <Card className="border-amber-200 bg-amber-50/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Star className="w-4 h-4 text-amber-500" />
                        {t.dailyTransit.reinforcedGates}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex flex-wrap gap-1.5">
                        {transit.reinforcedGates.map((g, i) => (
                          <Badge key={i} variant="outline" className="font-mono text-xs border-amber-300 text-amber-700 bg-amber-50">
                            {PLANET_SYMBOLS[g.planet] || g.planet} {t.dailyTransit.gate} {g.gate}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* All transit gates */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Sun className="w-4 h-4 text-amber-500" />
                      {t.dailyTransit.planetaryPositions}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {("transitGates" in transit ? transit.transitGates : []).map((tg, i) => (
                        <div key={i} className="flex items-center justify-between py-1 border-b border-border/30 last:border-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-lg w-6 text-center ${PLANET_COLORS[tg.planet] || "text-foreground"}`}>
                              {PLANET_SYMBOLS[tg.planet] || tg.planet[0]}
                            </span>
                            <div>
                              <div className="text-xs font-medium">
                                {(t.hd.planets as any)[tg.planet] || tg.planet}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {(t.dailyTransit.planetMeanings as any)[tg.planet] || ""}
                              </div>
                            </div>
                          </div>
                          <Badge variant="outline" className="font-mono text-xs">
                            {t.dailyTransit.gate} {tg.gate}.{"line" in tg ? tg.line : ""}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right: AI interpretation */}
              <div className="lg:col-span-2">
                {"interpretation" in transit ? (
                  <Card className="h-full">
                    <CardHeader className="pb-3 border-b border-border/40">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-primary" />
                          {t.dailyTransit.personalizedReading}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {(t.types as any)[transit.chartType] || transit.chartType}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {t.chart.profile} {transit.chartProfile}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t.dailyTransit.forChart}: <span className="font-medium">{transit.chartName as string}</span>
                        {" · "}
                        {t.dailyTransit.updatedAt}: {new Date(transit.timestamp).toLocaleTimeString(dateLocale, { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="prose prose-sm max-w-none text-foreground/90 leading-relaxed">
                        <Streamdown>{transit.interpretation}</Streamdown>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="h-full flex items-center justify-center bg-muted/20 border-dashed">
                    <CardContent className="py-12 text-center max-w-md">
                      <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-bold mb-2">
                        {locale === "cs" ? "Osobní AI výklad" : "Personalized AI Reading"}
                      </h3>
                      <p className="text-muted-foreground mb-6 text-sm">
                        {locale === "cs"
                          ? "Přihlaste se a nechte si vygenerovat osobní reading na dnešní den podle vaší unikátní mapy."
                          : "Sign in and get a personalized daily reading based on your unique Human Design chart."}
                      </p>
                      <a href={getLoginUrl()}>
                        <Button className="bg-primary text-primary-foreground">{t.common.signIn}</Button>
                      </a>
                    </CardContent>
                  </Card>
                )}
              </div>

            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
