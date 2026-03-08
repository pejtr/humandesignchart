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
  Target, Compass, BookOpen, Info, Lock, Download,
  Star,
} from "lucide-react";
import type { HumanDesignChartData } from "@shared/types";
import { useLanguage } from "@/contexts/LanguageContext";
import { GATE_DESCRIPTIONS } from "@shared/hdContent";

const CROSS_TYPE_CS: Record<string, string> = {
  "Right Angle Cross": "Pravý Úhlový Kříž",
  "Left Angle Cross": "Levý Úhlový Kříž",
  "Juxtaposition Cross": "Juxtapoziční Kříž",
};

function translateCrossName(name: string, locale: string): string {
  if (locale === "en") return name;
  let result = name;
  for (const [en, cz] of Object.entries(CROSS_TYPE_CS)) {
    result = result.replace(en, cz);
  }
  return result;
}

export default function IncarnationCross() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const { t, locale, localePath } = useLanguage();
  const tp = t.incarnationCrossPage;

  const [chart, setChart] = useState<HumanDesignChartData | null>(null);
  const [chartMeta, setChartMeta] = useState<any>(null);
  const [aiContent, setAiContent] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

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

    // Abort any existing stream
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
            if (parsed.token) {
              setAiContent(prev => prev + parsed.token);
            }
            if (parsed.done) {
              setIsStreaming(false);
            }
            if (parsed.error) {
              throw new Error(parsed.error);
            }
          } catch { /* skip malformed */ }
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        toast.error(locale === "cs" ? "AI analýza selhala" : "AI analysis failed");
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
    a.download = `${locale === "cs" ? "inkarnacni-kriz" : "incarnation-cross"}-${crossName.toLowerCase().replace(/\s+/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!chart) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Navbar />
        <main className="flex-1 pt-24 pb-16 flex items-center justify-center">
          <div className="text-center max-w-md px-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-primary" />
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

  const crossData = chart.incarnationCross;
  const crossName = crossData?.name || "Unknown Cross";
  const displayCrossName = translateCrossName(crossName, locale);
  const crossType = (Object.keys(CROSS_TYPE_CS) as string[]).find(k => crossName.includes(k)) || "Right Angle Cross";
  const crossTypeInfo = (tp.crossTypes as any)[crossType];

  // Color based on cross type
  const crossColor = crossType === "Right Angle Cross"
    ? "#7c3aed"
    : crossType === "Left Angle Cross"
    ? "#2a9d8f"
    : "#d4af37";

  // Get the 4 gates of the cross
  const sunGate = chart.personalityActivations?.find(p => p.planet === "Sun")?.gate;
  const earthGate = chart.personalityActivations?.find(p => p.planet === "Earth")?.gate;
  const designSunGate = chart.designActivations?.find(p => p.planet === "Sun")?.gate;
  const designEarthGate = chart.designActivations?.find(p => p.planet === "Earth")?.gate;
  const crossGateNumbers = crossData?.gates || [];

  const crossGates = [
    {
      label: tp.personalitySun,
      gate: sunGate || crossGateNumbers[0],
      icon: <Sun className="w-4 h-4" style={{ color: "#f59e0b" }} />,
      color: "#f59e0b",
    },
    {
      label: tp.personalityEarth,
      gate: earthGate || crossGateNumbers[1],
      icon: <span className="text-sm" style={{ color: "#6b7280" }}>⊕</span>,
      color: "#6b7280",
    },
    {
      label: tp.designSun,
      gate: designSunGate || crossGateNumbers[2],
      icon: <Sun className="w-4 h-4" style={{ color: "#ef4444" }} />,
      color: "#ef4444",
    },
    {
      label: tp.designEarth,
      gate: designEarthGate || crossGateNumbers[3],
      icon: <span className="text-sm" style={{ color: "#9ca3af" }}>⊕</span>,
      color: "#9ca3af",
    },
  ].filter(g => g.gate !== undefined);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container max-w-4xl">
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

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md"
                style={{ background: `${crossColor}20`, color: crossColor }}
              >
                <Target className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm text-muted-foreground font-medium">{tp.title}</p>
                  <Badge
                    className="text-white text-xs px-2 py-0.5"
                    style={{ background: crossColor }}
                  >
                    {crossTypeInfo?.theme || tp.badge}
                  </Badge>
                </div>
                <h1 className="font-serif text-2xl md:text-3xl font-bold">{displayCrossName}</h1>
                {chartMeta?.name && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {locale === "cs" ? `pro ${chartMeta.name}` : `for ${chartMeta.name}`}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left column */}
            <div className="md:col-span-1 space-y-4">
              {/* Cross type explanation */}
              {crossTypeInfo && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Info className="w-4 h-4 text-primary" />
                      {tp.crossType}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {crossTypeInfo.desc}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* The 4 gates */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Star className="w-4 h-4 text-primary" />
                    {tp.fourGates}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {crossGates.map((g, i) => {
                    const gateDesc = GATE_DESCRIPTIONS[g.gate as number];
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: `${g.color}15`, color: g.color }}
                        >
                          {g.icon}
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">{g.label}</p>
                          <p className="text-sm font-semibold">
                            {tp.gate} {g.gate}
                            {gateDesc && (
                              <span className="text-xs text-muted-foreground font-normal ml-1">
                                — {gateDesc.name}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {crossGates.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      {locale === "cs" ? "Data bran nejsou dostupná." : "Gate data not available."}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* What is incarnation cross */}
              <Card style={{ background: "linear-gradient(135deg, #f5f0ff 0%, #fef9e7 100%)" }}>
                <CardContent className="pt-4">
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
            </div>

            {/* Right column — AI analysis */}
            <div className="md:col-span-2">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    {tp.aiTitle}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {tp.aiDesc}
                    {chartMeta?.name ? (locale === "cs" ? ` pro ${chartMeta.name}` : ` for ${chartMeta.name}`) : ""}
                  </p>
                </CardHeader>
                <CardContent>
                  {/* Not started */}
                  {!aiContent && !isStreaming && (
                    <div className="text-center py-10">
                      <div
                        className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg"
                        style={{
                          background: `linear-gradient(135deg, ${crossColor}20, ${crossColor}10)`,
                          color: crossColor,
                        }}
                      >
                        <Target className="w-10 h-10" />
                      </div>
                      <h3 className="font-serif text-xl font-bold mb-2">
                        {displayCrossName}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                        {locale === "cs"
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
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">{tp.aiGenerating}</p>
                    </div>
                  )}

                  {/* Streaming content */}
                  {(aiContent || isStreaming) && aiContent && (
                    <div className="prose prose-sm max-w-none">
                      <Streamdown>{aiContent}</Streamdown>
                      {isStreaming && (
                        <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-0.5 align-middle" />
                      )}
                      {!isStreaming && (
                        <>
                          <Separator className="my-4" />
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleAiAnalysis}
                            >
                              <Sparkles className="w-4 h-4 mr-1.5" />
                              {tp.aiRegenerate}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleDownload}
                            >
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
