import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Headphones, Volume2, Sparkles, Play, Pause, Check } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface AudioReadingAddonProps {
  chartName?: string;
}

export function AudioReadingAddon({ chartName }: AudioReadingAddonProps) {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      toast.info(
        isEn
          ? "Playing sample audio snippet from Marie..."
          : "Přehrávám ukázku audio výkladu Marie..."
      );
    }
  };

  return (
    <Card className="border border-amber-300/40 dark:border-amber-800/40 bg-gradient-to-r from-amber-500/10 via-background to-purple-950/10 rounded-2xl p-5 shadow-md my-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
        <div className="flex items-start gap-3.5">
          <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-300 shrink-0">
            <Headphones className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                AUDIO ADD-ON
              </span>
              <h4 className="font-serif font-bold text-base text-foreground">
                {isEn ? "10-Minute AI Voice Audio Reading (+99 CZK)" : "10-minutový Audio Výklad s Hlasem Marie (+99 Kč)"}
              </h4>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isEn
                ? "Listen to your complete energetic blueprint on headphones while walking or driving."
                : "Poslechněte si svůj osobní energetický výklad do sluchátek při chůzi nebo v autě."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <Button
            size="sm"
            variant="outline"
            onClick={togglePlay}
            className="text-xs rounded-xl gap-1.5 h-10 border-amber-300 dark:border-amber-800"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 text-amber-500" /> : <Play className="w-3.5 h-3.5 text-amber-500" />}
            {isPlaying ? (isEn ? "Pause Sample" : "Pauza Ukázky") : isEn ? "Listen Sample" : "Přehrát Ukázku"}
          </Button>

          <Button
            size="sm"
            className="bg-amber-500 hover:bg-amber-400 text-purple-950 font-bold text-xs rounded-xl gap-1.5 h-10 px-4 shadow-sm"
            onClick={() => {
              toast.success(
                isEn
                  ? "Audio reading added to your order!"
                  : "Audio výklad přidán k vaší objednávce!"
              );
            }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            {isEn ? "Add (+99 CZK)" : "Přidat (+99 Kč)"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
