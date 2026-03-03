import { useParams, useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Compass, ArrowLeft, Sparkles, Users, Zap, Shield, Target, Heart, Brain } from "lucide-react";
import { useEffect } from "react";

const TYPE_DATA: Record<string, {
  name: string;
  czName: string;
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
}> = {
  generator: {
    name: "Generator",
    czName: "Generátor",
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
    czName: "Manifestující Generátor",
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
    czName: "Projektor",
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
    czName: "Manifestor",
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
    czName: "Reflektor",
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

export default function TypeDetail() {
  const params = useParams<{ type: string }>();
  const [, navigate] = useLocation();
  const typeKey = params.type || "";
  const typeInfo = TYPE_DATA[typeKey];

  useEffect(() => {
    if (typeInfo) {
      document.title = typeInfo.metaTitle;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute("content", typeInfo.metaDescription);
      else {
        const meta = document.createElement("meta");
        meta.name = "description";
        meta.content = typeInfo.metaDescription;
        document.head.appendChild(meta);
      }
    }
  }, [typeInfo]);

  if (!typeInfo) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="container pt-24 pb-16 text-center">
          <h1 className="font-serif text-3xl font-bold mb-4">Typ nenalezen</h1>
          <Button onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zpět na hlavní stránku
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
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zpět
          </Button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <Badge className={`${typeInfo.bgColor} ${typeInfo.textColor} ${typeInfo.borderColor} border mb-4`}>
                {typeInfo.percentage} populace
              </Badge>
              <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4" style={{ color: typeInfo.color }}>
                {typeInfo.czName}
              </h1>
              <p className="text-lg text-muted-foreground mb-2">{typeInfo.role}</p>
              <p className="text-base leading-relaxed mb-6">{typeInfo.description}</p>
              <Button onClick={() => navigate("/calculate")} className="bg-primary text-primary-foreground" size="lg">
                <Compass className="w-5 h-5 mr-2" />
                Zjistit svůj typ zdarma
              </Button>
            </div>
            <div className="flex justify-center">
              <img
                src={typeInfo.imgUrl}
                alt={`${typeInfo.czName} — Human Design aura`}
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
          <h2 className="font-serif text-3xl font-bold text-center mb-10">Klíčové vlastnosti</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center border-border/50">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: typeInfo.color + "20" }}>
                  <Target className="w-6 h-6" style={{ color: typeInfo.color }} />
                </div>
                <p className="text-sm text-muted-foreground mb-1">Strategie</p>
                <p className="font-semibold">{typeInfo.strategy}</p>
              </CardContent>
            </Card>
            <Card className="text-center border-border/50">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: typeInfo.color + "20" }}>
                  <Heart className="w-6 h-6" style={{ color: typeInfo.color }} />
                </div>
                <p className="text-sm text-muted-foreground mb-1">Signatura</p>
                <p className="font-semibold">{typeInfo.signature}</p>
              </CardContent>
            </Card>
            <Card className="text-center border-border/50">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: typeInfo.color + "20" }}>
                  <Shield className="w-6 h-6" style={{ color: typeInfo.color }} />
                </div>
                <p className="text-sm text-muted-foreground mb-1">Ne-self téma</p>
                <p className="font-semibold">{typeInfo.notSelfTheme}</p>
              </CardContent>
            </Card>
            <Card className="text-center border-border/50">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: typeInfo.color + "20" }}>
                  <Sparkles className="w-6 h-6" style={{ color: typeInfo.color }} />
                </div>
                <p className="text-sm text-muted-foreground mb-1">Aura</p>
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
                  Silné stránky
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
                  Výzvy
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
            Známé osobnosti — {typeInfo.czName}
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
            Jste {typeInfo.czName}?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Zjistěte svůj Human Design typ, strategii, autoritu a získejte personalizovaný AI rozbor zdarma.
          </p>
          <Button onClick={() => navigate("/calculate")} size="lg" className="bg-primary text-primary-foreground text-lg px-8 py-6">
            <Compass className="w-5 h-5 mr-2" />
            Vytvořit moji mapu zdarma
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
