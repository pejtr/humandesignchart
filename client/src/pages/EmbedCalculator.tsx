import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, MapPin, Compass } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSEO } from "@/hooks/useSEO";

export default function EmbedCalculator() {
    const { t, localePath, locale } = useLanguage();

    useSEO({
      title: "Human Design Calculator — Free Bodygraph Chart",
      description: "Calculate your Human Design chart instantly. Free bodygraph calculator with AI reading and detailed profile analysis.",
      keywords: "human design calculator, bodygraph calculator, free HD chart, human design chart online",
      ogType: "website",
      locale: "en_US",
      noIndex: true,
    });
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
            // We will save to a shared token or simply pass temporary params to the window.open
            // Actually, since we can't easily rely on sessionStorage transferring across domains in an iframe, 
            // generating a shared token is best!
            createLinkMutation.mutate({ chartData: data, ownerName: name });
        },
        onError: (err) => {
            toast.error(`Calculation failed: ${err.message}`);
        },
    });

    const createLinkMutation = trpc.share.createLink.useMutation({
        onSuccess: (data) => {
            // Open the target site in a new tab
            const baseUrl = window.location.origin; // Using origin instead of hardcoded
            window.open(`${baseUrl}/shared/${data.token}`, "_blank", "noopener,noreferrer");
        },
        onError: (err) => {
            toast.error(`Share failed: ${err.message}`);
        }
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
                toast.success(t.calculator?.locationFound || "Location found");
            } else {
                toast.error(t.calculator?.locationNotFound || "Location not found");
            }
        } catch {
            toast.error(t.calculator?.locationSearchFailed || "Location search failed");
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !birthDate || !birthTime || !locationResolved) {
            toast.error("Please fill all fields and search location.");
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

    const isPending = calculateMutation.isPending || createLinkMutation.isPending;

    return (
        <div className="min-h-screen bg-transparent p-4 flex flex-col font-sans">
            <div className="bg-card w-full max-w-md mx-auto rounded-xl border shadow-sm p-5 space-y-5">
                <div className="text-center">
                    <h2 className="font-serif text-xl font-bold flex items-center justify-center gap-2">
                        <Compass className="w-5 h-5 text-primary" />
                        {t.calculator?.title || "Free Human Design Chart"}
                    </h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="name" className="text-xs">{t.calculator?.name || "Name"}</Label>
                        <Input
                            id="name"
                            placeholder="Jan Novák / John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="h-9 text-sm"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="birthDate" className="text-xs">{t.calculator?.birthDate || "Date"}</Label>
                            <Input
                                id="birthDate"
                                type="date"
                                value={birthDate}
                                onChange={(e) => setBirthDate(e.target.value)}
                                required
                                className="h-9 text-sm"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="birthTime" className="text-xs">{t.calculator?.birthTime || "Time"}</Label>
                            <Input
                                id="birthTime"
                                type="time"
                                value={birthTime}
                                onChange={(e) => setBirthTime(e.target.value)}
                                required
                                className="h-9 text-sm"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="birthPlace" className="text-xs">{t.calculator?.birthPlace || "Place of birth"}</Label>
                        <div className="flex gap-2">
                            <Input
                                id="birthPlace"
                                placeholder={t.calculator?.birthPlacePlaceholder || "City..."}
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
                                className="h-9 text-sm"
                            />
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={handlePlaceSearch}
                                disabled={!birthPlace.trim()}
                                className="h-9 px-3"
                            >
                                <MapPin className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-10 bg-primary text-primary-foreground hover:bg-primary/90 transition-all font-medium"
                        disabled={isPending || !locationResolved}
                    >
                        {isPending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : !locationResolved ? (
                            "Vyhledejte místo"
                        ) : (
                            t.calculator?.calculate || "Calculate Chart"
                        )}
                    </Button>
                </form>

                <div className="pt-2 text-center border-t text-xs text-muted-foreground">
                    Powered by <a href={locale === "en" ? "https://www.humandesignchart.app" : "https://www.humandesignmapa.cz"} target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline">{locale === "en" ? "Human Design Chart" : "Human Design Mapa"}</a>
                </div>
            </div>
        </div>
    );
}
