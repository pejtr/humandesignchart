import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Share2, Users, DollarSign, Award, Copy, Check, ArrowRight, Sparkles, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";

export default function AffiliateProgram() {
  const { locale } = useLanguage();
  const { isAuthenticated, user } = useAuth();
  const isEn = locale === "en";
  const [copied, setCopied] = useState(false);

  const refCode = (user as any)?.referralCode || "PARTNER2026";
  const partnerUrl = `${window.location.origin}/${locale}/calculate?ref=${refCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(partnerUrl);
      setCopied(true);
      toast.success(isEn ? "Affiliate link copied!" : "Partner odkaz zkopírován!");
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error("Kopírování selhalo");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 pt-24 pb-16">
        <div className="container max-w-5xl">
          {/* Header Hero */}
          <div className="text-center space-y-4 mb-12">
            <Badge className="bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-300 font-semibold px-3 py-1">
              <Award className="w-3.5 h-3.5 mr-1 text-purple-500" />
              {isEn ? "Partner & Affiliate Portal" : "Partnerský & Provizní Program"}
            </Badge>
            <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight">
              {isEn
                ? "Earn 25% Commission on Every Human Design Blueprint"
                : "Získejte 25% provizi z každého prodeje Human Design rozboru"}
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
              {isEn
                ? "Join our partner network for coaches, therapists, and content creators. Share your unique link and earn 25% lifetime commission on all Blueprint & Subscription sales."
                : "Zapojte se do programu pro kouče, terapeuty a tvůrce obsahu. Sdílejte svůj odkaz a získejte 25% provizi z každého zakoupeného rozboru nebo předplatného."}
            </p>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <Card className="bg-card border-border/50">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-purple-100 dark:bg-purple-900/40 text-purple-600">
                  <Share2 className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs text-muted-foreground font-medium">{isEn ? "Total Clicks" : "Celkem kliknutí"}</span>
                  <div className="text-2xl font-bold text-foreground">128</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border/50">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs text-muted-foreground font-medium">{isEn ? "Conversions" : "Nákupů z odkazu"}</span>
                  <div className="text-2xl font-bold text-foreground">14</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border/50">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-600">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs text-muted-foreground font-medium">{isEn ? "Earned Commission" : "Vyplacené provize"}</span>
                  <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">1,715 Kč</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Link Generator Box */}
          <Card className="border-2 border-purple-400/40 bg-gradient-to-r from-purple-900/10 via-background to-amber-900/10 rounded-3xl p-6 sm:p-8 shadow-xl mb-12">
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="font-serif font-bold text-xl text-foreground">
                  {isEn ? "Your Unique Partner Link" : "Váš Unikátní Partnerský Odkaz"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {isEn
                    ? "Share this link on Instagram, blog, or in private client sessions. Cookies persist for 60 days."
                    : "Sdílejte tento odkaz na Instagramu, v blogu nebo se svými klienty. Cookies platí 60 dní."}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  readOnly
                  value={partnerUrl}
                  className="font-mono text-xs h-11 rounded-xl bg-background"
                />
                <Button
                  onClick={handleCopy}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs h-11 rounded-xl px-6 gap-2 shrink-0"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  {copied ? (isEn ? "Copied!" : "Zkopírováno!") : isEn ? "Copy Link" : "Zkopírovat odkaz"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
