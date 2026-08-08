import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Sparkles, Baby, ShieldCheck, Sun, Moon, ArrowRight, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "wouter";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function KidsHdGuide() {
  const { locale, localePath } = useLanguage();
  const isEn = locale === "en";

  const [childType, setChildType] = useState<"generator" | "projector" | "manifestor" | "reflector">("generator");

  const childGuides = {
    generator: {
      title: isEn ? "Child Generator (Sacral Spark)" : "Dítě Generátor (Sakrální Jiskra)",
      sleep: isEn ? "Needs to burn physical energy completely before sleep." : "Musí před spaním plně vytrávit fyzickou energii. Nechte ho vybláznit.",
      emotion: isEn ? "Ask closed YES/NO questions (Do you want apple or banana?)." : "Ptejte se uzavřenými otázkami ANO/NE (Chceš jablko nebo banán?).",
    },
    projector: {
      title: isEn ? "Child Projector (Sensitive Guide)" : "Dítě Projektor (Citlivý Průvodce)",
      sleep: isEn ? "Needs 30 mins in bed before sleep to discharge aura." : "Potřebuje ležet v posteli 30 min před spaním, aby vypustilo cizí energii.",
      emotion: isEn ? "Recognize their wisdom. Do not force physical marathon." : "Oceňujte jeho moudrost. Nenutit do fyzických maratónů.",
    },
    manifestor: {
      title: isEn ? "Child Manifestor (Independent Pioneer)" : "Dítě Manifestor (Nezávislý Průkopník)",
      sleep: isEn ? "Goes to bed when tired. Teach informing others." : "Chodí spát, když cítí únavu. Učte ho oznamovat předem.",
      emotion: isEn ? "Do not control. Teach informing instead of asking permission." : "Kultivujte oznamování před akcí. Kontrola vyvolává hněv.",
    },
    reflector: {
      title: isEn ? "Child Reflector (Mirror of the Family)" : "Dítě Reflektor (Zrcadlo Rodiny)",
      sleep: isEn ? "Extremely sensitive to bedroom environment." : "Extrémně citlivé na prostředí ložnice a čistotu energie.",
      emotion: isEn ? "Reflects the exact emotional atmosphere of parents." : "Zrcadlí přesnou atmosféru domova a náladu rodičů.",
    },
  };

  const active = childGuides[childType];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="flex-1 container max-w-4xl mx-auto px-4 py-8 space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-pink-100 dark:bg-pink-950/70 text-pink-700 dark:text-pink-300 text-xs font-bold">
            <Baby className="w-4 h-4 text-pink-500" />
            {isEn ? "Human Design Parenting Blueprint" : "Human Design Výchova Dětí pro Rodiče"}
          </div>

          <h1 className="text-3xl sm:text-5xl font-serif font-bold tracking-tight text-foreground">
            {isEn ? "Understand Your Child's Natural Design" : "Rozumějte Přirozenému Designu Vašeho Dítěte"}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            {isEn
              ? "Discover how your child processes emotions, sleeps, and learns — without pressure or shouting."
              : "Objevte, jak vaše dítě zpracovává emoce, jak správně uléhat k ke spánku a jak s ním komunikovat v harmonii."}
          </p>
        </div>

        {/* Child HD Type Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { id: "generator", label: isEn ? "Generator" : "Generátor / MG" },
            { id: "projector", label: isEn ? "Projector" : "Projektor" },
            { id: "manifestor", label: isEn ? "Manifestor" : "Manifestor" },
            { id: "reflector", label: isEn ? "Reflector" : "Reflektor" },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setChildType(t.id as any)}
              className={`p-4 rounded-2xl border text-xs font-bold transition-all ${
                childType === t.id
                  ? "ring-2 ring-pink-500 bg-pink-500/10 border-pink-500 text-pink-600 dark:text-pink-300 shadow-md"
                  : "border-border/60 bg-card hover:bg-muted"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Dynamic Parenting Guide Card */}
        <Card className="border-2 border-pink-400/60 bg-gradient-to-br from-pink-950/20 via-background to-purple-950/20 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-widest text-pink-500">
              {isEn ? "Parenting Guide" : "Rodičovský Průvodce"}
            </span>
            <h3 className="text-2xl font-serif font-bold text-foreground">{active.title}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-muted/40 border border-border/50 space-y-2">
              <div className="flex items-center gap-2 font-bold text-pink-600 dark:text-pink-400">
                <Moon className="w-4 h-4" />
                {isEn ? "Spánek a Uléhání" : "Spánek & Spánková Mechanika"}
              </div>
              <p className="text-muted-foreground leading-relaxed">{active.sleep}</p>
            </div>

            <div className="p-4 rounded-2xl bg-muted/40 border border-border/50 space-y-2">
              <div className="flex items-center gap-2 font-bold text-purple-600 dark:text-purple-400">
                <Heart className="w-4 h-4" />
                {isEn ? "Komunikace & Emoce" : "Komunikace & Emoční Vlny"}
              </div>
              <p className="text-muted-foreground leading-relaxed">{active.emotion}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border/40">
            <div>
              <div className="font-bold text-sm text-foreground">
                {isEn ? "Full Child Human Design Report (+290 CZK)" : "Kompletní HD Rozbor Dítěte (+290 Kč)"}
              </div>
              <div className="text-xs text-muted-foreground">
                {isEn ? "20-page personalized PDF parenting manual" : "20stránkový osobně vygenerovaný PDF manuál pro rodiče"}
              </div>
            </div>

            <Button
              size="lg"
              className="bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs h-11 px-6 rounded-xl shadow-lg gap-2 shrink-0"
              asChild
            >
              <Link href={localePath("/pricing")}>
                <Sparkles className="w-4 h-4" />
                {isEn ? "Get Child Blueprint" : "Získat Dětský Blueprint"}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
