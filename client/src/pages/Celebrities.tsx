import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Users, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import TypeAuraIcon from "@/components/TypeAuraIcon";
import type { HumanDesignChartData } from "@shared/types";

const CELEBRITIES = [
  { name: "Albert Einstein", birthDate: "1879-03-14", birthTime: "11:30", birthPlace: "Ulm, Germany", lat: 48.4011, lon: 9.9876, tz: 1, photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Albert_Einstein_Head_cleaned.jpg/200px-Albert_Einstein_Head_cleaned.jpg" },
  { name: "Oprah Winfrey", birthDate: "1954-01-29", birthTime: "04:30", birthPlace: "Kosciusko, Mississippi, USA", lat: 33.0576, lon: -89.5876, tz: -6, photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Oprah_Winfrey_2016.jpg/250px-Oprah_Winfrey_2016.jpg" },
  { name: "Elon Musk", birthDate: "1971-06-28", birthTime: "06:00", birthPlace: "Pretoria, South Africa", lat: -25.7479, lon: 28.2293, tz: 2, photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Elon_Musk_-_54820081119_%28cropped%29.jpg/250px-Elon_Musk_-_54820081119_%28cropped%29.jpg" },
  { name: "Beyoncé", birthDate: "1981-09-04", birthTime: "10:00", birthPlace: "Houston, Texas, USA", lat: 29.7604, lon: -95.3698, tz: -6, photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Beyonc%C3%A9_-_Tottenham_Hotspur_Stadium_-_1st_June_2023_%2810_of_118%29_%2852946364598%29_%28best_crop%29.jpg/250px-Beyonc%C3%A9_-_Tottenham_Hotspur_Stadium_-_1st_June_2023_%2810_of_118%29_%2852946364598%29_%28best_crop%29.jpg" },
  { name: "Steve Jobs", birthDate: "1955-02-24", birthTime: "19:15", birthPlace: "San Francisco, California, USA", lat: 37.7749, lon: -122.4194, tz: -8, photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Steve_Jobs_Headshot_2010-CROP_%28cropped_2%29.jpg/200px-Steve_Jobs_Headshot_2010-CROP_%28cropped_2%29.jpg" },
  { name: "Princess Diana", birthDate: "1961-07-01", birthTime: "19:45", birthPlace: "Sandringham, Norfolk, UK", lat: 52.8242, lon: 0.5134, tz: 1, photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Diana%2C_Princess_of_Wales_1997_%282%29.jpg/250px-Diana%2C_Princess_of_Wales_1997_%282%29.jpg" },
  { name: "Barack Obama", birthDate: "1961-08-04", birthTime: "19:24", birthPlace: "Honolulu, Hawaii, USA", lat: 21.3069, lon: -157.8583, tz: -10, photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/President_Barack_Obama.jpg/200px-President_Barack_Obama.jpg" },
  { name: "Taylor Swift", birthDate: "1989-12-13", birthTime: "05:17", birthPlace: "Reading, Pennsylvania, USA", lat: 40.3356, lon: -75.9269, tz: -5, photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Taylor_Swift_at_the_2023_MTV_Video_Music_Awards_%283%29.png/250px-Taylor_Swift_at_the_2023_MTV_Video_Music_Awards_%283%29.png" },
  { name: "Leonardo da Vinci", birthDate: "1452-04-15", birthTime: "03:00", birthPlace: "Vinci, Italy", lat: 43.7874, lon: 10.9237, tz: 1, photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Francesco_Melzi_-_Portrait_of_Leonardo.png/250px-Francesco_Melzi_-_Portrait_of_Leonardo.png" },
  { name: "Nikola Tesla", birthDate: "1856-07-10", birthTime: "00:00", birthPlace: "Smiljan, Croatia", lat: 44.5655, lon: 15.3172, tz: 1, photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Tesla_circa_1890.jpeg/200px-Tesla_circa_1890.jpeg" },
  { name: "Mahatma Gandhi", birthDate: "1869-10-02", birthTime: "07:12", birthPlace: "Porbandar, India", lat: 21.6417, lon: 69.6293, tz: 5, photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Mahatma-Gandhi%2C_studio%2C_1931.jpg/250px-Mahatma-Gandhi%2C_studio%2C_1931.jpg" },
  { name: "Martin Luther King Jr.", birthDate: "1929-01-15", birthTime: "12:00", birthPlace: "Atlanta, Georgia, USA", lat: 33.7490, lon: -84.3880, tz: -5, photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Martin_Luther_King%2C_Jr..jpg/200px-Martin_Luther_King%2C_Jr..jpg" },
  { name: "Madonna", birthDate: "1958-08-16", birthTime: "07:05", birthPlace: "Bay City, Michigan, USA", lat: 43.5945, lon: -83.8889, tz: -5, photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/MadonnaO2171023_%2897_of_133%29_%2853269593787%29_%28cropped%29.jpg/250px-MadonnaO2171023_%2897_of_133%29_%2853269593787%29_%28cropped%29.jpg" },
  { name: "Nelson Mandela", birthDate: "1918-07-18", birthTime: "12:00", birthPlace: "Mvezo, South Africa", lat: -31.9505, lon: 28.7780, tz: 2, photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Nelson_Mandela_1994.jpg/250px-Nelson_Mandela_1994.jpg" },
  { name: "Angelina Jolie", birthDate: "1975-06-04", birthTime: "09:09", birthPlace: "Los Angeles, California, USA", lat: 34.0522, lon: -118.2437, tz: -8, photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Angelina_Jolie_at_the_2024_Toronto_International_Film_Festival_%28cropped%29.jpg/200px-Angelina_Jolie_at_the_2024_Toronto_International_Film_Festival_%28cropped%29.jpg" },
  { name: "Bill Gates", birthDate: "1955-10-28", birthTime: "22:00", birthPlace: "Seattle, Washington, USA", lat: 47.6062, lon: -122.3321, tz: -8, photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Bill_Gates_at_the_European_Commission_-_2025_-_P067383-987995_%28cropped%29.jpg/200px-Bill_Gates_at_the_European_Commission_-_2025_-_P067383-987995_%28cropped%29.jpg" },
  { name: "Dalai Lama", birthDate: "1935-07-06", birthTime: "04:38", birthPlace: "Taktser, Tibet", lat: 36.4000, lon: 102.7833, tz: 8, photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/The_Dalai_Lama_in_2012.jpg/250px-The_Dalai_Lama_in_2012.jpg" },
  { name: "Frida Kahlo", birthDate: "1907-07-06", birthTime: "08:30", birthPlace: "Coyoacán, Mexico", lat: 19.3500, lon: -99.1621, tz: -6, photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Frida_Kahlo%2C_by_Guillermo_Kahlo.jpg/250px-Frida_Kahlo%2C_by_Guillermo_Kahlo.jpg" },
  { name: "Michael Jackson", birthDate: "1958-08-29", birthTime: "19:33", birthPlace: "Gary, Indiana, USA", lat: 41.5934, lon: -87.3465, tz: -6, photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Michael_Jackson_1983_%283x4_cropped%29_%28contrast%29.jpg/250px-Michael_Jackson_1983_%283x4_cropped%29_%28contrast%29.jpg" },
  { name: "Queen Elizabeth II", birthDate: "1926-04-21", birthTime: "02:40", birthPlace: "London, UK", lat: 51.5074, lon: -0.1278, tz: 0, photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Queen_Elizabeth_II_official_portrait_for_1959_tour_%28retouched%29_%28cropped%29_%283-to-4_aspect_ratio%29.jpg/250px-Queen_Elizabeth_II_official_portrait_for_1959_tour_%28retouched%29_%28cropped%29_%283-to-4_aspect_ratio%29.jpg" },
];

export default function Celebrities() {
  const [search, setSearch] = useState("");
  const [selectedCeleb, setSelectedCeleb] = useState<typeof CELEBRITIES[0] | null>(null);
  const [chartData, setChartData] = useState<HumanDesignChartData | null>(null);
  const { t, locale, localePath } = useLanguage();

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

  const channelsLabel = locale === "en" ? "defined" : "definovaných";

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container max-w-6xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm mb-4">
              <Users className="w-4 h-4" />
              {t.celebrities.title}
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold mb-3">{t.celebrities.subtitle}</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t.celebrities.description}
            </p>
          </div>

          {/* Search */}
          <div className="relative mb-8 max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t.celebrities.searchPlaceholder}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 bg-white border-border/50"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Celebrity list */}
            <div className="lg:col-span-1 space-y-2 max-h-[700px] overflow-y-auto pr-2 scrollbar-thin">
              {filtered.map(celeb => (
                <button
                  key={celeb.name}
                  onClick={() => handleSelectCeleb(celeb)}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${
                    selectedCeleb?.name === celeb.name
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border/30 bg-white hover:border-primary/30 hover:shadow-sm"
                  }`}
                >
                  <img
                    src={celeb.photo}
                    alt={celeb.name}
                    className="w-11 h-11 rounded-full object-cover bg-muted flex-shrink-0"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{celeb.name}</p>
                    <p className="text-xs text-muted-foreground">{celeb.birthDate} · {celeb.birthPlace.split(",")[0]}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Celebrity chart detail */}
            <div className="lg:col-span-2">
              {!selectedCeleb ? (
                <Card className="bg-white border-border/30 shadow-sm">
                  <CardContent className="py-20 text-center">
                    <Users className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
                    <p className="text-muted-foreground text-lg">
                      {locale === "en"
                        ? "Select a celebrity to view their Human Design chart."
                        : "Vyberte celebritu pro zobrazení jejího Human Design chartu."}
                    </p>
                    <p className="text-muted-foreground/60 text-sm mt-2">
                      {locale === "en"
                        ? "Click on a name in the list on the left"
                        : "Klikněte na jméno v seznamu vlevo"}
                    </p>
                  </CardContent>
                </Card>
              ) : calcMutation.isPending ? (
                <Card className="bg-white border-border/30 shadow-sm">
                  <CardContent className="py-20 text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {locale === "en"
                        ? `Calculating chart for ${selectedCeleb.name}...`
                        : `Počítám chart pro ${selectedCeleb.name}...`}
                    </p>
                  </CardContent>
                </Card>
              ) : chartData ? (
                <Card className="bg-white border-border/30 shadow-sm">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={selectedCeleb.photo}
                        alt={selectedCeleb.name}
                        className="w-16 h-16 rounded-full object-cover bg-muted shadow-sm"
                      />
                      <div>
                        <CardTitle className="font-serif text-2xl">{selectedCeleb.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {selectedCeleb.birthDate} {selectedCeleb.birthTime} · {selectedCeleb.birthPlace}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Type with aura icon */}
                    <div className="flex items-center gap-3 mb-5 p-4 rounded-xl bg-gradient-to-r from-primary/5 to-transparent border border-primary/10">
                      <TypeAuraIcon type={chartData.type} size={52} animate />
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">{t.chart.type}</p>
                        <p className="text-lg font-serif font-semibold text-primary">
                          {(t.types as any)[chartData.type] || chartData.type}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-6">
                      <Badge className="bg-primary/10 text-primary border-primary/20">
                        {chartData.profile} {chartData.profileName}
                      </Badge>
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
                        { label: t.chart.channels, value: `${chartData.channels?.length || 0} ${channelsLabel}` },
                      ].map(item => (
                        <div key={item.label} className="space-y-1 p-3 rounded-lg bg-muted/30">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">{item.label}</p>
                          <p className="text-sm font-medium">{item.value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-border/30 pt-4">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">{t.chart.centers}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(chartData.centers || []).map(c => (
                          <Badge
                            key={c.name}
                            variant={c.defined ? "default" : "outline"}
                            className={`text-xs ${c.defined ? "bg-primary/15 text-primary border-primary/20" : ""}`}
                          >
                            {(t.hd.centerNames as any)[c.name] || c.name}
                            {c.defined ? " ●" : " ○"}
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
