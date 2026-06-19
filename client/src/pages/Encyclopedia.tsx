import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, BookOpen, Zap, Circle, ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

// Czech gate names
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

const CENTER_NAMES_CS: Record<string, string> = {
  Head: "Hlava", Ajna: "Ajna", Throat: "Hrdlo", G: "G Centrum",
  Heart: "Srdce", Sacral: "Sakrální", SolarPlexus: "Solární plexus",
  Spleen: "Slezina", Root: "Kořen",
};
const CENTER_NAMES_EN: Record<string, string> = {
  Head: "Head", Ajna: "Ajna", Throat: "Throat", G: "G Center",
  Heart: "Heart", Sacral: "Sacral", SolarPlexus: "Solar Plexus",
  Spleen: "Spleen", Root: "Root",
};

const CIRCUIT_NAMES_CS: Record<string, string> = {
  Individual: "Individuální", Collective: "Kolektivní", Tribal: "Kmenový",
};
const CIRCUIT_NAMES_EN: Record<string, string> = {
  Individual: "Individual", Collective: "Collective", Tribal: "Tribal",
};

const CIRCUIT_COLORS: Record<string, string> = {
  Individual: "bg-red-100 text-red-700 border-red-200",
  Collective: "bg-blue-100 text-blue-700 border-blue-200",
  Tribal: "bg-amber-100 text-amber-700 border-amber-200",
};

type GateDetail = { gateNum: number; data: any } | null;
type ChannelDetail = { key: string; data: any } | null;

export default function Encyclopedia() {
  const { locale, localePath } = useLanguage();
  const isEN = locale === "en";
  const centerNames = isEN ? CENTER_NAMES_EN : CENTER_NAMES_CS;

  const hdContentQuery = trpc.content.getHdContent.useQuery();
  const hdData = hdContentQuery.data;

  useEffect(() => {
    if (isEN) {
      document.title = "📖 Human Design Encyclopedia — Gates, Channels & Centers 🔮";
      document.querySelector('meta[name="description"]')?.setAttribute(
        "content",
        "Browse all 64 gates, 36 channels, and 9 centers of Human Design. Detailed descriptions, I Ching hexagrams, and circuit information."
      );
    } else {
      document.title = "📖 Human Design Encyklopedie — Brány, Dráhy & Centra 🔮";
      document.querySelector('meta[name="description"]')?.setAttribute(
        "content",
        "Prozkoumejte všech 64 brán, 36 dráh a 9 center Human Design. Podrobné popisy, I-Ťing hexagramy a informace o okruzích."
      );
    }
  }, [locale, isEN]);
  const circuitNames = isEN ? CIRCUIT_NAMES_EN : CIRCUIT_NAMES_CS;

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("gates");
  const [circuitFilter, setCircuitFilter] = useState<string>("all");
  const [centerFilter, setCenterFilter] = useState<string>("all");
  const [selectedGate, setSelectedGate] = useState<GateDetail>(null);
  const [selectedChannel, setSelectedChannel] = useState<ChannelDetail>(null);

  const gatesArray = useMemo(() => {
    if (!hdData) return [];
    return Object.entries(hdData.gates).map(([num, data]) => ({
      num: parseInt(num),
      data: data as any,
    }));
  }, [hdData]);

  const channelsArray = useMemo(() => {
    if (!hdData) return [];
    return Object.entries(hdData.channels).map(([key, data]) => ({
      key,
      data: data as any,
    }));
  }, [hdData]);

  const filteredGates = useMemo(() => {
    return gatesArray.filter(g => {
      const gateName = isEN ? g.data.name : (GATE_NAMES_CS[g.num] || g.data.name);
      const matchSearch = search === "" ||
        g.num.toString().includes(search) ||
        gateName.toLowerCase().includes(search.toLowerCase()) ||
        g.data.name.toLowerCase().includes(search.toLowerCase()) ||
        g.data.iChing.toLowerCase().includes(search.toLowerCase());
      const matchCircuit = circuitFilter === "all" || g.data.circuit === circuitFilter;
      const matchCenter = centerFilter === "all" || g.data.center === centerFilter;
      return matchSearch && matchCircuit && matchCenter;
    });
  }, [gatesArray, search, circuitFilter, centerFilter, isEN]);

  const filteredChannels = useMemo(() => {
    return channelsArray.filter(c => {
      const matchSearch = search === "" ||
        c.key.includes(search) ||
        c.data.name.toLowerCase().includes(search.toLowerCase()) ||
        c.data.theme.toLowerCase().includes(search.toLowerCase());
      const matchCircuit = circuitFilter === "all" || c.data.circuit === circuitFilter;
      return matchSearch && matchCircuit;
    });
  }, [channelsArray, search, circuitFilter]);

  const centers = useMemo(() => {
    const set = new Set(gatesArray.map(g => g.data.center));
    return Array.from(set).sort();
  }, [gatesArray]);

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
              <BookOpen className="w-4 h-4" />
              {isEN ? "Human Design Encyclopedia" : "Encyklopedie Human Designu"}
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
              {isEN ? "Gates, Channels & Centers" : "Brány, dráhy a centra"}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {isEN
                ? "Complete guide to all 64 gates, 36 channels and 9 centers of the Human Design system with detailed descriptions and I Ching hexagrams."
                : "Kompletní průvodce všemi 64 branami, 36 dráhami a 9 centry systému Human Design s podrobnými popisy a I-Ťing hexagramy."}
            </p>
          </motion.div>

          {/* Search & Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={isEN ? "Search gates, channels, hexagrams..." : "Hledat brány, dráhy, hexagramy..."}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={circuitFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setCircuitFilter("all")}
              >
                {isEN ? "All" : "Vše"}
              </Button>
              {["Individual", "Collective", "Tribal"].map(c => (
                <Button
                  key={c}
                  variant={circuitFilter === c ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCircuitFilter(c)}
                >
                  {circuitNames[c]}
                </Button>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="gates" className="gap-1.5">
                <Sparkles className="w-4 h-4" />
                {isEN ? "64 Gates" : "64 bran"}
              </TabsTrigger>
              <TabsTrigger value="channels" className="gap-1.5">
                <Zap className="w-4 h-4" />
                {isEN ? "36 Channels" : "36 dráh"}
              </TabsTrigger>
              <TabsTrigger value="centers" className="gap-1.5">
                <Circle className="w-4 h-4" />
                {isEN ? "9 Centers" : "9 center"}
              </TabsTrigger>
            </TabsList>

            {/* ─── Gates Tab ─── */}
            <TabsContent value="gates">
              {activeTab === "gates" && (
                <div className="mb-4 flex gap-2 flex-wrap">
                  <Button
                    variant={centerFilter === "all" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setCenterFilter("all")}
                  >
                    {isEN ? "All centers" : "Všechna centra"}
                  </Button>
                  {centers.map(c => (
                    <Button
                      key={c}
                      variant={centerFilter === c ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setCenterFilter(c)}
                    >
                      {centerNames[c] || c}
                    </Button>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredGates.map(({ num, data }, i) => (
                  <motion.div
                    key={num}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.02, 0.5) }}
                  >
                    <Card
                      className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-0.5 h-full"
                      onClick={() => setSelectedGate({ gateNum: num, data })}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary text-lg">
                              {num}
                            </div>
                            <div>
                              <CardTitle className="text-sm font-semibold">
                                {isEN ? (data.nameEn || data.name) : (GATE_NAMES_CS[num] || data.name)}
                              </CardTitle>
                              <p className="text-xs text-muted-foreground">{data.iChing}</p>
                            </div>
                          </div>
                          <span className="text-2xl" title={data.iChing}>{data.hexagram}</span>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{isEN ? (data.themeEn || data.theme) : data.theme}</p>
                        <div className="flex gap-1.5 flex-wrap">
                          <Badge variant="outline" className={`text-[10px] ${CIRCUIT_COLORS[data.circuit] || ""}`}>
                            {circuitNames[data.circuit]}
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">
                            {centerNames[data.center]}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
              {filteredGates.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  {isEN ? "No gates match your search." : "Žádné brány neodpovídají vašemu hledání."}
                </div>
              )}
            </TabsContent>

            {/* ─── Channels Tab ─── */}
            <TabsContent value="channels">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredChannels.map(({ key, data }, i) => (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.03, 0.5) }}
                  >
                    <Card
                      className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-0.5 h-full"
                      onClick={() => setSelectedChannel({ key, data })}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-sm font-semibold">{isEN ? (data.nameEn || data.name) : data.name}</CardTitle>
                            <p className="text-xs text-muted-foreground mt-0.5">{isEN ? (data.themeEn || data.theme) : data.theme}</p>
                          </div>
                          <div className="flex items-center gap-1 text-primary font-bold text-sm shrink-0">
                            {data.gates[0]}
                            <ArrowRight className="w-3 h-3" />
                            {data.gates[1]}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-3">{isEN ? (data.descriptionEn || data.description) : data.description}</p>
                        <div className="flex gap-1.5 flex-wrap">
                          <Badge variant="outline" className={`text-[10px] ${CIRCUIT_COLORS[data.circuit] || ""}`}>
                            {circuitNames[data.circuit]}
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">
                            {centerNames[data.centers[0]]} → {centerNames[data.centers[1]]}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
              {filteredChannels.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  {isEN ? "No channels match your search." : "Žádné dráhy neodpovídají vašemu hledání."}
                </div>
              )}
            </TabsContent>

            {/* ─── Centers Tab ─── */}
            <TabsContent value="centers">
              {!hdData ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(hdData.centers).map(([key, data]: [string, any], i) => (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Card className="h-full">
                        <CardHeader>
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                              <Circle className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-base">{centerNames[key] || data.name}</CardTitle>
                              <p className="text-xs text-muted-foreground">{data.biologicalCorrelation}</p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm font-medium text-primary mb-3">{data.theme}</p>
                          <div className="space-y-3">
                            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                              <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">
                                ✦ {isEN ? "Defined center" : "Definované centrum"}
                              </p>
                              <p className="text-xs text-green-800 dark:text-green-300">{data.definedMeaning}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700">
                              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                ○ {isEN ? "Open center" : "Otevřené centrum"}
                              </p>
                              <p className="text-xs text-gray-800 dark:text-gray-200">{data.openMeaning}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">
                                ? {isEN ? "Not-Self question" : "Otázka Ne-Já"}
                              </p>
                              <p className="text-xs text-amber-800 dark:text-amber-300 italic">{data.notSelfQuestion}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Gate Detail Dialog */}
      <Dialog open={!!selectedGate} onOpenChange={() => setSelectedGate(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {selectedGate && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary text-2xl">
                    {selectedGate.gateNum}
                  </div>
                  <div>
                    <DialogTitle className="text-xl">
                      {isEN ? (selectedGate.data.nameEn || selectedGate.data.name) : (GATE_NAMES_CS[selectedGate.gateNum] || selectedGate.data.name)}
                    </DialogTitle>
                    <p className="text-sm text-muted-foreground">
                      {selectedGate.data.iChing} {selectedGate.data.hexagram}
                    </p>
                  </div>
                </div>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="flex gap-2 flex-wrap">
                  <Badge className={CIRCUIT_COLORS[selectedGate.data.circuit]}>
                    {circuitNames[selectedGate.data.circuit]}{isEN ? " circuit" : " okruh"}
                  </Badge>
                  <Badge variant="outline">
                    {centerNames[selectedGate.data.center]}
                  </Badge>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-1">{isEN ? "Theme" : "Téma"}</h4>
                  <p className="text-sm text-muted-foreground">{isEN ? (selectedGate.data.themeEn || selectedGate.data.theme) : selectedGate.data.theme}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-1">{isEN ? "Description" : "Popis"}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{isEN ? (selectedGate.data.descriptionEn || selectedGate.data.description) : selectedGate.data.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                    <p className="text-xs font-semibold text-green-700 mb-0.5">{isEN ? "Gift" : "Dar (Gift)"}</p>
                    <p className="text-sm font-medium text-green-800">{isEN ? (selectedGate.data.giftKeywordEn || selectedGate.data.giftKeyword) : selectedGate.data.giftKeyword}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-xs font-semibold text-red-700 mb-0.5">{isEN ? "Shadow" : "Stín (Shadow)"}</p>
                    <p className="text-sm font-medium text-red-800">{isEN ? (selectedGate.data.shadowKeywordEn || selectedGate.data.shadowKeyword) : selectedGate.data.shadowKeyword}</p>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 border">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">{isEN ? "I Ching hexagram" : "I-Ťing hexagram"}</p>
                  <p className="text-4xl text-center py-2">{selectedGate.data.hexagram}</p>
                  <p className="text-sm text-center text-muted-foreground">{selectedGate.data.iChing}</p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Channel Detail Dialog */}
      <Dialog open={!!selectedChannel} onOpenChange={() => setSelectedChannel(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {selectedChannel && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-primary font-bold text-xl">
                    {selectedChannel.data.gates[0]}
                    <ArrowRight className="w-5 h-5" />
                    {selectedChannel.data.gates[1]}
                  </div>
                  <div>
                    <DialogTitle className="text-xl">{isEN ? (selectedChannel.data.nameEn || selectedChannel.data.name) : selectedChannel.data.name}</DialogTitle>
                    <p className="text-sm text-muted-foreground">{isEN ? (selectedChannel.data.themeEn || selectedChannel.data.theme) : selectedChannel.data.theme}</p>
                  </div>
                </div>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="flex gap-2 flex-wrap">
                  <Badge className={CIRCUIT_COLORS[selectedChannel.data.circuit]}>
                    {circuitNames[selectedChannel.data.circuit]}{isEN ? " circuit" : " okruh"}
                  </Badge>
                  <Badge variant="outline">
                    {centerNames[selectedChannel.data.centers[0]]} → {centerNames[selectedChannel.data.centers[1]]}
                  </Badge>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-1">{isEN ? "Description" : "Popis"}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{isEN ? (selectedChannel.data.descriptionEn || selectedChannel.data.description) : selectedChannel.data.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {selectedChannel.data.gates.map(gateNum => {
                    const gateData = hdData?.gates[gateNum];
                    return gateData ? (
                      <div key={gateNum} className="p-3 rounded-lg bg-muted/50 border">
                        <p className="text-xs font-semibold text-muted-foreground mb-0.5">
                          {isEN ? `Gate ${gateNum}` : `Brána ${gateNum}`}
                        </p>
                        <p className="text-sm font-medium">
                          {isEN ? (gateData.nameEn || gateData.name) : (GATE_NAMES_CS[gateNum] || gateData.name)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{gateData.iChing} {gateData.hexagram}</p>
                        <p className="text-xs text-muted-foreground mt-1">{centerNames[gateData.center]}</p>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
