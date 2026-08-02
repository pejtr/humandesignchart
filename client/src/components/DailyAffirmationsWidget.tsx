import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Shield, RefreshCw, Copy, Check, Heart } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

export function DailyAffirmationsWidget() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const affirmations = [
    {
      center: isEn ? "Open Emotional Center" : "Otevřené Emoční Centrum (Solar Plexus)",
      text: isEn
        ? "I am a calm observer of emotional waves. I do not absorb feelings that do not belong to me."
        : "Jsem klidným pozorovatelem emočních vln okolí. Nepřebírám pocity, které mi nepatří.",
    },
    {
      center: isEn ? "Open Ego / Heart Center" : "Otevřené Ego / Srdce",
      text: isEn
        ? "My value is inherent. I have nothing to prove to anyone today."
        : "Má hodnota je nevratná a stálá. Dnes nemusím nikomu nic dokazovat.",
    },
    {
      center: isEn ? "Open Throat Center" : "Otevřené Hrdlo",
      text: isEn
        ? "I speak when recognized and invited. My silence is full of presence."
        : "Mluvím tehdy, když jsem rozpoznán a pozván. Mé mlčení má obrovskou sílu.",
    },
  ];

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success(isEn ? "Affirmation copied!" : "Afirmace zkopírována do schránky!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <Card className="border border-purple-300/40 dark:border-purple-800/40 bg-gradient-to-br from-purple-950/20 via-background to-indigo-950/20 rounded-3xl p-6 shadow-xl my-6">
      <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 text-xs font-semibold">
            <Shield className="w-3.5 h-3.5" />
            {isEn ? "HD De-conditioning Daily Affirmations" : "Denní HD Afirmace Ochrany Otevřených Centr"}
          </div>
          <CardTitle className="text-xl font-bold text-foreground">
            {isEn ? "Your Personalized Energy Shields for Today" : "Vaše Osobní Energetické Štíty pro Dnešní Den"}
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="p-0 space-y-3">
        {affirmations.map((item, i) => (
          <div
            key={i}
            className="p-4 rounded-2xl bg-muted/40 border border-border/50 space-y-2 relative group hover:border-purple-500/40 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {item.center}
              </span>
              <button
                onClick={() => handleCopy(item.text, i)}
                className="text-muted-foreground hover:text-purple-400 transition-colors p-1"
                title={isEn ? "Copy affirmation" : "Zkopírovat afirmaci"}
              >
                {copiedIndex === i ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-xs text-foreground font-medium leading-relaxed italic">
              "{item.text}"
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
