import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Copy, Users, Gift, Check, Share2, Sparkles } from "lucide-react";

export default function ReferralWidget() {
  const { locale, localePath } = useLanguage();
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = trpc.referral.getInfo.useQuery();

  const isCzech = locale === "cs";

  const referralLink = data?.referralCode
    ? `${window.location.origin}${localePath("/")  }?ref=${data.referralCode}`
    : "";

  const handleCopy = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success(isCzech ? "Odkaz zkopírován do schránky!" : "Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error(isCzech ? "Nepodařilo se zkopírovat" : "Failed to copy");
    }
  };

  const handleShare = async () => {
    if (!referralLink) return;
    const shareText = isCzech
      ? `Objevte svůj Human Design — mapu vaší duše! Získej bezplatný AI výklad: ${referralLink}`
      : `Discover your Human Design — the map of your soul! Get a free AI reading: ${referralLink}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: isCzech ? "Human Design — mapa vašeho Já" : "Human Design — Map of Your Soul",
          text: shareText,
          url: referralLink,
        });
      } catch {
        // User cancelled share
      }
    } else {
      handleCopy();
    }
  };

  if (isLoading) {
    return (
      <Card className="border-purple-500/20 bg-gradient-to-br from-purple-950/10 to-indigo-950/10">
        <CardContent className="p-6">
          <div className="h-24 animate-pulse bg-muted rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-purple-500/30 bg-gradient-to-br from-purple-950/15 via-background to-indigo-950/10 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Gift className="w-4 h-4 text-purple-400" />
            </div>
            {isCzech ? "Pozvěte přátele" : "Invite Friends"}
          </CardTitle>
          <Badge variant="outline" className="text-purple-400 border-purple-500/30 text-xs">
            <Sparkles className="w-3 h-3 mr-1" />
            {isCzech ? "Získejte výklad zdarma" : "Get a free reading"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Explanation */}
        <p className="text-sm text-muted-foreground leading-relaxed">
          {isCzech
            ? "Za každého přítele, který se zaregistruje přes váš odkaz, dostanete oba po 1 bezplatném AI výkladu."
            : "For every friend who signs up through your link, you both receive 1 free AI reading."}
        </p>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-xl bg-muted/50 border border-border/50">
            <p className="text-2xl font-bold text-foreground">{data?.totalInvited ?? 0}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {isCzech ? "Pozváno" : "Invited"}
            </p>
          </div>
          <div className="text-center p-3 rounded-xl bg-muted/50 border border-border/50">
            <p className="text-2xl font-bold text-green-500">{data?.completedReferrals ?? 0}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {isCzech ? "Registrováno" : "Registered"}
            </p>
          </div>
          <div className="text-center p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <p className="text-2xl font-bold text-purple-400">{data?.creditsEarned ?? 0}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {isCzech ? "Výklady získány" : "Credits earned"}
            </p>
          </div>
        </div>

        {/* Referral link */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {isCzech ? "Váš referral odkaz" : "Your referral link"}
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-muted/60 border border-border/60 rounded-lg px-3 py-2 text-xs text-muted-foreground font-mono truncate">
              {referralLink || "..."}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 gap-1.5 border-purple-500/40 text-purple-400 hover:bg-purple-500/10"
              onClick={handleCopy}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied
                ? (isCzech ? "Zkopírováno" : "Copied")
                : (isCzech ? "Kopírovat" : "Copy")}
            </Button>
          </div>
        </div>

        {/* Share button */}
        <Button
          className="w-full bg-purple-600 hover:bg-purple-700 text-white gap-2"
          onClick={handleShare}
        >
          <Share2 className="w-4 h-4" />
          {isCzech ? "Sdílet odkaz" : "Share link"}
        </Button>

        {/* How it works */}
        <div className="pt-1 border-t border-border/40">
          <p className="text-[11px] text-muted-foreground text-center">
            {isCzech
              ? "Jak to funguje: přítel klikne na odkaz → zaregistruje se → oba dostanete 1 výklad zdarma ✨"
              : "How it works: friend clicks your link → signs up → you both get 1 free reading ✨"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
