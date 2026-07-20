import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Compass, Loader2, MapPin, Calendar, Clock, Info, User, Heart, Users, Briefcase, Baby, Star, UserCheck, HelpCircle, Lock, Code2, Copy, Check } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSEO, OG_IMAGES } from "@/hooks/useSEO";

export default function ChartCalculator({ seoType }: { seoType?: "kalkulacka" | "test" | "typy" }) {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const { t, localePath, locale } = useLanguage();
  const isEn = locale === "en";
  useSEO(isEn ? {
    title: "✨ Free Human Design Chart Calculator 🔮",
    description: "Calculate your free Human Design bodygraph chart. Enter your birth date, time and place to discover your type, strategy, authority and profile.",
    ogImage: OG_IMAGES.calculator,
    keywords: "human design calculator, bodygraph calculator, free human design chart, human design birth chart",
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
      toast.error("Vyplňte prosím všechna pole a vyhledejte lokaci.");
      return;
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
                      Nejprve klikněte na "Najít" u Místa narození
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
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 shadow-sm relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/20 rounded-full blur-2xl pointer-events-none" />
              <CardHeader className="pb-3">
                <CardTitle className="font-serif text-lg flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-primary" />
                  {isEn ? "Embed on Your Website (Free Tool)" : "Vložte si kalkulačku zdarma na svůj web"}
                </CardTitle>
                <CardDescription>
                  {isEn
                    ? "Are you an astrologer, life coach, or blogger? Use our free chart widget to engage your audience and keep them on your site! Just copy the code below."
                    : "Jste astrolog, kouč nebo bloger? Vložte si na web naši Human design kalkulačku s profesionálním designem pro své návštěvníky zdarma!"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <pre className="p-4 rounded-xl bg-slate-950 text-slate-50 text-xs overflow-x-auto font-mono">
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
                    variant="secondary"
                    className="absolute top-2 right-2 h-8"
                    onClick={handleCopyEmbed}
                  >
                    {embedCopied ? <Check className="w-3.5 h-3.5 mr-1 text-green-500" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                    {isEn ? "Copy Code" : "Kopírovat kód"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
