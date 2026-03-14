import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Copy, Gift, Check, Share2, Sparkles } from "lucide-react";

// ─── Social platform SVG icons ───────────────────────────────────────────────

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ReferralWidget() {
  const { locale, localePath } = useLanguage();
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = trpc.referral.getInfo.useQuery();

  const isCzech = locale === "cs";

  const referralLink = data?.referralCode
    ? `${window.location.origin}${localePath("/")}?ref=${data.referralCode}`
    : "";

  const shareText = isCzech
    ? `Objevte svůj Human Design — mapu vaší duše! Získejte bezplatný AI výklad:`
    : `Discover your Human Design — the map of your soul! Get a free AI reading:`;

  const shareTitle = isCzech
    ? "Human Design — mapa vašeho Já"
    : "Human Design — Map of Your Soul";

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

  const handleNativeShare = async () => {
    if (!referralLink) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url: referralLink });
      } catch {
        // User cancelled
      }
    } else {
      handleCopy();
    }
  };

  const shareOnFacebook = () => {
    if (!referralLink) return;
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`;
    window.open(url, "_blank", "noopener,noreferrer,width=600,height=500");
  };

  const shareOnWhatsApp = () => {
    if (!referralLink) return;
    const text = `${shareText} ${referralLink}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const shareOnTelegram = () => {
    if (!referralLink) return;
    const url = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank", "noopener,noreferrer");
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

        {/* Social sharing buttons */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {isCzech ? "Sdílet přes" : "Share via"}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {/* Facebook */}
            <button
              onClick={shareOnFacebook}
              disabled={!referralLink}
              className="flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-sm font-medium transition-all
                bg-[#1877F2]/10 text-[#1877F2] border border-[#1877F2]/25
                hover:bg-[#1877F2]/20 hover:border-[#1877F2]/50
                disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Share on Facebook"
            >
              <FacebookIcon className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Facebook</span>
            </button>

            {/* WhatsApp */}
            <button
              onClick={shareOnWhatsApp}
              disabled={!referralLink}
              className="flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-sm font-medium transition-all
                bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/25
                hover:bg-[#25D366]/20 hover:border-[#25D366]/50
                disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Share on WhatsApp"
            >
              <WhatsAppIcon className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            {/* Telegram */}
            <button
              onClick={shareOnTelegram}
              disabled={!referralLink}
              className="flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-sm font-medium transition-all
                bg-[#2AABEE]/10 text-[#2AABEE] border border-[#2AABEE]/25
                hover:bg-[#2AABEE]/20 hover:border-[#2AABEE]/50
                disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Share on Telegram"
            >
              <TelegramIcon className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Telegram</span>
            </button>
          </div>
        </div>

        {/* Native share / fallback */}
        <Button
          className="w-full bg-purple-600 hover:bg-purple-700 text-white gap-2"
          onClick={handleNativeShare}
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
