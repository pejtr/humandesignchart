import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link, useLocation } from "wouter";
import { Sun, Moon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

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
  const [, setLocation] = useLocation();
  const { locale, localePath } = useLanguage();
  const isCs = locale === "cs";

  const { data, isLoading } = trpc.transit.current.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });

  if (isLoading || !data) return null;

  const gates = data.transitGates;
  const sun = gates.find(g => g.planet === "Sun");
  const earth = gates.find(g => g.planet === "Earth");
  const moon = gates.find(g => g.planet === "Moon");

  if (!sun || !earth) return null;

  const gateNames = isCs ? GATE_NAMES_CS : GATE_NAMES_EN;

  const today = new Date().toLocaleDateString(isCs ? "cs-CZ" : "en-US", {
    weekday: "short", day: "numeric", month: "short",
  });

  return (
    <div className="sticky top-16 z-40 w-full border-b border-purple-500/30"
      style={{
        background: "linear-gradient(135deg, #0d0520 0%, #130a2a 50%, #0d0520 100%)",
        boxShadow: "0 2px 20px rgba(139,92,246,0.3), inset 0 1px 0 rgba(139,92,246,0.2)",
      }}
    >
      <Link href={localePath("/daily-transit")} className="block no-underline">

        {/* ── DESKTOP (sm+): single row ─────────────────────────────── */}
        <div className="hidden sm:flex container items-center justify-between gap-4 h-10 text-xs">
          {/* Date */}
          <span className="text-purple-300/80 shrink-0 capitalize font-medium tracking-wide">{today}</span>

          {/* Planets row */}
          <div className="flex items-center gap-4 flex-1 justify-center">
            {/* Sun */}
            <TooltipProvider>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 shrink-0 hover:bg-white/5 p-1.5 rounded-lg transition-colors cursor-help">
                    <Sun className="w-3.5 h-3.5 shrink-0" style={{ color: "#ffd700", filter: "drop-shadow(0 0 6px #ffd700)" }} />
                    <span className="font-black tracking-wider" style={{ color: "#ffe566", textShadow: "0 0 10px #ffd700, 0 0 20px #ffd70088" }}>
                      {isCs ? "Brána" : "Gate"} {sun.gate}.{sun.line}
                    </span>
                    <span className="text-purple-300/60 hidden md:inline">— {gateNames[sun.gate] || ""}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="bg-background border-primary/20 shadow-xl max-w-xs text-center p-3">
                  <p className="font-semibold text-primary">{isCs ? "Tranzit Slunce (70 % vlivu)" : "Sun Transit (70% influence)"}</p>
                  <p className="text-xs font-medium bg-primary/10 text-primary py-0.5 px-2 rounded-full inline-block mt-1 mb-2">
                    {isCs ? sun.theme : sun.themeEn}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                    {isCs ? sun.description : sun.descriptionEn}
                  </p>
                  <p className="text-[10px] text-primary/70 font-semibold uppercase tracking-wider">{isCs ? "Klikněte pro denní výklad" : "Click for daily reading"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <span style={{ color: "rgba(139,92,246,0.5)" }}>✦</span>

            {/* Earth */}
            <TooltipProvider>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <div
                    onClick={() => setLocation(localePath("/daily-transit"))}
                    className="flex items-center gap-1.5 shrink-0 hover:bg-white/5 p-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <span className="text-[14px] shrink-0" style={{ color: "#4ade80", filter: "drop-shadow(0 0 6px #4ade80)", lineHeight: 1 }}>⊕</span>
                    <span className="font-black tracking-wider" style={{ color: "#86efac", textShadow: "0 0 10px #4ade80, 0 0 20px #4ade8088" }}>
                      {isCs ? "Brána" : "Gate"} {earth.gate}.{earth.line}
                    </span>
                    <span className="text-purple-300/60 hidden md:inline">— {gateNames[earth.gate] || ""}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="bg-background border-green-500/30 shadow-xl max-w-xs text-center p-3">
                  <p className="font-semibold text-green-500">{isCs ? "Tranzit Země (Ukotvení)" : "Earth Transit (Grounding)"}</p>
                  <p className="text-xs font-medium bg-green-500/10 text-green-500 py-0.5 px-2 rounded-full inline-block mt-1 mb-2">
                    {isCs ? earth.theme : earth.themeEn}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                    {isCs ? earth.description : earth.descriptionEn}
                  </p>
                  <p className="text-[10px] text-green-500/70 font-semibold uppercase tracking-wider">{isCs ? "Klikněte pro denní výklad" : "Click for daily reading"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {moon && (
              <>
                <span style={{ color: "rgba(139,92,246,0.5)" }}>✦</span>
                <TooltipProvider>
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <div
                        onClick={() => setLocation(localePath("/daily-transit"))}
                        className="hidden lg:flex items-center gap-1.5 shrink-0 hover:bg-white/5 p-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        <Moon className="w-3.5 h-3.5 shrink-0" style={{ color: "#67e8f9", filter: "drop-shadow(0 0 6px #67e8f9)" }} />
                        <span className="font-black tracking-wider" style={{ color: "#a5f3fc", textShadow: "0 0 10px #67e8f9, 0 0 20px #67e8f988" }}>
                          {isCs ? "Brána" : "Gate"} {moon.gate}.{moon.line}
                        </span>
                        <span className="text-purple-300/60 hidden xl:inline">— {gateNames[moon.gate] || ""}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="bg-background border-cyan-500/30 shadow-xl max-w-xs text-center p-3">
                      <p className="font-semibold text-cyan-500">{isCs ? "Tranzit Měsíce (Nálady)" : "Moon Transit (Moods)"}</p>
                      <p className="text-xs font-medium bg-cyan-500/10 text-cyan-500 py-0.5 px-2 rounded-full inline-block mt-1 mb-2">
                        {isCs ? moon.theme : moon.themeEn}
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                        {isCs ? moon.description : moon.descriptionEn}
                      </p>
                      <p className="text-[10px] text-cyan-500/70 font-semibold uppercase tracking-wider">{isCs ? "Klikněte pro denní výklad" : "Click for daily reading"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </>
            )}
          </div>

          {/* CTA */}
          <span className="shrink-0 font-semibold tracking-wide transition-all" style={{ color: "#c084fc" }}>
            {isCs ? "Denní energie →" : "Daily energy →"}
          </span>
        </div>

        {/* ── MOBILE: pill cards row ────────────────────────────────── */}
        <div className="sm:hidden flex items-center justify-center gap-2 px-3 py-2">
          {/* Sun pill */}
          <div className="flex items-center gap-1.5 rounded-full px-3 py-1"
            style={{
              background: "rgba(251,191,36,0.12)",
              border: "1px solid rgba(251,191,36,0.4)",
              boxShadow: "0 0 10px rgba(251,191,36,0.2)",
            }}
          >
            <Sun className="w-3.5 h-3.5 shrink-0" style={{ color: "#ffd700", filter: "drop-shadow(0 0 4px #ffd700)" }} />
            <span className="text-[11px] font-black" style={{ color: "#ffe566", textShadow: "0 0 8px #ffd700" }}>
              {sun.gate}.{sun.line}
            </span>
            <span className="text-[10px] font-medium" style={{ color: "rgba(255,229,102,0.7)" }}>
              {gateNames[sun.gate]?.split(" ")[0] || ""}
            </span>
          </div>

          {/* Earth pill */}
          <div className="flex items-center gap-1.5 rounded-full px-3 py-1"
            style={{
              background: "rgba(74,222,128,0.12)",
              border: "1px solid rgba(74,222,128,0.4)",
              boxShadow: "0 0 10px rgba(74,222,128,0.2)",
            }}
          >
            <span className="text-[13px] shrink-0" style={{ color: "#4ade80", filter: "drop-shadow(0 0 4px #4ade80)", lineHeight: 1 }}>⊕</span>
            <span className="text-[11px] font-black" style={{ color: "#86efac", textShadow: "0 0 8px #4ade80" }}>
              {earth.gate}.{earth.line}
            </span>
            <span className="text-[10px] font-medium" style={{ color: "rgba(134,239,172,0.7)" }}>
              {gateNames[earth.gate]?.split(" ")[0] || ""}
            </span>
          </div>

          {/* Moon pill (mobile) */}
          {moon && (
            <div className="flex items-center gap-1.5 rounded-full px-3 py-1"
              style={{
                background: "rgba(103,232,249,0.12)",
                border: "1px solid rgba(103,232,249,0.4)",
                boxShadow: "0 0 10px rgba(103,232,249,0.2)",
              }}
            >
              <Moon className="w-3 h-3 shrink-0" style={{ color: "#67e8f9", filter: "drop-shadow(0 0 4px #67e8f9)" }} />
              <span className="text-[11px] font-black" style={{ color: "#a5f3fc", textShadow: "0 0 8px #67e8f9" }}>
                {moon.gate}.{moon.line}
              </span>
            </div>
          )}
        </div>

      </Link>
    </div>
  );
}
