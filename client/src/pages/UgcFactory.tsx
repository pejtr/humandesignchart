import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Video, Play, Copy, Check, Wand2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function UgcFactory() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const scripts = [
    {
      title: "Hook: 3 Věci, které vám nikdo nerekl o vašem Otevřeném Hrdle",
      platform: "TikTok / Instagram Reels",
      scriptText: `[HOOK]: Stop scrolling! Pokud máte v Human Designu otevřené hrdlo, pravděpodobně neustále skáčete lidem do řeči...\n[PROBLEM]: Snažíte se přitáhnout pozornost, ale lidé vás ignorují.\n[SOLUTION]: Váš klíč je mlčet, dokud nejste rozpoznáni. Klikněte na odkaz a spočítejte si svou mapu zdarma!`,
    },
    {
      title: "VSL Hook: Jak AI Marie odhalila můj skrytý profil 3/5",
      platform: "Facebook Video Ad",
      scriptText: `[HOOK]: Myslel jsem si, že dělám v podnikání neustále chyby...\n[STORY]: Než jsem si udělal HD rozbor u AI Marie a zjistil, že můj Profil 3/5 se má učit přes pokus a omyl!\n[CTA]: Vyzkoušejte interaktivní AI výklad na odkazu zdarma.`,
    },
  ];

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    toast.success(isEn ? "UGC script copied!" : "UGC scénář pro reklamu zkopírován!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="flex-1 container max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="space-y-2 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 text-xs font-semibold">
            <Video className="w-3.5 h-3.5" />
            {isEn ? "AI UGC Video Ad Creative Factory" : "AI Továrna na UGC Video Reklamy & Scénáře"}
          </div>
          <h1 className="text-3xl font-serif font-bold text-foreground">
            {isEn ? "UGC Ad Creative Generator" : "Generátor Virálních UGC Scénářů a Háčků do Reklam"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isEn
              ? "Generate high-converting video scripts for TikTok, Instagram Reels, and Meta Ads tailored for Human Design."
              : "Generujte konverzní video scénáře pro TikTok, Instagram Reels a Meta Ads přesně vyladěné na lidské archetypy."}
          </p>
        </div>

        <div className="space-y-4">
          {scripts.map((s, i) => (
            <Card key={i} className="border border-border rounded-2xl p-5 space-y-3 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
                <div>
                  <h3 className="font-bold text-sm text-foreground">{s.title}</h3>
                  <span className="text-[11px] text-purple-500 font-mono">{s.platform}</span>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopy(s.scriptText, i)}
                  className="gap-1.5 text-xs rounded-xl h-9 shrink-0"
                >
                  {copiedIndex === i ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {isEn ? "Copy Script" : "Zkopírovat Scénář"}
                </Button>
              </div>

              <pre className="p-3.5 rounded-xl bg-muted/50 text-xs font-mono whitespace-pre-wrap text-foreground leading-relaxed">
                {s.scriptText}
              </pre>
            </Card>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
