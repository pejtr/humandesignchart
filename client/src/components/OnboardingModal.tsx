import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Sparkles, Brain, Star, ChevronRight, ChevronLeft } from "lucide-react";

interface OnboardingStep {
  icon: React.ReactNode;
  title: string;
  description: string;
  highlight: string;
  color: string;
}

interface OnboardingModalProps {
  chartType: string;
  chartProfile: string;
  chartAuthority: string;
  onClose: () => void;
  onRequestAiReading: () => void;
}

const STORAGE_KEY = "hd_onboarding_seen";

export function useOnboarding() {
  const [shouldShow, setShouldShow] = useState(false);

  const triggerOnboarding = () => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      setShouldShow(true);
    }
  };

  const markSeen = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setShouldShow(false);
  };

  return { shouldShow, triggerOnboarding, markSeen };
}

export default function OnboardingModal({
  chartType,
  chartProfile,
  chartAuthority,
  onClose,
  onRequestAiReading,
}: OnboardingModalProps) {
  const [step, setStep] = useState(0);

  const steps: OnboardingStep[] = [
    {
      icon: <Star className="w-8 h-8" />,
      title: `Jste ${chartType}`,
      description: `Váš typ určuje, jak vaše aura interaguje se světem a jaká je vaše správná strategie pro rozhodování a životní tok.`,
      highlight: `Typ je nejzákladnější informace ve vašem Human Design chartu.`,
      color: "#7c3aed",
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: `Vaše autorita: ${chartAuthority}`,
      description: `Autorita je váš vnitřní kompas — říká vám, jak dělat správná rozhodnutí. Není to mysl, ale tělesná inteligence.`,
      highlight: `Naučte se naslouchat své autoritě a rozhodování se stane přirozeným.`,
      color: "#2a9d8f",
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: "Získejte Hloubkový výklad",
      description: `Váš profil ${chartProfile} a inkarnační kříž odhalují vaše životní poslání. Hloubkový výklad vám vše vysvětlí srozumitelně v češtině.`,
      highlight: `Klikněte na "Hloubkový výklad vaší mapy" v pravém sloupci — je to první věc nahoře.`,
      color: "#d4af37",
    },
  ];

  const currentStep = steps[step];
  const isLast = step === steps.length - 1;

  const handleNext = () => {
    if (isLast) {
      onClose();
      onRequestAiReading();
    } else {
      setStep(s => s + 1);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="relative w-full max-w-md bg-background rounded-2xl shadow-2xl overflow-hidden"
        style={{ animation: "fadeSlideUp 0.3s ease-out" }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted transition-colors z-10"
          aria-label="Přeskočit průvodce"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 pt-6 pb-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === step ? "24px" : "8px",
                height: "8px",
                background: i === step ? currentStep.color : "#e2e8f0",
              }}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="px-8 py-6 text-center">
          {/* Icon */}
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg"
            style={{
              background: `${currentStep.color}20`,
              color: currentStep.color,
              boxShadow: `0 8px 32px ${currentStep.color}30`,
            }}
          >
            {currentStep.icon}
          </div>

          {/* Title */}
          <h2 className="font-serif text-2xl font-bold text-foreground mb-3">
            {currentStep.title}
          </h2>

          {/* Description */}
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            {currentStep.description}
          </p>

          {/* Highlight box */}
          <div
            className="rounded-xl px-4 py-3 mb-6 text-sm font-medium"
            style={{
              background: `${currentStep.color}12`,
              borderLeft: `3px solid ${currentStep.color}`,
              color: "#1a1a1a",
              textAlign: "left",
            }}
          >
            {currentStep.highlight}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between px-8 pb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => step > 0 ? setStep(s => s - 1) : onClose()}
            className="text-muted-foreground"
          >
            {step > 0 ? (
              <><ChevronLeft className="w-4 h-4 mr-1" /> Zpět</>
            ) : (
              "Přeskočit"
            )}
          </Button>

          <Button
            size="sm"
            onClick={handleNext}
            className="text-white px-5"
            style={{ background: currentStep.color, border: "none" }}
          >
            {isLast ? (
              <><Sparkles className="w-4 h-4 mr-1.5" /> Spustit Hloubkový výklad</>
            ) : (
              <>Další <ChevronRight className="w-4 h-4 ml-1" /></>
            )}
          </Button>
        </div>

        {/* Step counter */}
        <p className="text-center text-xs text-muted-foreground pb-4">
          Krok {step + 1} z {steps.length}
        </p>
      </div>
    </div>
  );
}
