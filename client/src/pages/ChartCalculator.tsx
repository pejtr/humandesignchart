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
import {
  Compass, Loader2, MapPin, Calendar, Clock, User, Heart, Users,
  Briefcase, Baby, Star, Lock, Code2, Copy, Check, Globe, Palette,
  Sparkles, Send, ShieldCheck, ArrowRight
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSEO, OG_IMAGES } from "@/hooks/useSEO";
import { TimeDisambiguationField, type TimeDisambiguation } from "@/components/TimeDisambiguationField";
import { useMetaPixel } from "@/hooks/useMetaPixel";
import { trackGA4Event } from "@/hooks/useGA4";
import { measureOpenAIAdsEvent } from "@/hooks/useOpenAIAdsPixel";
import { saveChartDraft } from "@/lib/chartDraft";

const CALCULATOR_HERO_VISUALS = {
  self: { eyebrowCs: "Moje mapa", eyebrowEn: "My chart", headlineCs: "Začněte u sebe.", headlineEn: "Start with yourself.", background: "radial-gradient(circle at 18% 18%, rgba(168,85,247,.20), transparent 38%), radial-gradient(circle at 82% 25%, rgba(99,102,241,.16), transparent 32%), linear-gradient(140deg, rgba(250,248,255,.96), rgba(244,247,255,.82))", accent: "#8b5cf6" },
  friend: { eyebrowCs: "Partnerská mapa", eyebrowEn: "Partner chart", headlineCs: "Lépe si rozumět ve dvou.", headlineEn: "Understand each other better.", background: "radial-gradient(circle at 14% 24%, rgba(244,114,182,.18), transparent 36%), radial-gradient(circle at 84% 24%, rgba(251,146,60,.17), transparent 34%), linear-gradient(140deg, rgba(255,248,252,.96), rgba(255,250,245,.86))", accent: "#ec4899" },
  family: { eyebrowCs: "Rodinná mapa", eyebrowEn: "Family chart", headlineCs: "Pohled na vztah s respektem.", headlineEn: "A respectful view of your relationship.", background: "radial-gradient(circle at 18% 24%, rgba(20,184,166,.18), transparent 34%), radial-gradient(circle at 84% 18%, rgba(59,130,246,.15), transparent 34%), linear-gradient(140deg, rgba(245,255,253,.96), rgba(246,250,255,.85))", accent: "#14b8a6" },
  client: { eyebrowCs: "Mapa pro práci", eyebrowEn: "Work chart", headlineCs: "Více jasnosti pro spolupráci.", headlineEn: "More clarity for collaboration.", background: "radial-gradient(circle at 16% 22%, rgba(245,158,11,.18), transparent 34%), radial-gradient(circle at 84% 22%, rgba(99,102,241,.15), transparent 34%), linear-gradient(140deg, rgba(255,252,243,.96), rgba(247,248,255,.84))", accent: "#d97706" },
  other: { eyebrowCs: "Mapa dítěte", eyebrowEn: "Child chart", headlineCs: "Vnímat jedinečnost od začátku.", headlineEn: "See uniqueness from the beginning.", background: "radial-gradient(circle at 18% 22%, rgba(34,197,94,.17), transparent 34%), radial-gradient(circle at 84% 20%, rgba(56,189,248,.18), transparent 34%), linear-gradient(140deg, rgba(247,255,249,.96), rgba(246,252,255,.85))", accent: "#16a34a" },
  celebrity: { eyebrowCs: "Mapa blízkého", eyebrowEn: "A loved one's chart", headlineCs: "Objevovat bez nálepek.", headlineEn: "Explore without labels.", background: "radial-gradient(circle at 18% 20%, rgba(139,92,246,.17), transparent 34%), radial-gradient(circle at 84% 24%, rgba(6,182,212,.17), transparent 34%), linear-gradient(140deg, rgba(249,248,255,.96), rgba(244,253,255,.84))", accent: "#6366f1" },
} as const;

export default function ChartCalculator({ seoType }: { seoType?: "kalkulacka" | "test" | "typy" }) {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const { t, localePath, locale } = useLanguage();
  const isEn = locale !== "cs";
  const meta = useMetaPixel();

  useSEO(isEn ? {
    title: "✨ Free Human Design Chart Calculator & Reading | Bodygraph Generator 🔮",
    description: "Calculate your free Human Design chart calculator & bodygraph. Get instant free Human Design reading, personality test result & authority breakdown. 100% free.",
    ogImage: OG_IMAGES.calculator,
    keywords: "human design calculator free, free human design chart, human design chart calculator, free human design reading, human design test free, human design map, human design chart calculator free, free human design chart reading, human design free",
    locale: "en_US",
  } : {
    title: seoType === "kalkulacka" ? "✨ Human Design Kalkulačka Zdarma — Bodygraph & Výpočet 🔮" :
      seoType === "test" ? "✨ Human Design Test Osobnosti Zdarma — Zjistěte svůj typ 🔮" :
        seoType === "typy" ? "✨ Human Design Typy — Přehled & Kalkulátor 🔮" :
          "✨ Kalkulačka Human Design Mapy Zdarma — AI Výklad & CZ 🔮",
    description: seoType === "test" ? "Udělejte si přesný Human Design test osobnosti zdarma. Zadejte své údaje a zjistěte svůj typ, strategii, autoritu a profil." :
      seoType === "typy" ? "Poznejte všechny Human Design typy – Generátor, Projektor, Manifestor, Reflektor. Jaký energetický typ jste vy?" :
        "Vypočítejte svou Human Design mapu zdarma přes náš kalkulátor. Zadejte datum, čas a místo narození a zjistěte svůj typ, strategii, autoritu a profil.",
    ogImage: OG_IMAGES.calculator,
    keywords: "human design kalkulačka, human design mapa, human design zdarma, human design test zdarma, human design typy, human design cz, bodygraph kalkulátor zdarma",
    locale: "cs_CZ",
  });

  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [isUnknownTime, setIsUnknownTime] = useState(false);
  const [disambiguation, setDisambiguation] = useState<TimeDisambiguation>("");
  const [birthPlace, setBirthPlace] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [locationResolved, setLocationResolved] = useState(false);
  const [isSearchingPlace, setIsSearchingPlace] = useState(false);
  const [category, setCategory] = useState<string>("self");
  const heroVisual = CALCULATOR_HERO_VISUALS[category as keyof typeof CALCULATOR_HERO_VISUALS] ?? CALCULATOR_HERO_VISUALS.self;

  // ORACULUM+ quick question
  const [oraculumQuestion, setOraculumQuestion] = useState("");

  // Embed widget section state
  const [showEmbedCode, setShowEmbedCode] = useState(false);
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
    { value: "friend", labelCs: "Partner / Partnerka", labelEn: "Partner", icon: Heart },
    { value: "family", labelCs: "Rodina / Rodič", labelEn: "Family / Parent", icon: Users },
    { value: "other", labelCs: "Dítě", labelEn: "Child", icon: Baby },
    { value: "client", labelCs: "Kolega / Práce", labelEn: "Colleague / Work", icon: Briefcase },
    { value: "celebrity", labelCs: "Přítel / Ostatní", labelEn: "Friend / Other", icon: Star },
  ];

  // Track ViewContent on page mount (funnel entry)
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
      saveChartDraft(data, {
        name, birthDate, birthTime, birthPlace, latitude, longitude, timezone: data.timezone, category,
      });
      trackGA4Event("ChartGenerated", {
        chart_type: data.type,
        profile: data.profile,
        authority: data.authority,
        locale,
      });
      measureOpenAIAdsEvent("registration_completed", { type: "customer_action" });
      const nextStep = new URLSearchParams(window.location.search).get("next");
      if (nextStep === "honorace" || nextStep === "pricing") {
        navigate(localePath("/honorace"));
        return;
      }
      navigate(localePath("/chart/new"));
    },
    onError: (err) => {
      toast.error(t.common?.error ? `${t.common.error}: ${err.message}` : `Calculation failed: ${err.message}`);
    },
  });

  const handleUnknownTimeToggle = (checked: boolean) => {
    setIsUnknownTime(checked);
    if (checked) {
      setBirthTime("12:00");
    }
  };

  const triggerCalculation = (lat: string, lon: string, place: string) => {
    if (!name || !birthDate || !birthTime) return;

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
      birthPlace: place,
      latitude: parseFloat(lat),
      longitude: parseFloat(lon),
      ...(disambiguation ? { disambiguation } : {}),
    });
  };

  const handlePlaceSearch = async (autoProceed = false) => {
    if (!birthPlace.trim()) return false;
    setIsSearchingPlace(true);
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
        setLocationResolved(true);
        setIsSearchingPlace(false);
        toast.success(t.calculator.locationFound);

        if (autoProceed) {
          triggerCalculation(result.lat, result.lon, result.display_name);
        }
        return true;
      } else {
        setIsSearchingPlace(false);
        toast.error(t.calculator.locationNotFound);
        return false;
      }
    } catch {
      setIsSearchingPlace(false);
      toast.error(t.calculator.locationSearchFailed);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(isEn ? "Please enter your name." : "Zadejte prosím své jméno.");
      return;
    }
    if (!birthDate) {
      toast.error(isEn ? "Please select your date of birth." : "Vyberte prosím datum narození.");
      return;
    }
    if (!birthTime) {
      toast.error(isEn ? "Please enter your birth time or select 'I don't know my exact time'." : "Zadejte prosím čas narození nebo zaškrtněte 'Neznám přesný čas'.");
      return;
    }

    if (!locationResolved) {
      if (birthPlace.trim()) {
        await handlePlaceSearch(true);
        return;
      }
      toast.error(isEn ? "Please enter and find your birth place." : "Zadejte a vyhledejte prosím místo narození.");
      return;
    }

    triggerCalculation(latitude, longitude, birthPlace);
  };

  const handleAskOraculum = (query?: string) => {
    const q = (query ?? oraculumQuestion).trim();
    if (!q) {
      navigate(localePath("/ai-guide"));
      return;
    }
    navigate(localePath(`/ai-guide?q=${encodeURIComponent(q)}`));
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground relative overflow-hidden">
      <div className="absolute inset-x-0 top-16 h-[34rem] pointer-events-none z-0 transition-opacity duration-500" style={{ background: heroVisual.background }} aria-hidden="true" />
      {/* Mystical Background Decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
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
        <div className="absolute top-[20%] left-[10%] w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-[20%] right-[10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <Navbar />

      <main className="flex-1 pt-24 pb-16">
        <div className="container max-w-2xl relative">
          {/* Top Hero Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border bg-white/70 dark:bg-card/70 text-sm mb-4 transition-colors duration-500 shadow-xs" style={{ borderColor: `${heroVisual.accent}55`, color: heroVisual.accent }}>
              <Compass className="w-4 h-4" />
              {isEn ? heroVisual.eyebrowEn : heroVisual.eyebrowCs}
            </div>
            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold mb-3 tracking-tight">
              {seoType === "kalkulacka" && isEn === false ? "Human Design Kalkulačka Zdarma" :
                seoType === "test" && isEn === false ? "Human Design Test Osobnosti Zdarma" :
                  seoType === "typy" && isEn === false ? "Human Design Typy — Vypočítejte svůj typ" :
                    t.calculator.title}
            </h1>
            <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto leading-relaxed">
              {seoType === "kalkulacka" && isEn === false ? "Využijte nejkomplexnější přesnou Human Design kalkulačku v češtině. Zjistěte ihned, jak byla vaše energetická mapa poskládána v momentě narození." :
                seoType === "test" && isEn === false ? "Na rozdíl od jiných psychologických testů vychází Human design z přesného postavení planet a vaší DNA v čase zrození. Získejte svůj rozbor zdarma." :
                  seoType === "typy" && isEn === false ? "Generátor, Projektor, Manifestor nebo Reflektor? Použijte náš výpočet a objevte svůj přesný typ a strategii pro život v lehkosti." :
                    t.calculator.description}
            </p>

            {/* Instant Value / Benefit Badges */}
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-left">
              <div className="flex items-center gap-2 p-2 rounded-xl bg-white/80 dark:bg-card/80 border border-border/60 shadow-xs">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0 text-xs font-bold">⚡</span>
                <span className="text-[11px] font-medium leading-tight text-foreground">{isEn ? "100% Free & Instant" : "100% Zdarma & Ihned"}</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-white/80 dark:bg-card/80 border border-border/60 shadow-xs">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-400 shrink-0 text-xs font-bold">🎯</span>
                <span className="text-[11px] font-medium leading-tight text-foreground">{isEn ? "Type & Inner Authority" : "Typ, strategie & autorita"}</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-white/80 dark:bg-card/80 border border-border/60 shadow-xs">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 shrink-0 text-xs font-bold">🔮</span>
                <span className="text-[11px] font-medium leading-tight text-foreground">{isEn ? "9 Centers & Channels" : "9 center, kanály a brány"}</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-white/80 dark:bg-card/80 border border-border/60 shadow-xs">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0 text-xs font-bold">🇨🇿</span>
                <span className="text-[11px] font-medium leading-tight text-foreground">{isEn ? "Deep English Analysis" : "Kompletní výklad v češtině"}</span>
              </div>
            </div>

            <p className="mt-3 text-xs md:text-sm font-medium transition-colors duration-500" style={{ color: heroVisual.accent }}>
              {isEn ? heroVisual.headlineEn : heroVisual.headlineCs}
            </p>
          </div>

          {/* Main Calculation Card */}
          <Card className="bg-card/95 backdrop-blur-sm border-border/70 shadow-lg rounded-2xl md:rounded-3xl overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="font-serif text-xl md:text-2xl text-foreground flex items-center justify-between">
                <span>{t.calculator.birthDataTitle}</span>
                <span className="text-xs font-sans font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  {isEn ? "Free & Confidential" : "Zdarma & Důvěrné"}
                </span>
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                {t.calculator.birthTimeNote}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-sm font-semibold">{t.calculator.name}</Label>
                  <Input
                    id="name"
                    placeholder={t.calculator.namePlaceholder}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="h-11 rounded-xl text-sm"
                  />
                </div>

                {/* Birth Date & Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="birthDate" className="flex items-center gap-1.5 text-sm font-semibold">
                      <Calendar className="w-4 h-4 text-primary" />
                      {t.calculator.birthDate}
                    </Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      required
                      className="h-11 rounded-xl text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="birthTime" className="flex items-center gap-1.5 text-sm font-semibold">
                      <Clock className="w-4 h-4 text-primary" />
                      {t.calculator.birthTime}
                    </Label>
                    <Input
                      id="birthTime"
                      type="time"
                      value={birthTime}
                      onChange={(e) => setBirthTime(e.target.value)}
                      disabled={isUnknownTime}
                      required={!isUnknownTime}
                      className={`h-11 rounded-xl text-sm transition-opacity ${isUnknownTime ? "opacity-60 bg-muted cursor-not-allowed" : ""}`}
                    />
                  </div>
                </div>

                {/* Unknown birth time option */}
                <div className="rounded-xl border border-border/60 bg-muted/20 p-3 space-y-2">
                  <label className="inline-flex items-center gap-2.5 text-xs md:text-sm font-medium text-foreground cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isUnknownTime}
                      onChange={(e) => handleUnknownTimeToggle(e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary/20 w-4 h-4 cursor-pointer"
                    />
                    <span>{t.calculator.unknownTimeLabel}</span>
                  </label>
                  {isUnknownTime && (
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/25 text-xs text-amber-900 dark:text-amber-200 leading-relaxed animate-in fade-in duration-200">
                      <p className="font-semibold mb-0.5">{isEn ? "Standard 12:00 (Noon) time selected" : "Nastaven standardní čas 12:00 (poledne)"}</p>
                      <p>{t.calculator.unknownTimeHelp}</p>
                    </div>
                  )}
                </div>

                <TimeDisambiguationField
                  value={disambiguation}
                  onChange={setDisambiguation}
                  isEnglish={isEn}
                />

                {/* Relationship Category */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">
                      {isEn ? "Who is this chart for?" : "Pro koho je tato mapa?"}
                    </Label>
                    {!isAuthenticated && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground cursor-help">
                            <Lock className="w-3 h-3" />
                            {isEn ? "Sign in to save" : "Přihlaste se pro uložení"}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p className="text-xs">{isEn ? "You can choose a visual context now; sign in to save the chart to your collection." : "Kontext můžete vybrat hned; pro uložení mapy do sbírky se přihlaste."}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {RELATIONSHIP_OPTIONS.map((opt) => {
                      const Icon = opt.icon;
                      const label = isEn ? opt.labelEn : opt.labelCs;
                      const active = category === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setCategory(opt.value)}
                          aria-pressed={active}
                          className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-xs font-medium transition-all duration-150 ${active
                            ? 'border-primary bg-primary/10 text-primary shadow-xs ring-1 ring-primary/30'
                            : 'border-border/70 bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
                            }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="truncate">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Birth Place with robust search & auto-resolver */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="birthPlace" className="flex items-center gap-1.5 text-sm font-semibold">
                      <MapPin className="w-4 h-4 text-primary" />
                      {t.calculator.birthPlace}
                    </Label>
                    {locationResolved && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        <Check className="w-3 h-3" />
                        {isEn ? "Timezone verified" : "Časové pásmo ověřeno"}
                      </span>
                    )}
                  </div>
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
                          handlePlaceSearch(false);
                        }
                      }}
                      required
                      className="h-11 rounded-xl text-sm"
                    />
                    <Button
                      type="button"
                      variant={locationResolved ? "outline" : "secondary"}
                      onClick={() => handlePlaceSearch(false)}
                      disabled={!birthPlace.trim() || isSearchingPlace}
                      className="h-11 px-4 rounded-xl shrink-0"
                    >
                      {isSearchingPlace ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                          <span className="text-xs">{t.calculator.searchingLocation}</span>
                        </>
                      ) : (
                        <>
                          <MapPin className="w-4 h-4 mr-1.5" />
                          <span className="text-xs">{t.calculator.findLocation}</span>
                        </>
                      )}
                    </Button>
                  </div>
                  {locationResolved ? (
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 truncate">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">{birthPlace}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground ml-2 shrink-0 font-mono">
                        {Number(latitude).toFixed(2)}°, {Number(longitude).toFixed(2)}°
                      </span>
                    </div>
                  ) : (
                    <p className="text-[11px] text-muted-foreground">
                      {isEn
                        ? "Enter city (e.g. London, New York, Prague) and click Find to detect timezone & coordinates."
                        : "Zadejte město (např. Praha, Brno, Londýn) a klikněte na Najít pro automatické určení časového pásma."}
                    </p>
                  )}
                </div>

                {/* Primary CTA Submit Button */}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full h-13 text-base font-semibold bg-gradient-to-r from-purple-600 via-primary to-indigo-600 text-primary-foreground hover:brightness-105 shadow-lg shadow-purple-500/20 transition-all rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={calculateMutation.isPending || isSearchingPlace}
                >
                  {calculateMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {t.calculator.calculating}
                    </>
                  ) : isSearchingPlace ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {t.calculator.searchingLocation}
                    </>
                  ) : (
                    <>
                      <Compass className="w-5 h-5 mr-2" />
                      {t.calculator.calculate}
                    </>
                  )}
                </Button>

                {/* Trust Signals */}
                <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground pt-1">
                  <span className="inline-flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    {isEn ? "100% Free · No spam" : "100% Zdarma · Bez spamu"}
                  </span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    {isEn ? "Instant Bodygraph" : "Okamžitý výsledek"}
                  </span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-primary" />
                    {isEn ? "Private & Secure" : "Data v bezpečí"}
                  </span>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* ORACULUM+ Dedicated Smart Assistant Section */}
          <section className="mt-12 rounded-3xl border border-amber-300/40 bg-gradient-to-br from-amber-500/10 via-purple-900/5 to-amber-500/5 backdrop-blur-xl p-6 md:p-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-5">
              <div className="flex items-center gap-3.5">
                <div className="relative w-12 h-12 rounded-2xl overflow-hidden border-2 border-amber-300/70 bg-[#160b2f] shrink-0 shadow-md">
                  <img
                    src="/images/brand/veleknezka-master-v1.png"
                    alt="ORACULUM+"
                    className="w-full h-full object-cover object-[center_16%]"
                  />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-200 text-[11px] font-bold border border-amber-500/25 mb-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    ORACULUM+
                  </div>
                  <h2 className="font-serif text-xl md:text-2xl font-bold text-foreground">
                    {isEn ? "Smart AI Human Design Guide" : "Chytrá AI průvodkyně Human Designem"}
                  </h2>
                  <p className="text-xs md:text-sm text-muted-foreground mt-0.5 max-w-xl">
                    {isEn
                      ? "Have questions about your type, authority, or transits? ORACULUM+ translates complex Human Design knowledge into clear practical guidance."
                      : "Máte otázky ke svému typu, autoritě nebo dnešním tranzitům? ORACULUM+ propojuje hluboké principy Human Designu s reálným životem."}
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="rounded-full border-amber-300/60 hover:bg-amber-500/10 text-xs shrink-0 self-start md:self-center"
                onClick={() => navigate(localePath("/ai-guide"))}
              >
                <span>{isEn ? "Open full AI Chat" : "Otevřít celého AI průvodce"}</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </div>

            {/* Prompt chips */}
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                {isEn ? "Quick questions to ask:" : "Časté dotazy návštěvníků:"}
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  isEn ? "What is my type and decision strategy?" : "Jaký je můj typ, strategie a rozhodování?",
                  isEn ? "What does a defined vs. open Sacral center mean?" : "Co znamená definované vs. otevřené Sakrální centrum?",
                  isEn ? "How do today's planetary transits affect my energy?" : "Jak dnešní tranzity ovlivňují moji energii?",
                ].map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAskOraculum(q)}
                    className="text-left px-3.5 py-2 rounded-xl bg-background/80 hover:bg-amber-500/10 border border-amber-300/30 hover:border-amber-400 text-xs font-medium text-foreground transition-all duration-150 hover:scale-[1.01]"
                  >
                    ✨ {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Direct Question Bar */}
            <div className="flex items-center gap-2 pt-2">
              <Input
                type="text"
                placeholder={isEn ? "Ask ORACULUM+ anything about Human Design..." : "Zeptejte se ORACULUM+ na cokoliv ohledně Human Designu..."}
                value={oraculumQuestion}
                onChange={(e) => setOraculumQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && oraculumQuestion.trim()) {
                    handleAskOraculum();
                  }
                }}
                className="flex-1 bg-background/90 text-sm border-amber-300/40 rounded-xl"
              />
              <Button
                type="button"
                onClick={() => handleAskOraculum()}
                className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-semibold rounded-xl text-xs sm:text-sm px-4 shadow-sm"
              >
                <span>{isEn ? "Ask" : "Položit dotaz"}</span>
                <Send className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </div>
          </section>

          {/* B2B / Partner Embed Section (Secondary) */}
          <section className="mt-8 mb-8 rounded-2xl border border-border/60 bg-muted/20 p-5 md:p-6 transition-all">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-bold text-foreground">
                    {isEn ? "For Astrologers & Coaches: Embed Free Calculator" : "Pro astrology a kouče: Vložte si kalkulačku zdarma na web"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {isEn ? "Engage your visitors with an instant interactive bodygraph tool on your own website." : "Zaujměte své klienty a návštěvníky interaktivním výpočtem přímo na svých stránkách."}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEmbedCode(!showEmbedCode)}
                className="text-xs gap-1.5 shrink-0"
              >
                <Code2 className="w-3.5 h-3.5" />
                {showEmbedCode ? (isEn ? "Hide Code" : "Skrýt kód") : (isEn ? "Show Embed Code" : "Zobrazit kód")}
              </Button>
            </div>

            {showEmbedCode && (
              <div className="mt-4 pt-4 border-t border-border/40 space-y-3">
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
                    className="absolute top-2 right-2 h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                    onClick={handleCopyEmbed}
                  >
                    {embedCopied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                    {isEn ? "Copy" : "Kopírovat kód"}
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground pt-1">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    <Palette className="w-3 h-3" /> {isEn ? "100% Responsive" : "Responzivní"}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                    <Sparkles className="w-3 h-3" /> {isEn ? "Free forever" : "Zdarma navždy"}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300">
                    <Code2 className="w-3 h-3" /> {isEn ? "Zero setup required" : "Bez složité instalace"}
                  </span>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
