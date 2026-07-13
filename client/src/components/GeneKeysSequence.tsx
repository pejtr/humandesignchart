import type { HumanDesignChartData } from "@shared/types";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { GATE_DESCRIPTIONS } from "@/data/hdContent";
import { Circle, Hexagon, Compass, Sparkles } from "lucide-react";

import { motion } from "framer-motion";

export function GeneKeysSequence({ chart }: { chart: HumanDesignChartData }) {
    const { locale } = useLanguage();
    const isCs = locale === "cs";

    const pSun = chart.personalityActivations?.find(a => a.planet === "Sun");
    const pEarth = chart.personalityActivations?.find(a => a.planet === "Earth");
    const dSun = chart.designActivations?.find(a => a.planet === "Sun");
    const dEarth = chart.designActivations?.find(a => a.planet === "Earth");

    const pillars = [
        { id: "vocation", title: isCs ? "Životní Úkol" : "Life's Work", desc: isCs ? "Účel vaší duše ve světě." : "Your soul's purpose in the world.", data: pSun, bg: "bg-amber-100/50", border: "border-amber-200/50", iconCol: "text-amber-500" },
        { id: "evolution", title: isCs ? "Evoluce" : "Evolution", desc: isCs ? "Výzva k růstu a překonání překážek." : "The challenge you must overcome.", data: pEarth, bg: "bg-emerald-100/50", border: "border-emerald-200/50", iconCol: "text-emerald-500" },
        { id: "radiance", title: isCs ? "Vyzařování" : "Radiance", desc: isCs ? "Vaše přirozená jasnost a zdraví." : "Your vitality and physical health.", data: dSun, bg: "bg-blue-100/50", border: "border-blue-200/50", iconCol: "text-blue-500" },
        { id: "purpose", title: isCs ? "Vyšší Cíl" : "Purpose", desc: isCs ? "To, co se skrze vás snaží ukotvit." : "What anchors you in the material world.", data: dEarth, bg: "bg-purple-100/50", border: "border-purple-200/50", iconCol: "text-purple-500" },
    ];

    const getFrequencies = (gateNo: number) => {
        const gk = (GATE_DESCRIPTIONS as any[]).find((g: any) => String(g.number) === String(gateNo));
        return {
            shadow: gk?.shadowKeyword || "...",
            gift: gk?.giftKeyword || "...",
            siddhi: gk?.siddhiKeyword || "..."
        };
    };

    return (
        <div className="space-y-4">
            {/* Intro Card */}
            <Card className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white border-0 shadow-lg">
                <CardContent className="pt-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Hexagon className="w-48 h-48 animate-[spin_60s_linear_infinite]" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-5 h-5 text-amber-400" />
                            <h3 className="font-serif text-xl font-bold tracking-tight">
                                {isCs ? "Aktivační sekvence" : "Activation Sequence"}
                            </h3>
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
                            {isCs
                                ? "Aktivační sekvence představuje vaši primární čtyřku u Genových Klíčů (inkarnační kříž). Tyto 4 pilíře určují, jak se váš život může proměnit z fáze Stínu do rozvinutí vašeho Daru."
                                : "The Activation Sequence represents your primary four Gene Keys (the Incarnation Cross). These 4 pillars dictate how your life can transform from Shadow state to your highest Gift."}
                        </p>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pillars.map((p, idx) => {
                    if (!p.data) return null;
                    const freqs = getFrequencies(p.data.gate);
                    return (
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            key={p.id}
                        >
                            <Card className={`relative overflow-hidden ${p.bg} ${p.border} border-2 hover:shadow-md transition-all group`}>
                                <CardContent className="p-5 flex flex-col h-full relative z-10">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                                                {p.title}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span className="font-serif text-3xl font-bold text-foreground">
                                                    {p.data.gate}.{p.data.line}
                                                </span>
                                            </div>
                                        </div>
                                        <Circle className={`w-8 h-8 ${p.iconCol} opacity-80 group-hover:scale-110 transition-transform`} />
                                    </div>

                                    <div className="flex-1 space-y-2 mb-4">
                                        <div className="bg-white/60 dark:bg-black/20 rounded-md p-2 flex justify-between items-center px-3 border border-red-500/10">
                                            <span className="text-xs text-muted-foreground">Stín {isCs ? "(Potlačení)" : "(Repression)"}</span>
                                            <span className="text-sm font-semibold text-red-600/80">{freqs.shadow}</span>
                                        </div>
                                        <div className="bg-white/60 dark:bg-black/20 rounded-md p-2 flex justify-between items-center px-3 border border-amber-500/20">
                                            <span className="text-xs text-muted-foreground">Dar {isCs ? "(Kreativita)" : "(Creativity)"}</span>
                                            <span className="text-sm font-bold text-amber-600">{freqs.gift}</span>
                                        </div>
                                        <div className="bg-white/60 dark:bg-black/20 rounded-md p-2 flex justify-between items-center px-3 border border-indigo-500/20">
                                            <span className="text-xs text-muted-foreground">Siddhi {isCs ? "(Osvícení)" : "(Essecence)"}</span>
                                            <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{freqs.siddhi}</span>
                                        </div>
                                    </div>

                                    <div className="text-[10px] sm:text-xs text-muted-foreground/80 pt-2 border-t border-black/5 dark:border-white/5 line-clamp-2">
                                        {p.desc}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )
                })}
            </div>
        </div>
    )
}
