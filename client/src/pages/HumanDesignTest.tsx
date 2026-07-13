import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Loader2, ArrowRight, ArrowLeft, CheckCircle2, User, Heart, Sparkles, MapPin, Compass } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSEO, OG_IMAGES } from "@/hooks/useSEO";

export default function HumanDesignTest() {
    const [, navigate] = useLocation();
    const { t, localePath, locale } = useLanguage();
    const isEn = locale === "en";

    useSEO({
        title: "✨ Human Design Test Osobnosti Zdarma 🔮",
        description: "Udělejte si přesný Human Design test osobnosti. Zjistěte svůj typ, strategii a profil na základě data a místa zrození.",
        ogImage: OG_IMAGES.calculator,
        keywords: "human design test, human design quiz, human design kalkulacka",
        locale: "cs_CZ",
    });

    const [step, setStep] = useState(1);
    const totalSteps = 6;

    // Form State
    const [gender, setGender] = useState("");
    const [goal, setGoal] = useState("");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [birthDate, setBirthDate] = useState("");
    const [birthTime, setBirthTime] = useState("");
    const [birthPlace, setBirthPlace] = useState("");
    const [latitude, setLatitude] = useState("");
    const [longitude, setLongitude] = useState("");
    const [timezone, setTimezone] = useState("");
    const [timezoneOffset, setTimezoneOffset] = useState(0);
    const [locationResolved, setLocationResolved] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const calculateMutation = trpc.chart.calculate.useMutation();
    const subscribeMutation = trpc.newsletter.subscribe.useMutation();

    const handleNext = () => setStep((s) => Math.min(s + 1, totalSteps));
    const handlePrev = () => setStep((s) => Math.max(s - 1, 1));

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
                setBirthPlace(result.display_name.split(',')[0]); // Take city name
                const tzOffset = Math.round(parseFloat(result.lon) / 15);
                setTimezoneOffset(tzOffset);
                setTimezone(`UTC${tzOffset >= 0 ? "+" : ""}${tzOffset}`);
                setLocationResolved(true);
                handleNext();
            } else {
                toast.error("Lokace nenalezena. Zkuste upřesnit název.");
            }
        } catch {
            toast.error("Chyba při hledání lokace.");
        }
    };

    const handleFinalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !name) {
            toast.error("Vyplňte prosím křestní jméno a e-mail.");
            return;
        }

        setIsSubmitting(true);
        try {
            // Zapsání e-mailu do trpc newsletter tabulky
            await subscribeMutation.mutateAsync({
                email,
                locale,
                source: "quiz"
            });

            // Výpočet mapy
            const data = await calculateMutation.mutateAsync({
                name,
                birthDate,
                birthTime,
                birthPlace,
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                timezoneOffset,
                timezone,
            });

            sessionStorage.setItem("chartResult", JSON.stringify(data));
            sessionStorage.setItem("chartMeta", JSON.stringify({
                name, birthDate, birthTime, birthPlace, latitude, longitude, timezone, category: "self"
            }));

            // Můžeme redirectovat na OTO okno nebo klasicky na mapu
            navigate(localePath("/chart/new"));
        } catch (err: any) {
            toast.error(`Došlo k chybě: ${err.message}`);
            setIsSubmitting(false);
        }
    };

    // ----- Step Renderer ----- //
    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h2 className="text-2xl font-serif font-bold text-foreground mb-6">Než začneme<br /><span className="text-xl font-medium text-muted-foreground">Jaké je vaše pohlaví?</span></h2>
                        <div className="grid grid-cols-3 gap-4">
                            {[
                                { id: "female", icon: "👩", label: "Žena" },
                                { id: "male", icon: "👨", label: "Muž" },
                                { id: "other", icon: "✨", label: "Nechci uvádět" }
                            ].map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => { setGender(opt.id); handleNext(); }}
                                    className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all hover:scale-105 ${gender === opt.id ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-card'}`}
                                >
                                    <span className="text-4xl">{opt.icon}</span>
                                    <span className="text-sm font-medium">{opt.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h2 className="text-2xl font-serif font-bold text-foreground mb-6">Jaký je váš hlavní cíl?</h2>
                        <div className="flex flex-col gap-3">
                            {[
                                { id: "self_discovery", label: "Hlubší sebepoznání a osobní rozvoj", icon: User },
                                { id: "relationships", label: "Zlepšení vztahů a komunikace", icon: Heart },
                                { id: "purpose", label: "Nalezení životního poslání a kariéry", icon: Compass },
                                { id: "energy", label: "Mít více energie a klidu v životě", icon: Sparkles }
                            ].map(opt => {
                                const Icon = opt.icon;
                                return (
                                    <button
                                        key={opt.id}
                                        onClick={() => { setGoal(opt.id); handleNext(); }}
                                        className={`flex items-center gap-4 p-5 rounded-xl border-2 transition-all text-left ${goal === opt.id ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-card hover:border-primary/40'}`}
                                    >
                                        <div className={`p-2 rounded-lg ${goal === opt.id ? 'bg-primary/20' : 'bg-muted'}`}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <span className="font-medium text-sm md:text-base">{opt.label}</span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h2 className="text-2xl font-serif font-bold text-foreground mb-2">Kdy jste se narodili?</h2>
                        <p className="text-muted-foreground text-sm mb-6">Astrologické postavení hvězd definuje váš test.</p>
                        <div className="max-w-xs mx-auto">
                            <Input
                                type="date"
                                className="h-14 text-lg text-center"
                                value={birthDate}
                                onChange={(e) => setBirthDate(e.target.value)}
                            />
                        </div>
                        <Button
                            size="lg"
                            className="mt-8 w-full max-w-xs"
                            disabled={!birthDate}
                            onClick={handleNext}
                        >
                            Pokračovat <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                );
            case 4:
                return (
                    <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h2 className="text-2xl font-serif font-bold text-foreground mb-2">V kolik hodin přesně?</h2>
                        <p className="text-muted-foreground text-sm mb-6">Pokud nevíte, dejte 12:00, ale přesnost ovlivňuje výsledek.</p>
                        <div className="max-w-xs mx-auto">
                            <Input
                                type="time"
                                className="h-14 text-lg text-center"
                                value={birthTime}
                                onChange={(e) => setBirthTime(e.target.value)}
                            />
                        </div>
                        <Button
                            size="lg"
                            className="mt-8 w-full max-w-xs"
                            disabled={!birthTime}
                            onClick={handleNext}
                        >
                            Pokračovat <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                );
            case 5:
                return (
                    <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h2 className="text-2xl font-serif font-bold text-foreground mb-2">Jaké město narození?</h2>
                        <p className="text-muted-foreground text-sm mb-6">Zeměpisná šířka je klíčovým faktorem.</p>
                        <div className="max-w-sm mx-auto flex gap-2">
                            <div className="relative flex-1">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    className="pl-10 h-14"
                                    placeholder="Např. Praha"
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
                                />
                            </div>
                            <Button
                                type="button"
                                className="h-14 px-6"
                                onClick={handlePlaceSearch}
                                disabled={!birthPlace || locationResolved}
                            >
                                Vyhledat
                            </Button>
                        </div>
                        {locationResolved && (
                            <p className="text-sm text-green-600 font-medium">✨ Lokace ověřena. Pokračujte dalším krokem.</p>
                        )}
                    </div>
                );
            case 6:
                return (
                    <form onSubmit={handleFinalSubmit} className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="mx-auto w-16 h-16 bg-primary/10 text-primary flex items-center justify-center rounded-full mb-6">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-serif font-bold text-foreground mb-2">Váš profil je připraven!</h2>
                        <p className="text-muted-foreground text-sm mb-8">Zadejte své jméno a e-mail, kam vám máme poslat výsledek Human Design Testu a ihned vás přeneseme do analýzy.</p>

                        <div className="max-w-sm mx-auto space-y-4 text-left">
                            <div className="space-y-1.5">
                                <Label>Křestní jméno</Label>
                                <Input
                                    className="h-12"
                                    placeholder="Vaše jméno"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>E-mailová adresa</Label>
                                <Input
                                    type="email"
                                    className="h-12"
                                    placeholder="vas@email.cz"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <Button
                                type="submit"
                                size="lg"
                                className="w-full h-14 text-base font-bold"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Zobrazit můj Výsledek"}
                            </Button>
                            <p className="text-xs text-center text-muted-foreground mt-4">
                                Vyplněním souhlasíte se zpracováním osobních údajů přesně podle GDPR.
                            </p>
                        </div>
                    </form>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-muted/20 flex flex-col relative overflow-hidden">
            {/* Mystical Background Decorations */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] animate-slow-spin">
                    <svg viewBox="0 0 24 24" className="w-[800px] h-[800px] text-primary" fill="none" stroke="currentColor" strokeWidth="0.5">
                        <circle cx="12" cy="12" r="10" />
                        <circle cx="12" cy="12" r="6" />
                        <line x1="12" y1="2" x2="12" y2="22" />
                        <line x1="2" y1="12" x2="22" y2="12" />
                    </svg>
                </div>
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px] opacity-50" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[120px] opacity-50" />
            </div>

            <Navbar />

            <main className="flex-1 flex flex-col justify-center py-24 relative z-10">
                <div className="container max-w-2xl px-4">

                    {/* Progress Indicator */}
                    <div className="mb-10 max-w-md mx-auto">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Krok {step} z {totalSteps}</span>
                            <span className="text-xs text-primary font-medium">{Math.round((step / totalSteps) * 100)}% hotovo</span>
                        </div>
                        <div className="h-2 w-full bg-border rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary transition-all duration-500 ease-out"
                                style={{ width: `${(step / totalSteps) * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Form Card */}
                    <div className="bg-background/80 backdrop-blur-xl border shadow-xl rounded-3xl p-6 md:p-10 relative">
                        {step > 1 && step < totalSteps && (
                            <button
                                onClick={handlePrev}
                                className="absolute top-6 left-6 text-muted-foreground hover:text-foreground transition-colors p-2 -m-2"
                                aria-label="Back"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                        )}

                        <div className="min-h-[300px] flex flex-col justify-center">
                            {renderStep()}
                        </div>
                    </div>

                </div>
            </main>

            <Footer />
        </div>
    );
}
