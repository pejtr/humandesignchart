import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
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
  ArrowLeft, Sparkles, Loader2, Sun, Earth, Moon, Star,
  Target, Compass, BookOpen, ChevronRight, Info, Lock,
} from "lucide-react";
import type { HumanDesignChartData } from "@shared/types";

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

const CROSS_TYPE_INFO: Record<string, { desc: string; theme: string; color: string }> = {
  "Right Angle Cross": {
    desc: "Pravý Úhlový Kříž je osobní osud — vaše životní téma se rozvíjí skrze osobní zkušenosti a vztahy. Máte karma, která se zpracovává v tomto životě.",
    theme: "Osobní osud",
    color: "#7c3aed",
  },
  "Left Angle Cross": {
    desc: "Levý Úhlový Kříž je transpersonální osud — vaše životní téma se rozvíjí skrze setkání s druhými. Jste zde, abyste sloužili komunitě a kolektivu.",
    theme: "Transpersonální osud",
    color: "#2a9d8f",
  },
  "Juxtaposition Cross": {
    desc: "Juxtapoziční Kříž je fixní osud — vaše životní téma je pevně dané a neměnné. Máte specifické poslání, které přinášíte světu bez ohledu na okolnosti.",
    theme: "Fixní osud",
    color: "#d4af37",
  },
};

const PLANET_ICONS: Record<string, React.ReactNode> = {
  Sun: <Sun className="w-4 h-4" />,
  Earth: <span className="text-sm">⊕</span>,
  "North Node": <span className="text-sm">☊</span>,
  "South Node": <span className="text-sm">☋</span>,
};

export default function IncarnationCross() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();

  const [chart, setChart] = useState<HumanDesignChartData | null>(null);
  const [chartMeta, setChartMeta] = useState<any>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  const aiMutation = trpc.ai.generateReading.useMutation({
    onSuccess: (data) => setAiAnalysis(data.content),
    onError: (err) => toast.error("AI analýza selhala: " + err.message),
  });

  useEffect(() => {
    const stored = sessionStorage.getItem("chartResult");
    const meta = sessionStorage.getItem("chartMeta");
    if (stored) setChart(JSON.parse(stored));
    if (meta) setChartMeta(JSON.parse(meta));
  }, []);

  const handleAiAnalysis = () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    if (!chart) return;
    aiMutation.mutate({
      chartId: 0,
      chartData: chart,
      readingType: "incarnation_cross" as any,
    });
  };

  if (!chart) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Navbar />
        <main className="flex-1 pt-24 pb-16 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-primary" />
            </div>
            <h2 className="font-serif text-2xl font-bold mb-3">Nejprve si vypočítejte mapu</h2>
            <p className="text-muted-foreground mb-6">
              Pro zobrazení analýzy inkarnačního kříže potřebujete nejprve vygenerovat svou Human Design mapu.
            </p>
            <Button onClick={() => navigate("/calculate")}>
              <Compass className="w-4 h-4 mr-2" />
              Vypočítat mapu
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const crossData = chart.incarnationCross;
  const crossName = crossData?.name || "Unknown Cross";
  const czCrossName = translateCrossName(crossName);
  const crossType = Object.keys(CROSS_TYPE_CS).find(k => crossName.includes(k)) || "Right Angle Cross";
  const crossInfo = CROSS_TYPE_INFO[crossType];

  // Get the 4 gates of the cross from personalityActivations and designActivations
  const sunGate = chart.personalityActivations?.find(p => p.planet === "Sun")?.gate;
  const earthGate = chart.personalityActivations?.find(p => p.planet === "Earth")?.gate;
  const designSunGate = chart.designActivations?.find(p => p.planet === "Sun")?.gate;
  const designEarthGate = chart.designActivations?.find(p => p.planet === "Earth")?.gate;

  // Use cross gates from the data if available
  const crossGateNumbers = crossData?.gates || [];

  const crossGates = [
    { label: "Osobnost — Slunce", gate: sunGate || crossGateNumbers[0], icon: <Sun className="w-4 h-4 text-amber-500" />, color: "#f59e0b" },
    { label: "Osobnost — Země", gate: earthGate || crossGateNumbers[1], icon: <span className="text-sm">⊕</span>, color: "#6b7280" },
    { label: "Design — Slunce", gate: designSunGate || crossGateNumbers[2], icon: <Sun className="w-4 h-4 text-red-400" />, color: "#ef4444" },
    { label: "Design — Země", gate: designEarthGate || crossGateNumbers[3], icon: <span className="text-sm">⊕</span>, color: "#9ca3af" },
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
            className="mb-6"
            onClick={() => navigate("/chart/new")}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Zpět na mapu
          </Button>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md"
                style={{ background: `${crossInfo?.color}20`, color: crossInfo?.color }}
              >
                <Target className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Inkarnační kříž</p>
                <h1 className="font-serif text-2xl md:text-3xl font-bold">{czCrossName}</h1>
              </div>
            </div>
            {crossInfo && (
              <Badge
                className="text-white text-xs px-3 py-1"
                style={{ background: crossInfo.color }}
              >
                {crossInfo.theme}
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left column — cross info */}
            <div className="md:col-span-1 space-y-4">
              {/* Cross type explanation */}
              {crossInfo && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Info className="w-4 h-4 text-primary" />
                      Typ kříže
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {crossInfo.desc}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* The 4 gates */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Star className="w-4 h-4 text-primary" />
                    4 brány kříže
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {crossGates.map((g, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: `${g.color}15`, color: g.color }}
                      >
                        {g.icon}
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{g.label}</p>
                        <p className="text-sm font-semibold">Brána {g.gate}</p>
                      </div>
                    </div>
                  ))}
                  {crossGates.length === 0 && (
                    <p className="text-sm text-muted-foreground">Data bran nejsou dostupná.</p>
                  )}
                </CardContent>
              </Card>

              {/* What is incarnation cross */}
              <Card style={{ background: "linear-gradient(135deg, #f5f0ff 0%, #fef9e7 100%)" }}>
                <CardContent className="pt-4">
                  <div className="flex items-start gap-2">
                    <BookOpen className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold mb-1">Co je inkarnační kříž?</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Inkarnační kříž je tvořen čtyřmi branami — Slunce a Země v osobnostním a designovém výpočtu. Reprezentuje vaše životní téma a poslání, které přinášíte do světa.
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
                    AI analýza vašeho životního poslání
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Personalizovaný výklad inkarnačního kříže {chartMeta?.name ? `pro ${chartMeta.name}` : ""} v češtině
                  </p>
                </CardHeader>
                <CardContent>
                  {!aiAnalysis && !aiMutation.isPending && (
                    <div className="text-center py-10">
                      <div
                        className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg"
                        style={{
                          background: "linear-gradient(135deg, #7c3aed20, #d4af3720)",
                          color: "#7c3aed",
                        }}
                      >
                        <Target className="w-10 h-10" />
                      </div>
                      <h3 className="font-serif text-xl font-bold mb-2">
                        {czCrossName}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                        Nechte AI odhalit hlubší smysl vašeho inkarnačního kříže — vaše životní téma, výzvy a dary, které přinášíte světu.
                      </p>

                      {isAuthenticated ? (
                        <Button
                          onClick={handleAiAnalysis}
                          size="lg"
                          className="text-white px-8"
                          style={{ background: "linear-gradient(135deg, #7c3aed, #2a9d8f)", border: "none" }}
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          Spustit AI analýzu poslání
                        </Button>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
                            <Lock className="w-4 h-4" />
                            Pro AI analýzu je potřeba přihlášení
                          </div>
                          <a href={getLoginUrl()}>
                            <Button
                              size="lg"
                              className="text-white px-8"
                              style={{ background: "linear-gradient(135deg, #7c3aed, #2a9d8f)", border: "none" }}
                            >
                              <Sparkles className="w-4 h-4 mr-2" />
                              Přihlásit se a spustit analýzu
                            </Button>
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {aiMutation.isPending && (
                    <div className="flex flex-col items-center justify-center py-12 gap-4">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">AI analyzuje váš inkarnační kříž…</p>
                    </div>
                  )}

                  {aiAnalysis && (
                    <div className="prose prose-sm max-w-none">
                      <Streamdown>{aiAnalysis}</Streamdown>
                      <Separator className="my-4" />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAiAnalysis}
                        disabled={aiMutation.isPending}
                      >
                        <Sparkles className="w-4 h-4 mr-1.5" />
                        Vygenerovat znovu
                      </Button>
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
