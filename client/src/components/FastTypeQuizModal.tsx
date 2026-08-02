import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, CheckCircle2, Compass, Zap } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "wouter";

interface FastTypeQuizModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FastTypeQuizModal({ open, onOpenChange }: FastTypeQuizModalProps) {
  const { locale, localePath } = useLanguage();
  const isEn = locale === "en";
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [resultType, setResultType] = useState<string | null>(null);

  const QUESTIONS = isEn
    ? [
        {
          q: "How do you feel at the end of a productive day?",
          options: [
            { text: "Satisfied and peacefully tired (I love doing what engages me)", type: "Generator" },
            { text: "Exhausted or bitter if others don't appreciate my guidance", type: "Projector" },
            { text: "Restless or angry if I felt restricted or blocked", type: "Manifestor" },
            { text: "Disappointed or surprised by how unpredictable people are", type: "Reflector" },
          ],
        },
        {
          q: "How do you naturally make your best life choices?",
          options: [
            { text: "By responding to opportunities with a gut feeling or emotion", type: "Generator" },
            { text: "When I am invited, recognized, or asked for advice", type: "Projector" },
            { text: "When I initiate independently and inform others first", type: "Manifestor" },
            { text: "By waiting out a full moon cycle before deciding", type: "Reflector" },
          ],
        },
        {
          q: "What is your main energy pattern in daily work?",
          options: [
            { text: "I have sustainable endurance for work I enjoy", type: "Generator" },
            { text: "I work in focused bursts; I need rest & efficiency", type: "Projector" },
            { text: "I am a powerful self-starter; I open new paths", type: "Manifestor" },
            { text: "I absorb and mirror the environment around me", type: "Reflector" },
          ],
        },
      ]
    : [
        {
          q: "Jak se cítíte na konci plodného dne?",
          options: [
            { text: "Spokojeně a příjemně unavení (baví mě dělat to, co dávám ze srdce)", type: "Generátor / M. Generátor" },
            { text: "Vyčerpaně či hořce, pokud druhí neocení mé vedení a rady", type: "Projektor" },
            { text: "Nedočkavě či naštvaně, pokud jsem cítil/a překážky a omezení", type: "Manifestor" },
            { text: "Zklamaně či překvapeně tím, jak jsou lidé nepředvídatelní", type: "Reflektor" },
          ],
        },
        {
          q: "Jak přirozeně děláte svá nejlepší životní rozhodnutí?",
          options: [
            { text: "Reagováním na příležitosti skrz vnitřní pocit či sakrální zvuky", type: "Generátor / M. Generátor" },
            { text: "Když jsem pozván/a, rozpoznán/a a požádán/a o radu", type: "Projektor" },
            { text: "Když sám/sama iniciuji a předem informuji své okolí", type: "Manifestor" },
            { text: "Když si dám čas a počkám měsíční cyklus bez spěchu", type: "Reflektor" },
          ],
        },
        {
          q: "Jaký je váš hlavní energetický styl při práci?",
          options: [
            { text: "Mám udržitelnou výdrž a motor pro činnosti, které mě baví", type: "Generátor / M. Generátor" },
            { text: "Pracuji v efektivních vlnách, potřebuji odpočinek a nadhled", type: "Projektor" },
            { text: "Jsem silný spouštěč věcí; prorážím nové cesty", type: "Manifestor" },
            { text: "Zrcadlím a vnímám energii a náladu celého prostředí", type: "Reflektor" },
          ],
        },
      ];

  const handleSelectOption = (type: string) => {
    if (step < QUESTIONS.length - 1) {
      setStep(prev => prev + 1);
    } else {
      setResultType(type);
      setStep(3);
    }
  };

  const handleReset = () => {
    setStep(0);
    setAnswers([]);
    setResultType(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-background border border-purple-300/30 rounded-3xl p-6 sm:p-8">
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-serif font-bold text-foreground">
            {isEn ? "30-Second Energy Type Quiz" : "Rychlý 30s Odhad HD Typu"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            {isEn
              ? "Don't know your exact birth time? Answer 3 quick questions to discover your probable Human Design Type."
              : "Nevíte přesný čas narození? Odpovězte 3 rychlé otázky a zjistěte váš pravděpodobný typ."}
          </DialogDescription>
        </DialogHeader>

        {step < 3 ? (
          <div className="space-y-4 my-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
              <span>{isEn ? `Question ${step + 1} of 3` : `Otázka ${step + 1} ze 3`}</span>
              <span>{Math.round(((step + 1) / 3) * 100)}%</span>
            </div>

            <h4 className="text-base font-semibold text-foreground leading-snug">
              {QUESTIONS[step].q}
            </h4>

            <div className="space-y-2.5 pt-2">
              {QUESTIONS[step].options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(opt.type)}
                  className="w-full text-left p-3.5 rounded-xl border border-border hover:border-purple-500/60 bg-muted/30 hover:bg-purple-50/20 dark:hover:bg-purple-950/20 transition-all text-xs font-medium text-foreground flex items-center justify-between group"
                >
                  <span>{opt.text}</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-purple-600 transition-colors shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center space-y-6 my-4">
            <div className="inline-flex p-4 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {isEn ? "Estimated Type" : "Váš Odhadovaný Typ"}
              </span>
              <h3 className="text-3xl font-bold font-serif text-purple-600 dark:text-purple-400">
                {resultType}
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {isEn
                  ? "Based on your energetic answers, this is your primary aura archetype. Calculate your exact chart to get complete 100% precision."
                  : "Podle vašich odpovědí odpovídáte tomuto energetickému archetypu. Spočcalculate svou přesnou mapu pro 100% přesnost."}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                variant="outline"
                onClick={handleReset}
                className="w-full text-xs"
              >
                {isEn ? "Retake Quiz" : "Zkusit znovu"}
              </Button>
              <Button
                className="w-full text-xs bg-purple-600 hover:bg-purple-700 text-white font-medium"
                onClick={() => onOpenChange(false)}
                asChild
              >
                <Link href={localePath("/calculate")}>
                  {isEn ? "Calculate Free Chart" : "Spočítat přesnou mapu"}
                </Link>
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
