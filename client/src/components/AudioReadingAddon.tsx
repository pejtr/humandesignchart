import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Headphones, Play, Square } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface AudioReadingAddonProps {
  chartName?: string;
  readingText?: string | null;
  isPremium?: boolean;
  onUpgrade?: () => void;
}

function plainSpeechText(value: string) {
  return value
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#*_>`~\[\]()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const FEMALE_CZECH_VOICE_NAMES = ["vlasta", "zuzana", "iveta", "tereza", "veronika", "jolana"];
const MALE_CZECH_VOICE_NAMES = ["jakub", "antonin", "antonín", "vit", "vít"];

function voiceScore(voice: SpeechSynthesisVoice, isEn: boolean) {
  const name = voice.name.toLocaleLowerCase();
  const language = voice.lang.toLocaleLowerCase();
  const requestedLanguage = isEn ? "en" : "cs";
  let score = language.startsWith(requestedLanguage) ? 100 : 0;

  if (!isEn) {
    if (FEMALE_CZECH_VOICE_NAMES.some(candidate => name.includes(candidate))) score += 60;
    if (MALE_CZECH_VOICE_NAMES.some(candidate => name.includes(candidate))) score -= 80;
  }
  if (name.includes("natural")) score += 30;
  if (name.includes("online")) score += 12;
  if (name.includes("google")) score += 8;
  if (voice.localService) score += 2;

  return score;
}

async function loadSpeechVoices() {
  const synth = window.speechSynthesis;
  const available = synth.getVoices();
  if (available.length > 0) return available;

  return new Promise<SpeechSynthesisVoice[]>(resolve => {
    const finish = () => {
      window.clearTimeout(timeoutId);
      synth.removeEventListener("voiceschanged", finish);
      resolve(synth.getVoices());
    };
    const timeoutId = window.setTimeout(finish, 1200);
    synth.addEventListener("voiceschanged", finish, { once: true });
  });
}

export function AudioReadingAddon({ readingText, isPremium = false, onUpgrade }: AudioReadingAddonProps) {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  const toggleAudio = async () => {
    if (!isPremium) {
      onUpgrade?.();
      return;
    }

    if (!window.speechSynthesis || typeof SpeechSynthesisUtterance === "undefined") {
      toast.error(
        isEn
          ? "Natural voice playback is not supported in this browser."
          : "Tento prohlížeč nepodporuje přehrání přirozeného českého hlasu.",
      );
      return;
    }

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    if (!readingText) {
      toast.info(isEn ? "Create your AI reading first." : "Nejprve si vytvořte AI výklad mapy.");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(plainSpeechText(readingText));
    utterance.lang = isEn ? "en-US" : "cs-CZ";
    utterance.rate = isEn ? 0.9 : 0.86;
    utterance.pitch = isEn ? 1 : 1.04;
    utterance.volume = 1;
    const voices = await loadSpeechVoices();
    const preferred = voices
      .filter(voice => voice.lang.toLocaleLowerCase().startsWith(isEn ? "en" : "cs"))
      .filter(voice => isEn || !MALE_CZECH_VOICE_NAMES.some(candidate => voice.name.toLocaleLowerCase().includes(candidate)))
      .sort((left, right) => voiceScore(right, isEn) - voiceScore(left, isEn))[0];
    if (!preferred && !isEn) {
      toast.error("Na tomto zařízení není dostupný český ženský hlas. Doporučujeme Microsoft Edge nebo Chrome s hlasem Microsoft Vlasta.");
      return;
    }
    if (preferred) utterance.voice = preferred;
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => {
      setIsPlaying(false);
      toast.error(isEn ? "Audio playback is not available in this browser." : "V tomto prohlížeči se audio nepodařilo přehrát.");
    };
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  return (
    <Card id="premium-outputs" className="scroll-mt-36 border border-amber-300/40 dark:border-amber-800/40 bg-gradient-to-r from-amber-500/10 via-background to-purple-950/10 rounded-2xl p-5 shadow-md">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
        <div className="flex items-start gap-3.5">
          <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-300 shrink-0">
            <Headphones className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                <Crown className="w-3 h-3" /> Premium
              </span>
              <h4 className="font-serif font-bold text-base text-foreground">
                {isEn ? "Personal audio reading with Marie" : "Osobní audio výklad s Marií"}
              </h4>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isEn
                ? "Listen to your current AI interpretation while walking or driving. Included in Premium."
                : "Poslechněte si aktuální AI výklad při chůzi nebo v autě. Je součástí Premium."}
            </p>
          </div>
        </div>

        <Button
          size="sm"
          variant={isPremium ? "default" : "outline"}
          onClick={toggleAudio}
          className="text-xs rounded-xl gap-1.5 h-10 shrink-0"
        >
          {isPlaying ? <Square className="w-3.5 h-3.5" /> : isPremium ? <Play className="w-3.5 h-3.5" /> : <Crown className="w-3.5 h-3.5" />}
          {isPlaying
            ? (isEn ? "Stop" : "Zastavit")
            : isPremium
              ? (isEn ? "Play my reading" : "Přehrát můj výklad")
              : (isEn ? "Unlock Premium" : "Odemknout Premium")}
        </Button>
      </div>
    </Card>
  );
}
