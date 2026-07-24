import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Compass, Loader2, MapPin, Calendar, Clock, Info, User, Heart, Users, Briefcase, Baby, Star, UserCheck, HelpCircle, Lock, Code2, Copy, Check, Globe, Palette, Sparkles } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSEO, OG_IMAGES } from "@/hooks/useSEO";
import { useMetaPixel } from "@/hooks/useMetaPixel";

export default function ChartCalculator({ seoType }: { seoType?: "kalkulacka" | "test" | "typy" }) {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const { t, localePath, locale } = useLanguage();
  const isEn = locale === "en";
  const meta = useMetaPixel();

  useSEO(isEn ? {
    title: "✨ Free Human Design Chart Calculator 🔮",
    description: "Calculate your free Human Design bodygraph chart. Enter your birth date, time and place to discover your type, strategy, authority and profile. Available in English, Czech, Russian, Ukrainian, German & Hungarian.",
    ogImage: OG_IMAGES.calculator,
    keywords: "human design calculator, bodygraph calculator, free human design chart, human design birth chart, human design berechnen kostenlos, human design analyse kostenlos, хьюман дизайн рассчитать, дизайн человека бесплатно, дизайн людини розрахувати, human design elemzés",
    locale: "en_US",
  } : {
    title: seoType === "kalkulacka" ? "✨ Human Design Kalkulačka Zdarma 🔮" :
      seoType === "test" ? "✨ Human Design Test Osobnosti Zdarma 🔮" :
        seoType === "typy" ? "✨ Human Design Typy - Zjistěte ten svůj 🔮" :
          "✨ Kalkulačka Human Design mapy zdarma 🔮",
    description: seoType === "test" ? "Udělejte si přesný Human Design test osobnosti. Zadejte své údaje a zjistěte svůj typ, strategii a profil." :
      seoType === "typy" ? "Poznejte všechny Human Design typy – Generátor, Projektor, Manifestor, Reflektor. Jaký typ jste vy?" :
        "Vypočítejte svou Human Design mapu zdarma přes naši kalkulačku. Zadejte datum, čas a místo narození a zjistěte svůj typ, strategii, autoritu a profil.",
    ogImage: OG_IMAGES.calculator,
    keywords: "human design kalkulačka, human design test, human design typy, bodygraph, free human design chart",
    locale: "cs_CZ",
  });

  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [timezone, setTimezone] = useState("");
  const [timezoneOffset, setTimezoneOffset] = useState(0);
  const [locationResolved, setLocationResolved] = useState(false);
  const [category, setCategory] = useState<string>("self");

  const [embedCopied, setEmbedCopied] = useState(false);
  const handleCopyEmbed = () => {
    const domain = isEn ? "https://www.humandesignchart.app" : "https://www.humandesignmapa.cz";
    const brandName = isEn ? "Human Design Chart" : "Human Design Mapa";
    const code = `<iframe src="${domain}/embed/calculator" width="100%" height="600" frameborder="0"></iframe>\n<p style="text-align:center;font-size:12px;">Powered by <a href="${domain}">${brandName}</a></p>`;
    navigator.clipboard.writeText(code).then(() => {
      setEmbedCopied(true);
      toast.success(isEn ? "Embed code copied!" : "Kód byl zkopírován!");
      setTimeout(() => setEmbedCopied(false), 2000);
    });
  };

  const RELATIONSHIP_OPTIONS = [
    { value: "self", labelCs: "Já", labelEn: "Myself", icon: User },
    { value: "friend", labelCs: "Partner", labelEn: "Partner", icon: Heart },
    { value: "family", labelCs: "Rodič", labelEn: "Parent", icon: Users },
    { value: "client", labelCs: "Šéf / práce", labelEn: "Boss / Work", icon: Briefcase },
    { value: "other", labelCs: "Potomek", labelEn: "Child", icon: Baby },
    { value: "celebrity", labelCs: "Kamarád", labelEn: "Friend", icon: Star },
  ];

  // Track ViewContent on page mount (the main funnel entry — key for retargeting)
  useEffect(() => {
    const pageType = seoType ?? "calculator";
    meta.viewContent({
      content_name: "Human Design Chart Calculator",
      content_category: pageType === "test" ? "personality_test" : pageType === "typy" ? "types" : "calculator",
      content_ids: [pageType],
    });
  }, [seoType]);

  const calculateMutation = trpc.chart.calculate.useMutation({
    onSuccess: (data) => {
      sessionStorage.setItem("chartResult", JSON.stringify(data));
      sessionStorage.setItem("chartMeta", JSON.stringify({
        name, birthDate, birthTime, birthPlace, latitude, longitude, timezone, category,
      }));
      navigate(localePath("/chart/new"));
    },
    onError: (err) => {
      toast.error(t.common?.error ? `${t.common.error}: ${err.message}` : `Calculation failed: ${err.message}`);
    },
  });

  const handlePlaceSearch = async () => {
    if (!birthPlace.trim()) return;
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(birthPlace)}&limit=1`
      );
      const results = await response.json();
      if (results && results.length > 0) {
        const result = results[0];
        setLatitude(result.lat);
        setLongitude(result.lon);
        setBirthPlace(result.display_name);
        const tzOffset = Math.round(parseFloat(result.lon) / 15);
        setTimezoneOffset(tzOffset);
        setTimezone(`UTC${tzOffset >= 0 ? "+" : ""}${tzOffset}`);
        setLocationResolved(true);
        toast.success(t.calculator.locationFound);
      } else {
        toast.error(t.calculator.locationNotFound);
      }
    } catch {
      toast.error(t.calculator.locationSearchFailed);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !birthDate || !birthTime || !locationResolved) {
      toast.error(isEn ? "Please fill in all fields and search for a location." : "Vyplňte prosím všechna pole a vyhledejte lokaci.");
      return;
    }

    // If not authenticated, track registration intent before redirect to login
    if (!isAuthenticated) {
      meta.completeRegistration({
        content_name: "Chart Calculation Started",
        status: true,
      });
    }

    calculateMutation.mutate({
      name,
      birthDate,
      birthTime,
      birthPlace,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      timezoneOffset,
      timezone,
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground relative overflow-hidden">
      {/* Mystical Background Decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Large faint logo icon in the background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] dark:opacity-[0.05] animate-slow-spin">
          <svg viewBox="0 0 24 24" className="w-[800px] h-[800px] text-primary" fill="none" stroke="currentColor" strokeWidth="0.5">
            <circle cx="12" cy="4" r="2" />
            <circle cx="12" cy="12" r="2.5" />
            <circle cx="12" cy="20" r="2" />
            <circle cx="6" cy="8" r="1.5" />
            <circle cx="18" cy="8" r="1.5" />
            <line x1="12" y1="6" x2="12" y2="9.5" />
            <line x1="12" y1="14.5" x2="12" y2="18" />
            <line x1="7.2" y1="7" x2="10" y2="10.5" />
            <line x1="16.8" y1="7" x2="14" y2="10.5" />
          </svg>
        </div>
        {/* Floating glow spots */}
        <div className="absolute top-[20%] left-[10%] w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-[20%] right-[10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <Navbar />

      <main className="flex-1 pt-24 pb-16">
        <div className="container max-w-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm mb-4">
              <Compass className="w-4 h-4" />
              {t.nav.calculateChart}
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold mb-3">
              {seoType === "kalkulacka" && isEn === false ? "Human Design Kalkulačka Zdarma" :
                seoType === "test" && isEn === false ? "Human Design Test Osobnosti Zdarma" :
                  seoType === "typy" && isEn === false ? "Human Design Typy (Vypočítejte svůj typ)" :
                    t.calculator.title}
            </h1>
            <p className="text-muted-foreground">
              {seoType === "kalkulacka" && isEn === false ? "Využijte nejkomplexnější přesnou Human Design kalkulačku v češtině. Zjistěte ihned, jak byla vaše energetická mapa poskládána v momentě narození." :
                seoType === "test" && isEn === false ? "Na rozdíl od jiných psychologických testů vychází Human design test z přesného výpočtu hvězd a vaší DNA v čase zrození. Udělejte si svůj test zdarma." :
                  seoType === "typy" && isEn === false ? "Generátor, Projektor, Manifestor nebo Reflektor? Použijte náš výpočet a objevte svůj přesný typ a strategii pro lepší život." :
                    t.calculator.description}
            </p>
          </div>

          <Card className="bg-card border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="font-serif text-xl text-foreground">{t.calculator.birthDataTitle}</CardTitle>
              <CardDescription>
                {t.calculator.birthTimeNote}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">{t.calculator.name}</Label>
                  <Input
                    id="name"
                    placeholder={t.calculator.namePlaceholder}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                {/* Birth Date & Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="birthDate" className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      {t.calculator.birthDate}
                    </Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="birthTime" className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      {t.calculator.birthTime}
                    </Label>
                    <Input
                      id="birthTime"
                      type="time"
                      value={birthTime}
                      onChange={(e) => setBirthTime(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Relationship Category */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium">
                      {isEn ? "Who is this chart for?" : "Pro koho generuješ mapu?"}
                    </Label>
                    {!isAuthenticated && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground cursor-help">
                            <Lock className="w-3 h-3" />
                            {isEn ? "Login to save" : "Přihlaste se pro uložení"}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p className="text-xs">{isEn ? "Log in to save charts to your collection" : "Přihlaste se a ukládejte mapy do své sbírky"}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  <div className={`grid grid-cols-3 gap-2 ${!isAuthenticated ? 'opacity-40 pointer-events-none select-none' : ''}`}>
                    {RELATIONSHIP_OPTIONS.map((opt) => {
                      const Icon = opt.icon;
                      const label = isEn ? opt.labelEn : opt.labelCs;
                      const active = category === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          disabled={!isAuthenticated}
                          onClick={() => setCategory(opt.value)}
                          className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-xs font-medium transition-all duration-150 ${active
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
                            }`}
                        >
                          <Icon className="w-4 h-4" />
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Birth Place */}
                <div className="space-y-2">
                  <Label htmlFor="birthPlace" className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    {t.calculator.birthPlace}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="birthPlace"
                      placeholder={t.calculator.birthPlacePlaceholder}
                      value={birthPlace}
                      onChange={(e) => {
                        setBirthPlace(e.target.value);
                        setLocationResolved(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handlePlaceSearch();
                        }
                      }}
                      required
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handlePlaceSearch}
                      disabled={!birthPlace.trim()}
                    >
                      <MapPin className="w-4 h-4 mr-1" />
                      {t.calculator.findLocation}
                    </Button>
                  </div>
                  {locationResolved && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <Info className="w-3.5 h-3.5" />
                      {t.calculator.coordinates}: {latitude}, {longitude} ({timezone})
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={calculateMutation.isPending || !locationResolved}
                >
                  {calculateMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {t.calculator.calculating}
                    </>
                  ) : !locationResolved ? (
                    <>
                      <MapPin className="w-5 h-5 mr-2" />
                      {isEn ? 'First click "Find" for Birth Place' : 'Nejprve klikněte na "Najít" u Místa narození'}
                    </>
                  ) : (
                    <>
                      <Compass className="w-5 h-5 mr-2" />
                      {t.calculator.calculate}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
          <div className="mt-12 mb-8">
            <div className="rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50 via-white to-indigo-50 shadow-sm overflow-hidden">
              <div className="p-6 md:p-8">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-slate-900">
                      {isEn ? "Embed Free Calculator on Your Site" : "Vložte si kalkulačku zdarma na web"}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {isEn ? "No registration required" : "Bez registrace"}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mb-6 max-w-lg">
                  {isEn
                    ? "Astrologers, coaches, and bloggers — engage your audience with a professional Human Design calculator. Just paste the code:"
                    : "Astrologové, koučové a blogeři — zaujměte své návštěvníky profesionální Human Design kalkulačkou. Stačí vložit kód:"}
                </p>

                <div className="grid md:grid-cols-2 gap-6 items-start">
                  <div className="relative order-2 md:order-1">
                    <div className="relative rounded-xl border border-slate-200 bg-white shadow-md overflow-hidden">
                      <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 border-b border-slate-200">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                        <span className="ml-2 text-[10px] text-slate-400 font-mono truncate">vase-web.cz</span>
                      </div>
                      <div className="p-4 bg-gradient-to-b from-purple-50 to-slate-50 min-h-[180px] flex flex-col items-center justify-center text-center">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center mb-3">
                          <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <p className="text-sm font-bold text-slate-800 mb-1">Human Design Mapa</p>
                        <p className="text-xs text-slate-500 mb-3">{isEn ? "Generate your chart for free" : "Vygenerujte si mapu zdarma"}</p>
                        <div className="w-full max-w-[200px] space-y-2">
                          <div className="h-7 rounded-lg bg-white border border-slate-200 shadow-sm" />
                          <div className="flex gap-2">
                            <div className="h-7 flex-1 rounded-lg bg-white border border-slate-200 shadow-sm" />
                            <div className="h-7 flex-1 rounded-lg bg-white border border-slate-200 shadow-sm" />
                          </div>
                          <div className="h-8 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 shadow-sm" />
                        </div>
                      </div>
                    </div>
                    <p className="text-center text-[10px] text-slate-400 mt-2 italic">
                      {isEn ? "Preview of the embedded widget" : "Náhled vloženého widgetu"}
                    </p>
                  </div>

                  <div className="order-1 md:order-2 space-y-3">
                    <div className="relative">
                      <pre className="p-4 rounded-xl bg-slate-950 text-emerald-300 text-[11px] leading-relaxed overflow-x-auto font-mono shadow-inner">
{`<iframe
  src="${isEn ? 'https://www.humandesignchart.app' : 'https://www.humandesignmapa.cz'}/embed/calculator"
  width="100%"
  height="600"
  frameborder="0"
></iframe>
<p style="text-align:center;font-size:12px;">
  Powered by <a href="${isEn ? 'https://www.humandesignchart.app' : 'https://www.humandesignmapa.cz'}">${isEn ? 'Human Design Chart' : 'Human Design Mapa'}</a>
</p>`}
                      </pre>
                      <Button
                        size="sm"
                        className="absolute top-2 right-2 h-8 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
                        onClick={handleCopyEmbed}
                      >
                        {embedCopied ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                        {isEn ? "Copy" : "Kopírovat"}
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                        <Palette className="w-3 h-3" /> {isEn ? "Responsive" : "Responzivní"}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-indigo-100 text-indigo-700">
                        <Code2 className="w-3 h-3" /> {isEn ? "Copy & paste" : "Kopírovat a vložit"}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700">
                        <Sparkles className="w-3 h-3" /> {isEn ? "Free forever" : "Zdarma navždy"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
