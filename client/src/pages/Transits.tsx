import { useMemo, useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Bodygraph from "@/components/Bodygraph";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Star, RefreshCw, Globe, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { GATE_DESCRIPTIONS } from "@shared/hdContent";
import { motion } from "framer-motion";
import type { HumanDesignChartData } from "@shared/types";

const PLANET_SYMBOLS: Record<string, string> = {
  Sun: "☉", Earth: "⊕", Moon: "☽", "North Node": "☊", "South Node": "☋",
  Mercury: "☿", Venus: "♀", Mars: "♂", Jupiter: "♃", Saturn: "♄",
  Uranus: "♅", Neptune: "♆", Pluto: "♇",
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: "easeOut" as const },
  }),
};

export default function Transits() {
  const { t, locale, localePath } = useLanguage();

  useEffect(() => {
    if (locale === "en") {
      document.title = "🪐 Human Design Planetary Transits — Today's Active Gates 🌟";
      document.querySelector('meta[name="description"]')?.setAttribute(
        "content",
        "View current Human Design planetary transits. See which gates are active today and how they interact with your natal chart."
      );
    } else {
      document.title = "🪐 Human Design Planetární Tranzity — Aktuální Brány 🌟";
      document.querySelector('meta[name="description"]')?.setAttribute(
        "content",
        "Zobrazit aktuální Human Design planetární tranzity. Zjistěte, které brány jsou dnes aktivní a jak interagují s vaší natální mapou."
      );
    }
  }, [locale]);

    const { isAuthenticated } = useAuth();
  const [selectedChartId, setSelectedChartId] = useState<string>("none");

  const transitQuery = trpc.transit.current.useQuery(undefined, {
    refetchInterval: 60000,
  });

  const chartsQuery = trpc.chart.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const selectedChart = useMemo(() => {
    if (selectedChartId === "none" || !chartsQuery.data) return null;
    const found = chartsQuery.data.find((c: any) => c.id === parseInt(selectedChartId));
    return found ? found.chartData as HumanDesignChartData : null;
  }, [selectedChartId, chartsQuery.data]);

  const transitGateNumbers = useMemo(() => {
    if (!transitQuery.data) return [];
    return transitQuery.data.transitGates.map(tg => tg.gate);
  }, [transitQuery.data]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container">
          <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp} className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm mb-4">
              <Star className="w-4 h-4" />
              {t.transits.title}
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold mb-3">{t.transits.subtitle}</h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {t.transits.description}
            </p>
          </motion.div>

          {transitQuery.isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : transitQuery.data ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left: Bodygraph with transit overlay */}
              <motion.div initial="hidden" animate="visible" custom={1} variants={fadeUp} className="lg:col-span-1">
                <Card className="bg-card border-border/50 shadow-sm sticky top-24">
                  <CardHeader className="pb-2">
                    <CardTitle className="font-serif text-lg flex items-center gap-2">
                      <Globe className="w-5 h-5 text-cyan-600" />
                      {t.transits.transitOverlay}
                    </CardTitle>
                    <CardDescription>{t.transits.selectChart}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isAuthenticated && chartsQuery.data && chartsQuery.data.length > 0 && (
                      <Select value={selectedChartId} onValueChange={setSelectedChartId}>
                        <SelectTrigger className="mb-4">
                          <SelectValue placeholder={t.transits.selectChart} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Pouze tranzity</SelectItem>
                          {chartsQuery.data.map((c: any) => (
                            <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {selectedChart ? (
                      <Bodygraph
                        chart={selectedChart}
                        width={380}
                        height={460}
                        transitGates={transitGateNumbers}
                        interactive={false}
                      />
                    ) : (
                      <div className="flex items-center justify-center py-12">
                        <div className="text-center text-muted-foreground">
                          <Globe className="w-16 h-16 mx-auto mb-4 text-cyan-500/30" />
                          <p className="text-sm">Vyberte mapu pro zobrazení překrytí tranzitů na vašem Bodygraphu</p>
                        </div>
                      </div>
                    )}

                    {/* Legend */}
                    {selectedChart && (
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-4">
                        <span className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-full" style={{ background: "#4a3a8a", border: "1px solid #7c5fc7" }} />
                          {t.chart.personality}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-full bg-red-600" />
                          {t.chart.design}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-full" style={{ background: "#22d3ee" }} />
                          {t.chart.transit}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Right: Transit list */}
              <div className="lg:col-span-2 space-y-6">
                <motion.div initial="hidden" animate="visible" custom={2} variants={fadeUp}>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-muted-foreground">
                      {t.transits.lastUpdated}: {new Date(transitQuery.data.timestamp).toLocaleString("cs-CZ")}
                    </p>
                    <Button variant="ghost" size="sm" onClick={() => transitQuery.refetch()}>
                      <RefreshCw className="w-4 h-4 mr-1" />
                      {t.transits.refresh}
                    </Button>
                  </div>
                </motion.div>

                <div className="space-y-3">
                  {transitQuery.data.transitGates.map((tr, i) => {
                    const czPlanet = (t.hd.planets as any)[tr.planet] || tr.planet;
                    const gateDesc = GATE_DESCRIPTIONS[tr.gate];
                    return (
                      <motion.div key={i} initial="hidden" animate="visible" custom={i + 3} variants={fadeUp}>
                        <Card className="bg-card border-border/50 hover:border-cyan-500/30 transition-all hover:shadow-lg hover:shadow-cyan-500/5 group">
                          <CardContent className="py-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="text-2xl w-10 text-center group-hover:scale-110 transition-transform">{PLANET_SYMBOLS[tr.planet] || "?"}</span>
                                <div>
                                  <p className="font-medium">{czPlanet}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {tr.longitude.toFixed(2)}°
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge variant="outline" className="text-base font-mono border-cyan-500/30 text-cyan-600">
                                  Brána {tr.gate}.{tr.line}
                                </Badge>
                                {gateDesc && (
                                  <p className="text-[10px] text-muted-foreground mt-1">{gateDesc.name}</p>
                                )}
                              </div>
                            </div>
                            {gateDesc && (
                              <div className="mt-3 pt-3 border-t border-border/30">
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                  <span className="text-cyan-600 font-medium">{gateDesc.theme}</span> — {gateDesc.iChing}
                                </p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>

                <motion.div initial="hidden" animate="visible" custom={16} variants={fadeUp}>
                  <Card className="bg-card border-border/50 shadow-sm mt-4">
                    <CardHeader>
                      <CardTitle className="font-serif text-lg flex items-center gap-2">
                        <Info className="w-5 h-5 text-primary" />
                        O Tranzitech
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground space-y-3">
                      <p>
                        Tranzity představují aktuální pozice planet, jak procházejí 64 branami mandaly Human Design.
                        Tyto dočasné aktivace vytvářejí "počasí", které ovlivňuje každého jinak na základě jeho individuálního chartu.
                      </p>
                      <p>
                        Když tranzitní planeta aktivuje bránu, která doplní jednu z vašich "visících" bran do plného kanálu,
                        můžete tuto energii cítit intenzivněji. To je zvláště patrné u tranzitů Slunce a Měsíce,
                        které se mění nejčastěji.
                      </p>
                      <p>
                        Slunce mění brány přibližně každých 5,7 dne, zatímco Měsíc projde všemi 64 branami za přibližně 28,5 dne.
                        Vnější planety (Jupiter až Pluto) vytvářejí déletrvající tranzitní efekty.
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-10">Nepodařilo se načíst data tranzitů.</p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
