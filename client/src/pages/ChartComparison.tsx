import { useState } from "react";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Bodygraph from "@/components/Bodygraph";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Users, Zap, MapPin, Calendar, Clock } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";
import type { HumanDesignChartData } from "@shared/types";

interface ChartFormData {
  name: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  latitude: string;
  longitude: string;
  timezone: string;
  timezoneOffset: number;
  locationResolved: boolean;
}

const emptyForm = (): ChartFormData => ({
  name: "", birthDate: "", birthTime: "", birthPlace: "",
  latitude: "", longitude: "", timezone: "", timezoneOffset: 0, locationResolved: false,
});

function ChartInputForm({ label, form, setForm, onCalculate, loading }: {
  label: string;
  form: ChartFormData;
  setForm: (f: ChartFormData) => void;
  onCalculate: () => void;
  loading: boolean;
}) {
  const handlePlaceSearch = async () => {
    if (!form.birthPlace.trim()) return;
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(form.birthPlace)}&limit=1`
      );
      const results = await response.json();
      if (results && results.length > 0) {
        const r = results[0];
        const tzOff = Math.round(parseFloat(r.lon) / 15);
        setForm({
          ...form,
          latitude: r.lat,
          longitude: r.lon,
          birthPlace: r.display_name,
          timezoneOffset: tzOff,
          timezone: `UTC${tzOff >= 0 ? "+" : ""}${tzOff}`,
          locationResolved: true,
        });
        toast.success("Lokace nalezena!");
      } else {
        toast.error("Lokace nenalezena.");
      }
    } catch { toast.error("Vyhledávání selhalo."); }
  };

  return (
    <Card className="bg-card border-border/50">
      <CardHeader>
        <CardTitle className="font-serif text-lg">{label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Jméno</Label>
          <Input placeholder="Jméno" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />Datum</Label>
            <Input type="date" value={form.birthDate} onChange={e => setForm({ ...form, birthDate: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />Čas</Label>
            <Input type="time" value={form.birthTime} onChange={e => setForm({ ...form, birthTime: e.target.value })} />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />Místo</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Město, Země"
              value={form.birthPlace}
              onChange={e => setForm({ ...form, birthPlace: e.target.value, locationResolved: false })}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handlePlaceSearch(); } }}
            />
            <Button type="button" variant="secondary" size="sm" onClick={handlePlaceSearch}>Najít</Button>
          </div>
          {form.locationResolved && (
            <p className="text-xs text-green-600">{form.latitude}, {form.longitude} ({form.timezone})</p>
          )}
        </div>
        <Button
          className="w-full"
          onClick={onCalculate}
          disabled={loading || !form.name || !form.birthDate || !form.birthTime || !form.locationResolved}
        >
          {loading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
          Vypočítat
        </Button>
      </CardContent>
    </Card>
  );
}

export default function ChartComparison() {
  const [formA, setFormA] = useState<ChartFormData>(emptyForm());
  const [formB, setFormB] = useState<ChartFormData>(emptyForm());
  const [chartA, setChartA] = useState<HumanDesignChartData | null>(null);
  const [chartB, setChartB] = useState<HumanDesignChartData | null>(null);
  const { t } = useTranslation();

  const calcA = trpc.chart.calculate.useMutation({
    onSuccess: (data) => setChartA(data as unknown as HumanDesignChartData),
    onError: (err) => toast.error(err.message),
  });
  const calcB = trpc.chart.calculate.useMutation({
    onSuccess: (data) => setChartB(data as unknown as HumanDesignChartData),
    onError: (err) => toast.error(err.message),
  });

  const calcChart = (form: ChartFormData, mutation: typeof calcA) => {
    mutation.mutate({
      name: form.name,
      birthDate: form.birthDate,
      birthTime: form.birthTime,
      birthPlace: form.birthPlace,
      latitude: parseFloat(form.latitude),
      longitude: parseFloat(form.longitude),
      timezoneOffset: form.timezoneOffset,
      timezone: form.timezone,
    });
  };

  // Find electromagnetic connections
  const electromagneticChannels = chartA && chartB ? (() => {
    const aGates = new Set(chartA.activatedGates || []);
    const bGates = new Set(chartB.activatedGates || []);
    const connections: Array<{ gate1: number; gate2: number; source: string }> = [];

    const channelDefs = [
      [1,8],[2,14],[3,60],[4,63],[5,15],[6,59],[7,31],[9,52],[10,20],[10,34],[10,57],
      [11,56],[12,22],[13,33],[16,48],[17,62],[18,58],[19,49],[20,34],[20,57],
      [21,45],[23,43],[24,61],[25,51],[26,44],[27,50],[28,38],[29,46],[30,41],
      [32,54],[34,57],[35,36],[37,40],[39,55],[42,53],[47,64],
    ];

    for (const [g1, g2] of channelDefs) {
      if (aGates.has(g1) && bGates.has(g2) && !aGates.has(g2)) {
        connections.push({ gate1: g1, gate2: g2, source: `${formA.name} Brána ${g1} + ${formB.name} Brána ${g2}` });
      }
      if (bGates.has(g1) && aGates.has(g2) && !bGates.has(g2)) {
        connections.push({ gate1: g1, gate2: g2, source: `${formB.name} Brána ${g1} + ${formA.name} Brána ${g2}` });
      }
    }
    return connections;
  })() : [];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm mb-4">
              <Users className="w-4 h-4" />
              {t.comparison.title}
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold mb-3">{t.comparison.subtitle}</h1>
            <p className="text-muted-foreground">{t.comparison.description}</p>
          </div>

          {/* Input Forms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <ChartInputForm label={t.comparison.personA} form={formA} setForm={setFormA}
              onCalculate={() => calcChart(formA, calcA)} loading={calcA.isPending} />
            <ChartInputForm label={t.comparison.personB} form={formB} setForm={setFormB}
              onCalculate={() => calcChart(formB, calcB)} loading={calcB.isPending} />
          </div>

          {/* Results */}
          {chartA && chartB && (
            <>
              {/* Side by side bodygraphs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Card className="bg-card border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="font-serif text-lg">{formA.name}</CardTitle>
                    <div className="flex gap-2">
                      <Badge variant="outline">{(t.types as any)[chartA.type] || chartA.type}</Badge>
                      <Badge variant="outline">{chartA.profile}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex justify-center">
                    <Bodygraph chart={chartA} width={340} height={410} />
                  </CardContent>
                </Card>
                <Card className="bg-card border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="font-serif text-lg">{formB.name}</CardTitle>
                    <div className="flex gap-2">
                      <Badge variant="outline">{(t.types as any)[chartB.type] || chartB.type}</Badge>
                      <Badge variant="outline">{chartB.profile}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex justify-center">
                    <Bodygraph chart={chartB} width={340} height={410} />
                  </CardContent>
                </Card>
              </div>

              {/* Electromagnetic Connections */}
              <Card className="bg-card border-border/50 mb-8">
                <CardHeader>
                  <CardTitle className="font-serif text-xl flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    {t.comparison.electromagneticConnections} ({electromagneticChannels.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {electromagneticChannels.length === 0 ? (
                    <p className="text-muted-foreground text-center py-6">
                      {t.comparison.noConnections}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {electromagneticChannels.map((c, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
                          <div>
                            <p className="font-medium">Kanál {c.gate1}-{c.gate2}</p>
                            <p className="text-sm text-muted-foreground">{c.source}</p>
                          </div>
                          <Zap className="w-5 h-5 text-primary" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Comparison Table */}
              <Card className="bg-card border-border/50">
                <CardHeader>
                  <CardTitle className="font-serif text-xl">{t.comparison.sideBySide}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/50">
                          <th className="text-left py-2 px-3 text-muted-foreground">{t.comparison.property}</th>
                          <th className="text-left py-2 px-3">{formA.name}</th>
                          <th className="text-left py-2 px-3">{formB.name}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          [t.chart.type, (t.types as any)[chartA.type] || chartA.type, (t.types as any)[chartB.type] || chartB.type],
                          [t.chart.profile, `${chartA.profile} ${chartA.profileName}`, `${chartB.profile} ${chartB.profileName}`],
                          [t.chart.authority, chartA.authority, chartB.authority],
                          [t.chart.strategy, (t.hd.strategies as any)[chartA.strategy] || chartA.strategy, (t.hd.strategies as any)[chartB.strategy] || chartB.strategy],
                          [t.chart.definition, (t.hd.definitionTypes as any)[chartA.definition] || chartA.definition, (t.hd.definitionTypes as any)[chartB.definition] || chartB.definition],
                          [t.chart.signature, (t.hd.signatures as any)[chartA.signature] || chartA.signature, (t.hd.signatures as any)[chartB.signature] || chartB.signature],
                          [t.chart.notSelf, (t.hd.notSelfs as any)[chartA.notSelf] || chartA.notSelf, (t.hd.notSelfs as any)[chartB.notSelf] || chartB.notSelf],
                          [t.comparison.incCross, chartA.incarnationCross?.name, chartB.incarnationCross?.name],
                        ].map(([label, a, b], i) => (
                          <tr key={i} className="border-b border-border/20">
                            <td className="py-2 px-3 text-muted-foreground">{label}</td>
                            <td className="py-2 px-3 font-medium">{a}</td>
                            <td className="py-2 px-3 font-medium">{b}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
