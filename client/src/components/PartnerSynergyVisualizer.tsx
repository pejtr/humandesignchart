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
  const hasNamedPartner = Boolean(person2Name && person2Name !== "Partner");

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
              {hasNamedPartner
                ? (isEn
                    ? `Energetic compatibility: ${person1Name} & ${person2Name}`
                    : `Energetická kompatibilita: ${person1Name} a ${person2Name}`)
                : (isEn
                    ? "Where you naturally connect — and where friction may arise"
                    : "Kde se přirozeně propojíte — a kde může vznikat tření")}
            </h3>
            {!hasNamedPartner && (
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {isEn
                  ? "Choose a second real chart to see attraction, communication patterns and places where you may condition each other."
                  : "Vyberte druhou skutečnou mapu a uvidíte přitažlivost, komunikační vzorce i místa, kde se můžete navzájem podmiňovat."}
              </p>
            )}
          </div>

          <Button size="sm" className="bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs rounded-xl px-5 h-10 gap-2 shrink-0" asChild>
            <Link href={destination}>
              <Sparkles className="w-4 h-4" />
              {isPremium
                ? (isEn ? "Choose the second chart" : "Vybrat druhou mapu")
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
                ? "Shows where two incomplete channels meet. This often feels like immediate attraction, momentum or creative chemistry."
                : "Ukáže místa, kde se dvě neúplné dráhy spojí v celek. Často je vnímáte jako okamžitou přitažlivost, tah nebo tvůrčí chemii."}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
              <ShieldAlert className="w-4 h-4" />
              {isEn ? "Compromise zones" : "Kompromisní zóny"}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isEn
                ? "Reveals where one person's stable energy may override the other. Naming the pattern early makes communication easier."
                : "Odhalí, kde stabilní energie jednoho může přehlušit druhého. Když vzorec pojmenujete včas, snáze se o něm domluvíte."}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
