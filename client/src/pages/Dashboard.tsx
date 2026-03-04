import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";
import {
  Plus, Heart, Trash2, Loader2, LayoutDashboard,
  Star, Users, Compass, BookOpen, ThumbsUp, ThumbsDown,
  Share2, ChevronDown, ChevronUp, Calendar, Sparkles,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useEffect, useState } from "react";
import { Streamdown } from "streamdown";

const typeColors: Record<string, string> = {
  Manifestor: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Generator: "bg-amber-50 text-amber-700 border-amber-200",
  "Manifesting Generator": "bg-orange-50 text-orange-700 border-orange-200",
  Projector: "bg-violet-50 text-violet-700 border-violet-200",
  Reflector: "bg-slate-100 text-slate-700 border-slate-200",
};

const categoryIcons: Record<string, typeof Users> = {
  self: Star,
  family: Heart,
  friend: Users,
  client: Compass,
  celebrity: Star,
  other: LayoutDashboard,
};

const readingTypeLabels: Record<string, string> = {
  overview: "Kompletní přehled",
  type_strategy: "Typ & Strategie",
  profile: "Profil",
  authority: "Autorita",
  incarnation_cross: "Životní poslání",
  channels: "Kanály",
  relationships: "Vztahy",
  career: "Kariéra",
  gates: "Brány",
  variables: "Proměnné",
};

export default function Dashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"charts" | "readings">("charts");
  const [expandedReading, setExpandedReading] = useState<number | null>(null);

  const chartsQuery = trpc.chart.list.useQuery(undefined, { enabled: isAuthenticated });
  const readingsQuery = trpc.ai.getAllReadings.useQuery(undefined, { enabled: isAuthenticated && activeTab === "readings" });

  const deleteMutation = trpc.chart.delete.useMutation({
    onSuccess: () => {
      utils.chart.list.invalidate();
      toast.success(t.dashboard.deleteSuccess);
    },
  });
  const favMutation = trpc.chart.toggleFavorite.useMutation({
    onSuccess: () => utils.chart.list.invalidate(),
  });
  const rateMutation = trpc.ai.rateReading.useMutation({
    onSuccess: () => utils.ai.getAllReadings.invalidate(),
  });
  const shareMutation = trpc.ai.shareReading.useMutation({
    onSuccess: (data) => {
      const url = `${window.location.origin}/shared/${data.token}`;
      navigator.clipboard.writeText(url).then(() => {
        toast.success("Odkaz na výklad zkopírován do schránky!");
      }).catch(() => {
        toast.success(`Odkaz: ${url}`);
      });
    },
    onError: () => toast.error("Nepodařilo se vytvořit odkaz"),
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [loading, isAuthenticated]);

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const charts = chartsQuery.data || [];
  const readings = readingsQuery.data || [];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 pt-24 pb-16">
        <div className="container max-w-5xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-serif text-3xl font-bold mb-1">{t.dashboard.title}</h1>
              <p className="text-muted-foreground">
                Vítejte zpět, {user?.name || "Průzkumníku"}. Máte {charts.length} uložen{charts.length === 1 ? "ou" : charts.length < 5 ? "é" : "ých"} map{charts.length === 1 ? "u" : charts.length < 5 ? "y" : ""}.
              </p>
            </div>
            <Link href="/calculate">
              <Button className="bg-primary text-primary-foreground">
                <Plus className="w-4 h-4 mr-1.5" />
                Nová mapa
              </Button>
            </Link>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 border-b border-border/40">
            <button
              onClick={() => setActiveTab("charts")}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "charts"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Compass className="w-4 h-4" />
              Moje mapy
              {charts.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                  {charts.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("readings")}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "readings"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Moje výklady
              {readings.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                  {readings.length}
                </span>
              )}
            </button>
          </div>

          {/* ─── Charts Tab ─── */}
          {activeTab === "charts" && (
            <>
              {chartsQuery.isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : charts.length === 0 ? (
                <Card className="bg-card border-border/50">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <Compass className="w-16 h-16 text-muted-foreground/30 mb-4" />
                    <h3 className="font-serif text-xl font-semibold mb-2">{t.dashboard.noCharts}</h3>
                    <p className="text-muted-foreground mb-6 text-center max-w-sm">
                      {t.dashboard.noChartsDesc}
                    </p>
                    <Link href="/calculate">
                      <Button className="bg-primary text-primary-foreground">
                        <Plus className="w-4 h-4 mr-1.5" />
                        {t.dashboard.calculateFirst}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {charts.map(chart => {
                    const data = chart.chartData as any;
                    const CategoryIcon = categoryIcons[chart.category] || LayoutDashboard;
                    const czType = data ? ((t.types as any)[data.type] || data.type) : "";
                    const czDef = data ? ((t.hd.definitionTypes as any)[data.definition] || data.definition) : "";

                    return (
                      <Card
                        key={chart.id}
                        className="bg-card border-border/50 hover:border-primary/30 transition-all group cursor-pointer"
                        onClick={() => { navigate(`/chart/${chart.id}`); window.scrollTo(0, 0); }}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <CategoryIcon className="w-4 h-4 text-muted-foreground" />
                              <CardTitle className="font-serif text-lg">{chart.name}</CardTitle>
                            </div>
                            <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => favMutation.mutate({ id: chart.id, isFavorite: !chart.isFavorite })}
                              >
                                <Heart
                                  className={`w-3.5 h-3.5 ${chart.isFavorite ? "fill-red-400 text-red-400" : "text-muted-foreground"}`}
                                />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                    <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-popover text-popover-foreground">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Smazat mapu</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {t.dashboard.deleteConfirm} "{chart.name}"?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteMutation.mutate({ id: chart.id })}>
                                      {t.common.delete}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {data && (
                            <div className="space-y-2">
                              <div className="flex flex-wrap gap-1.5">
                                <Badge className={typeColors[data.type] || "bg-primary/20 text-primary"}>
                                  {czType}
                                </Badge>
                                <Badge variant="outline" className="text-xs">{data.profile}</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {chart.birthDate} {chart.birthTime} &middot; {chart.birthPlace?.split(",")[0]}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {data.authority} &middot; {czDef}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ─── Readings Tab ─── */}
          {activeTab === "readings" && (
            <>
              {readingsQuery.isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : readings.length === 0 ? (
                <Card className="bg-card border-border/50">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <BookOpen className="w-16 h-16 text-muted-foreground/30 mb-4" />
                    <h3 className="font-serif text-xl font-semibold mb-2">Zatím žádné výklady</h3>
                    <p className="text-muted-foreground mb-6 text-center max-w-sm">
                      Vygenerujte svůj první AI výklad na stránce výsledků vaší mapy.
                    </p>
                    <Link href="/calculate">
                      <Button className="bg-primary text-primary-foreground">
                        <Plus className="w-4 h-4 mr-1.5" />
                        Vytvořit mapu
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {readings.map((reading) => {
                    const isExpanded = expandedReading === reading.id;
                    const label = readingTypeLabels[reading.readingType] || reading.readingType;
                    const preview = reading.content?.slice(0, 200) + (reading.content && reading.content.length > 200 ? "..." : "");
                    const dateStr = new Date(reading.createdAt).toLocaleDateString("cs-CZ", {
                      day: "numeric", month: "long", year: "numeric",
                    });

                    return (
                      <Card key={reading.id} className="bg-card border-border/50 hover:border-primary/20 transition-all">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                                  {label}
                                </Badge>
                                {reading.chartName && (
                                  <span
                                    className="text-xs text-primary/70 hover:text-primary cursor-pointer underline underline-offset-2"
                                    onClick={() => { navigate(`/chart/${reading.chartId}`); window.scrollTo(0, 0); }}
                                  >
                                    {reading.chartName}
                                  </span>
                                )}
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {dateStr}
                                </span>
                                {reading.rating && (
                                  <span className={`text-xs ${reading.rating === "up" ? "text-green-600" : "text-red-500"}`}>
                                    {reading.rating === "up" ? "👍" : "👎"}
                                  </span>
                                )}
                              </div>
                              {!isExpanded && (
                                <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{preview}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {/* Rate */}
                              <button
                                onClick={() => rateMutation.mutate({ readingId: reading.id, rating: reading.rating === "up" ? null : "up" })}
                                className={`p-1.5 rounded-full transition-colors ${reading.rating === "up" ? "bg-green-100 text-green-600" : "text-muted-foreground hover:text-green-600 hover:bg-green-50"}`}
                                title="Užitečný výklad"
                              >
                                <ThumbsUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => rateMutation.mutate({ readingId: reading.id, rating: reading.rating === "down" ? null : "down" })}
                                className={`p-1.5 rounded-full transition-colors ${reading.rating === "down" ? "bg-red-100 text-red-500" : "text-muted-foreground hover:text-red-500 hover:bg-red-50"}`}
                                title="Neužitečný výklad"
                              >
                                <ThumbsDown className="w-3.5 h-3.5" />
                              </button>
                              {/* Share */}
                              <button
                                onClick={() => shareMutation.mutate({ readingId: reading.id })}
                                disabled={shareMutation.isPending}
                                className="p-1.5 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                title="Sdílet výklad"
                              >
                                {shareMutation.isPending ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Share2 className="w-3.5 h-3.5" />
                                )}
                              </button>
                              {/* Expand/Collapse */}
                              <button
                                onClick={() => setExpandedReading(isExpanded ? null : reading.id)}
                                className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                                title={isExpanded ? "Sbalit" : "Rozbalit"}
                              >
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>
                        </CardHeader>
                        {isExpanded && reading.content && (
                          <CardContent className="pt-0">
                            <div className="prose prose-sm max-w-none p-4 rounded-lg bg-muted/20 border border-border/30 mt-2">
                              <Streamdown>{reading.content}</Streamdown>
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
