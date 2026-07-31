import { useMemo } from "react";
import {
  Cell,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Activity, CircleDot, Route, Sparkles } from "lucide-react";
import type { HumanDesignChartData } from "@shared/types";

type Props = {
  chart: HumanDesignChartData;
  locale: string;
  moon?: {
    phase: { name: string; emoji: string; illumination: number; waxing: boolean };
    gate?: number;
    line?: number;
    theme?: string;
    themeEn?: string;
  };
};

const CENTER_LABELS: Record<string, { cs: string; en: string }> = {
  Head: { cs: "Hlava", en: "Head" },
  Hlava: { cs: "Hlava", en: "Head" },
  Ajna: { cs: "Ajna", en: "Ajna" },
  Throat: { cs: "Hrdlo", en: "Throat" },
  Hrdlo: { cs: "Hrdlo", en: "Throat" },
  G: { cs: "G centrum", en: "G Center" },
  Heart: { cs: "Srdce", en: "Heart" },
  Srdce: { cs: "Srdce", en: "Heart" },
  Sacral: { cs: "Sakrál", en: "Sacral" },
  "Sakrální": { cs: "Sakrál", en: "Sacral" },
  SolarPlexus: { cs: "Emoce", en: "Solar Plexus" },
  "Solar Plexus": { cs: "Emoce", en: "Solar Plexus" },
  "Solární plexus": { cs: "Emoce", en: "Solar Plexus" },
  Spleen: { cs: "Slezina", en: "Spleen" },
  Slezina: { cs: "Slezina", en: "Spleen" },
  Root: { cs: "Kořen", en: "Root" },
  "Kořen": { cs: "Kořen", en: "Root" },
};

export function ChartInsightsVisuals({ chart, locale, moon }: Props) {
  const isCs = locale === "cs";
  const definedCount = chart.centers.filter((center) => center.defined).length;
  const centerBalance = [
    { name: isCs ? "Definovaná" : "Defined", value: definedCount, color: "#7c3aed" },
    { name: isCs ? "Otevřená" : "Open", value: chart.centers.length - definedCount, color: "#ddd6fe" },
  ];

  const activationData = useMemo(() => chart.centers.map((center) => ({
    center: CENTER_LABELS[center.name]?.[isCs ? "cs" : "en"] || center.name,
    activation: center.gates.length > 0
      ? Math.round((center.activatedGates.length / center.gates.length) * 100)
      : 0,
  })), [chart.centers, isCs]);

  const activeGates = new Set(chart.activatedGates).size;
  const phaseLabel = moon && ({
    new_moon: isCs ? "Nov" : "New moon",
    waxing_crescent: isCs ? "Dorůstající srpek" : "Waxing crescent",
    first_quarter: isCs ? "První čtvrť" : "First quarter",
    waxing_gibbous: isCs ? "Dorůstající Luna" : "Waxing gibbous",
    full_moon: isCs ? "Úplněk" : "Full moon",
    waning_gibbous: isCs ? "Ubývající Luna" : "Waning gibbous",
    last_quarter: isCs ? "Poslední čtvrť" : "Last quarter",
    waning_crescent: isCs ? "Ubývající srpek" : "Waning crescent",
  } as Record<string, string>)[moon.phase.name];

  return (
    <section className="grid gap-4 xl:grid-cols-[0.85fr_1.4fr]" aria-label={isCs ? "Vizuální přehled mapy" : "Visual chart overview"}>
      {moon && (
        <div className="relative overflow-hidden rounded-2xl border border-indigo-200/60 bg-gradient-to-r from-slate-950 via-indigo-950 to-violet-950 px-5 py-4 text-white shadow-sm xl:col-span-2">
          <div className="absolute -right-8 -top-12 h-36 w-36 rounded-full bg-white/10 blur-xl" />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-white/10 text-3xl shadow-inner">
                {moon.phase.emoji}
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-violet-200">{isCs ? "Dnešní Luna" : "Today's Moon"}</p>
                <p className="font-serif text-xl font-semibold">{phaseLabel}</p>
                <p className="text-xs text-violet-100/80">
                  {moon.phase.illumination}% {isCs ? "osvětlení" : "illuminated"} · {moon.phase.waxing ? (isCs ? "dorůstá" : "waxing") : (isCs ? "ubývá" : "waning")}
                </p>
              </div>
            </div>
            {moon.gate && (
              <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
                <p className="text-[10px] uppercase tracking-wider text-violet-200">{isCs ? "Tranzitní brána" : "Transit gate"}</p>
                <p className="font-semibold">{moon.gate}.{moon.line} · {isCs ? moon.theme : moon.themeEn}</p>
              </div>
            )}
          </div>
        </div>
      )}
      <div className="rounded-2xl border border-violet-200/70 bg-gradient-to-br from-white via-violet-50/70 to-amber-50/60 p-5 shadow-sm">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 font-serif text-lg font-semibold">
              <CircleDot className="h-5 w-5 text-violet-600" />
              {isCs ? "Mapa center" : "Center map"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {isCs ? "Poměr konzistentní a vnímavé energie" : "Balance of consistent and receptive energy"}
            </p>
          </div>
          <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700">
            {definedCount}/{chart.centers.length}
          </span>
        </div>
        <div className="relative h-44">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={centerBalance} dataKey="value" innerRadius={48} outerRadius={70} paddingAngle={3} stroke="none">
                {centerBalance.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(value: number, name: string) => [`${value} ${isCs ? "center" : "centers"}`, name]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-violet-700">{definedCount}</span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{isCs ? "definovaných" : "defined"}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {centerBalance.map((item) => (
            <div key={item.name} className="flex items-center gap-2 rounded-lg border bg-white/70 px-3 py-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span>{item.name}: <strong>{item.value}</strong></span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-cyan-200/60 bg-gradient-to-br from-white via-cyan-50/60 to-violet-50/70 p-5 shadow-sm">
        <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 font-serif text-lg font-semibold">
              <Activity className="h-5 w-5 text-cyan-600" />
              {isCs ? "Aktivace v centrech" : "Center activations"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {isCs ? "Podíl aktivovaných bran v jednotlivých centrech" : "Share of activated gates in each center"}
            </p>
          </div>
          <div className="flex gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-cyan-100 px-2.5 py-1 text-xs font-semibold text-cyan-800">
              <Sparkles className="h-3 w-3" /> {activeGates} {isCs ? "bran" : "gates"}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-800">
              <Route className="h-3 w-3" /> {chart.channels.length} {isCs ? "kanálů" : "channels"}
            </span>
          </div>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={activationData} outerRadius="72%">
              <PolarGrid stroke="#d8d4ea" />
              <PolarAngleAxis dataKey="center" tick={{ fill: "#655d76", fontSize: 10 }} />
              <Radar dataKey="activation" stroke="#7c3aed" fill="#8b5cf6" fillOpacity={0.34} strokeWidth={2} />
              <Tooltip formatter={(value: number) => [`${value} %`, isCs ? "Aktivace" : "Activation"]} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
