import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Zap, ShieldAlert, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

interface PartnerSynergyVisualizerProps {
  person1Name?: string;
  person2Name?: string;
  isPremium?: boolean;
  chartId?: number | null;
}

export function PartnerSynergyVisualizer({
  person1Name = "Vy",
  person2Name = "Partner",
  isPremium = false,
  chartId,
}: PartnerSynergyVisualizerProps) {
  const { locale, localePath } = useLanguage();
  const isEn = locale === "en";
  const destination = isPremium
    ? `${localePath("/compare")}${chartId ? `?chartId=${chartId}` : ""}`
    : `${localePath("/pricing")}#plans`;

  return (
    <Card id="relationship-analysis" className="scroll-mt-36 border border-pink-300/40 dark:border-pink-800/40 bg-gradient-to-br from-pink-950/20 via-background to-purple-950/20 rounded-3xl p-6 sm:p-8 shadow-xl">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-100 dark:bg-pink-950/70 text-pink-700 dark:text-pink-300 text-xs font-semibold">
              <Heart className="w-3.5 h-3.5 fill-current" />
              {isEn ? "Relationship synergy" : "Partnerská synergie"}
            </div>
            <h3 className="font-serif font-bold text-2xl text-foreground">
              {isEn
                ? `Energetic compatibility: ${person1Name} & ${person2Name}`
                : `Energetická kompatibilita: ${person1Name} a ${person2Name}`}
            </h3>
          </div>

          <Button size="sm" className="bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs rounded-xl px-5 h-10 gap-2 shrink-0" asChild>
            <Link href={destination}>
              <Sparkles className="w-4 h-4" />
              {isPremium
                ? (isEn ? "Create full relationship report" : "Vytvořit kompletní rozbor vztahu")
                : (isEn ? "Unlock with Premium" : "Odemknout v Premium")}
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
              <Zap className="w-4 h-4 fill-current" />
              {isEn ? "Electromagnetic spark" : "Elektromagnetická jiskra"}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isEn
                ? "Defined gates can connect with a partner's gates and create a continuous shared energy flow."
                : "Vaše definované brány se mohou propojit s bránami partnera a vytvářet společný proud energie a inspirace."}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
              <ShieldAlert className="w-4 h-4" />
              {isEn ? "Compromise zones" : "Kompromisní zóny"}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isEn
                ? "Areas where conscious communication helps prevent emotional and mental conditioning."
                : "Místa, kde vědomá komunikace pomáhá předcházet přebírání mentálního tlaku a emocí."}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
