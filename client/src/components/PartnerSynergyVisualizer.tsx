import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Zap, ShieldAlert, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

interface PartnerSynergyVisualizerProps {
  person1Name?: string;
  person2Name?: string;
}

export function PartnerSynergyVisualizer({
  person1Name = "Vy",
  person2Name = "Partner",
}: PartnerSynergyVisualizerProps) {
  const { locale, localePath } = useLanguage();
  const isEn = locale === "en";

  return (
    <Card className="border border-pink-300/40 dark:border-pink-800/40 bg-gradient-to-br from-pink-950/20 via-background to-purple-950/20 rounded-3xl p-6 sm:p-8 shadow-xl my-8">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-100 dark:bg-pink-950/70 text-pink-700 dark:text-pink-300 text-xs font-semibold">
              <Heart className="w-3.5 h-3.5 fill-current" />
              {isEn ? "Relational Synergy Matrix" : "Matice Partnerské Synergie"}
            </div>
            <h3 className="font-serif font-bold text-2xl text-foreground">
              {isEn
                ? `Energetic Compatibility: ${person1Name} & ${person2Name}`
                : `Energetická Kompatibilita: ${person1Name} & ${person2Name}`}
            </h3>
          </div>

          <Button
            size="sm"
            className="bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs rounded-xl px-5 h-10 gap-2 shrink-0"
            asChild
          >
            <Link href={localePath("/pricing")}>
              <Sparkles className="w-4 h-4" />
              {isEn ? "Full Partner Report (390 CZK)" : "Kompletní Rozbor Vztahu (390 Kč)"}
            </Link>
          </Button>
        </div>

        {/* Dynamic Synergy Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
              <Zap className="w-4 h-4 fill-current" />
              {isEn ? "Elektromagnetické Jiskry (Silná Přitažlivost)" : "Elektromagnetická Jiskra (Přitažlivost)"}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isEn
                ? "Your defined channels connect with partner's open gates to create continuous shared energy flow."
                : "Vaše definované brány se propojují s bránami partnera a vytvářejí neustálý proud společné vážně a inspirace."}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
              <ShieldAlert className="w-4 h-4" />
              {isEn ? "Kompromisní Zóny (Možná Nepochopení)" : "Kompromisní Zóna (Třecí Plochy)"}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isEn
                ? "Open center dynamics where clear communication is key to avoid emotional conditioning."
                : "Místa, kde je potřeba vědomá komunikace, aby nedocházelo k přebírání mentálního tlaku a emocí."}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
