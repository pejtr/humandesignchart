import { useLanguage } from "@/contexts/LanguageContext";
import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Bodygraph from "@/components/Bodygraph";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import HDLoader from "@/components/HDLoader";
import { useSEO } from "@/hooks/useSEO";
import {
  ArrowLeft, Compass, Eye, Zap, Shield, Target,
  Sun, Moon, Star, Brain, Hexagon, CircleDot, Globe,
} from "lucide-react";
import type { HumanDesignChartData } from "@shared/types";

const TYPE_COLORS: Record<string, string> = {
  Manifestor: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Generator: "bg-amber-50 text-amber-700 border-amber-200",
  "Manifesting Generator": "bg-orange-50 text-orange-700 border-orange-200",
  Projector: "bg-violet-50 text-violet-700 border-violet-200",
  Reflector: "bg-slate-100 text-slate-700 border-slate-200",
};

const TYPE_CS: Record<string, string> = {
  Generator: "Generátor",
  "Manifesting Generator": "Manifestující Generátor",
  Projector: "Projektor",
  Manifestor: "Manifestor",
  Reflector: "Reflektor",
};

const DEFINITION_CS: Record<string, string> = {
  "Single Definition": "Jednoduchá definice",
  "Split Definition": "Rozdělená definice",
  "Triple Split Definition": "Trojitě rozdělená definice",
  "Quadruple Split Definition": "Čtyřnásobně rozdělená definice",
  "No Definition": "Bez definice",
};

export default function SharedChart({ token: propToken }: { token?: string } = {}) {
  const { locale, localePath } = useLanguage();
  const params = useParams<{ token: string }>();
  const [, navigate] = useLocation();

  const token = propToken || params.token || "";

  const { data, isLoading, error } = trpc.share.getShared.useQuery(
    { token },
    { enabled: !!params.token }
  );

  const chartName = data?.ownerName || "Human Design Chart";
  const chartType = data?.chartData?.type || "";

  const ogImageUrl = `${window.location.origin}/api/og/shared/${params.token}?locale=${locale}`;

  useSEO({
    title: locale === "cs"
      ? `Sdílená Human Design Mapa — ${chartName}`
      : `Shared Human Design Chart — ${chartName}`,
    description: locale === "cs"
      ? `Prohlédněte si sdílenou Human Design mapu ${chartName}. Typ: ${TYPE_CS[chartType] || chartType || ""}`
      : `View the shared Human Design chart of ${chartName}. Type: ${chartType || ""}`,
    ogImage: ogImageUrl,
    keywords: locale === "cs"
      ? "sdílená human design mapa, human design chart shared, bodygraph"
      : "shared human design chart, bodygraph, human design map",
    ogType: "website",
    noIndex: true,
  });

  if (isLoading) return <HDLoader />;

  if (!data) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="container pt-24 pb-16 text-center">
          <h1 className="font-serif text-3xl font-bold mb-4">
            {locale === "cs" ? "Sdílená mapa nenalezena" : "Shared chart not found"}
          </h1>
          <p className="text-muted-foreground mb-6">
            {locale === "cs"
              ? "Tento odkaz je neplatný nebo vypršel. Sdílené mapy jsou platné 30 dní."
              : "This link is invalid or has expired. Shared charts are valid for 30 days."}
          </p>
          <Button onClick={() => navigate(localePath("/"))}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {locale === "cs" ? "Zpět na hlavní stránku" : "Back to homepage"}
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const chart = data.chartData as HumanDesignChartData;
  const czType = TYPE_CS[chart.type] || chart.type;
  const czDefinition = DEFINITION_CS[chart.definition] || chart.definition;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="container pt-24 pb-16">
        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-sm text-muted-foreground mb-2">Sdílená Human Design mapa</p>
          <h1 className="font-serif text-3xl md:text-4xl font-bold mb-3">
            {data.ownerName || "Human Design Chart"}
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Badge className={TYPE_COLORS[chart.type] || "bg-primary/20 text-primary"}>{czType}</Badge>
            <Badge variant="outline">{chart.profile} {chart.profileName}</Badge>
            <Badge variant="outline">{czDefinition}</Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Bodygraph */}
          <div className="lg:col-span-1">
            <Card className="bg-card border-border/50 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="font-serif text-lg">Bodygraph</CardTitle>
                <CardDescription>{locale === "cs" ? "Vizuální mapa energetických center" : "Visual map of energy centers"}</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Bodygraph chart={chart} width={380} height={460} />
              </CardContent>
            </Card>
          </div>

          {/* Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview */}
            <Card className="bg-card border-border/50">
              <CardHeader>
                <CardTitle className="font-serif text-xl">{locale === "cs" ? "Přehled" : "Overview"}</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">{locale === "cs" ? "Typ" : "Type"}</p>
                  <p className="font-semibold text-sm">{czType}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">{locale === "cs" ? "Strategie" : "Strategy"}</p>
                  <p className="font-semibold text-sm">{chart.strategy}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">{locale === "cs" ? "Autorita" : "Authority"}</p>
                  <p className="font-semibold text-sm">{chart.authority}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">{locale === "cs" ? "Profil" : "Profile"}</p>
                  <p className="font-semibold text-sm">{chart.profile} {chart.profileName}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">{locale === "cs" ? "Definice" : "Definition"}</p>
                  <p className="font-semibold text-sm">{czDefinition}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">{locale === "cs" ? "Inkarnační kříž" : "Incarnation Cross"}</p>
                  <p className="font-semibold text-xs">{chart.incarnationCross?.name || "—"}</p>
                </div>
              </CardContent>
            </Card>

            {/* Defined Centers */}
            <Card className="bg-card border-border/50">
              <CardHeader>
                <CardTitle className="font-serif text-lg">{locale === "cs" ? "Definovaná centra" : "Defined Centers"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {chart.centers?.filter((c: any) => c.defined).map((c: any) => (
                    <Badge key={c.name} variant="secondary" className="py-1 px-3">
                      {c.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Active Gates */}
            <Card className="bg-card border-border/50">
              <CardHeader>
                <CardTitle className="font-serif text-lg">{locale === "cs" ? "Aktivní brány" : "Active Gates"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {chart.activatedGates?.map((g: any) => (
                    <Badge key={g.gate} variant="outline" className="text-xs py-0.5">
                      {locale === "cs" ? `Brána ${g.gate}` : `Gate ${g.gate}`}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Channels */}
            {chart.channels && chart.channels.length > 0 && (
              <Card className="bg-card border-border/50">
                <CardHeader>
                  <CardTitle className="font-serif text-lg">{locale === "cs" ? "Kanály" : "Channels"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {chart.channels.map((ch: any) => (
                      <Badge key={ch.channel} variant="secondary" className="py-1 px-3">
                        {ch.channel} — {ch.name}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* CTA */}
            <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="py-6 text-center">
                <h3 className="font-serif text-xl font-bold mb-2">
                  {locale === "cs" ? "Chcete vlastní mapu s AI výkladem?" : "Want your own chart with AI reading?"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {locale === "cs"
                    ? "Vytvořte si svou Human Design mapu zdarma a získejte personalizovaný AI rozbor."
                    : "Create your Human Design chart for free and get a personalized AI reading."}
                </p>
                <Button onClick={() => navigate(localePath("/calculate"))} className="bg-primary text-primary-foreground">
                  <Compass className="w-4 h-4 mr-2" />
                  {locale === "cs" ? "Vytvořit moji mapu zdarma" : "Create my free chart"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
