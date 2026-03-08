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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UtensilsCrossed, MapPin, Eye, Brain, LogIn, ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

// Comprehensive PHS/Variables data in Czech
const DIGESTION_TYPES: Record<string, { name: string; description: string; tips: string[]; foods: string[] }> = {
  Consecutive: {
    name: "Postupné (Consecutive)",
    description: "Vaše trávení funguje nejlépe, když jíte jednu věc po druhé. Nemíchejte různé druhy jídla na jednom talíři. Jezte postupně — nejdřív jeden druh, pak další.",
    tips: ["Jezte jednoduché pokrmy s málo ingrediencemi", "Nemíchejte příliš mnoho chutí najednou", "Dejte si pauzu mezi různými druhy jídla", "Preferujte jednoduché kombinace"],
    foods: ["Jednoduchá jídla", "Mono-pokrmy", "Oddělené ingredience"],
  },
  Alternating: {
    name: "Střídavé (Alternating)",
    description: "Vaše trávení je nejefektivnější, když střídáte mezi různými druhy jídla. Jeden den jezte lehce, další den bohatě. Variace je klíčem.",
    tips: ["Střídejte těžká a lehká jídla", "Měňte svůj jídelníček pravidelně", "Nebojte se experimentovat s novými pokrmy", "Naslouchejte svému tělu den po dni"],
    foods: ["Rozmanitá strava", "Střídání teplého a studeného", "Sezónní potraviny"],
  },
  Open: {
    name: "Otevřené (Open)",
    description: "Potřebujete jíst v otevřeném, klidném prostředí. Vaše trávení je ovlivněno atmosférou kolem vás. Jezte venku nebo u otevřeného okna.",
    tips: ["Jezte venku nebo u otevřeného okna", "Vyhněte se uzavřeným, stísněným prostorům při jídle", "Čerstvý vzduch zlepšuje vaše trávení", "Preferujte lehká, vzdušná jídla"],
    foods: ["Čerstvé saláty", "Lehké pokrmy", "Syrová zelenina a ovoce"],
  },
  Closed: {
    name: "Uzavřené (Closed)",
    description: "Nejlépe trávíte v uzavřeném, intimním prostředí. Potřebujete klid a soukromí při jídle. Vyhněte se rušným restauracím.",
    tips: ["Jezte v klidu a soukromí", "Vyhněte se rušným restauracím", "Vytvořte si příjemné prostředí pro jídlo", "Teplá, vařená jídla vám svědčí lépe"],
    foods: ["Domácí vaření", "Teplé polévky", "Dušená jídla"],
  },
  Hot: {
    name: "Horké (Hot)",
    description: "Vaše trávení preferuje teplá a horká jídla. Studená jídla mohou zpomalovat vaše trávení. Pijte teplé nápoje.",
    tips: ["Preferujte teplá a horká jídla", "Pijte teplou vodu nebo čaj", "Vyhněte se ledovým nápojům", "Koření může podpořit vaše trávení"],
    foods: ["Polévky", "Dušená jídla", "Teplé nápoje", "Kořeněná jídla"],
  },
  Cold: {
    name: "Studené (Cold)",
    description: "Vaše trávení funguje lépe se studenými nebo pokojově teplými jídly. Příliš horká jídla mohou narušit vaše trávení.",
    tips: ["Preferujte pokojově teplá nebo chladná jídla", "Syrová strava vám může svědčit", "Nechte jídlo vychladnout před konzumací", "Smoothie a saláty jsou ideální"],
    foods: ["Saláty", "Smoothie", "Syrová zelenina", "Studené pokrmy"],
  },
  Calm: {
    name: "Klidné (Calm)",
    description: "Potřebujete absolutní klid při jídle. Žádné rozptylování — žádná televize, telefon ani konverzace. Soustřeďte se pouze na jídlo.",
    tips: ["Jezte v naprostém klidu", "Vypněte všechna zařízení při jídle", "Soustřeďte se na každé sousto", "Mindful eating je váš styl"],
    foods: ["Jednoduché pokrmy", "Meditativní přístup k jídlu"],
  },
  Nervous: {
    name: "Nervózní (Nervous)",
    description: "Paradoxně trávíte lépe v mírně stimulujícím prostředí. Trocha rozptýlení při jídle vám pomáhá. Můžete jíst při konverzaci nebo lehké aktivitě.",
    tips: ["Jezte ve společnosti", "Lehká konverzace při jídle je v pořádku", "Nemusíte se nutit do ticha", "Mírná stimulace podporuje vaše trávení"],
    foods: ["Společenské stolování", "Rozmanitá jídla"],
  },
  Appetite: {
    name: "Chuť (Appetite)",
    description: "Jezte pouze tehdy, když máte skutečný hlad a chuť na konkrétní jídlo. Vaše tělo vám přesně řekne, co potřebuje.",
    tips: ["Jezte jen když máte skutečný hlad", "Naslouchejte svým chutím", "Nejezte podle hodin, ale podle těla", "Důvěřujte svým cravings"],
    foods: ["Cokoliv, na co máte chuť", "Intuitivní stravování"],
  },
  Thirst: {
    name: "Žízeň (Thirst)",
    description: "Hydratace je pro vás klíčová. Pijte dostatek tekutin a preferujte vodnaté potraviny. Vaše trávení je úzce spojeno s příjmem tekutin.",
    tips: ["Pijte hodně vody", "Preferujte vodnaté ovoce a zeleninu", "Polévky jsou pro vás ideální", "Hydratujte se před jídlem"],
    foods: ["Vodnaté ovoce", "Polévky", "Smoothie", "Šťávy"],
  },
  Touch: {
    name: "Dotek (Touch)",
    description: "Vaše trávení je spojeno s hmatovým vjemem. Textury jídla jsou pro vás důležitější než chutě. Vybírejte jídla podle toho, jak se cítí.",
    tips: ["Všímejte si textur jídla", "Jezte rukama když je to vhodné", "Vybírejte jídla podle konzistence", "Důležitý je haptický zážitek"],
    foods: ["Jídla s různými texturami", "Křupavé i měkké pokrmy"],
  },
  Sound: {
    name: "Zvuk (Sound)",
    description: "Zvukové prostředí ovlivňuje vaše trávení. Příjemná hudba nebo zvuky přírody mohou zlepšit vaše trávení.",
    tips: ["Pusťte si příjemnou hudbu při jídle", "Zvuky přírody podporují trávení", "Vyhněte se hlučným prostředím", "Ticho nebo jemná hudba"],
    foods: ["Jídla, která 'zní' — křupavá, šumivá"],
  },
  Light: {
    name: "Světlo (Light)",
    description: "Osvětlení prostředí ovlivňuje vaše trávení. Přirozené denní světlo je ideální. Vyhněte se jídlu v tmavých prostorech.",
    tips: ["Jezte za denního světla", "Přirozené osvětlení je ideální", "Vyhněte se jídlu ve tmě", "Ranní a polední jídla jsou nejlepší"],
    foods: ["Lehká, barevná jídla", "Čerstvé potraviny"],
  },
  Color: {
    name: "Barva (Color)",
    description: "Barvy jídla ovlivňují vaše trávení. Jezte pestře barevná jídla. Vizuální prezentace pokrmu je pro vás důležitá.",
    tips: ["Jezte pestře barevná jídla", "Vizuální prezentace je důležitá", "Každý den jiná barva na talíři", "Čerstvé, barevné potraviny"],
    foods: ["Barevná zelenina", "Pestré saláty", "Vizuálně atraktivní pokrmy"],
  },
};

const ENVIRONMENT_TYPES: Record<string, { name: string; description: string; tips: string[] }> = {
  Caves: { name: "Jeskyně", description: "Potřebujete uzavřené, chráněné prostory. Cítíte se nejlépe v útulných, ohraničených místnostech s pocitem bezpečí.", tips: ["Pracujte v malých, útulných prostorech", "Vytvořte si svůj 'úkryt'", "Nízké stropy a teplé osvětlení"] },
  Markets: { name: "Tržiště", description: "Prosperujete v rušných, živých prostředích plných lidí a aktivity. Potřebujete stimulaci a rozmanitost.", tips: ["Pracujte v kavárnách nebo co-working prostorech", "Vyhledávejte živá místa", "Rozmanitost prostředí vás nabíjí"] },
  Kitchens: { name: "Kuchyně", description: "Potřebujete prostředí, kde se 'vaří' — kde se věci transformují a mění. Kreativní dílny, laboratoře.", tips: ["Prostředí s tvůrčí energií", "Místa kde se věci mění a vznikají", "Kreativní ateliéry a dílny"] },
  Mountains: { name: "Hory", description: "Potřebujete nadhled — fyzicky i metaforicky. Vyšší patra budov, kopce, místa s výhledem.", tips: ["Pracujte ve vyšších patrech", "Vyhledávejte místa s výhledem", "Potřebujete perspektivu a nadhled"] },
  Valleys: { name: "Údolí", description: "Cítíte se nejlépe v nížinách, v přírodě, blízko vody. Potřebujete uzemnění a spojení se zemí.", tips: ["Bydlete blízko přírody", "Nízko položená místa vám svědčí", "Spojení se zemí a vodou"] },
  Shores: { name: "Pobřeží", description: "Potřebujete být na rozhraní — kde se setkávají dva světy. Okraje měst, břehy řek, přechodové zóny.", tips: ["Bydlete na okraji — města, lesa, vody", "Přechodové zóny jsou vaše místo", "Rozhraní dvou prostředí"] },
  Wet: { name: "Vlhké", description: "Vlhkost a voda jsou pro vás důležité. Blízkost vodních ploch, vlhčí klima, koupelny.", tips: ["Bydlete blízko vody", "Zvlhčovač vzduchu v interiéru", "Koupání a vodní aktivity"] },
  Dry: { name: "Suché", description: "Suché klima a prostředí vám svědčí. Vyhněte se přílišné vlhkosti.", tips: ["Preferujte suché klima", "Odvlhčovač v interiéru", "Suchá, vzdušná místa"] },
  Natural: { name: "Přírodní", description: "Potřebujete být obklopeni přírodou — stromy, rostliny, zvířata. Přirozené materiály a prostředí.", tips: ["Hodně rostlin v interiéru", "Přírodní materiály", "Čas v přírodě je nezbytný"] },
  Artificial: { name: "Umělé", description: "Moderní, člověkem vytvořené prostředí vám svědčí. Technologie, design, městské prostředí.", tips: ["Moderní architektura", "Technologické prostředí", "Městský životní styl"] },
  Narrow: { name: "Úzké", description: "Potřebujete zaměřené, úzké prostory. Chodby, úzké uličky, specifická místa.", tips: ["Pracujte v zaměřených prostorech", "Úzké, specifické zóny", "Jasně vymezené prostory"] },
  Wide: { name: "Široké", description: "Potřebujete otevřené, rozlehlé prostory. Velké místnosti, otevřená krajina.", tips: ["Velké, otevřené prostory", "Otevřená krajina", "Vysoké stropy a rozlehlé místnosti"] },
};

const PERSPECTIVE_TYPES: Record<string, { name: string; description: string }> = {
  Survival: { name: "Přežití", description: "Vaše perspektiva je zaměřena na bezpečí a přežití. Vidíte svět skrze filtr 'je to bezpečné?'" },
  Possibility: { name: "Možnosti", description: "Vidíte svět plný příležitostí a možností. Vaše perspektiva je optimistická a expanzivní." },
  Power: { name: "Moc", description: "Vnímáte dynamiku moci v každé situaci. Vidíte, kdo má vliv a jak se energie pohybuje." },
  Wanting: { name: "Touha", description: "Vaše perspektiva je řízena touhou a motivací. Vidíte, co chybí a co je potřeba." },
  Probability: { name: "Pravděpodobnost", description: "Vnímáte svět skrze pravděpodobnosti a vzorce. Vidíte, co je pravděpodobné a co ne." },
  Action: { name: "Akce", description: "Vaše perspektiva je orientována na činy a výsledky. Vidíte, co je třeba udělat." },
  Personal: { name: "Osobní", description: "Vnímáte vše osobně a subjektivně. Vaše perspektiva je hluboce individuální." },
  Outer: { name: "Vnější", description: "Máte schopnost vidět věci z vnějšího, objektivního pohledu. Nadhled je vaší silou." },
};

const AWARENESS_TYPES: Record<string, { name: string; description: string }> = {
  Smell: { name: "Čich", description: "Vaše vědomí je spojeno s čichem. Intuitivně 'cítíte' situace. Důvěřujte svému nosu." },
  Taste: { name: "Chuť", description: "Vaše vědomí pracuje skrze chuť. Rozlišujete, co je 'sladké' a co 'hořké' v životě." },
  Feeling: { name: "Pocit", description: "Vaše vědomí je založeno na pocitech. Cítíte energie a nálady kolem sebe." },
  Thinking: { name: "Myšlení", description: "Vaše vědomí pracuje skrze myšlení a analýzu. Potřebujete věci promyslet." },
  Emotion: { name: "Emoce", description: "Vaše vědomí je emocionální. Prožíváte svět skrze emoce a nálady." },
  Meditation: { name: "Meditace", description: "Vaše vědomí pracuje v tichu a klidu. Meditativní stavy vám přinášejí jasnost." },
};

export default function VariablesAnalysis() {
  const { isAuthenticated } = useAuth();
  const { locale } = useLanguage();

  useEffect(() => {
    if (locale === "en") {
      document.title = "🧬 Human Design Variables — Digestion, Environment & PHS 🌿";
      document.querySelector('meta[name="description"]')?.setAttribute(
        "content",
        "Explore your Human Design Variables: digestion type, environment, perspective, and awareness. Deep PHS analysis for optimal living."
      );
    } else {
      document.title = "🧬 Human Design Proměnné — Trávení, Prostředí & PHS 🌿";
      document.querySelector('meta[name="description"]')?.setAttribute(
        "content",
        "Prozkoumejte své Human Design Proměnné: typ trávení, prostředí, perspektivu a vědomí. Hluboká PHS analýza pro optimální život."
      );
    }
  }, [locale]);

  const [selectedChartId, setSelectedChartId] = useState<string>("");

  const chartsQuery = trpc.chart.list.useQuery(undefined, { enabled: isAuthenticated });

  const selectedChart = useMemo(() => {
    if (!selectedChartId || !chartsQuery.data) return null;
    return chartsQuery.data.find(c => c.id === parseInt(selectedChartId));
  }, [selectedChartId, chartsQuery.data]);

  const chartData = selectedChart?.chartData as any;
  const variables = chartData?.variables;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="container max-w-2xl text-center">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <UtensilsCrossed className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-serif font-bold mb-4">Proměnné (Variables)</h1>
            <p className="text-muted-foreground mb-8">
              Přihlaste se pro podrobnou analýzu vašich proměnných — trávení, prostředí, perspektiva a vědomí.
            </p>
            <a href={getLoginUrl()}>
              <Button size="lg" className="gap-2">
                <LogIn className="w-5 h-5" />
                Přihlásit se
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
              <Sparkles className="w-4 h-4" />
              Pokročilá analýza
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
              Proměnné (Variables)
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Proměnné jsou nejhlubší vrstvou Human Designu. Určují vaše ideální stravování (PHS), prostředí, perspektivu a vědomí.
            </p>
          </motion.div>

          {/* Chart selector */}
          <div className="max-w-md mx-auto mb-10">
            <Select value={selectedChartId} onValueChange={setSelectedChartId}>
              <SelectTrigger>
                <SelectValue placeholder="Vyberte uloženou mapu..." />
              </SelectTrigger>
              <SelectContent>
                {chartsQuery.data?.map(chart => (
                  <SelectItem key={chart.id} value={chart.id.toString()}>
                    {chart.name} ({chart.birthDate})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {variables ? (
            <Tabs defaultValue="digestion" className="space-y-6">
              <TabsList className="grid grid-cols-4 w-full max-w-2xl mx-auto">
                <TabsTrigger value="digestion" className="gap-1.5">
                  <UtensilsCrossed className="w-4 h-4" />
                  <span className="hidden sm:inline">Trávení</span>
                </TabsTrigger>
                <TabsTrigger value="environment" className="gap-1.5">
                  <MapPin className="w-4 h-4" />
                  <span className="hidden sm:inline">Prostředí</span>
                </TabsTrigger>
                <TabsTrigger value="perspective" className="gap-1.5">
                  <Eye className="w-4 h-4" />
                  <span className="hidden sm:inline">Perspektiva</span>
                </TabsTrigger>
                <TabsTrigger value="awareness" className="gap-1.5">
                  <Brain className="w-4 h-4" />
                  <span className="hidden sm:inline">Vědomí</span>
                </TabsTrigger>
              </TabsList>

              {/* Digestion Tab */}
              <TabsContent value="digestion">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                          <UtensilsCrossed className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">Trávení (PHS)</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            Váš typ: <strong>{variables.digestion?.type || "Neznámý"}</strong>
                            {variables.digestion?.arrow && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                {variables.digestion.arrow === "left" ? "← Levá" : "→ Pravá"} šipka
                              </Badge>
                            )}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {(() => {
                        const dType = variables.digestion?.type;
                        const data = dType && DIGESTION_TYPES[dType];
                        if (!data) return <p className="text-muted-foreground">Data o trávení nejsou k dispozici pro tento typ.</p>;
                        return (
                          <>
                            <p className="text-sm leading-relaxed">{data.description}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                                <h4 className="text-sm font-semibold text-amber-800 mb-2">Praktické tipy</h4>
                                <ul className="space-y-1.5">
                                  {data.tips.map((tip: string, i: number) => (
                                    <li key={i} className="text-xs text-amber-700 flex items-start gap-2">
                                      <span className="text-amber-500 mt-0.5">•</span>
                                      {tip}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                                <h4 className="text-sm font-semibold text-green-800 mb-2">Doporučené potraviny</h4>
                                <div className="flex flex-wrap gap-1.5">
                                  {data.foods.map((food: string, i: number) => (
                                    <Badge key={i} variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300">
                                      {food}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="p-4 rounded-lg bg-muted/50 border">
                              <h4 className="text-sm font-semibold mb-2">Šipka: {variables.digestion?.arrow === "left" ? "Levá ←" : "Pravá →"}</h4>
                              <p className="text-xs text-muted-foreground">
                                {variables.digestion?.arrow === "left"
                                  ? "Levá šipka znamená aktivní, strategický přístup k trávení. Vědomě si vybíráte, co a jak jíte."
                                  : "Pravá šipka znamená pasivní, receptivní přístup. Nechte své tělo vést — ono ví, co potřebuje."}
                              </p>
                            </div>
                          </>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              {/* Environment Tab */}
              <TabsContent value="environment">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                          <MapPin className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">Prostředí</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            Váš typ: <strong>{variables.environment?.type || "Neznámý"}</strong>
                            {variables.environment?.arrow && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                {variables.environment.arrow === "left" ? "← Levá" : "→ Pravá"} šipka
                              </Badge>
                            )}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const eType = variables.environment?.type;
                        const data = eType && ENVIRONMENT_TYPES[eType];
                        if (!data) return <p className="text-muted-foreground">Data o prostředí nejsou k dispozici.</p>;
                        return (
                          <>
                            <p className="text-sm leading-relaxed mb-4">{data.description}</p>
                            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                              <h4 className="text-sm font-semibold text-emerald-800 mb-2">Praktické tipy</h4>
                              <ul className="space-y-1.5">
{data.tips.map((tip: string, i: number) => (
                                    <li key={i} className="text-xs text-emerald-700 flex items-start gap-2">
                                    <span className="text-emerald-500 mt-0.5">•</span>
                                    {tip}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              {/* Perspective Tab */}
              <TabsContent value="perspective">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                          <Eye className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">Perspektiva</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            Váš typ: <strong>{variables.perspective?.type || "Neznámý"}</strong>
                            {variables.perspective?.arrow && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                {variables.perspective.arrow === "left" ? "← Levá" : "→ Pravá"} šipka
                              </Badge>
                            )}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const pType = variables.perspective?.type;
                        const data = pType && PERSPECTIVE_TYPES[pType];
                        if (!data) return <p className="text-muted-foreground">Data o perspektivě nejsou k dispozici.</p>;
                        return (
                          <p className="text-sm leading-relaxed">{data.description}</p>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              {/* Awareness Tab */}
              <TabsContent value="awareness">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                          <Brain className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">Vědomí (Awareness)</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            Váš typ: <strong>{variables.awareness?.type || "Neznámý"}</strong>
                            {variables.awareness?.arrow && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                {variables.awareness.arrow === "left" ? "← Levá" : "→ Pravá"} šipka
                              </Badge>
                            )}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const aType = variables.awareness?.type;
                        const data = aType && AWARENESS_TYPES[aType];
                        if (!data) return <p className="text-muted-foreground">Data o vědomí nejsou k dispozici.</p>;
                        return (
                          <p className="text-sm leading-relaxed">{data.description}</p>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
            </Tabs>
          ) : selectedChartId ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">
                  Tato mapa nemá vypočítané proměnné. Zkuste vybrat jinou mapu nebo přepočítat tuto mapu.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Sparkles className="w-12 h-12 text-primary/30 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Vyberte mapu</h3>
                <p className="text-muted-foreground">
                  Vyberte uloženou Human Design mapu pro zobrazení podrobné analýzy proměnných.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
