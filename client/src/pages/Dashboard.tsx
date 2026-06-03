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
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Plus, Heart, Trash2, Loader2, LayoutDashboard,
  Star, Users, Compass, BookOpen, ThumbsUp, ThumbsDown,
  Share2, ChevronDown, ChevronUp, Calendar, Sparkles, Sun, Zap, CreditCard, Crown,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useEffect, useState, useMemo, useRef } from "react";
import { Streamdown } from "streamdown";
import ReferralWidget from "@/components/ReferralWidget";
import { StreakWidget } from "@/components/StreakWidget";
import { AffiliateWidget } from "@/components/AffiliateWidget";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Tag } from "lucide-react";

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
] as const;

type RoleTagValue = typeof ROLE_TAGS[number]["value"];

const readingTypeLabelsCS: Record<string, string> = {
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
const readingTypeLabelsEN: Record<string, string> = {
  overview: "Complete Overview",
  type_strategy: "Type & Strategy",
  profile: "Profile",
  authority: "Authority",
  incarnation_cross: "Life Purpose",
  channels: "Channels",
  relationships: "Relationships",
  career: "Career",
  gates: "Gates",
  variables: "Variables",
};

export default function Dashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const { t, localePath, locale } = useLanguage();
  const readingTypeLabels = locale === 'en' ? readingTypeLabelsEN : readingTypeLabelsCS;
  const [activeTab, setActiveTab] = useState<"charts" | "readings" | "transit" | "subscription">("charts");
  const [expandedReading, setExpandedReading] = useState<number | null>(null);
  const [roleTagOpen, setRoleTagOpen] = useState<number | null>(null);

  const chartsQuery = trpc.chart.list.useQuery(undefined, { enabled: isAuthenticated });
  const readingsQuery = trpc.ai.getAllReadings.useQuery(undefined, { enabled: isAuthenticated && activeTab === "readings" });
  const subQuery = trpc.subscription.status.useQuery(undefined, { enabled: isAuthenticated });

  const deleteMutation = trpc.chart.delete.useMutation({
    onSuccess: () => {
      utils.chart.list.invalidate();
      toast.success(t.dashboard.deleteSuccess);
    },
  });
  const favMutation = trpc.chart.toggleFavorite.useMutation({
    onSuccess: () => utils.chart.list.invalidate(),
  });
  const updateMutation = trpc.chart.update.useMutation({
    onMutate: async (vars) => {
      await utils.chart.list.cancel();
      const prev = utils.chart.list.getData();
      utils.chart.list.setData(undefined, old =>
        old?.map(c => c.id === vars.id ? { ...c, roleTag: vars.roleTag ?? c.roleTag } : c)
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) utils.chart.list.setData(undefined, ctx.prev);
    },
    onSettled: () => utils.chart.list.invalidate(),
  });
  const rateMutation = trpc.ai.rateReading.useMutation({
    onSuccess: () => utils.ai.getAllReadings.invalidate(),
  });
  const shareMutation = trpc.ai.shareReading.useMutation({
    onSuccess: (data) => {
      const url = `${window.location.origin}/shared/${data.token}`;
      navigator.clipboard.writeText(url).then(() => {
        toast.success(locale === 'en' ? 'Reading link copied to clipboard!' : 'Odkaz na výklad zkopírován do schránky!');
      }).catch(() => {
        toast.success(`Link: ${url}`);
      });
    },
    onError: () => toast.error(locale === 'en' ? 'Failed to create link' : 'Nepodařilo se vytvořit odkaz'),
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

      {/* Stripe Sandbox Activation Notice — owner only */}
      {subQuery.data?.isOwner && (
        <div className="fixed top-16 left-0 right-0 z-40 bg-amber-500/95 text-amber-950 text-sm py-2 px-4 flex items-center justify-center gap-3 shadow-lg">
          <span className="text-base">⚠️</span>
          <span className="font-medium">
            {locale === 'cs' ? 'Stripe sandbox není aktivní — ' : 'Stripe sandbox not activated — '}
          </span>
          <a
            href="https://dashboard.stripe.com/claim_sandbox/YWNjdF8xVDZZZVhFbWhjTnpzNmpZLDE3NzM1ODQ5MTEv100cqpryh6Z"
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-bold hover:text-amber-900"
          >
            {locale === 'cs' ? 'Aktivovat testovací prostředí →' : 'Activate test environment →'}
          </a>
          <span className="text-xs opacity-70">
            {locale === 'cs' ? '(platnost do 7. 5. 2026)' : '(expires May 7, 2026)'}
          </span>
        </div>
      )}

      <main className="flex-1 pt-24 pb-16">
        <div className="container max-w-5xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-serif text-3xl font-bold mb-1">{t.dashboard.title}</h1>
              <p className="text-muted-foreground">
                {locale === 'en'
                  ? `Welcome back, ${user?.name || 'Explorer'}. You have ${charts.length} saved chart${charts.length !== 1 ? 's' : ''}.`
                  : `Vítejte zpět, ${user?.name || 'Průzkumníku'}. Máte ${charts.length} uložen${charts.length === 1 ? 'ou' : charts.length < 5 ? 'é' : 'ých'} map${charts.length === 1 ? 'u' : charts.length < 5 ? 'y' : ''}.`
                }
              </p>
            </div>
            <Link href={localePath("/calculate")}>
              <Button className="bg-primary text-primary-foreground">
                <Plus className="w-4 h-4 mr-1.5" />
                {locale === 'en' ? 'New Chart' : 'Nová mapa'}
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
              {locale === 'en' ? 'My Charts' : 'Moje mapy'}
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
              {locale === 'en' ? 'My Readings' : 'Moje výklady'}
              {readings.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                  {readings.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("transit")}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "transit"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sun className="w-4 h-4" />
              {locale === 'en' ? 'Daily Transit' : 'Denní tranzit'}
            </button>
            <button
              onClick={() => setActiveTab("subscription")}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "subscription"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <CreditCard className="w-4 h-4" />
              {locale === 'en' ? 'Subscription' : 'Předplatné'}
              {subQuery.data?.isPremium && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-xs font-semibold">
                  <Crown className="w-3 h-3 inline" />
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
                    <Link href={localePath("/calculate")}>
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
                    const currentRole = ROLE_TAGS.find(r => r.value === (chart as any).roleTag);
                    const isNotSelf = chart.category !== "self";

                    return (
                      <Card
                        key={chart.id}
                        className="bg-card border-border/50 hover:border-primary/30 transition-all group cursor-pointer"
                        onClick={() => { navigate(localePath(`/chart/${chart.id}`)); window.scrollTo(0, 0); }}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <CategoryIcon className="w-4 h-4 text-muted-foreground" />
                              <CardTitle className="font-serif text-lg">{chart.name}</CardTitle>
                            </div>
                            <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                              {/* Role Tag Popover — only for non-self charts */}
                              {isNotSelf && (
                                <Popover open={roleTagOpen === chart.id} onOpenChange={open => setRoleTagOpen(open ? chart.id : null)}>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 px-1.5 text-xs gap-1"
                                      title={locale === 'en' ? 'Set role tag' : 'Nastavit roli'}
                                    >
                                      {currentRole ? (
                                        <span className={`px-1.5 py-0.5 rounded text-xs border ${currentRole.color}`}>
                                          {currentRole.label}
                                        </span>
                                      ) : (
                                        <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                                      )}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-52 p-2 bg-popover border-border" align="end">
                                    <p className="text-xs text-muted-foreground mb-2 font-medium">
                                      {locale === 'en' ? 'Relationship role:' : 'Role ve vztahu:'}
                                    </p>
                                    <div className="grid grid-cols-2 gap-1">
                                      {ROLE_TAGS.map(role => (
                                        <button
                                          key={role.value}
                                          className={`text-xs px-2 py-1 rounded border text-left transition-all hover:opacity-80 ${
                                            (chart as any).roleTag === role.value
                                              ? role.color + " ring-1 ring-primary/50"
                                              : "bg-background/50 border-border/50 text-muted-foreground hover:border-primary/30"
                                          }`}
                                          onClick={() => {
                                            updateMutation.mutate({ id: chart.id, roleTag: role.value as RoleTagValue });
                                            setRoleTagOpen(null);
                                            toast.success(locale === 'en' ? `Role set: ${role.label}` : `Role nastavena: ${role.label}`);
                                          }}
                                        >
                                          {role.label}
                                        </button>
                                      ))}
                                      {(chart as any).roleTag && (
                                        <button
                                          className="col-span-2 text-xs px-2 py-1 rounded border border-border/50 text-muted-foreground hover:border-destructive/30 hover:text-destructive transition-all mt-1"
                                          onClick={() => {
                                            updateMutation.mutate({ id: chart.id, roleTag: null });
                                            setRoleTagOpen(null);
                                          }}
                                        >
                                          {locale === 'en' ? '✕ Remove role' : '✕ Odebrat roli'}
                                        </button>
                                      )}
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              )}
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
                                    <AlertDialogTitle>{locale === 'en' ? 'Delete Chart' : 'Smazat mapu'}</AlertDialogTitle>
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
                                {currentRole && (
                                  <span className={`px-1.5 py-0.5 rounded text-xs border ${currentRole.color}`}>
                                    {currentRole.label}
                                  </span>
                                )}
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
                    <h3 className="font-serif text-xl font-semibold mb-2">{locale === 'en' ? 'No readings yet' : 'Zatím žádné výklady'}</h3>
                    <p className="text-muted-foreground mb-6 text-center max-w-sm">
                      {locale === 'en' ? 'Generate your first AI reading on your chart result page.' : 'Vygenerujte svůj první AI výklad na stránce výsledků vaší mapy.'}
                    </p>
                    <Link href={localePath("/calculate")}>
                      <Button className="bg-primary text-primary-foreground">
                        <Plus className="w-4 h-4 mr-1.5" />
                        {locale === 'en' ? 'Create Chart' : 'Vytvořit mapu'}
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
                    const dateStr = new Date(reading.createdAt).toLocaleDateString(locale === 'en' ? 'en-US' : 'cs-CZ', {
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
                                    onClick={() => { navigate(localePath(`/chart/${reading.chartId}`)); window.scrollTo(0, 0); }}
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
                                title={locale === 'en' ? 'Helpful reading' : 'Užitečný výklad'}
                              >
                                <ThumbsUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => rateMutation.mutate({ readingId: reading.id, rating: reading.rating === "down" ? null : "down" })}
                                className={`p-1.5 rounded-full transition-colors ${reading.rating === "down" ? "bg-red-100 text-red-500" : "text-muted-foreground hover:text-red-500 hover:bg-red-50"}`}
                                title={locale === 'en' ? 'Not helpful' : 'Neužitečný výklad'}
                              >
                                <ThumbsDown className="w-3.5 h-3.5" />
                              </button>
                              {/* Share */}
                              <button
                                onClick={() => shareMutation.mutate({ readingId: reading.id })}
                                disabled={shareMutation.isPending}
                                className="p-1.5 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                title={locale === 'en' ? 'Share reading' : 'Sdílet výklad'}
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
                                title={isExpanded ? (locale === 'en' ? 'Collapse' : 'Sbalit') : (locale === 'en' ? 'Expand' : 'Rozbalit')}
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

           {/* ─── Transit Tab ─── */}
          {activeTab === "transit" && (
            <DailyTransitWidget charts={charts} />
          )}
          {/* ─── Subscription Tab ─── */}
          {activeTab === "subscription" && (
            <div className="space-y-6">
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Crown className="w-4 h-4 text-primary" />
                    {locale === 'en' ? 'Your Plan' : 'Váš plán'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {subQuery.isLoading ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">{locale === 'en' ? 'Loading...' : 'Načítám...'}</span>
                    </div>
                  ) : subQuery.data?.isPremium ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-primary/10 border border-purple-500/20">
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                          <Crown className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">
                            Premium — {subQuery.data.plan === 'annual' ? (locale === 'en' ? 'Annual' : 'Roční') : (locale === 'en' ? 'Monthly' : 'Měsíční')}
                          </p>
                          {subQuery.data.currentPeriodEnd && (
                            <p className="text-xs text-muted-foreground">
                              {locale === 'en' ? 'Renews' : 'Obnoví se'}: {new Date(subQuery.data.currentPeriodEnd).toLocaleDateString(locale === 'en' ? 'en-US' : 'cs-CZ')}
                            </p>
                          )}
                        </div>
                        <Badge className="ml-auto bg-purple-500/20 text-purple-400 border-purple-500/30">
                          {locale === 'en' ? 'Active' : 'Aktivní'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="p-3 rounded-lg bg-muted/50">
                          <p className="text-muted-foreground text-xs mb-1">{locale === 'en' ? 'AI Readings' : 'AI Výklady'}</p>
                          <p className="font-semibold">{locale === 'en' ? 'Unlimited ∞' : 'Neomezené ∞'}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/50">
                          <p className="text-muted-foreground text-xs mb-1">{locale === 'en' ? 'PDF Reports' : 'PDF Reporty'}</p>
                          <p className="font-semibold">{locale === 'en' ? 'Included ✓' : 'Zahrnuto ✓'}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/40 border border-border/50">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <Zap className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{locale === 'en' ? 'Free Plan' : 'Bezplatný plán'}</p>
                          <p className="text-xs text-muted-foreground">
                            {locale === 'en'
                              ? `${subQuery.data?.totalReadings ?? 0} / 5 free AI readings used`
                              : `${subQuery.data?.totalReadings ?? 0} / 5 bezplatných AI výkladů využito`}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {locale === 'en'
                          ? 'Upgrade to Premium for unlimited AI readings, PDF reports, and all advanced tools.'
                          : 'Upgradujte na Premium pro neomezené AI výklady, PDF reporty a všechny pokročilé nástroje.'}
                      </p>
                      <Link href={localePath("/pricing")}>
                        <Button className="bg-primary text-primary-foreground w-full">
                          <Crown className="w-4 h-4 mr-2" />
                          {locale === 'en' ? 'Upgrade to Premium — from 83 CZK/month' : 'Upgradovat na Premium — od 83 Kč/měsíc'}
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
              <div className="text-center">
                <Link href={localePath("/pricing")}>
                  <Button variant="outline" size="sm">
                    <CreditCard className="w-4 h-4 mr-2" />
                    {locale === 'en' ? 'View all plans & gift vouchers' : 'Zobrazit všechny plány a dárkové poukazy'}
                  </Button>
                </Link>
              </div>

              {/* Gamification: Streak & Daily Reward */}
              <StreakWidget />

              {/* Referral Widget */}
              <ReferralWidget />

              {/* Affiliate Widget */}
              <AffiliateWidget />
              </div>
          )}

        </div>
      </main>
      <Footer />
    </div>
  );
}
// ─── DailyTransitWidget (inline in Dashboard) ────────────────────────────────
function DailyTransitWidget({ charts }: { charts: Array<{ id: number; name: string }> }) {
  const { localePath, locale } = useLanguage();
  const [selectedChartId, setSelectedChartId] = useState<number | null>(null);
  const effectiveChartId = selectedChartId ?? (charts[0]?.id ?? null);

  const stableInput = useMemo(
    () => (effectiveChartId ? { chartId: effectiveChartId, locale } : undefined),
    [effectiveChartId, locale]
  );

  const transitQuery = trpc.transit.personalized.useQuery(
    stableInput!,
    { enabled: !!effectiveChartId }
  );

  const transit = transitQuery.data;

  const PLANET_SYMBOLS: Record<string, string> = {
    Sun: "☉", Moon: "☽", Mercury: "☿", Venus: "♀", Mars: "♂",
    Jupiter: "♃", Saturn: "♄", Uranus: "⛢", Neptune: "♆", Pluto: "♇",
    "North Node": "☊", "South Node": "☋",
  };

  const PLANET_COLORS: Record<string, string> = {
    Sun: "text-amber-500", Moon: "text-slate-400", Mercury: "text-cyan-500",
    Venus: "text-pink-400", Mars: "text-red-500", Jupiter: "text-orange-400",
    Saturn: "text-stone-500", Uranus: "text-teal-400", Neptune: "text-indigo-400",
    Pluto: "text-purple-500", "North Node": "text-emerald-500", "South Node": "text-rose-400",
  };

  if (charts.length === 0) {
    return (
      <div className="text-center py-16">
        <Sun className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground mb-4">{locale === 'en' ? 'You have no saved chart to calculate transit.' : 'Nemáte žádnou uloženou mapu pro výpočet tranzitu.'}</p>
        <Link href={localePath("/calculate")}>
          <Button className="bg-primary text-primary-foreground">{locale === 'en' ? 'Create Chart' : 'Vytvořit mapu'}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Chart selector */}
      {charts.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {charts.map(chart => (
            <button
              key={chart.id}
              onClick={() => setSelectedChartId(chart.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                effectiveChartId === chart.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              {chart.name}
            </button>
          ))}
        </div>
      )}

      {/* Loading */}
      {transitQuery.isLoading && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <Sun className="w-5 h-5 text-amber-500 absolute inset-0 m-auto" />
          </div>
          <p className="text-muted-foreground text-sm">Počítám dnešní planetární pozice…</p>
        </div>
      )}

      {/* Error */}
      {transitQuery.isError && (
        <div className="text-center py-10">
          <p className="text-destructive mb-3">Nepodařilo se načíst tranzit.</p>
          <Button variant="outline" onClick={() => transitQuery.refetch()}>Zkusit znovu</Button>
        </div>
      )}

      {/* Transit content */}
      {transit && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: key highlights */}
          <div className="lg:col-span-1 space-y-4">
            {/* Activated channels */}
            {transit.activatedChannels.length > 0 && (
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    {locale === 'en' ? 'Activated Channels Today' : 'Aktivované dráhy dnes'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-1.5">
                  {transit.activatedChannels.map((ch, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs border-primary/40 text-primary">
                        {ch.gate1}–{ch.gate2}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Reinforced gates */}
            {transit.reinforcedGates.length > 0 && (
              <Card className="border-amber-200 bg-amber-50/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500" />
                    {locale === 'en' ? 'Reinforced Natal Gates' : 'Zesílené natální brány'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-1.5">
                  {transit.reinforcedGates.map((g, i) => (
                    <Badge key={i} variant="outline" className="font-mono text-xs border-amber-300 text-amber-700">
                      {PLANET_SYMBOLS[g.planet]} {locale === 'en' ? 'Gate' : 'Brána'} {g.gate}
                    </Badge>
                  ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Planet positions summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sun className="w-4 h-4 text-amber-500" />
                  {locale === 'en' ? 'Planetary Positions' : 'Planetární pozice'}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1.5">
                  {transit.transitGates.slice(0, 6).map((t, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className={`text-sm ${PLANET_COLORS[t.planet] || ""}`}>
                        {PLANET_SYMBOLS[t.planet]} {t.planet}
                      </span>
                      <Badge variant="outline" className="font-mono text-xs">{locale === 'en' ? 'Gate' : 'Brána'} {t.gate}.{t.line}</Badge>
                    </div>
                  ))}
                </div>
                <Link href={localePath("/daily-transit")}>
                  <Button variant="outline" size="sm" className="w-full mt-3 text-xs">
                    {locale === 'en' ? 'View all' : 'Zobrazit vše'}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Right: AI interpretation */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader className="pb-3 border-b border-border/40">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Sparkles className="w-4 h-4 text-primary" />
                    {locale === 'en' ? 'Personalized Reading for Today' : 'Personalizovaný výklad pro dnes'}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{transit.chartType}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(transit.timestamp).toLocaleTimeString(locale === 'en' ? 'en-US' : 'cs-CZ', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="prose prose-sm max-w-none text-foreground/90 leading-relaxed">
                  <Streamdown>{transit.interpretation}</Streamdown>
                </div>
                <div className="mt-4 pt-3 border-t border-border/30">
                  <Link href={localePath("/daily-transit")}>
                    <Button variant="outline" size="sm" className="text-xs">
                      <Sun className="w-3.5 h-3.5 mr-1.5" />
                      {locale === 'en' ? 'Open full transit overview' : 'Otevřít plný přehled tranzitu'}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
