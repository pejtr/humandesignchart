import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Sparkles, Plus, ShieldCheck, User } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "wouter";

export function FamilyTreeChart() {
  const { locale, localePath } = useLanguage();
  const isEn = locale === "en";

  return (
    <Card className="border border-purple-300/40 dark:border-purple-800/40 bg-gradient-to-br from-purple-950/20 via-background to-amber-950/20 rounded-3xl p-6 shadow-xl my-6">
      <CardHeader className="p-0 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 text-xs font-semibold">
            <Users className="w-3.5 h-3.5" />
            {isEn ? "Family Penta & Group Dynamics" : "Rodinný HD Rodokmen & Skupinová Penta"}
          </div>
          <CardTitle className="text-xl font-bold text-foreground">
            {isEn ? "Interactive Family Energetic Dynamics" : "Energetická Dynamika Vaší Rodiny"}
          </CardTitle>
        </div>

        <Button
          size="sm"
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl px-4 h-9 gap-1.5 shrink-0"
          asChild
        >
          <Link href={localePath("/calculator")}>
            <Plus className="w-4 h-4" />
            {isEn ? "Add Family Member" : "Přidat Člena Rodiny"}
          </Link>
        </Button>
      </CardHeader>

      <CardContent className="p-0 space-y-4">
        {/* Sample Family Visual Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { name: "Já (Mapa)", type: "Generátor 3/5", color: "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400" },
            { name: "Partner", type: "Projektor 1/3", color: "bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400" },
            { name: "Dítě #1", type: "Manifestující Gen.", color: "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400" },
            { name: "Dítě #2", type: "Reflektor 6/2", color: "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400" },
          ].map((member, i) => (
            <div key={i} className={`p-3.5 rounded-2xl border ${member.color} space-y-1 text-center`}>
              <div className="w-8 h-8 rounded-full bg-background border mx-auto flex items-center justify-center text-foreground font-bold text-xs">
                <User className="w-4 h-4" />
              </div>
              <div className="font-bold text-xs text-foreground">{member.name}</div>
              <div className="text-[10px] text-muted-foreground">{member.type}</div>
            </div>
          ))}
        </div>

        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="space-y-0.5">
            <span className="font-bold text-xs text-amber-600 dark:text-amber-400 flex items-center justify-center sm:justify-start gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              {isEn ? "Penta Group Dynamic Analysis Available" : "Detekována Skupinová Rodinná Penta"}
            </span>
            <p className="text-xs text-muted-foreground">
              {isEn
                ? "Unlock the complete 3-5 member group energetic blueprint (+490 CZK)."
                : "Odemkněte hloubkový rozbor harmonie a výzev v rodinné skupině (+490 Kč)."}
            </p>
          </div>

          <Button
            size="sm"
            className="bg-amber-400 hover:bg-amber-300 text-purple-950 font-bold text-xs rounded-xl px-4 h-9 gap-1.5 shrink-0"
            asChild
          >
            <Link href={localePath("/pricing")}>
              <ShieldCheck className="w-4 h-4" />
              {isEn ? "Unlock Family Penta" : "Odemknout Rodinnou Pentu"}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
