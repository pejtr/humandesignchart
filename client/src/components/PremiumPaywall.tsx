import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Sparkles, Crown, Zap, Lock } from "lucide-react";
import { toast } from "sonner";

interface PremiumPaywallProps {
  /** Whether to show as a full blocking overlay or inline banner */
  variant?: "overlay" | "banner" | "inline";
  onClose?: () => void;
}

export default function PremiumPaywall({ variant = "inline", onClose }: PremiumPaywallProps) {
  const { locale } = useLanguage();
  const { user } = useAuth();
  const isCzech = locale === "cs";

  const createCheckout = trpc.subscription.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, "_blank");
        toast.info(isCzech ? "Přesměrování na platební bránu..." : "Redirecting to checkout...");
      }
    },
    onError: (err) => toast.error(err.message),
  });

  const handleUpgrade = (plan: "monthly" | "annual" | "credits") => {
    if (!user) {
      window.location.href = getLoginUrl();
      return;
    }
    createCheckout.mutate({ plan, locale, origin: window.location.origin });
  };

  if (variant === "banner") {
    return (
      <div className="rounded-xl border border-purple-500/40 bg-gradient-to-r from-purple-950/40 to-violet-950/40 p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
            <Crown className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <p className="font-semibold text-sm text-foreground">
              {isCzech ? "Vyčerpali jste bezplatný výklad" : "Free reading used"}
            </p>
            <p className="text-xs text-muted-foreground">
              {isCzech
                ? "Upgradujte na Premium pro neomezené AI výklady"
                : "Upgrade to Premium for unlimited AI readings"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            className="border-amber-500/50 text-amber-300 hover:bg-amber-500/10 text-xs"
            disabled={createCheckout.isPending}
            onClick={() => handleUpgrade("credits")}
          >
            <Zap className="w-3 h-3 mr-1" />
            {isCzech ? "5 kreditů / 49 Kč" : "5 credits / €1.99"}
          </Button>
          <Button
            size="sm"
            className="bg-purple-600 hover:bg-purple-700 text-white text-xs"
            disabled={createCheckout.isPending}
            onClick={() => handleUpgrade("monthly")}
          >
            <Crown className="w-3 h-3 mr-1" />
            {isCzech ? "Premium 88 Kč/měs" : "Premium €3.49/mo"}
          </Button>
        </div>
      </div>
    );
  }

  if (variant === "overlay") {
    return (
      <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-xl">
        <div className="text-center p-6 max-w-sm">
          <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-purple-400" />
          </div>
          <Badge className="mb-3 bg-purple-500/20 text-purple-300 border-purple-500/30">
            <Sparkles className="w-3 h-3 mr-1" />
            Premium
          </Badge>
          <h3 className="text-lg font-semibold mb-2">
            {isCzech ? "Bezplatný výklad byl použit" : "Free reading used"}
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            {isCzech
              ? "Upgradujte na Premium pro neomezené AI výklady, PDF reporty a všechny nástroje."
              : "Upgrade to Premium for unlimited AI readings, PDF reports, and all tools."}
          </p>
          <div className="space-y-2">
            <Button
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              disabled={createCheckout.isPending}
              onClick={() => handleUpgrade("monthly")}
            >
              <Crown className="w-4 h-4 mr-2" />
              {isCzech ? "Premium — 88 Kč/měsíc" : "Premium — €3.49/month"}
            </Button>
            <Button
              variant="outline"
              className="w-full border-amber-500/50 text-amber-300 hover:bg-amber-500/10"
              disabled={createCheckout.isPending}
              onClick={() => handleUpgrade("credits")}
            >
              <Zap className="w-4 h-4 mr-2" />
              {isCzech ? "5 kreditů za 49 Kč" : "5 credits for €1.99"}
            </Button>
            <Link href={`/${locale}/pricing`}>
              <Button variant="ghost" size="sm" className="w-full text-muted-foreground text-xs">
                {isCzech ? "Zobrazit všechny plány" : "View all plans"}
              </Button>
            </Link>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {isCzech ? "Zavřít" : "Close"}
            </button>
          )}
        </div>
      </div>
    );
  }

  // inline variant (default)
  return (
    <div className="rounded-xl border border-purple-500/40 bg-gradient-to-br from-purple-950/30 to-violet-950/30 p-6 text-center">
      <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-3">
        <Crown className="w-6 h-6 text-purple-400" />
      </div>
      <h3 className="font-semibold mb-1">
        {isCzech ? "Bezplatný výklad byl použit" : "Free reading used"}
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        {isCzech
          ? "Upgradujte na Premium pro neomezené AI výklady."
          : "Upgrade to Premium for unlimited AI readings."}
      </p>
      <div className="flex flex-col sm:flex-row gap-2 justify-center">
        <Button
          size="sm"
          className="bg-purple-600 hover:bg-purple-700 text-white"
          disabled={createCheckout.isPending}
          onClick={() => handleUpgrade("monthly")}
        >
          <Crown className="w-4 h-4 mr-1.5" />
          {isCzech ? "Premium 88 Kč/měs" : "Premium €3.49/mo"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="border-amber-500/50 text-amber-300 hover:bg-amber-500/10"
          disabled={createCheckout.isPending}
          onClick={() => handleUpgrade("credits")}
        >
          <Zap className="w-4 h-4 mr-1.5" />
          {isCzech ? "5 kreditů / 49 Kč" : "5 credits / €1.99"}
        </Button>
      </div>
      <Link href={`/${locale}/pricing`}>
        <p className="text-xs text-muted-foreground mt-3 hover:text-foreground cursor-pointer transition-colors">
          {isCzech ? "Zobrazit všechny plány →" : "View all plans →"}
        </p>
      </Link>
    </div>
  );
}
