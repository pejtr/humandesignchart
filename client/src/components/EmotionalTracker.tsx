import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Smile, Meh, Frown, Sparkles, Calendar, BookOpen, Check } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

export function EmotionalTracker() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [savedEntries, setSavedEntries] = useState([
    { date: "Včera", mood: "Vyjádření & Jasnost", icon: "✨" },
    { date: "Před 2 dny", mood: "Emoční Vlna", icon: "🌊" },
  ]);

  const handleSaveEntry = () => {
    if (!selectedMood) {
      toast.error(isEn ? "Select your mood first" : "Vyberte nejprve váš dnešní stav");
      return;
    }
    setSavedEntries(prev => [{ date: "Dnes", mood: selectedMood, icon: "🎯" }, ...prev]);
    setSelectedMood(null);
    setNote("");
    toast.success(
      isEn
        ? "Emotional reflection saved to your chart profile!"
        : "Denohodnocení uloženo do vašeho Human Design profilu!"
    );
  };

  return (
    <Card className="border border-indigo-300/40 dark:border-indigo-800/40 bg-gradient-to-br from-indigo-950/20 via-background to-purple-950/20 rounded-3xl p-6 shadow-xl my-6">
      <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
            <BookOpen className="w-3.5 h-3.5" />
            {isEn ? "Daily Transit & Emotional Reflection Log" : "Deník Osobní HD Reflexe & Emočního Cyklu"}
          </div>
          <CardTitle className="text-xl font-bold text-foreground">
            {isEn ? "How do today's transits align with your authority?" : "Jak dnes vnímáte svou autoritu & dnešní tranzity?"}
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="p-0 space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: "Mír a Spokojenost", label: isEn ? "Peace / Satisfaction" : "Spokojenost & Mír", icon: Smile, color: "hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" },
            { id: "Emoční Vlna", label: isEn ? "Emotional Wave" : "Emoční Vlna", icon: Meh, color: "hover:bg-amber-500/20 text-amber-600 dark:text-amber-400" },
            { id: "Mentální Tlak", label: isEn ? "Mental Pressure" : "Mentální Tlak", icon: Frown, color: "hover:bg-rose-500/20 text-rose-600 dark:text-rose-400" },
          ].map(m => (
            <button
              key={m.id}
              onClick={() => setSelectedMood(m.id)}
              className={`p-3 rounded-2xl border text-xs font-semibold flex flex-col items-center gap-2 transition-all ${m.color} ${
                selectedMood === m.id ? "ring-2 ring-indigo-500 bg-indigo-500/10 border-indigo-500" : "border-border/60 bg-muted/30"
              }`}
            >
              <m.icon className="w-6 h-6" />
              <span>{m.label}</span>
            </button>
          ))}
        </div>

        {selectedMood && (
          <div className="space-y-3 pt-2">
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder={
                isEn
                  ? "Optional note: What situation tested your authority today?"
                  : "Volitelná poznámka: Jaká situace dnes prověřila vaši autoritu?"
              }
              className="w-full p-3 rounded-2xl border border-border/60 bg-muted/40 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={2}
            />
            <Button
              onClick={handleSaveEntry}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-10 rounded-xl gap-2"
            >
              <Check className="w-4 h-4" />
              {isEn ? "Save Reflection Entry" : "Uložit Dnešní HD Reflexi"}
            </Button>
          </div>
        )}

        <div className="pt-2 border-t border-border/40 space-y-2">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            {isEn ? "Recent Journal History" : "Historie Vašich Záznamů"}
          </span>
          <div className="flex flex-wrap gap-2">
            {savedEntries.map((e, i) => (
              <div key={i} className="px-3 py-1.5 rounded-xl bg-muted/60 text-xs font-medium border border-border/40 flex items-center gap-1.5">
                <span>{e.icon}</span>
                <span className="font-bold text-foreground">{e.date}:</span>
                <span className="text-muted-foreground">{e.mood}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
