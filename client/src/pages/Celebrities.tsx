import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Users, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";
import type { HumanDesignChartData } from "@shared/types";

const CELEBRITIES = [
  { name: "Albert Einstein", birthDate: "1879-03-14", birthTime: "11:30", birthPlace: "Ulm, Německo", lat: 48.4011, lon: 9.9876, tz: 1 },
  { name: "Oprah Winfrey", birthDate: "1954-01-29", birthTime: "04:30", birthPlace: "Kosciusko, Mississippi, USA", lat: 33.0576, lon: -89.5876, tz: -6 },
  { name: "Elon Musk", birthDate: "1971-06-28", birthTime: "06:00", birthPlace: "Pretoria, Jižní Afrika", lat: -25.7479, lon: 28.2293, tz: 2 },
  { name: "Beyoncé", birthDate: "1981-09-04", birthTime: "10:00", birthPlace: "Houston, Texas, USA", lat: 29.7604, lon: -95.3698, tz: -6 },
  { name: "Steve Jobs", birthDate: "1955-02-24", birthTime: "19:15", birthPlace: "San Francisco, Kalifornie, USA", lat: 37.7749, lon: -122.4194, tz: -8 },
  { name: "Princezna Diana", birthDate: "1961-07-01", birthTime: "19:45", birthPlace: "Sandringham, Norfolk, UK", lat: 52.8242, lon: 0.5134, tz: 1 },
  { name: "Barack Obama", birthDate: "1961-08-04", birthTime: "19:24", birthPlace: "Honolulu, Havaj, USA", lat: 21.3069, lon: -157.8583, tz: -10 },
  { name: "Taylor Swift", birthDate: "1989-12-13", birthTime: "05:17", birthPlace: "Reading, Pensylvánie, USA", lat: 40.3356, lon: -75.9269, tz: -5 },
  { name: "Leonardo da Vinci", birthDate: "1452-04-15", birthTime: "03:00", birthPlace: "Vinci, Itálie", lat: 43.7874, lon: 10.9237, tz: 1 },
  { name: "Nikola Tesla", birthDate: "1856-07-10", birthTime: "00:00", birthPlace: "Smiljan, Chorvatsko", lat: 44.5655, lon: 15.3172, tz: 1 },
  { name: "Mahátma Gándhí", birthDate: "1869-10-02", birthTime: "07:12", birthPlace: "Porbandar, Indie", lat: 21.6417, lon: 69.6293, tz: 5 },
  { name: "Martin Luther King Jr.", birthDate: "1929-01-15", birthTime: "12:00", birthPlace: "Atlanta, Georgia, USA", lat: 33.7490, lon: -84.3880, tz: -5 },
  { name: "Madonna", birthDate: "1958-08-16", birthTime: "07:05", birthPlace: "Bay City, Michigan, USA", lat: 43.5945, lon: -83.8889, tz: -5 },
  { name: "Nelson Mandela", birthDate: "1918-07-18", birthTime: "12:00", birthPlace: "Mvezo, Jižní Afrika", lat: -31.9505, lon: 28.7780, tz: 2 },
  { name: "Angelina Jolie", birthDate: "1975-06-04", birthTime: "09:09", birthPlace: "Los Angeles, Kalifornie, USA", lat: 34.0522, lon: -118.2437, tz: -8 },
  { name: "Bill Gates", birthDate: "1955-10-28", birthTime: "22:00", birthPlace: "Seattle, Washington, USA", lat: 47.6062, lon: -122.3321, tz: -8 },
  { name: "Dalajláma", birthDate: "1935-07-06", birthTime: "04:38", birthPlace: "Taktser, Tibet", lat: 36.4000, lon: 102.7833, tz: 8 },
  { name: "Frida Kahlo", birthDate: "1907-07-06", birthTime: "08:30", birthPlace: "Coyoacán, Mexiko", lat: 19.3500, lon: -99.1621, tz: -6 },
  { name: "Michael Jackson", birthDate: "1958-08-29", birthTime: "19:33", birthPlace: "Gary, Indiana, USA", lat: 41.5934, lon: -87.3465, tz: -6 },
  { name: "Královna Alžběta II.", birthDate: "1926-04-21", birthTime: "02:40", birthPlace: "Londýn, UK", lat: 51.5074, lon: -0.1278, tz: 0 },
];

export default function Celebrities() {
  const [search, setSearch] = useState("");
  const [selectedCeleb, setSelectedCeleb] = useState<typeof CELEBRITIES[0] | null>(null);
  const [chartData, setChartData] = useState<HumanDesignChartData | null>(null);
  const { t } = useTranslation();

  const calcMutation = trpc.chart.calculate.useMutation({
    onSuccess: (data) => setChartData(data as unknown as HumanDesignChartData),
    onError: (err) => toast.error(err.message),
  });

  const handleSelectCeleb = (celeb: typeof CELEBRITIES[0]) => {
    setSelectedCeleb(celeb);
    setChartData(null);
    calcMutation.mutate({
      name: celeb.name,
      birthDate: celeb.birthDate,
      birthTime: celeb.birthTime,
      birthPlace: celeb.birthPlace,
      latitude: celeb.lat,
      longitude: celeb.lon,
      timezoneOffset: celeb.tz,
      timezone: `UTC${celeb.tz >= 0 ? "+" : ""}${celeb.tz}`,
    });
  };

  const filtered = useMemo(() => {
    return CELEBRITIES.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container max-w-5xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm mb-4">
              <Users className="w-4 h-4" />
              {t.celebrities.title}
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold mb-3">{t.celebrities.subtitle}</h1>
            <p className="text-muted-foreground">
              {t.celebrities.description}
            </p>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t.celebrities.searchPlaceholder}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Celebrity list */}
            <div className="md:col-span-1 space-y-2 max-h-[600px] overflow-y-auto pr-2">
              {filtered.map(celeb => (
                <button
                  key={celeb.name}
                  onClick={() => handleSelectCeleb(celeb)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedCeleb?.name === celeb.name
                      ? "border-primary bg-primary/10"
                      : "border-border/30 bg-card hover:border-primary/30"
                  }`}
                >
                  <p className="font-medium text-sm">{celeb.name}</p>
                  <p className="text-xs text-muted-foreground">{celeb.birthDate} &middot; {celeb.birthPlace.split(",")[0]}</p>
                </button>
              ))}
            </div>

            {/* Celebrity chart detail */}
            <div className="md:col-span-2">
              {!selectedCeleb ? (
                <Card className="bg-card border-border/50">
                  <CardContent className="py-16 text-center">
                    <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground">Vyberte celebritu pro zobrazení jejího Human Design chartu.</p>
                  </CardContent>
                </Card>
              ) : calcMutation.isPending ? (
                <Card className="bg-card border-border/50">
                  <CardContent className="py-16 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Počítám chart pro {selectedCeleb.name}...</p>
                  </CardContent>
                </Card>
              ) : chartData ? (
                <Card className="bg-card border-border/50">
                  <CardHeader>
                    <CardTitle className="font-serif text-xl">{selectedCeleb.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {selectedCeleb.birthDate} {selectedCeleb.birthTime} &middot; {selectedCeleb.birthPlace}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-6">
                      <Badge className="bg-primary/20 text-primary border-primary/30">
                        {(t.types as any)[chartData.type] || chartData.type}
                      </Badge>
                      <Badge variant="outline">{chartData.profile} {chartData.profileName}</Badge>
                      <Badge variant="outline">{chartData.authority}</Badge>
                      <Badge variant="outline">{(t.hd.definitionTypes as any)[chartData.definition] || chartData.definition}</Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      {[
                        { label: t.chart.strategy, value: (t.hd.strategies as any)[chartData.strategy] || chartData.strategy },
                        { label: t.chart.signature, value: (t.hd.signatures as any)[chartData.signature] || chartData.signature },
                        { label: t.chart.notSelf, value: (t.hd.notSelfs as any)[chartData.notSelf] || chartData.notSelf },
                        { label: t.chart.aura, value: chartData.aura },
                        { label: t.chart.incarnationCross, value: chartData.incarnationCross?.name },
                        { label: t.chart.channels, value: `${chartData.channels?.length || 0} definovaných` },
                      ].map(item => (
                        <div key={item.label} className="space-y-1">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">{item.label}</p>
                          <p className="text-sm font-medium">{item.value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-border/30 pt-4">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Definovaná Centra</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(chartData.centers || []).map(c => (
                          <Badge
                            key={c.name}
                            variant={c.defined ? "default" : "outline"}
                            className="text-xs"
                          >
                            {(t.hd.centerNames as any)[c.name] || c.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : null}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
