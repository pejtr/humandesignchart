import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Briefcase, Sparkles, Building2, ShieldCheck, ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export function TeamDesignAudit() {
  const { locale, localePath } = useLanguage();
  const isEn = locale === "en";

  return (
    <Card className="border border-indigo-300/40 dark:border-indigo-800/40 bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 text-white rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden relative my-8">
      <div className="absolute -right-10 -bottom-10 opacity-15 pointer-events-none">
        <Building2 className="w-72 h-72 text-indigo-400" />
      </div>

      <div className="relative z-10 space-y-6 max-w-2xl">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-400/30">
          <Briefcase className="w-3.5 h-3.5" />
          {isEn ? "B2B & Team Enterprise Solution" : "B2B Týmová Analýza pro Firmy"}
        </div>

        <div className="space-y-2">
          <h3 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight">
            {isEn
              ? "Human Design Team Audit & Leadership Dynamics"
              : "Týmový Audit Human Design & Dynamika Vedení"}
          </h3>
          <p className="text-sm text-indigo-200/80 leading-relaxed">
            {isEn
              ? "Analyze up to 10 team members in 1 composite matrix. Discover who naturally initiates (Manifestors), sustains work (Generators), or guides strategy (Projectors)."
              : "Analýza až 10 členů týmu v 1 přehledné matici. Zjistěte, kdo přirozeně spouští projekty (Manifestoři), dává stabilní výkon (Generátoři) a efektivně vede (Projektor)."}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <span className="font-bold block text-indigo-300">10 Členů</span>
            <span className="text-[11px] text-muted-foreground">{isEn ? "Full Team Matrix" : "Plná týmová matice"}</span>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <span className="font-bold block text-amber-300">AI Report</span>
            <span className="text-[11px] text-muted-foreground">{isEn ? "Leadership Synergy" : "Synergie v komunikaci"}</span>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <span className="font-bold block text-emerald-300">PDF Audit</span>
            <span className="text-[11px] text-muted-foreground">{isEn ? "Printable Report" : "PDF do firmy"}</span>
          </div>
        </div>

        <div className="pt-2">
          <Button
            size="lg"
            className="bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-lg shadow-indigo-900/40 gap-2"
            onClick={() => {
              window.location.href = `mailto:b2b@avanito.cz?subject=${encodeURIComponent(
                isEn ? "HD Team Audit Inquiry" : "Poptávka Týmového HD Auditu"
              )}`;
            }}
          >
            <Sparkles className="w-4 h-4 text-indigo-200" />
            {isEn ? "Request Team Audit (1,490 CZK)" : "Poptat Týmový Audit (1 490 Kč)"}
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
