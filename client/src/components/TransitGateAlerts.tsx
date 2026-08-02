import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Sparkles, Sun, Zap, Bell } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export function TransitGateAlerts() {
  const { locale } = useLanguage();
  const isEn = locale === "en";

  return (
    <Card className="border border-amber-300/40 dark:border-amber-800/40 bg-gradient-to-br from-amber-950/20 via-background to-purple-950/20 rounded-3xl p-5 shadow-lg my-6">
      <div className="flex items-start gap-3.5">
        <div className="p-2.5 rounded-2xl bg-amber-400/20 text-amber-500 shrink-0">
          <Sun className="w-5 h-5" />
        </div>
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1">
              <Zap className="w-3 h-3" />
              {isEn ? "Today's Transit Gate Activation" : "Dnešní Aktivace Osobní Brány"}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">Dnes · Slunce V Bráně 33</span>
          </div>
          <h4 className="font-bold text-sm text-foreground">
            {isEn
              ? "Transit Sun Activates Gate 33 (Retreat & Privacy) in your Open Throat!"
              : "Dnešní Slunce aktivuje Bránu 33 (Ústup & Soukromí) ve vašem Otevřeném Hrdle!"}
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {isEn
              ? "Today brings a temporary burst of wisdom about past experiences. Take time alone before voicing decisions."
              : "Dnešní tranzit vám přináší dočasný příval moudrosti z minulých zkušeností. Dopřejte si čas v samotě, než zformulujete důležitá rozhodnutí."}
          </p>
        </div>
      </div>
    </Card>
  );
}
