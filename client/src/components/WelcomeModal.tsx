import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Sparkles, Gift, Compass, ChevronRight, ChevronLeft, Star } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

const STORAGE_KEY = "hd_welcome_seen_v2";

interface WelcomeModalProps {
  onClose: () => void;
}

export function useWelcomeModal() {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      // Small delay so the page loads first
      const timer = setTimeout(() => setShouldShow(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setShouldShow(false);
  };

  return { shouldShow, dismiss };
}

export default function WelcomeModal({ onClose }: WelcomeModalProps) {
  const { locale, localePath } = useLanguage();
  const isCs = locale === "cs";
  const [step, setStep] = useState(0);

  const steps = isCs
    ? [
        {
          icon: <Gift className="w-8 h-8" />,
          color: "#7c3aed",
          title: "Vítejte v Human Design!",
          description: "Vaše mapa je zdarma a první AI výklad k ní také. Stačí datum, čas a místo narození.",
          highlight: "Bez platební karty — pro výklad se stačí zdarma přihlásit.",
          cta: null,
        },
        {
          icon: <Compass className="w-8 h-8" />,
          color: "#2a9d8f",
          title: "Jak začít?",
          description: "Zadejte datum, čas a místo narození. Systém vygeneruje váš osobní bodygraph — mapu vaší energie.",
          highlight: "Přesný čas narození je důležitý. Pokud ho neznáte, zkuste dopoledne (9:00).",
          cta: { label: "Vytvořit mapu zdarma", href: "/calculate" },
        },
      ]
    : [
        {
          icon: <Gift className="w-8 h-8" />,
          color: "#7c3aed",
          title: "Welcome to Human Design!",
          description: "Your chart is free, and so is your first AI reading of it. All you need is your birth date, time and place.",
          highlight: "No card needed — just sign in for free to read it.",
          cta: null,
        },
        {
          icon: <Compass className="w-8 h-8" />,
          color: "#2a9d8f",
          title: "How to get started?",
          description: "Enter your date, time, and place of birth. The system generates your personal bodygraph — a map of your energy.",
          highlight: "Exact birth time matters. If unknown, try morning (9:00 AM).",
          cta: { label: "Create free chart", href: "/calculate" },
        },
      ];

  const current = steps[step];
  const isLast = step === steps.length - 1;

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    onClose();
  };

  const handleNext = () => {
    if (isLast) {
      handleClose();
    } else {
      setStep(s => s + 1);
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(8px)", zIndex: 99999 }}
    >
      <div
        className="relative w-full max-w-md bg-background rounded-2xl shadow-2xl overflow-hidden"
        style={{ animation: "fadeSlideUp 0.35s ease-out", zIndex: 100000 }}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted transition-colors z-10"
          aria-label={isCs ? "Přeskočit průvodce" : "Skip guide"}
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
                background: i === step ? current.color : "#e2e8f0",
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
              background: `${current.color}20`,
              color: current.color,
              boxShadow: `0 8px 32px ${current.color}30`,
            }}
          >
            {current.icon}
          </div>

          {/* Title */}
          <h2 className="font-serif text-2xl font-bold text-foreground mb-3">
            {current.title}
          </h2>

          {/* Description */}
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            {current.description}
          </p>

          {/* Highlight box */}
          <div
            className="rounded-xl px-4 py-3 mb-6 text-sm font-medium text-left"
            style={{
              background: `${current.color}10`,
              borderLeft: `3px solid ${current.color}`,
              color: "#1a1a1a",
            }}
          >
            <Star className="w-3.5 h-3.5 inline mr-1.5 opacity-70" style={{ color: current.color }} />
            {current.highlight}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between px-8 pb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => step > 0 ? setStep(s => s - 1) : handleClose()}
            className="text-muted-foreground"
          >
            {step > 0 ? (
              <><ChevronLeft className="w-4 h-4 mr-1" /> {isCs ? "Zpět" : "Back"}</>
            ) : (
              isCs ? "Přeskočit" : "Skip"
            )}
          </Button>

          {current.cta ? (
            <Link href={localePath(current.cta.href)}>
              <Button
                size="sm"
                className="text-white px-5"
                style={{ background: current.color, border: "none" }}
                onClick={handleClose}
              >
                {current.cta.label}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          ) : (
            <Button
              size="sm"
              onClick={handleNext}
              className="text-white px-5"
              style={{ background: current.color, border: "none" }}
            >
              {isLast ? (
                <><Sparkles className="w-4 h-4 mr-1.5" /> {isCs ? "Začít" : "Get started"}</>
              ) : (
                <>{isCs ? "Další" : "Next"} <ChevronRight className="w-4 h-4 ml-1" /></>
              )}
            </Button>
          )}
        </div>

        {/* Step counter */}
        <p className="text-center text-xs text-muted-foreground pb-4">
          {isCs ? `Krok ${step + 1} z ${steps.length}` : `Step ${step + 1} of ${steps.length}`}
        </p>
      </div>
    </div>
  );
}
