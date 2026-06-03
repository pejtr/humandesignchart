import { useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Gift, Users, ArrowRight, Check } from "lucide-react";

interface Props {
  code: string;
}

export default function ReferralLanding({ code }: Props) {
  const { locale, localePath } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const isCzech = locale === "cs";

  // Validate the referral code
  const { data: validation, isLoading } = trpc.referral.validateCode.useQuery(
    { code },
    { enabled: !!code }
  );

  // Store referral code in localStorage so it can be applied after login
  useEffect(() => {
    if (code) {
      localStorage.setItem("pendingReferralCode", code);
    }
  }, [code]);

  // Set page title
  useEffect(() => {
    document.title = isCzech
      ? "✨ Váš přítel vás zve do Human Design — získejte výklad zdarma!"
      : "✨ Your friend invited you to Human Design — get a free reading!";
  }, [isCzech]);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate(localePath("/calculate"));
    } else {
      window.location.href = getLoginUrl();
    }
  };

  const referrerName = validation?.referrerName || (isCzech ? "váš přítel" : "your friend");

  const benefits = isCzech ? [
    "5 bezplatných AI výkladů vašeho Human Design",
    "Neomezené výpočty mapy",
    "Přístup do encyklopedie Human Design",
    "Základní bodygraph zdarma",
  ] : [
    "5 free AI readings of your Human Design",
    "Unlimited chart calculations",
    "Access to Human Design encyclopedia",
    "Basic bodygraph for free",
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-16">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-purple-500/8 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-indigo-500/8 blur-3xl animate-pulse" style={{ animationDelay: "1.5s" }} />
      </div>

      <div className="relative z-10 max-w-lg w-full text-center space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
          </div>

          <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 px-4 py-1.5">
            <Gift className="w-3.5 h-3.5 mr-1.5" />
            {isCzech ? "Speciální pozvánka" : "Special invitation"}
          </Badge>

          <h1 className="text-3xl md:text-4xl font-bold leading-tight">
            {isCzech ? (
              <>
                <span className="text-foreground">{referrerName} vás zve</span>
                <br />
                <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                  do Human Design
                </span>
              </>
            ) : (
              <>
                <span className="text-foreground">{referrerName} invited you</span>
                <br />
                <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                  to Human Design
                </span>
              </>
            )}
          </h1>

          <p className="text-muted-foreground text-lg leading-relaxed">
            {isCzech
              ? "Zaregistrujte se a získejte bezplatný AI výklad vaší jedinečné mapy — dárek od přítele."
              : "Sign up and get a free AI reading of your unique chart — a gift from your friend."}
          </p>
        </div>

        {/* Gift box */}
        <div className="bg-gradient-to-br from-purple-950/20 to-indigo-950/20 border border-purple-500/30 rounded-2xl p-6 text-left space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <Gift className="w-5 h-5 text-purple-400" />
            <p className="font-semibold text-sm">
              {isCzech ? "Co dostanete zdarma:" : "What you get for free:"}
            </p>
          </div>
          {benefits.map((benefit, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3 h-3 text-green-400" />
              </div>
              <span className="text-sm text-muted-foreground">{benefit}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="space-y-3">
          <Button
            size="lg"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-base h-12 gap-2"
            onClick={handleGetStarted}
          >
            {isCzech ? "Získat výklad zdarma" : "Get my free reading"}
            <ArrowRight className="w-4 h-4" />
          </Button>
          <p className="text-xs text-muted-foreground">
            {isCzech
              ? "Bezplatná registrace · Žádná kreditní karta · Okamžitý přístup"
              : "Free registration · No credit card · Instant access"}
          </p>
        </div>

        {/* Social proof */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Users className="w-4 h-4" />
          {isCzech
            ? "Přidejte se k více než 1 200 uživatelům, kteří znají svůj design"
            : "Join over 1,200 users who know their design"}
        </div>
      </div>
    </div>
  );
}
