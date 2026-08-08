import { Card } from "@/components/ui/card";
import { Star, CheckCircle2, Quote } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export function CustomerReviewsWidget() {
  const { locale } = useLanguage();
  const isEn = locale === "en";

  const reviews = [
    {
      name: "Lenka K.",
      role: "Generátor 3/5",
      rating: 5,
      text: isEn
        ? "AI Marie's analysis of my open Emotional Center completely changed how I handle work stress. 10/10 recommendation!"
        : "Rozbor mého otevřeného Emočního Centra od AI Marie kompletně změnil to, jak přistupuji k pracovnímu stresu. Doporučuji 10/10!",
    },
    {
      name: "Martin P.",
      role: "Projektor 1/3",
      rating: 5,
      text: isEn
        ? "The audio reading in my headphones was so personal and soothing. Finally I understand my energy boundaries."
        : "Audio výklad do sluchátek byl tak osobní a uklidňující. Konečně rozumím svým energetickým hranicím.",
    },
    {
      name: "Tereza & Jan",
      role: "Partnerská Synergie",
      rating: 5,
      text: isEn
        ? "The relationship matrix showed us exactly where friction was coming from. Best investment in our marriage."
        : "Partnerská matice nám přesně ukázala, odkud pramenilo nedorozumění. Nejlepší investice do našeho vztahu.",
    },
  ];

  return (
    <div className="space-y-4 my-8">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold text-sm">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="text-foreground">4.9 / 5.0</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {isEn ? "Verified customer reviews (2,400+ charts calculated)" : "Hodnocení ověřených zákazníků (2 400+ vypočítaných map)"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {reviews.map((r, idx) => (
          <Card key={idx} className="p-4 rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-foreground block">{r.name}</span>
                <span className="text-[10px] text-purple-500 font-mono">{r.role}</span>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            </div>
            <p className="text-muted-foreground leading-relaxed italic">
              "{r.text}"
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
