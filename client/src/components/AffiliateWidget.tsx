import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const TIER_CONFIG = {
  bronze: { label: { cs: "Bronze", en: "Bronze" }, icon: "🥉", commission: "20%", color: "text-amber-700" },
  silver: { label: { cs: "Silver", en: "Silver" }, icon: "🥈", commission: "22%", color: "text-slate-400" },
  gold:   { label: { cs: "Gold",   en: "Gold"   }, icon: "🥇", commission: "25%", color: "text-yellow-500" },
} as const;

export function AffiliateWidget() {
  const { locale: lang } = useLanguage();
  const utils = trpc.useUtils();
  const [payoutMethod, setPayoutMethod] = useState<"bank_transfer" | "paypal">("bank_transfer");
  const [payoutDetails, setPayoutDetails] = useState("");
  const [showPayoutForm, setShowPayoutForm] = useState(false);

  const { data: stats, isLoading } = trpc.affiliate.getStats.useQuery();

  const activate = trpc.affiliate.activate.useMutation({
    onSuccess: () => {
      utils.affiliate.getStats.invalidate();
      toast.success(lang === "cs" ? "Affiliate program aktivován! 🎉" : "Affiliate program activated! 🎉");
    },
  });

  const requestPayout = trpc.affiliate.requestPayout.useMutation({
    onSuccess: (data) => {
      utils.affiliate.getStats.invalidate();
      setShowPayoutForm(false);
      setPayoutDetails("");
      toast.success(lang === "cs"
        ? `Výplata ${data.amount.toFixed(0)} Kč odeslána ke zpracování!`
        : `Payout of ${data.amount.toFixed(0)} CZK requested!`
      );
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  if (isLoading) {
    return (
      <Card className="bg-card border-border/50">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-8 bg-muted rounded w-2/3" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  const affiliateLink = stats.affiliateCode
    ? `${window.location.origin}/${lang}?aff=${stats.affiliateCode}`
    : null;

  const tierCfg = TIER_CONFIG[stats.tier as keyof typeof TIER_CONFIG] ?? TIER_CONFIG.bronze;

  // Not yet an affiliate
  if (!stats.isAffiliate) {
    return (
      <Card className="bg-card border-border/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent pointer-events-none" />
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            {lang === "cs" ? "💰 Affiliate program" : "💰 Affiliate Program"}
          </CardTitle>
          <CardDescription>
            {lang === "cs"
              ? "Vydělávejte 20–25 % provizi z každého Premium předplatného, které přivedete. Opakovaně každý měsíc."
              : "Earn 20–25% commission on every Premium subscription you refer. Recurring every month."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {Object.entries(TIER_CONFIG).map(([tier, cfg]) => (
              <div key={tier} className="rounded-lg border border-border/50 p-3 text-center">
                <div className="text-2xl mb-1">{cfg.icon}</div>
                <div className={`font-bold text-sm ${cfg.color}`}>{cfg.label[lang]}</div>
                <div className="text-xs text-muted-foreground">{cfg.commission}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {tier === "bronze" ? "0–5" : tier === "silver" ? "6–20" : "21+"}{" "}
                  {lang === "cs" ? "konverzí" : "conversions"}
                </div>
              </div>
            ))}
          </div>
          <Button
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0"
            onClick={() => activate.mutate()}
            disabled={activate.isPending}
          >
            {activate.isPending
              ? (lang === "cs" ? "Aktivuji..." : "Activating...")
              : (lang === "cs" ? "Aktivovat affiliate program" : "Activate affiliate program")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Active affiliate dashboard
  return (
    <Card className="bg-card border-border/50 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent pointer-events-none" />
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">
            {lang === "cs" ? "💰 Affiliate dashboard" : "💰 Affiliate Dashboard"}
          </CardTitle>
          <Badge variant="outline" className={`${tierCfg.color} border-current`}>
            {tierCfg.icon} {tierCfg.label[lang]} · {tierCfg.commission}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <div className="text-2xl font-bold text-foreground">{stats.totalConversions}</div>
            <div className="text-xs text-muted-foreground">{lang === "cs" ? "Konverzí" : "Conversions"}</div>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <div className="text-2xl font-bold text-green-600">{(stats.totalEarned ?? 0).toFixed(0)}</div>
            <div className="text-xs text-muted-foreground">{lang === "cs" ? "Kč celkem" : "CZK total"}</div>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <div className="text-2xl font-bold text-amber-600">{(stats.pendingPayout ?? 0).toFixed(0)}</div>
            <div className="text-xs text-muted-foreground">{lang === "cs" ? "Kč k výplatě" : "CZK pending"}</div>
          </div>
        </div>

        {/* Affiliate link */}
        {affiliateLink && (
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              {lang === "cs" ? "Váš affiliate odkaz" : "Your affiliate link"}
            </Label>
            <div className="flex gap-2">
              <Input value={affiliateLink} readOnly className="text-xs font-mono" />
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(affiliateLink);
                  toast.success(lang === "cs" ? "Odkaz zkopírován!" : "Link copied!");
                }}
              >
                {lang === "cs" ? "Kopírovat" : "Copy"}
              </Button>
            </div>
          </div>
        )}

        {/* Payout request */}
        {(stats.pendingPayout ?? 0) >= 100 && !showPayoutForm && (
          <Button
            variant="outline"
            className="w-full border-green-500/50 text-green-600 hover:bg-green-500/10"
            onClick={() => setShowPayoutForm(true)}
          >
            {lang === "cs"
              ? `Požádat o výplatu ${(stats.pendingPayout ?? 0).toFixed(0)} Kč`
              : `Request payout of ${(stats.pendingPayout ?? 0).toFixed(0)} CZK`}
          </Button>
        )}

        {showPayoutForm && (
          <div className="rounded-lg border border-border/50 p-4 space-y-3">
            <p className="text-sm font-medium">{lang === "cs" ? "Žádost o výplatu" : "Payout Request"}</p>
            <div className="space-y-1">
              <Label className="text-xs">{lang === "cs" ? "Způsob platby" : "Payment method"}</Label>
              <Select value={payoutMethod} onValueChange={(v) => setPayoutMethod(v as "bank_transfer" | "paypal")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">{lang === "cs" ? "Bankovní převod (IBAN)" : "Bank Transfer (IBAN)"}</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{payoutMethod === "bank_transfer" ? "IBAN" : "PayPal email"}</Label>
              <Input
                placeholder={payoutMethod === "bank_transfer" ? "CZ65 0800 0000 1920 0014 5399" : "your@email.com"}
                value={payoutDetails}
                onChange={(e) => setPayoutDetails(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1"
                onClick={() => requestPayout.mutate({ paymentMethod: payoutMethod, paymentDetails: payoutDetails })}
                disabled={requestPayout.isPending || payoutDetails.length < 5}
              >
                {requestPayout.isPending ? "..." : (lang === "cs" ? "Odeslat žádost" : "Submit request")}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowPayoutForm(false)}>
                {lang === "cs" ? "Zrušit" : "Cancel"}
              </Button>
            </div>
          </div>
        )}

        {(stats.pendingPayout ?? 0) < 100 && (
          <p className="text-xs text-muted-foreground text-center">
            {lang === "cs"
              ? `Minimální výplata: 100 Kč (aktuálně: ${(stats.pendingPayout ?? 0).toFixed(0)} Kč)`
              : `Minimum payout: 100 CZK (current: ${(stats.pendingPayout ?? 0).toFixed(0)} CZK)`}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
