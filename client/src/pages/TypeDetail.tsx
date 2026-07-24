import { useParams, useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Compass, ArrowLeft, Sparkles, Users, Zap, Shield, Target, Heart, Brain } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";

interface TypeInfo {
  name: string;
  localName: string;
  color: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  percentage: string;
  strategy: string;
  notSelfTheme: string;
  signature: string;
  aura: string;
  role: string;
  description: string;
  strengths: string[];
  challenges: string[];
  famousPeople: string[];
  imgUrl: string;
  metaTitle: string;
  metaDescription: string;
}

const TYPE_DATA_CS: Record<string, TypeInfo> = {
  generator: {
    name: "Generator",
    localName: "Generátor",
    color: "#C8902E",
    bgColor: "bg-amber-50",
    textColor: "text-amber-700",
    borderColor: "border-amber-200",
    percentage: "37%",
    strategy: "Reagovat na život",
    notSelfTheme: "Frustrace",
    signature: "Uspokojení",
    aura: "Otevřená a objímající — přitahuje k sobě život",
    role: "Budovatel a tvůrce",
    description: "Generátoři jsou životní silou planety. Mají konzistentní přístup k sakrální energii, která jim dává vytrvalost a schopnost pracovat na tom, co je skutečně naplňuje. Jejich klíčem je čekat na správné podněty a reagovat na ně svým sakrálním centrem — pocitem \"aha\" nebo \"ne-e\". Když Generátor dělá práci, která ho baví, je neúnavný a jeho energie je nakažlivá.",
    strengths: [
      "Obrovská pracovní kapacita a vytrvalost",
      "Silná sakrální energie — vnitřní kompas",
      "Schopnost zvládnout dlouhodobé projekty",
      "Magnetická aura přitahující správné příležitosti",
      "Přirozená schopnost tvořit a budovat",
    ],
    challenges: [
      "Tendence iniciovat místo reagovat",
      "Frustrace, když dělají špatnou práci",
      "Obtížné říkat ne — vyčerpání",
      "Netrpělivost s čekáním na správný podnět",
    ],
    famousPeople: ["Albert Einstein", "Dalai Lama", "Mozart", "Oprah Winfrey", "Meghan Markle"],
    imgUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663032296198/IxAVlaOWqHGkhytp.webp",
    metaTitle: "Generátor v Human Design | Typ, Strategie, Aura",
    metaDescription: "Generátor je nejčastější Human Design typ (37% populace). Zjistěte svou strategii, sakrální autoritu a jak žít v souladu se svou energií.",
  },
  "manifesting-generator": {
    name: "Manifesting Generator",
    localName: "Manifestující Generátor",
    color: "#E8652B",
    bgColor: "bg-orange-50",
    textColor: "text-orange-700",
    borderColor: "border-orange-200",
    percentage: "33%",
    strategy: "Reagovat a informovat",
    notSelfTheme: "Frustrace a hněv",
    signature: "Uspokojení a mír",
    aura: "Otevřená a objímající s průraznou silou",
    role: "Rychlý tvůrce a iniciátor",
    description: "Manifestující Generátoři jsou hybridní typ kombinující energii Generátora s průrazností Manifestora. Jsou to multi-talentovaní lidé, kteří často dělají více věcí najednou a přeskakují kroky. Jejich strategie je reagovat a pak informovat okolí o svých záměrech. Jsou nejrychlejší ze všech typů a mají schopnost efektivně zkracovat procesy.",
    strengths: [
      "Multi-tasking a schopnost dělat více věcí najednou",
      "Rychlost a efektivita v práci",
      "Kombinace sakrální energie s manifestační silou",
      "Přirozená schopnost najít zkratky",
      "Adaptabilita a flexibilita",
    ],
    challenges: [
      "Tendence přeskakovat důležité kroky",
      "Obtížné se soustředit na jednu věc",
      "Zapomínání informovat ostatní",
      "Netrpělivost s pomalými procesy",
    ],
    famousPeople: ["Angelina Jolie", "Freddie Mercury", "Tony Robbins", "Sachin Tendulkar", "Clint Eastwood"],
    imgUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663032296198/qWsAFzAtJmYBPSzE.webp",
    metaTitle: "Manifestující Generátor v Human Design | Typ, Strategie",
    metaDescription: "Manifestující Generátor tvoří 33% populace. Kombinuje sakrální energii s manifestační silou. Zjistěte svou strategii a jak žít autenticky.",
  },
  projector: {
    name: "Projector",
    localName: "Projektor",
    color: "#7C3AED",
    bgColor: "bg-violet-50",
    textColor: "text-violet-700",
    borderColor: "border-violet-200",
    percentage: "20%",
    strategy: "Čekat na pozvání",
    notSelfTheme: "Hořkost",
    signature: "Úspěch",
    aura: "Zaměřená a pronikavá — vidí do druhých",
    role: "Průvodce a vizionář",
    description: "Projektoři jsou přirození průvodci a vůdci nové éry. Nemají konzistentní sakrální energii, ale mají unikátní schopnost vidět do systémů a lidí. Jejich aura je zaměřená a pronikavá — dokáží přesně identifikovat, kde je problém a jak ho vyřešit. Klíčem k jejich úspěchu je čekat na uznání a pozvání, než začnou sdílet svou moudrost.",
    strengths: [
      "Hluboký vhled do lidí a systémů",
      "Přirozené vůdcovské schopnosti",
      "Schopnost efektivně řídit energii druhých",
      "Moudrost a strategické myšlení",
      "Talent pro optimalizaci procesů",
    ],
    challenges: [
      "Čekání na pozvání je obtížné",
      "Hořkost, když nejsou uznáni",
      "Tendence dávat nevyžádané rady",
      "Vyčerpání z přepracování (nemají sakrální energii)",
    ],
    famousPeople: ["Barack Obama", "Marilyn Monroe", "Nelson Mandela", "Mick Jagger", "Osho"],
    imgUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663032296198/uyvogIBNHAiNkHXh.webp",
    metaTitle: "Projektor v Human Design | Typ, Strategie, Pozvání",
    metaDescription: "Projektor tvoří 20% populace. Průvodce a vizionář se zaměřenou aurou. Zjistěte strategii čekání na pozvání a jak dosáhnout úspěchu.",
  },
  manifestor: {
    name: "Manifestor",
    localName: "Manifestor",
    color: "#059669",
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-700",
    borderColor: "border-emerald-200",
    percentage: "9%",
    strategy: "Informovat před akcí",
    notSelfTheme: "Hněv",
    signature: "Mír",
    aura: "Uzavřená a odpuzující — chrání nezávislost",
    role: "Iniciátor a katalyzátor",
    description: "Manifestoři jsou jediný typ, který může skutečně iniciovat. Mají uzavřenou a odpuzující auru, která jim dává nezávislost a schopnost jednat bez čekání na ostatní. Jsou to katalyzátoři změn — přicházejí, spouštějí procesy a jdou dál. Jejich strategie je informovat okolí o svých záměrech, ne žádat o svolení, ale dát ostatním vědět, co se chystají udělat.",
    strengths: [
      "Schopnost iniciovat a spouštět nové věci",
      "Nezávislost a samostatnost",
      "Silná vůle a odhodlání",
      "Přirozený dopad na okolí",
      "Schopnost prolomit bariéry",
    ],
    challenges: [
      "Tendence nechtít informovat ostatní",
      "Hněv, když jsou omezováni",
      "Obtížné pracovat v týmu",
      "Nepochopení ze strany ostatních typů",
    ],
    famousPeople: ["Johnny Depp", "Adolf Hitler", "Jack Nicholson", "Robert De Niro", "George W. Bush"],
    imgUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663032296198/rMbULSgMTGcVzRZZ.webp",
    metaTitle: "Manifestor v Human Design | Typ, Strategie, Iniciátor",
    metaDescription: "Manifestor tvoří 9% populace. Jediný typ schopný iniciovat. Zjistěte strategii informování a jak žít v míru se svou silou.",
  },
  reflector: {
    name: "Reflector",
    localName: "Reflektor",
    color: "#6B7280",
    bgColor: "bg-slate-50",
    textColor: "text-slate-700",
    borderColor: "border-slate-200",
    percentage: "1%",
    strategy: "Čekat na lunární cyklus",
    notSelfTheme: "Zklamání",
    signature: "Překvapení",
    aura: "Odolná a vzorkující — zrcadlí prostředí",
    role: "Zrcadlo a pozorovatel",
    description: "Reflektoři jsou nejřidší typ v Human Design — tvoří pouze 1% populace. Nemají žádné definované centrum, což z nich dělá dokonalé zrcadlo svého prostředí. Jsou extrémně citliví na energie kolem sebe a dokáží přesně odrážet zdraví komunity. Jejich strategie je čekat celý lunární cyklus (28 dní) před důležitými rozhodnutími, protože jejich zkušenost se mění den ode dne.",
    strengths: [
      "Unikátní schopnost vnímat prostředí",
      "Objektivní pohled na komunitu a skupiny",
      "Moudrost z rozmanitosti zkušeností",
      "Schopnost být spravedlivým soudcem",
      "Hluboká empatie a citlivost",
    ],
    challenges: [
      "Obtížné najít vlastní identitu",
      "Extrémní citlivost na prostředí",
      "28denní rozhodovací cyklus je náročný",
      "Zklamání z nezdravých komunit",
    ],
    famousPeople: ["Sandra Bullock", "Fyodor Dostoevsky", "Uri Geller", "H.G. Wells"],
    imgUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663032296198/UWRWlEUvFOKUinyN.webp",
    metaTitle: "Reflektor v Human Design | Nejřidší typ, Lunární cyklus",
    metaDescription: "Reflektor tvoří pouhé 1% populace. Zrcadlo komunity s unikátní aurou. Zjistěte strategii lunárního cyklu a svou roli pozorovatele.",
  },
};

const TYPE_DATA_EN: Record<string, TypeInfo> = {
  generator: {
    name: "Generator",
    localName: "Generator",
    color: "#C8902E",
    bgColor: "bg-amber-50",
    textColor: "text-amber-700",
    borderColor: "border-amber-200",
    percentage: "37%",
    strategy: "To respond to life",
    notSelfTheme: "Frustration",
    signature: "Satisfaction",
    aura: "Open and enveloping — attracts life towards itself",
    role: "Builder and creator",
    description: "Generators are the life force of the planet. They have consistent access to sacral energy, giving them endurance and the ability to work on what truly fulfills them. Their key is to wait for the right stimuli and respond with their sacral center — that gut feeling of \"uh-huh\" or \"un-un\". When a Generator does work they love, they are tireless and their energy is contagious.",
    strengths: [
      "Enormous work capacity and endurance",
      "Strong sacral energy — inner compass",
      "Ability to sustain long-term projects",
      "Magnetic aura attracting the right opportunities",
      "Natural ability to create and build",
    ],
    challenges: [
      "Tendency to initiate instead of responding",
      "Frustration when doing the wrong work",
      "Difficulty saying no — leads to exhaustion",
      "Impatience with waiting for the right stimulus",
    ],
    famousPeople: ["Albert Einstein", "Dalai Lama", "Mozart", "Oprah Winfrey", "Meghan Markle"],
    imgUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663032296198/IxAVlaOWqHGkhytp.webp",
    metaTitle: "Generator in Human Design | Type, Strategy, Aura",
    metaDescription: "Generator is the most common Human Design type (37% of population). Discover your strategy, sacral authority, and how to live in alignment with your energy.",
  },
  "manifesting-generator": {
    name: "Manifesting Generator",
    localName: "Manifesting Generator",
    color: "#E8652B",
    bgColor: "bg-orange-50",
    textColor: "text-orange-700",
    borderColor: "border-orange-200",
    percentage: "33%",
    strategy: "To respond and inform",
    notSelfTheme: "Frustration and anger",
    signature: "Satisfaction and peace",
    aura: "Open and enveloping with initiating power",
    role: "Fast creator and initiator",
    description: "Manifesting Generators are a hybrid type combining Generator energy with Manifestor's initiating power. They are multi-talented people who often do multiple things at once and skip steps. Their strategy is to respond and then inform others of their intentions. They are the fastest of all types and have the ability to efficiently shortcut processes.",
    strengths: [
      "Multi-tasking and ability to do several things at once",
      "Speed and efficiency in work",
      "Combination of sacral energy with manifesting power",
      "Natural ability to find shortcuts",
      "Adaptability and flexibility",
    ],
    challenges: [
      "Tendency to skip important steps",
      "Difficulty focusing on one thing",
      "Forgetting to inform others",
      "Impatience with slow processes",
    ],
    famousPeople: ["Angelina Jolie", "Freddie Mercury", "Tony Robbins", "Sachin Tendulkar", "Clint Eastwood"],
    imgUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663032296198/qWsAFzAtJmYBPSzE.webp",
    metaTitle: "Manifesting Generator in Human Design | Type, Strategy",
    metaDescription: "Manifesting Generator makes up 33% of the population. Combines sacral energy with manifesting power. Discover your strategy and how to live authentically.",
  },
  projector: {
    name: "Projector",
    localName: "Projector",
    color: "#7C3AED",
    bgColor: "bg-violet-50",
    textColor: "text-violet-700",
    borderColor: "border-violet-200",
    percentage: "20%",
    strategy: "Wait for the invitation",
    notSelfTheme: "Bitterness",
    signature: "Success",
    aura: "Focused and penetrating — sees into others",
    role: "Guide and visionary",
    description: "Projectors are natural guides and leaders of the new era. They don't have consistent sacral energy, but they have a unique ability to see into systems and people. Their aura is focused and penetrating — they can precisely identify where the problem is and how to solve it. The key to their success is waiting for recognition and invitation before sharing their wisdom.",
    strengths: [
      "Deep insight into people and systems",
      "Natural leadership abilities",
      "Ability to effectively manage others' energy",
      "Wisdom and strategic thinking",
      "Talent for optimizing processes",
    ],
    challenges: [
      "Waiting for invitation is difficult",
      "Bitterness when not recognized",
      "Tendency to give unsolicited advice",
      "Exhaustion from overworking (no sacral energy)",
    ],
    famousPeople: ["Barack Obama", "Marilyn Monroe", "Nelson Mandela", "Mick Jagger", "Osho"],
    imgUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663032296198/uyvogIBNHAiNkHXh.webp",
    metaTitle: "Projector in Human Design | Type, Strategy, Invitation",
    metaDescription: "Projector makes up 20% of the population. Guide and visionary with a focused aura. Discover the strategy of waiting for invitation and how to achieve success.",
  },
  manifestor: {
    name: "Manifestor",
    localName: "Manifestor",
    color: "#059669",
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-700",
    borderColor: "border-emerald-200",
    percentage: "9%",
    strategy: "To inform before acting",
    notSelfTheme: "Anger",
    signature: "Peace",
    aura: "Closed and repelling — protects independence",
    role: "Initiator and catalyst",
    description: "Manifestors are the only type that can truly initiate. They have a closed and repelling aura that gives them independence and the ability to act without waiting for others. They are catalysts of change — they arrive, start processes, and move on. Their strategy is to inform those around them of their intentions, not to ask permission, but to let others know what they're about to do.",
    strengths: [
      "Ability to initiate and start new things",
      "Independence and self-sufficiency",
      "Strong will and determination",
      "Natural impact on surroundings",
      "Ability to break through barriers",
    ],
    challenges: [
      "Tendency to not want to inform others",
      "Anger when restricted",
      "Difficulty working in teams",
      "Misunderstanding from other types",
    ],
    famousPeople: ["Johnny Depp", "Adolf Hitler", "Jack Nicholson", "Robert De Niro", "George W. Bush"],
    imgUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663032296198/rMbULSgMTGcVzRZZ.webp",
    metaTitle: "Manifestor in Human Design | Type, Strategy, Initiator",
    metaDescription: "Manifestor makes up 9% of the population. The only type capable of initiating. Discover the strategy of informing and how to live in peace with your power.",
  },
  reflector: {
    name: "Reflector",
    localName: "Reflector",
    color: "#6B7280",
    bgColor: "bg-slate-50",
    textColor: "text-slate-700",
    borderColor: "border-slate-200",
    percentage: "1%",
    strategy: "Wait for a lunar cycle",
    notSelfTheme: "Disappointment",
    signature: "Surprise",
    aura: "Resistant and sampling — mirrors the environment",
    role: "Mirror and observer",
    description: "Reflectors are the rarest type in Human Design — making up only 1% of the population. They have no defined centers, making them a perfect mirror of their environment. They are extremely sensitive to energies around them and can precisely reflect the health of a community. Their strategy is to wait an entire lunar cycle (28 days) before making important decisions, because their experience changes day by day.",
    strengths: [
      "Unique ability to perceive the environment",
      "Objective perspective on community and groups",
      "Wisdom from diversity of experiences",
      "Ability to be a fair judge",
      "Deep empathy and sensitivity",
    ],
    challenges: [
      "Difficulty finding own identity",
      "Extreme sensitivity to environment",
      "28-day decision cycle is demanding",
      "Disappointment from unhealthy communities",
    ],
    famousPeople: ["Sandra Bullock", "Fyodor Dostoevsky", "Uri Geller", "H.G. Wells"],
    imgUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663032296198/UWRWlEUvFOKUinyN.webp",
    metaTitle: "Reflector in Human Design | Rarest Type, Lunar Cycle",
    metaDescription: "Reflector makes up only 1% of the population. Community mirror with a unique aura. Discover the lunar cycle strategy and your role as an observer.",
  },
};

// UI labels per locale
const LABELS = {
  cs: {
    typeNotFound: "Typ nenalezen",
    back: "Zpět",
    backToHome: "Zpět na hlavní stránku",
    population: "populace",
    keyProperties: "Klíčové vlastnosti",
    strategy: "Strategie",
    signature: "Signatura",
    notSelfTheme: "Ne-self téma",
    aura: "Aura",
    strengths: "Silné stránky",
    challenges: "Výzvy",
    famousPeople: "Známé osobnosti",
    areYou: "Jste",
    ctaDesc: "Zjistěte svůj Human Design typ, strategii, autoritu a získejte personalizovaný AI rozbor zdarma.",
    ctaButton: "Vytvořit moji mapu zdarma",
    discoverType: "Zjistit svůj typ zdarma",
  },
  en: {
    typeNotFound: "Type not found",
    back: "Back",
    backToHome: "Back to home page",
    population: "of population",
    keyProperties: "Key Properties",
    strategy: "Strategy",
    signature: "Signature",
    notSelfTheme: "Not-Self Theme",
    aura: "Aura",
    strengths: "Strengths",
    challenges: "Challenges",
    famousPeople: "Famous People",
    areYou: "Are you a",
    ctaDesc: "Discover your Human Design type, strategy, authority, and get a personalized AI reading for free.",
    ctaButton: "Create my chart for free",
    discoverType: "Discover your type for free",
  },
};

export default function TypeDetail({ type: propType }: { type?: string } = {}) {
  const params = useParams<{ type: string }>();
  const [, navigate] = useLocation();
  const { locale, localePath } = useLanguage();
  const typeKey = propType || params.type || "";

  const typeData = locale === "en" ? TYPE_DATA_EN : TYPE_DATA_CS;
  const labels = LABELS[locale];
  const typeInfo = typeData[typeKey];

  useSEO(typeInfo ? {
    title: typeInfo.metaTitle,
    description: typeInfo.metaDescription,
    keywords: `human design ${typeKey}, ${typeInfo.localName}, ${typeInfo.name} type, ${typeInfo.strategy}, ${typeInfo.aura}`,
    ogType: "website",
    locale: locale === "en" ? "en_US" : "cs_CZ",
  } : {
    title: locale === "en" ? "Human Design Type — Generator, Projector, Manifestor & Reflector" : "Human Design Typ — Generátor, Projektor, Manifestor & Reflektor",
    description: locale === "en" ? "Learn about all Human Design types: Generator, Manifesting Generator, Projector, Manifestor, and Reflector." : "Přečtěte si o všech Human Design typech: Generátor, Manifestující Generátor, Projektor, Manifestor a Reflektor.",
    ogType: "website",
    locale: locale === "en" ? "en_US" : "cs_CZ",
  });

  if (!typeInfo) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="container pt-24 pb-16 text-center">
          <h1 className="font-serif text-3xl font-bold mb-4">{labels.typeNotFound}</h1>
          <Button onClick={() => navigate(localePath("/"))}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {labels.backToHome}
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Hero */}
      <section className={`pt-24 pb-16 ${typeInfo.bgColor}`}>
        <div className="container">
          <Button variant="ghost" size="sm" onClick={() => navigate(localePath("/"))} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {labels.back}
          </Button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <Badge className={`${typeInfo.bgColor} ${typeInfo.textColor} ${typeInfo.borderColor} border mb-4`}>
                {typeInfo.percentage} {labels.population}
              </Badge>
              <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4" style={{ color: typeInfo.color }}>
                {typeInfo.localName}
              </h1>
              <p className="text-lg text-muted-foreground mb-2">{typeInfo.role}</p>
              <p className="text-base leading-relaxed mb-6">{typeInfo.description}</p>
              <Button onClick={() => navigate(localePath("/calculate"))} className="bg-primary text-primary-foreground" size="lg">
                <Compass className="w-5 h-5 mr-2" />
                {labels.discoverType}
              </Button>
            </div>
            <div className="flex justify-center">
              <img
                src={typeInfo.imgUrl}
                alt={`${typeInfo.localName} — Human Design aura`}
                className="max-w-xs md:max-w-sm"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Key Info Cards */}
      <section className="py-16">
        <div className="container">
          <h2 className="font-serif text-3xl font-bold text-center mb-10">{labels.keyProperties}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center border-border/50">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: typeInfo.color + "20" }}>
                  <Target className="w-6 h-6" style={{ color: typeInfo.color }} />
                </div>
                <p className="text-sm text-muted-foreground mb-1">{labels.strategy}</p>
                <p className="font-semibold">{typeInfo.strategy}</p>
              </CardContent>
            </Card>
            <Card className="text-center border-border/50">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: typeInfo.color + "20" }}>
                  <Heart className="w-6 h-6" style={{ color: typeInfo.color }} />
                </div>
                <p className="text-sm text-muted-foreground mb-1">{labels.signature}</p>
                <p className="font-semibold">{typeInfo.signature}</p>
              </CardContent>
            </Card>
            <Card className="text-center border-border/50">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: typeInfo.color + "20" }}>
                  <Shield className="w-6 h-6" style={{ color: typeInfo.color }} />
                </div>
                <p className="text-sm text-muted-foreground mb-1">{labels.notSelfTheme}</p>
                <p className="font-semibold">{typeInfo.notSelfTheme}</p>
              </CardContent>
            </Card>
            <Card className="text-center border-border/50">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: typeInfo.color + "20" }}>
                  <Sparkles className="w-6 h-6" style={{ color: typeInfo.color }} />
                </div>
                <p className="text-sm text-muted-foreground mb-1">{labels.aura}</p>
                <p className="font-semibold text-sm">{typeInfo.aura}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Strengths & Challenges */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-border/50">
              <CardContent className="pt-6">
                <h3 className="font-serif text-xl font-bold mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5" style={{ color: typeInfo.color }} />
                  {labels.strengths}
                </h3>
                <ul className="space-y-3">
                  {typeInfo.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-1.5 w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: typeInfo.color }} />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="pt-6">
                <h3 className="font-serif text-xl font-bold mb-4 flex items-center gap-2">
                  <Brain className="w-5 h-5" style={{ color: typeInfo.color }} />
                  {labels.challenges}
                </h3>
                <ul className="space-y-3">
                  {typeInfo.challenges.map((c, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-1.5 w-2 h-2 rounded-full shrink-0 bg-muted-foreground/40" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Famous People */}
      <section className="py-16">
        <div className="container">
          <h2 className="font-serif text-2xl font-bold text-center mb-8">
            {labels.famousPeople} — {typeInfo.localName}
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {typeInfo.famousPeople.map((person) => (
              <Badge key={person} variant="outline" className="py-2 px-4 text-sm">
                <Users className="w-3.5 h-3.5 mr-1.5" />
                {person}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="container text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
            {labels.areYou} {typeInfo.localName}?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            {labels.ctaDesc}
          </p>
          <Button onClick={() => navigate(localePath("/calculate"))} size="lg" className="bg-primary text-primary-foreground text-lg px-8 py-6">
            <Compass className="w-5 h-5 mr-2" />
            {labels.ctaButton}
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
