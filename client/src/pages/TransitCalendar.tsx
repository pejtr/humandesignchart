import { useState, useMemo, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronLeft, ChevronRight, Sun, Moon, Sparkles, ArrowRight } from "lucide-react";


const PLANET_NAMES_CS: Record<string, string> = {
  Sun: "Slunce", Earth: "Země", NorthNode: "Severní uzel", SouthNode: "Jižní uzel",
  Moon: "Měsíc", Mercury: "Merkur", Venus: "Venuše", Mars: "Mars",
  Jupiter: "Jupiter", Saturn: "Saturn", Uranus: "Uran", Neptune: "Neptun", Pluto: "Pluto",
};

const PLANET_ICONS: Record<string, string> = {
  Sun: "☉", Earth: "⊕", Moon: "☽", Mercury: "☿", Venus: "♀", Mars: "♂",
  Jupiter: "♃", Saturn: "♄", Uranus: "♅", Neptune: "♆", Pluto: "♇",
  NorthNode: "☊", SouthNode: "☋",
};

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

const DAYS_CS = ["Ne", "Po", "Út", "St", "Čt", "Pá", "So"];
const MONTHS_CS = [
  "Leden", "Únor", "Březen", "Duben", "Květen", "Červen",
  "Červenec", "Srpen", "Září", "Říjen", "Listopad", "Prosinec"
];

export default function TransitCalendar() {
  const { locale } = useLanguage();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMonth, setViewMonth] = useState(new Date());

  const { data: hdData, isLoading: isLoadingContent } = trpc.content.hdData.useQuery();
  const GATE_DESCRIPTIONS = hdData?.gates || {};

  useEffect(() => {
    if (locale === "en") {
      document.title = "📅 Human Design Transit Calendar — Daily & Weekly Overview 🌙";
      document.querySelector('meta[name="description"]')?.setAttribute(
        "content",
        "Plan with the Human Design transit calendar. See daily and weekly gate activations and their influence on your energy."
      );
    } else {
      document.title = "📅 Human Design Tranzitní Kalendář — Denní & Týdenní Přehled 🌙";
      document.querySelector('meta[name="description"]')?.setAttribute(
        "content",
        "Plánujte s Human Design tranzitním kalendářem. Sledujte denní a týdenní aktivace brán a jejich vliv na vaši energii."
      );
    }
  }, [locale]);

  const transitQuery = trpc.transit.current.useQuery(undefined, {
    refetchInterval: 60000,
  });

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPad = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Monday start

    const days: Array<{ date: Date; isCurrentMonth: boolean; isToday: boolean; isSelected: boolean }> = [];

    // Previous month padding
    for (let i = startPad - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({ date: d, isCurrentMonth: false, isToday: false, isSelected: false });
    }

    // Current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(year, month, i);
      const today = new Date();
      days.push({
        date: d,
        isCurrentMonth: true,
        isToday: d.toDateString() === today.toDateString(),
        isSelected: d.toDateString() === selectedDate.toDateString(),
      });
    }

    // Next month padding
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({ date: d, isCurrentMonth: false, isToday: false, isSelected: false });
    }

    return days;
  }, [viewMonth, selectedDate]);

  const prevMonth = () => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1));
  const nextMonth = () => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1));

  // Group transits by planet type
  const personalPlanets = transitQuery.data?.transitGates.filter(t =>
    ["Sun", "Earth", "Moon", "Mercury", "Venus", "Mars"].includes(t.planet)
  ) || [];

  const outerPlanets = transitQuery.data?.transitGates.filter(t =>
    ["Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"].includes(t.planet)
  ) || [];

  const lunarNodes = transitQuery.data?.transitGates.filter(t =>
    ["NorthNode", "SouthNode"].includes(t.planet)
  ) || [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container max-w-7xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Calendar className="w-4 h-4" />
              Tranzitní kalendář
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
              Planetární tranzity
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Sledujte denní pohyb planet skrze brány Human Designu. Tranzity ovlivňují kolektivní energii a mohou aktivovat vaše spící brány.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Calendar */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Button variant="ghost" size="icon" onClick={prevMonth}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <CardTitle className="text-base">
                    {MONTHS_CS[viewMonth.getMonth()]} {viewMonth.getFullYear()}
                  </CardTitle>
                  <Button variant="ghost" size="icon" onClick={nextMonth}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {["Po", "Út", "St", "Čt", "Pá", "So", "Ne"].map(d => (
                    <div key={d} className="text-center text-xs text-muted-foreground font-medium py-1">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedDate(day.date)}
                      className={`
                        aspect-square rounded-lg text-sm flex items-center justify-center transition-all
                        ${!day.isCurrentMonth ? "text-muted-foreground/40" : "text-foreground"}
                        ${day.isToday ? "ring-2 ring-primary font-bold" : ""}
                        ${day.isSelected ? "bg-primary text-primary-foreground" : "hover:bg-muted"}
                      `}
                    >
                      {day.date.getDate()}
                    </button>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => { setSelectedDate(new Date()); setViewMonth(new Date()); }}
                  >
                    Dnes
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Transit details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Current date info */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Sun className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold">
                        {DAYS_CS[selectedDate.getDay()]} {selectedDate.getDate()}. {MONTHS_CS[selectedDate.getMonth()]} {selectedDate.getFullYear()}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Aktuální tranzitní energie
                      </p>
                    </div>
                  </div>

                  {transitQuery.isLoading ? (
                    <div className="text-center py-8 text-muted-foreground">Načítání tranzitů...</div>
                  ) : (
                    <div className="space-y-6">
                      {/* Personal planets */}
                      <div>
                        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <Sun className="w-4 h-4 text-amber-500" />
                          Osobní planety
                          <span className="text-xs text-muted-foreground font-normal">(rychlý pohyb)</span>
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {personalPlanets.map(transit => {
                            const gateData = GATE_DESCRIPTIONS[transit.gate];
                            return (
                              <div key={transit.planet} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                                <span className="text-xl w-7 text-center">{PLANET_ICONS[transit.planet] || "•"}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">{PLANET_NAMES_CS[transit.planet]}</span>
                                    <Badge variant="outline" className="text-[10px] shrink-0">
                                      Brána {transit.gate}.{transit.line}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {GATE_NAMES_CS[transit.gate]} — {gateData?.iChing || ""}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Outer planets */}
                      <div>
                        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-purple-500" />
                          Vnější planety
                          <span className="text-xs text-muted-foreground font-normal">(pomalý pohyb, kolektivní vliv)</span>
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {outerPlanets.map(transit => {
                            const gateData = GATE_DESCRIPTIONS[transit.gate];
                            return (
                              <div key={transit.planet} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                                <span className="text-xl w-7 text-center">{PLANET_ICONS[transit.planet] || "•"}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">{PLANET_NAMES_CS[transit.planet]}</span>
                                    <Badge variant="outline" className="text-[10px] shrink-0">
                                      Brána {transit.gate}.{transit.line}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {GATE_NAMES_CS[transit.gate]} — {gateData?.iChing || ""}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Lunar Nodes */}
                      <div>
                        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <Moon className="w-4 h-4 text-slate-500" />
                          Lunární uzly
                          <span className="text-xs text-muted-foreground font-normal">(karmické směřování)</span>
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {lunarNodes.map(transit => {
                            const gateData = GATE_DESCRIPTIONS[transit.gate];
                            return (
                              <div key={transit.planet} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                                <span className="text-xl w-7 text-center">{PLANET_ICONS[transit.planet] || "•"}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">{PLANET_NAMES_CS[transit.planet]}</span>
                                    <Badge variant="outline" className="text-[10px] shrink-0">
                                      Brána {transit.gate}.{transit.line}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {GATE_NAMES_CS[transit.gate]} — {gateData?.iChing || ""}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Transit insight */}
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardContent className="p-6">
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Denní energie
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {personalPlanets.length > 0 ? (
                      <>
                        Dnes je Slunce v bráně <strong>{personalPlanets[0]?.gate}</strong> ({GATE_NAMES_CS[personalPlanets[0]?.gate]}) —
                        {" "}{GATE_DESCRIPTIONS[personalPlanets[0]?.gate]?.theme || ""}.
                        {personalPlanets[1] && (
                          <> Země je v bráně <strong>{personalPlanets[1]?.gate}</strong> ({GATE_NAMES_CS[personalPlanets[1]?.gate]}),
                            což přináší uzemňující energii {GATE_DESCRIPTIONS[personalPlanets[1]?.gate]?.theme?.toLowerCase() || ""}.</>
                        )}
                      </>
                    ) : (
                      "Načítání denní energie..."
                    )}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
