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
  Star, Users, Compass,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useEffect } from "react";

const typeColors: Record<string, string> = {
  Manifestor: "bg-red-500/20 text-red-300 border-red-500/30",
  Generator: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  "Manifesting Generator": "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  Projector: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  Reflector: "bg-green-500/20 text-green-300 border-green-500/30",
};

const categoryIcons: Record<string, typeof Users> = {
  self: Star,
  family: Heart,
  friend: Users,
  client: Compass,
  celebrity: Star,
  other: LayoutDashboard,
};

export default function Dashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const { t } = useTranslation();

  const chartsQuery = trpc.chart.list.useQuery(undefined, { enabled: isAuthenticated });
  const deleteMutation = trpc.chart.delete.useMutation({
    onSuccess: () => {
      utils.chart.list.invalidate();
      toast.success(t.dashboard.deleteSuccess);
    },
  });
  const favMutation = trpc.chart.toggleFavorite.useMutation({
    onSuccess: () => utils.chart.list.invalidate(),
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
                Vítejte zpět, {user?.name || "Průzkumníku"}. Máte {charts.length} uložen{charts.length === 1 ? "ý" : charts.length < 5 ? "é" : "ých"} chart{charts.length === 1 ? "" : charts.length < 5 ? "y" : "ů"}.
              </p>
            </div>
            <Link href="/calculate">
              <Button className="bg-primary text-primary-foreground">
                <Plus className="w-4 h-4 mr-1.5" />
                Nový Chart
              </Button>
            </Link>
          </div>

          {/* Charts Grid */}
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
                    onClick={() => navigate(`/chart/${chart.id}`)}
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
                                <AlertDialogTitle>Smazat Chart</AlertDialogTitle>
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
        </div>
      </main>

      <Footer />
    </div>
  );
}
