import React from "react";
import { Sparkles, Sun, Moon, Zap, ArrowRight, Flame } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { QuantumLivingAura } from "@/components/QuantumLivingAura";
import { trpc } from "@/lib/trpc";

interface QuantumPortalFieldProps {
  className?: string;
}

/**
 * QuantumPortalField — Dynamic Living Portal Field
 * Anchored in fixed position, dynamically updating daily content based on today's planetary transit inputs.
 */
export function QuantumPortalField({ className = "" }: QuantumPortalFieldProps) {
  const { locale, localePath } = useLanguage();
  const isCs = locale === "cs";

  // Query current daily transit data
  const { data: transitData, isLoading } = trpc.transit.getDailyTransit.useQuery(undefined, {
    staleTime: 1000 * 60 * 30, // 30 mins
  });

  const todayGate = transitData?.sunGate ?? 55;
  const todayGateName = transitData?.sunGateName ?? (isCs ? "Brána Hojnosti & Svobody Emocí" : "Gate of Abundance & Freedom");
  const channelName = transitData?.activeChannelName ?? (isCs ? "Kanál Emocionální Vlny 39-55" : "Channel of Emotional Wave 39-55");
  const dailyImpulse = transitData?.dailyImpulse ?? (
    isCs
      ? "Dnešní energetické pole otevírá hluboké emoce. Vnímejte impulzy svého těla a nenechte se strhnout tlakem mysli."
      : "Today's quantum field opens deep emotional resonance. Trust your body's response and avoid mental pressure."
  );

  return (
    <div className={`w-full max-w-4xl mx-auto ${className}`}>
      <QuantumLivingAura intensity="vibrant">
        <div className="rounded-3xl bg-white/95 dark:bg-slate-900/95 border-2 border-purple-300/80 dark:border-purple-500/40 p-6 md:p-8 shadow-2xl backdrop-blur-xl space-y-6">
          
          <!-- Portal Header -->
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 via-pink-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-600/30 text-white font-bold">
                <Sun className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-600 dark:text-purple-400 block">
                  {isCs ? "Živé Kvantové Portálové Pole" : "Live Quantum Portal Field"}
                </span>
                <h3 className="text-lg font-serif font-bold text-slate-900 dark:text-white">
                  {isCs ? "Dnešní Planetární Tranzit & Vliv" : "Today's Planetary Transit & Energy"}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/80 border border-purple-300 dark:border-purple-700 text-purple-900 dark:text-purple-200 text-xs font-bold flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                <span>{isCs ? `Dnešní Brána ${todayGate}` : `Sun Gate ${todayGate}`}</span>
              </span>
            </div>
          </div>

          <!-- Dynamic Portal Content Grid -->
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            
            <!-- Left: Gate & Channel Visual Badge -->
            <div className="md:col-span-4 p-5 rounded-2xl bg-gradient-to-br from-purple-50 via-pink-50/50 to-indigo-50 dark:from-slate-800/80 dark:to-purple-950/50 border border-purple-200 dark:border-purple-800/60 text-center space-y-3 shadow-inner">
              <div className="flex items-center justify-center gap-2 text-purple-700 dark:text-purple-300 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>{isCs ? "Aktivní Brána Dne" : "Active Gate Today"}</span>
              </div>
              <div className="text-4xl font-serif font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-700 via-pink-600 to-indigo-600">
                #{todayGate}
              </div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {todayGateName}
              </p>
              <div className="text-[11px] font-mono text-purple-800 dark:text-purple-300 bg-white/80 dark:bg-slate-900/80 py-1 px-2.5 rounded-lg border border-purple-200 dark:border-purple-700 inline-block">
                {channelName}
              </div>
            </div>

            <!-- Right: AI Marie's Daily Impulse -->
            <div className="md:col-span-8 space-y-4">
              <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/80 space-y-2">
                <div className="flex items-center gap-2 text-purple-900 dark:text-purple-200 font-bold text-xs">
                  <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
                  <span>{isCs ? "Denní Kvantová Náhledová Rezonance:" : "Daily Quantum Insight:"}</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm italic leading-relaxed font-medium">
                  "{dailyImpulse}"
                </p>
              </div>

              <!-- Action Links -->
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isCs ? "🔄 Aktualizuje se denně o půlnoci s planetárním tranzitem" : "🔄 Updates daily at midnight UTC with planetary transits"}
                </span>

                <Link href={localePath("/daily-transit")}>
                  <button className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white font-bold text-xs shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5">
                    <span>{isCs ? "Zobrazit Dnešní Tranzit Detailně" : "Explore Daily Transit"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
              </div>
            </div>

          </div>

        </div>
      </QuantumLivingAura>
    </div>
  );
}
