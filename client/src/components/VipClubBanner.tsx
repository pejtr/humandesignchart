import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Sparkles, Headphones, Layers, ArrowRight, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

export function VipClubBanner() {
  const { locale, localePath } = useLanguage();
  const isEn = locale === "en";

  return (
    <Card className="border-2 border-amber-400/80 bg-gradient-to-br from-amber-950/30 via-purple-950/40 to-background text-white rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden relative my-8">
      <div className="absolute -right-8 -top-8 w-40 h-40 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-5 max-w-2xl">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold border border-amber-400/40">
          <Crown className="w-3.5 h-3.5 text-amber-400" />
          {isEn ? "VIP Inner Circle Membership" : "VIP Členství v Klubu AI Marie"}
        </div>

        <div className="space-y-2">
          <h3 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {isEn
              ? "Unlimited Blueprint Access & Daily Personal Transit Audio"
              : "Neomezený Přístup & Každodenní Audio Zpráva podle Tranzitů"}
          </h3>
          <p className="text-sm text-purple-200/80 leading-relaxed">
            {isEn
              ? "Join our VIP Inner Circle. Get unlimited family chart calculations, all PHS variables (digestion, environment, perspective), and daily personal voice notes from AI Marie."
              : "Získejte neomezené výklady pro celou rodinu, všechny PHS proměnné (strávení, prostředí, perspektiva) a každodenní osobní audio zprávu od AI Marie přímo do telefonu."}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-1">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <span className="font-bold block text-amber-300">Neomezeno</span>
            <span className="text-[11px] text-muted-foreground">{isEn ? "Family Charts" : "Mapy pro celou rodinu"}</span>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <span className="font-bold block text-purple-300">Audio Zprávy</span>
            <span className="text-[11px] text-muted-foreground">{isEn ? "Daily Transit Voice" : "Denní tranzitní hlas"}</span>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <span className="font-bold block text-emerald-300">PHS Proměnné</span>
            <span className="text-[11px] text-muted-foreground">{isEn ? "Advanced PHS" : "Hloubkové prostředí"}</span>
          </div>
        </div>

        <div className="pt-2">
          <Button
            size="lg"
            className="bg-amber-400 hover:bg-amber-300 text-purple-950 font-bold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-lg gap-2"
            asChild
          >
            <Link href={localePath("/pricing") + "#vip"}>
              <Sparkles className="w-4 h-4 text-purple-950" />
              {isEn ? "Join VIP Club (390 CZK/mo)" : "Vstoupit do VIP Klubu (390 Kč/měs)"}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
