import { calculatePlanetaryPositions, dateToJD } from "../server/humandesign/ephemeris";
import { GATE_WHEEL, PLANET_NAMES, CHANNELS } from "../server/humandesign/constants";
import { GATE_DESCRIPTIONS } from "../server/data/hdContent";
import { getPragueDay, getPragueDayStart } from "../server/services/pragueDailyCache";

export type DailyLocale = "cs" | "en";

export function transitGate(longitude: number) {
  if (!Number.isFinite(longitude)) throw new Error("Invalid ephemeris longitude");
  const normalized = ((longitude % 360) + 360) % 360;
  const entry = [...GATE_WHEEL].reverse().find(([start]) => normalized >= start)
    ?? GATE_WHEEL[GATE_WHEEL.length - 1];
  const offset = (normalized - entry[0] + 360) % 360;
  return { gate: entry[1], line: Math.min(6, Math.floor(offset / 0.9375) + 1) };
}

type DailyChart = {
  date: string;
  timestamp: string;
  timezone: "Europe/Prague";
  transitGates: { planet: string; gate: number; line: number; longitude: number }[];
};
let cached: DailyChart | undefined;

/** Only public astronomical snapshot cached; no user data or external LLM calls. */
export function getAgentDailyChart(now: Date = new Date()): DailyChart {
  const date = getPragueDay(now);
  if (cached?.date === date) return cached;
  const at = getPragueDayStart(now);
  const positions = calculatePlanetaryPositions(dateToJD(at));
  cached = {
    date, timestamp: at.toISOString(), timezone: "Europe/Prague",
    transitGates: PLANET_NAMES.map(planet => {
      const longitude = positions[planet];
      return { planet, longitude, ...transitGate(longitude) };
    }),
  };
  return cached;
}

export function buildAgentDailyReading(locale: DailyLocale, natalGates: number[] = [], now: Date = new Date()) {
  if (natalGates.length > 64 || natalGates.some(g => !Number.isInteger(g) || g < 1 || g > 64)) {
    throw new Error("Invalid natal gates");
  }
  const chart = getAgentDailyChart(now);
  const natal = new Set(natalGates);
  const transits = new Set(chart.transitGates.map(t => t.gate));
  const en = locale === "en";
  const themes = chart.transitGates.filter(t => ["Sun", "Earth", "Moon"].includes(t.planet)).map(t => ({
    planet: t.planet, gate: t.gate, line: t.line,
    theme: en ? GATE_DESCRIPTIONS[t.gate]?.themeEn : GATE_DESCRIPTIONS[t.gate]?.theme,
  }));
  const reinforcedGates = [...transits].filter(g => natal.has(g)).sort((a, b) => a - b);
  const transitCompletedChannels = CHANNELS.filter(([a, b]) =>
    (natal.has(a) && !natal.has(b) && transits.has(b)) ||
    (natal.has(b) && !natal.has(a) && transits.has(a))
  ).map(([a, b]) => [a, b]);
  const sourceUrl = en ? "https://humandesignchart.app/en/daily-transit" : "https://humandesignmapa.cz/cs/daily-transit";
  return {
    ...chart, locale, personalized: natal.size > 0, themes, reinforcedGates, transitCompletedChannels,
    interpretation: themes.map(t => `${t.planet} ${t.gate}.${t.line} — ${t.theme ?? ""}`).join("\n"),
    reflection: en
      ? "Use these symbolic themes as optional journaling prompts. What would you like to notice about your actions today?"
      : "Využijte tato symbolická témata jako volitelné podněty k deníku. Čeho si dnes chcete všimnout ve svém jednání?",
    disclaimer: en
      ? "Human Design is a symbolic self-reflection system, not a scientifically validated diagnosis or prediction."
      : "Human Design je symbolický systém sebereflexe, nikoli vědecky ověřená diagnostika nebo předpověď.",
    sourceUrl,
  };
}
