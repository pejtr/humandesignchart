import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "wouter";
import { Sun, Moon } from "lucide-react";

// Gate names in Czech
const GATE_NAMES_CS: Record<number, string> = {
  1: "Sebevyjádření", 2: "Směr Já", 3: "Uspořádání", 4: "Formulace", 5: "Pevné vzorce",
  6: "Tření", 7: "Role Já", 8: "Přínos", 9: "Soustředění", 10: "Chování Já",
  11: "Ideje", 12: "Opatrnost", 13: "Naslouchající", 14: "Mocné dovednosti", 15: "Extrémy",
  16: "Dovednosti", 17: "Názory", 18: "Korekce", 19: "Chtění", 20: "Přítomnost",
  21: "Lovec", 22: "Otevřenost", 23: "Asimilace", 24: "Racionalizace", 25: "Nevinnost",
  26: "Trikster", 27: "Výživa", 28: "Hráč", 29: "Vytrvalost", 30: "Pocity",
  31: "Vedení", 32: "Kontinuita", 33: "Soukromí", 34: "Síla", 35: "Změna",
  36: "Krize", 37: "Přátelství", 38: "Bojovník", 39: "Provokace", 40: "Samota",
  41: "Stažení", 42: "Růst", 43: "Vhled", 44: "Bdělost", 45: "Shromažďovatel",
  46: "Odhodlání", 47: "Realizace", 48: "Hloubka", 49: "Revoluce", 50: "Hodnoty",
  51: "Šok", 52: "Klid", 53: "Začátky", 54: "Ambice", 55: "Duch",
  56: "Stimulace", 57: "Intuice", 58: "Vitalita", 59: "Sexualita", 60: "Omezení",
  61: "Tajemství", 62: "Detail", 63: "Pochybnost", 64: "Zmatek",
};

const GATE_NAMES_EN: Record<number, string> = {
  1: "Self-Expression", 2: "Direction of Self", 3: "Ordering", 4: "Formulization", 5: "Fixed Patterns",
  6: "Friction", 7: "Role of Self", 8: "Contribution", 9: "Focus", 10: "Behavior of Self",
  11: "Ideas", 12: "Caution", 13: "Listener", 14: "Power Skills", 15: "Extremes",
  16: "Skills", 17: "Opinions", 18: "Correction", 19: "Wanting", 20: "The Now",
  21: "Hunter", 22: "Openness", 23: "Assimilation", 24: "Rationalization", 25: "Innocence",
  26: "Trickster", 27: "Caring", 28: "The Game Player", 29: "Perseverance", 30: "Feelings",
  31: "Leading", 32: "Continuity", 33: "Privacy", 34: "Power", 35: "Change",
  36: "Crisis", 37: "Friendship", 38: "The Fighter", 39: "Provocation", 40: "Aloneness",
  41: "Contraction", 42: "Growth", 43: "Insight", 44: "Alertness", 45: "The Gatherer",
  46: "Determination", 47: "Realization", 48: "Depth", 49: "Revolution", 50: "Values",
  51: "Shock", 52: "Stillness", 53: "Beginnings", 54: "Ambition", 55: "Spirit",
  56: "Stimulation", 57: "Intuition", 58: "Vitality", 59: "Sexuality", 60: "Limitation",
  61: "Mystery", 62: "Detail", 63: "Doubt", 64: "Confusion",
};

export default function DailyEnergyBar() {
  const { locale, localePath } = useLanguage();
  const isCs = locale === "cs";

  const { data, isLoading } = trpc.transit.current.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 min cache
    refetchInterval: 10 * 60 * 1000, // refresh every 10 min
  });

  if (isLoading || !data) return null;

  const gates = data.transitGates;
  const sun = gates.find(g => g.planet === "Sun");
  const earth = gates.find(g => g.planet === "Earth");
  const moon = gates.find(g => g.planet === "Moon");

  if (!sun || !earth) return null;

  const gateNames = isCs ? GATE_NAMES_CS : GATE_NAMES_EN;

  const today = new Date().toLocaleDateString(isCs ? "cs-CZ" : "en-US", {
    weekday: "long", day: "numeric", month: "long",
  });

  return (
    <div className="sticky top-16 z-40 w-full border-b border-purple-500/15 bg-gradient-to-r from-purple-950/60 via-indigo-950/50 to-purple-950/60 backdrop-blur-md">
      <Link href={localePath("/daily-transit")} className="block no-underline">
        <div className="container flex items-center justify-between gap-3 h-9 text-xs overflow-hidden">
          {/* Left: date */}
          <span className="hidden sm:block text-purple-300/70 shrink-0 capitalize">{today}</span>

          {/* Center: Sun + Earth + Moon */}
          <div className="flex items-center gap-3 md:gap-5 flex-1 justify-center sm:justify-start">
            {/* Sparkles icon */}
            <span className="text-purple-400/80 shrink-0 hidden md:block">✦</span>

            {/* Sun */}
            <div className="flex items-center gap-1.5 shrink-0">
              <Sun className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="text-amber-300/90 font-medium">
                {isCs ? "Brána" : "Gate"} {sun.gate}.{sun.line}
              </span>
              <span className="text-muted-foreground/60 hidden sm:inline">
                — {gateNames[sun.gate] || ""}
              </span>
            </div>

            <span className="text-purple-500/40">·</span>

            {/* Earth */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-emerald-400 text-[11px] shrink-0">⊕</span>
              <span className="text-emerald-300/90 font-medium">
                {isCs ? "Brána" : "Gate"} {earth.gate}.{earth.line}
              </span>
              <span className="text-muted-foreground/60 hidden sm:inline">
                — {gateNames[earth.gate] || ""}
              </span>
            </div>

            {moon && (
              <>
                <span className="text-purple-500/40 hidden md:inline">·</span>
                <div className="hidden md:flex items-center gap-1.5 shrink-0">
                  <Moon className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="text-slate-300/80 font-medium">
                    {isCs ? "Brána" : "Gate"} {moon.gate}.{moon.line}
                  </span>
                  <span className="text-muted-foreground/60 hidden lg:inline">
                    — {gateNames[moon.gate] || ""}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Right: CTA */}
          <span className="text-purple-400/70 shrink-0 hidden sm:block hover:text-purple-300 transition-colors">
            {isCs ? "Denní energie →" : "Daily energy →"}
          </span>
        </div>
      </Link>
    </div>
  );
}
