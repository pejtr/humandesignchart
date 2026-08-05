import { Link } from "wouter";
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSEO } from "@/hooks/useSEO";
import { useMetaPixel } from "@/hooks/useMetaPixel";
import { useEffect } from "react";

export default function RedditLanding() {
  const { locale, localePath } = useLanguage();
  const isCs = locale === "cs";
  const { viewContent } = useMetaPixel();

  useSEO({
    title: isCs ? "Human Design bez ezoterickĂ© mlhy" : "Human Design without the mystical fog",
    description: isCs
      ? "VypoÄŤĂ­tejte si mapu zdarma a sami posuÄŹte, zda je pro vĂˇs Human Design praktickĂ˝."
      : "Create your free chart and decide for yourself whether Human Design is useful to you.",
    locale: isCs ? "cs_CZ" : "en_US",
  });

  useEffect(() => {
    viewContent({
      content_name: "Reddit Human Design landing",
      content_category: "acquisition",
      content_ids: ["reddit-human-design"],
      content_type: "landing_page",
    });
  }, [viewContent]);

  const points = isCs
    ? ["Mapa podle data, ÄŤasu a mĂ­sta narozenĂ­", "PraktickĂ˝ vĂ˝klad typu, strategie a autority", "Jedna kompletnĂ­ AI interpretace zdarma"]
    : ["Chart based on birth date, time and place", "Practical reading of type, strategy and authority", "One complete AI interpretation free"];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <section className="relative overflow-hidden border-b border-border/60 px-5 py-20 md:py-28">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(139,92,246,0.20),transparent_38%),radial-gradient(circle_at_75%_65%,rgba(20,184,166,0.14),transparent_42%)]" />
          <div className="relative mx-auto max-w-4xl text-center">
            <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-purple-300/50 bg-purple-50/80 px-4 py-2 text-sm text-purple-800">
              <Sparkles className="h-4 w-4" />
              {isCs ? "PĹ™iĹˇli jste z Redditu? ZaÄŤnÄ›te zdarma." : "Coming from Reddit? Start free."}
            </div>
            <h1 className="font-serif text-4xl font-semibold tracking-tight md:text-6xl">
              {isCs ? "Human Design bez velkĂ˝ch slibĹŻ" : "Human Design without big promises"}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              {isCs
                ? "Bereme ho jako nĂˇstroj sebereflexe, ne jako nĂˇhradu medicĂ­ny, psychologie ani vlastnĂ­ho Ăşsudku. VytvoĹ™te si mapu a rozhodnÄ›te se podle vlastnĂ­ zkuĹˇenosti."
                : "We treat it as a self-reflection tool, not a replacement for medicine, psychology, or your own judgment. Create a chart and judge it from your own experience."}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" asChild className="min-w-64 bg-teal-600 hover:bg-teal-700">
                <Link href={`${localePath("/calculate")}?utm_source=reddit&utm_medium=paid_social&utm_campaign=reddit_hdm_test`}>
                  {isCs ? "VytvoĹ™it mapu zdarma" : "Create my free chart"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href={localePath("/pricing")}>{isCs ? "Co obsahuje Premium" : "See Premium"}</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-5xl gap-8 px-5 py-16 md:grid-cols-2">
          <div className="rounded-3xl border border-border bg-card p-7 shadow-sm">
            <h2 className="font-serif text-3xl">{isCs ? "Co skuteÄŤnÄ› dostanete" : "What you actually get"}</h2>
            <ul className="mt-6 space-y-4">
              {points.map(point => (
                <li key={point} className="flex gap-3 text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-teal-600" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border border-purple-200 bg-purple-50/60 p-7">
            <ShieldCheck className="h-7 w-7 text-purple-700" />
            <h2 className="mt-4 font-serif text-3xl">{isCs ? "FĂ©rovĂ˝ test pĹ™ed platbou" : "A fair test before payment"}</h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              {isCs
                ? "ZĂˇkladnĂ­ mapa a prvnĂ­ vĂ˝klad jsou zdarma. PlatebnĂ­ Ăşdaje nepotĹ™ebujeme. Premium nabĂ­dneme aĹľ ve chvĂ­li, kdy uĹľ vĂ­te, co od nÄ›j ÄŤekat."
                : "Your basic chart and first reading are free, with no payment details required. We only offer Premium after you know what to expect."}
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

