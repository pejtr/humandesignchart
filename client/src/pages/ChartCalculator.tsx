import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Compass, Loader2, MapPin, Calendar, Clock, Info } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ChartCalculator() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const { t, localePath } = useLanguage();

  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [timezone, setTimezone] = useState("");
  const [timezoneOffset, setTimezoneOffset] = useState(0);
  const [locationResolved, setLocationResolved] = useState(false);

  const calculateMutation = trpc.chart.calculate.useMutation({
    onSuccess: (data) => {
      sessionStorage.setItem("chartResult", JSON.stringify(data));
      sessionStorage.setItem("chartMeta", JSON.stringify({
        name, birthDate, birthTime, birthPlace, latitude, longitude, timezone,
      }));
      navigate(localePath("/chart/new"));
    },
    onError: (err) => {
      toast.error(t.common?.error ? `${t.common.error}: ${err.message}` : `Calculation failed: ${err.message}`);
    },
  });

  const handlePlaceSearch = async () => {
    if (!birthPlace.trim()) return;
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(birthPlace)}&limit=1`
      );
      const results = await response.json();
      if (results && results.length > 0) {
        const result = results[0];
        setLatitude(result.lat);
        setLongitude(result.lon);
        setBirthPlace(result.display_name);
        const tzOffset = Math.round(parseFloat(result.lon) / 15);
        setTimezoneOffset(tzOffset);
        setTimezone(`UTC${tzOffset >= 0 ? "+" : ""}${tzOffset}`);
        setLocationResolved(true);
        toast.success(t.calculator.locationFound);
      } else {
        toast.error(t.calculator.locationNotFound);
      }
    } catch {
      toast.error(t.calculator.locationSearchFailed);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !birthDate || !birthTime || !locationResolved) {
      toast.error("Vyplňte prosím všechna pole a vyhledejte lokaci.");
      return;
    }

    calculateMutation.mutate({
      name,
      birthDate,
      birthTime,
      birthPlace,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      timezoneOffset,
      timezone,
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 pt-24 pb-16">
        <div className="container max-w-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm mb-4">
              <Compass className="w-4 h-4" />
              {t.nav.calculateChart}
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold mb-3">
              {t.calculator.title}
            </h1>
            <p className="text-muted-foreground">
              {t.calculator.description}
            </p>
          </div>

          <Card className="bg-card border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="font-serif text-xl text-foreground">Údaje o narození</CardTitle>
              <CardDescription>
                {t.calculator.birthTimeNote}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">{t.calculator.name}</Label>
                  <Input
                    id="name"
                    placeholder={t.calculator.namePlaceholder}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                {/* Birth Date & Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="birthDate" className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      {t.calculator.birthDate}
                    </Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="birthTime" className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      {t.calculator.birthTime}
                    </Label>
                    <Input
                      id="birthTime"
                      type="time"
                      value={birthTime}
                      onChange={(e) => setBirthTime(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Birth Place */}
                <div className="space-y-2">
                  <Label htmlFor="birthPlace" className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    {t.calculator.birthPlace}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="birthPlace"
                      placeholder={t.calculator.birthPlacePlaceholder}
                      value={birthPlace}
                      onChange={(e) => {
                        setBirthPlace(e.target.value);
                        setLocationResolved(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handlePlaceSearch();
                        }
                      }}
                      required
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handlePlaceSearch}
                      disabled={!birthPlace.trim()}
                    >
                      <MapPin className="w-4 h-4 mr-1" />
                      {t.calculator.findLocation}
                    </Button>
                  </div>
                  {locationResolved && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <Info className="w-3.5 h-3.5" />
                      {t.calculator.coordinates}: {latitude}, {longitude} ({timezone})
                    </div>
                  )}
                </div>

                {/* Manual coordinates */}
                {!locationResolved && (
                  <div className="rounded-lg border border-border/50 p-4 space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Nebo zadejte souřadnice ručně:
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Zeměpisná šířka</Label>
                        <Input
                          placeholder="50.08"
                          value={latitude}
                          onChange={(e) => setLatitude(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Zeměpisná délka</Label>
                        <Input
                          placeholder="14.44"
                          value={longitude}
                          onChange={(e) => setLongitude(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">UTC Offset</Label>
                        <Input
                          type="number"
                          placeholder="1"
                          value={timezoneOffset}
                          onChange={(e) => {
                            const v = parseInt(e.target.value) || 0;
                            setTimezoneOffset(v);
                            setTimezone(`UTC${v >= 0 ? "+" : ""}${v}`);
                            if (latitude && longitude) setLocationResolved(true);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={calculateMutation.isPending}
                >
                  {calculateMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {t.calculator.calculating}
                    </>
                  ) : (
                    <>
                      <Compass className="w-5 h-5 mr-2" />
                      {t.calculator.calculate}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
