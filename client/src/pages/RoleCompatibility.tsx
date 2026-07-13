import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Users, Heart, Zap, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { Streamdown } from "streamdown";

const ROLE_TAGS = [
  { value: "partner",    label: "💑 Partner",       color: "bg-pink-500/20 text-pink-300 border-pink-500/30" },
  { value: "partnerka",  label: "💑 Partnerka",     color: "bg-pink-500/20 text-pink-300 border-pink-500/30" },
  { value: "manzel",     label: "💍 Manžel",        color: "bg-rose-500/20 text-rose-300 border-rose-500/30" },
  { value: "manzelka",   label: "💍 Manželka",      color: "bg-rose-500/20 text-rose-300 border-rose-500/30" },
  { value: "sef",        label: "👔 Šéf",           color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  { value: "sefova",     label: "👔 Šéfová",        color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  { value: "kolega",     label: "🤝 Kolega",        color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" },
  { value: "pritel",     label: "👫 Přítel",        color: "bg-green-500/20 text-green-300 border-green-500/30" },
  { value: "pritelkyne", label: "👫 Přítelkyně",    color: "bg-green-500/20 text-green-300 border-green-500/30" },
  { value: "rodic",      label: "👨‍👩‍👧 Rodič",          color: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  { value: "dite",       label: "🧒 Dítě",          color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" },
  { value: "sourozenec", label: "👫 Sourozenec",    color: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
  { value: "kamarad",    label: "😊 Kamarád",       color: "bg-teal-500/20 text-teal-300 border-teal-500/30" },
  { value: "klient",     label: "💼 Klient",        color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30" },
  { value: "mentor",     label: "🎓 Mentor",        color: "bg-violet-500/20 text-violet-300 border-violet-500/30" },
  { value: "jine",       label: "✨ Jiné",          color: "bg-slate-500/20 text-slate-300 border-slate-500/30" },
];

const CHANNELS: [number, number][] = [
  [1,8],[2,14],[3,60],[4,63],[5,15],[6,59],[7,31],[9,52],[10,20],[10,34],[10,57],
  [11,56],[12,22],[13,33],[16,48],[17,62],[18,58],[19,49],[20,34],[20,57],
  [21,45],[23,43],[24,61],[25,51],[26,44],[27,50],[28,38],[29,46],[30,41],
  [32,54],[34,57],[35,36],[37,40],[39,55],[42,53],[47,64],
];

function calcCompatibility(dataA: any, dataB: any) {
  const gatesA = new Set<number>(dataA?.activatedGates || []);
  const gatesB = new Set<number>(dataB?.activatedGates || []);
  const em: Array<{ gate1: number; gate2: number }> = [];
  for (const [g1, g2] of CHANNELS) {
    if (gatesA.has(g1) && gatesB.has(g2) && !gatesA.has(g2) && !gatesB.has(g1)) em.push({ gate1: g1, gate2: g2 });
    else if (gatesB.has(g1) && gatesA.has(g2) && !gatesB.has(g2) && !gatesA.has(g1)) em.push({ gate1: g1, gate2: g2 });
  }
  const emScore = Math.min(em.length * 15, 45);
  const typeScore = dataA?.type === dataB?.type ? 10 :
    (["Generator","Manifesting Generator"].includes(dataA?.type) && ["Generator","Manifesting Generator"].includes(dataB?.type)) ? 8 : 5;
  const defScore = dataA?.definition === dataB?.definition ? 10 : 5;
  return { score: Math.min(emScore + typeScore + defScore + 20, 100), electromagnetic: em };
}

export default function RoleCompatibility() {
  const { isAuthenticated, loading } = useAuth();
  const { locale, localePath } = useLanguage();
  const isCs = locale === "cs";

  const [chartIdA, setChartIdA] = useState<number | null>(null);
  const [chartIdB, setChartIdB] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [aiContent, setAiContent] = useState<string>("");
  const [showAi, setShowAi] = useState(false);

  const chartsQuery = trpc.chart.list.useQuery(undefined, { enabled: isAuthenticated });
  const charts = chartsQuery.data || [];

  const chartA = useMemo(() => charts.find((c: any) => c.id === chartIdA), [charts, chartIdA]);
  const chartB = useMemo(() => charts.find((c: any) => c.id === chartIdB), [charts, chartIdB]);

  const compat = useMemo(() => {
    if (!chartA || !chartB) return null;
    return calcCompatibility(chartA.chartData as any, chartB.chartData as any);
  }, [chartA, chartB]);

  const roleCompatMutation = trpc.composite.roleCompatibility.useMutation({
    onSuccess: (data) => {
      setAiContent(typeof data.content === 'string' ? data.content : String(data.content));
      setShowAi(true);
    },
    onError: (err) => {
      if (err.data?.code === "PAYMENT_REQUIRED") {
        toast.error(isCs ? "Tato funkce vyžaduje Premium předplatné." : "This feature requires a Premium subscription.");
      } else {
        toast.error(isCs ? "Chyba při generování analýzy." : "Error generating analysis.");
      }
    },
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  const currentRole = ROLE_TAGS.find(r => r.value === selectedRole);

  const scoreColor = !compat ? "" :
    compat.score >= 75 ? "text-emerald-400" :
    compat.score >= 50 ? "text-amber-400" : "text-rose-400";

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 pt-24 pb-20 md:pb-8">
        <div className="container max-w-4xl">
          {/* Hero */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-4">
              <Users className="w-4 h-4" />
              {isCs ? "Rolová kompatibilita" : "Role Compatibility"}
            </div>
            <h1 className="font-serif text-4xl font-bold mb-3">
              {isCs ? "Analýza vztahu podle role" : "Relationship Analysis by Role"}
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {isCs
                ? "Zjistěte, jak spolu fungujete v konkrétní roli — jako partner, šéf, kolega nebo rodič. Human Design odhalí dynamiku vašeho vztahu."
                : "Discover how you work together in a specific role — as a partner, boss, colleague, or parent. Human Design reveals your relationship dynamics."}
            </p>
          </div>

          {/* Selection Panel */}
          <Card className="bg-card border-border/50 mb-6">
            <CardHeader>
              <CardTitle className="text-lg font-serif flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary" />
                {isCs ? "Vyberte mapy a roli" : "Select charts and role"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Chart A */}
              <div>
                <label className="text-sm font-medium mb-2 block text-muted-foreground">
                  {isCs ? "Vaše mapa (Já):" : "Your chart (Me):"}
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {charts.map((c: any) => (
                    <button
                      key={c.id}
                      onClick={() => setChartIdA(c.id === chartIdA ? null : c.id)}
                      className={`text-left px-3 py-2 rounded-lg border text-sm transition-all ${
                        chartIdA === c.id
                          ? "bg-primary/20 border-primary text-primary"
                          : "bg-background/50 border-border/50 hover:border-primary/30 text-foreground"
                      }`}
                    >
                      <div className="font-medium truncate">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{(c.chartData as any)?.type}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chart B */}
              <div>
                <label className="text-sm font-medium mb-2 block text-muted-foreground">
                  {isCs ? "Mapa druhé osoby:" : "Other person's chart:"}
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {charts.filter((c: any) => c.id !== chartIdA).map((c: any) => (
                    <button
                      key={c.id}
                      onClick={() => setChartIdB(c.id === chartIdB ? null : c.id)}
                      className={`text-left px-3 py-2 rounded-lg border text-sm transition-all ${
                        chartIdB === c.id
                          ? "bg-primary/20 border-primary text-primary"
                          : "bg-background/50 border-border/50 hover:border-primary/30 text-foreground"
                      }`}
                    >
                      <div className="font-medium truncate">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{(c.chartData as any)?.type}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block text-muted-foreground">
                  {isCs ? "Role druhé osoby ve vašem životě:" : "Their role in your life:"}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {ROLE_TAGS.map(role => (
                    <button
                      key={role.value}
                      onClick={() => setSelectedRole(role.value === selectedRole ? "" : role.value)}
                      className={`text-xs px-3 py-2 rounded-lg border text-left transition-all ${
                        selectedRole === role.value
                          ? role.color + " ring-1 ring-primary/50"
                          : "bg-background/50 border-border/50 text-muted-foreground hover:border-primary/30"
                      }`}
                    >
                      {role.label}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Compatibility Score */}
          {compat && chartA && chartB && (
            <Card className="bg-card border-border/50 mb-6">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  {/* Score Ring */}
                  <div className="relative flex-shrink-0">
                    <svg width="120" height="120" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="8" className="text-border/30" />
                      <circle
                        cx="60" cy="60" r="50"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        strokeDasharray={`${(compat.score / 100) * 314} 314`}
                        strokeLinecap="round"
                        transform="rotate(-90 60 60)"
                        className={scoreColor}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-3xl font-bold ${scoreColor}`}>{compat.score}</span>
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="font-serif text-xl font-bold mb-1">
                      {chartA.name} × {chartB.name}
                    </h3>
                    {currentRole && (
                      <span className={`inline-block px-2 py-0.5 rounded text-xs border mb-2 ${currentRole.color}`}>
                        {currentRole.label}
                      </span>
                    )}
                    <p className="text-sm text-muted-foreground mb-3">
                      {isCs
                        ? `Elektromagnetická spojení: ${compat.electromagnetic.length} kanálů`
                        : `Electromagnetic connections: ${compat.electromagnetic.length} channels`}
                    </p>
                    {compat.electromagnetic.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {compat.electromagnetic.map(em => (
                          <Badge key={`${em.gate1}-${em.gate2}`} variant="outline" className="text-xs">
                            <Zap className="w-3 h-3 mr-1 text-amber-400" />
                            {em.gate1}–{em.gate2}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Generate AI Reading Button */}
          {chartIdA && chartIdB && selectedRole && (
            <div className="flex justify-center mb-6">
              <Button
                size="lg"
                className="gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white"
                onClick={() => {
                  roleCompatMutation.mutate({
                    chartIdA: chartIdA!,
                    chartIdB: chartIdB!,
                    roleTag: selectedRole,
                    locale,
                  });
                }}
                disabled={roleCompatMutation.isPending}
              >
                {roleCompatMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> {isCs ? "Generuji analýzu..." : "Generating..."}</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> {isCs ? "Generovat AI analýzu vztahu" : "Generate AI Relationship Analysis"}</>
                )}
              </Button>
            </div>
          )}

          {/* AI Reading Result */}
          {aiContent && (
            <Card className="bg-card border-border/50">
              <CardHeader>
                <button
                  className="flex items-center justify-between w-full text-left"
                  onClick={() => setShowAi(!showAi)}
                >
                  <CardTitle className="font-serif text-lg flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    {isCs ? "AI Analýza vztahu" : "AI Relationship Analysis"}
                    {currentRole && (
                      <span className={`px-2 py-0.5 rounded text-xs border ${currentRole.color}`}>
                        {currentRole.label}
                      </span>
                    )}
                  </CardTitle>
                  {showAi ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>
              </CardHeader>
              {showAi && (
                <CardContent>
                  <div className="prose prose-sm prose-invert max-w-none">
                    <Streamdown>{aiContent}</Streamdown>
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {/* Empty State */}
          {charts.length < 2 && (
            <Card className="bg-card border-border/50 text-center py-12">
              <CardContent>
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-serif text-lg font-medium mb-2">
                  {isCs ? "Potřebujete alespoň 2 uložené mapy" : "You need at least 2 saved charts"}
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {isCs
                    ? "Uložte mapy svých blízkých v kalkulátoru a pak se sem vraťte pro analýzu vztahu."
                    : "Save charts of your loved ones in the calculator, then come back here for relationship analysis."}
                </p>
                <Button variant="outline" onClick={() => window.location.href = localePath("/calculator")}>
                  {isCs ? "Přejít na kalkulátor" : "Go to Calculator"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
