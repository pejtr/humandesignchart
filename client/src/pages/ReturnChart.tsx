import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sun, Moon, LogIn, Loader2, RotateCcw, Info } from "lucide-react";
import Bodygraph from "@/components/Bodygraph";
import { useLanguage } from "@/contexts/LanguageContext";

type ReturnType = "solar" | "saturn" | "chiron" | "uranus";

export default function ReturnChart() {
  const { isAuthenticated } = useAuth();
  const { t, locale } = useLanguage();

  useEffect(() => {
    if (locale === "en") {
      document.title = "🌀 Human Design Return Charts — Solar, Saturn & Chiron 🪐";
      document.querySelector('meta[name="description"]')?.setAttribute(
        "content",
        "Calculate your Human Design Solar Return, Saturn Return, and Chiron Return charts. Discover how planetary cycles shape your life."
      );
    } else {
      document.title = "🌀 Human Design Return Charty — Solární, Saturnův & Chironův 🪐";
      document.querySelector('meta[name="description"]')?.setAttribute(
        "content",
        "Vypočítejte svůj Human Design Solární Return, Saturnův Return a Chironův Return. Zjistěte, jak planetární cykly formují váš život."
      );
    }
  }, [locale]);

  const [selectedChartId, setSelectedChartId] = useState<string>("");
  const [returnType, setReturnType] = useState<ReturnType>("solar");
  const [returnData, setReturnData] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const chartsQuery = trpc.chart.list.useQuery(undefined, { enabled: isAuthenticated });
  const calculateMutation = trpc.chart.calculate.useMutation();

  const selectedChart = useMemo(() => {
    if (!selectedChartId || !chartsQuery.data) return null;
    return chartsQuery.data.find((c: any) => c.id === parseInt(selectedChartId));
  }, [selectedChartId, chartsQuery.data]);

  const RETURN_INFO: Record<ReturnType, { title: string; icon: typeof Sun; description: string; period: string; color: string }> = {
    solar: {
      title: t.returnChart.returns.solar.title,
      icon: Sun,
      description: t.returnChart.returns.solar.description,
      period: t.returnChart.returns.solar.period,
      color: "text-amber-600 bg-amber-50",
    },
    saturn: {
      title: t.returnChart.returns.saturn.title,
      icon: RotateCcw,
      description: t.returnChart.returns.saturn.description,
      period: t.returnChart.returns.saturn.period,
      color: "text-slate-600 bg-slate-50",
    },
    chiron: {
      title: t.returnChart.returns.chiron.title,
      icon: Moon,
      description: t.returnChart.returns.chiron.description,
      period: t.returnChart.returns.chiron.period,
      color: "text-purple-600 bg-purple-50",
    },
    uranus: {
      title: t.returnChart.returns.uranus.title,
      icon: RotateCcw,
      description: t.returnChart.returns.uranus.description,
      period: t.returnChart.returns.uranus.period,
      color: "text-cyan-600 bg-cyan-50",
    },
  };

  const handleCalculateReturn = async () => {
    if (!selectedChart) return;
    setIsCalculating(true);
    setReturnData(null);

    try {
      const birthDate = new Date(selectedChart.birthDate);
      const now = new Date();
      let returnDate: Date;

      switch (returnType) {
        case "solar":
          returnDate = new Date(now.getFullYear(), birthDate.getMonth(), birthDate.getDate());
          if (returnDate < now) {
            returnDate = new Date(now.getFullYear() + 1, birthDate.getMonth(), birthDate.getDate());
          }
          break;
        case "saturn":
          returnDate = new Date(birthDate.getTime() + 29.5 * 365.25 * 24 * 60 * 60 * 1000);
          break;
        case "chiron":
          returnDate = new Date(birthDate.getTime() + 50.7 * 365.25 * 24 * 60 * 60 * 1000);
          break;
        case "uranus":
          returnDate = new Date(birthDate.getTime() + 42 * 365.25 * 24 * 60 * 60 * 1000);
          break;
      }

      const dateStr = returnDate.toISOString().split("T")[0];

      const result = await calculateMutation.mutateAsync({
        name: `${RETURN_INFO[returnType].title} - ${selectedChart.name}`,
        birthDate: dateStr,
        birthTime: selectedChart.birthTime,
        birthPlace: selectedChart.birthPlace,
        latitude: parseFloat(selectedChart.latitude),
        longitude: parseFloat(selectedChart.longitude),
        timezoneOffset: 0,
        timezone: selectedChart.timezone,
      });

      setReturnData(result);
    } catch (error) {
      console.error("Return chart calculation failed:", error);
    } finally {
      setIsCalculating(false);
    }
  };

  const info = RETURN_INFO[returnType];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="container max-w-2xl text-center">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <RotateCcw className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-serif font-bold mb-4">{t.returnChart.title}</h1>
            <p className="text-muted-foreground mb-8">
              {t.returnChart.loginRequired}
            </p>
            <a href={getLoginUrl()}>
              <Button size="lg" className="gap-2">
                <LogIn className="w-5 h-5" />
                {t.common.signIn}
              </Button>
            </a>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container max-w-6xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <RotateCcw className="w-4 h-4" />
              {t.returnChart.title}
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
              {t.returnChart.subtitle}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t.returnChart.description}
            </p>
          </motion.div>

          {/* Return type selector */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {(Object.entries(RETURN_INFO) as [ReturnType, typeof RETURN_INFO[ReturnType]][]).map(([key, val]) => (
              <Card
                key={key}
                className={`cursor-pointer transition-all hover:shadow-md ${returnType === key ? "ring-2 ring-primary" : ""}`}
                onClick={() => { setReturnType(key); setReturnData(null); }}
              >
                <CardContent className="p-4 text-center">
                  <div className={`w-10 h-10 rounded-lg ${val.color} flex items-center justify-center mx-auto mb-2`}>
                    <val.icon className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-semibold">{val.title}</p>
                  <p className="text-xs text-muted-foreground">{val.period}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Info card */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-semibold mb-1">{info.title}</h3>
                  <p className="text-sm text-muted-foreground">{info.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chart selector */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <Select value={selectedChartId} onValueChange={setSelectedChartId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder={t.returnChart.selectChart} />
              </SelectTrigger>
              <SelectContent>
                {chartsQuery.data?.map((chart: any) => (
                  <SelectItem key={chart.id} value={chart.id.toString()}>
                    {chart.name} ({chart.birthDate})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleCalculateReturn}
              disabled={!selectedChartId || isCalculating}
              className="gap-2"
            >
              {isCalculating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
              {t.returnChart.calculate} {info.title}
            </Button>
          </div>

          {/* Results */}
          {returnData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Original chart */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Badge variant="outline">{t.returnChart.natalChart}</Badge>
                    {selectedChart?.name as string}
                  </h3>
                  {selectedChart?.chartData != null && (
                    <div className="bg-white rounded-xl border p-4">
                      <Bodygraph chart={selectedChart.chartData as any} width={350} />
                    </div>
                  )}
                </div>

                {/* Return chart */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Badge className="bg-primary text-primary-foreground">{info.title}</Badge>
                  </h3>
                  <div className="bg-white rounded-xl border p-4">
                    <Bodygraph chart={returnData} width={350} />
                  </div>
                </div>
              </div>

              {/* Return chart details */}
              <Card className="mt-8">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {locale === "en" ? `Details: ${info.title}` : `Detaily ${info.title}`}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">{t.returnChart.details.type}</p>
                      <p className="font-semibold text-sm">{(t.types as any)[returnData.type] || returnData.type}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">{t.returnChart.details.profile}</p>
                      <p className="font-semibold text-sm">{returnData.profile}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">{t.returnChart.details.authority}</p>
                      <p className="font-semibold text-sm">{returnData.authority}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">{t.returnChart.details.definition}</p>
                      <p className="font-semibold text-sm">{(t.hd.definitionTypes as any)[returnData.definition] || returnData.definition}</p>
                    </div>
                  </div>

                  {returnData.channels?.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-semibold mb-2">{t.returnChart.activeChannels}</p>
                      <div className="flex flex-wrap gap-2">
                        {returnData.channels.map((ch: any, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {ch.gate1}-{ch.gate2}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
