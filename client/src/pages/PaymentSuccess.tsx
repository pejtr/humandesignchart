import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useMetaPixel } from "@/hooks/useMetaPixel";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Crown, Sparkles, ArrowRight, BookOpen, Zap, Star, CheckCircle2, Moon, Clock3 } from "lucide-react";
import { Link } from "wouter";

export default function PaymentSuccess() {
  const { locale, localePath } = useLanguage();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const isEn = locale === "en";
  const meta = useMetaPixel();
  const plan = new URLSearchParams(window.location.search).get("plan") as
    | "monthly"
    | "annual"
    | "credits"
    | "lifetime"
    | "blueprint"
    | "blueprint_annual_upgrade"
    | null;
  const isBlueprint = plan === "blueprint";

  const createCheckout = trpc.subscription.createCheckout.useMutation({
    onSuccess: (data) => data.url && window.location.assign(data.url),
  });

  const handleAnnualUpgrade = () => {
    meta.initiateCheckout(798, {
      content_name: "Annual Premium after Blueprint",
      content_category: "subscription",
      content_ids: ["blueprint_annual_upgrade"],
      content_type: "product",
    });
    createCheckout.mutate({
      plan: "blueprint_annual_upgrade",
      locale,
      origin: window.location.origin,
      includePartnerAddon: false,
    });
  };

  // Refetch subscription status after successful payment
  const utils = trpc.useUtils();
  useEffect(() => {
    // Invalidate subscription status so it refreshes
    utils.subscription.status.invalidate();
    document.title = isEn ? "✨ Payment Successful — Welcome to Premium!" : "✨ Platba úspěšná — Vítejte v Premium!";

    // Track Purchase event (META Pixel + Conversions API) — fires once per mount
    const searchParams = new URLSearchParams(window.location.search);
    const sessionId = searchParams.get("session_id");
    const trackingKey = sessionId ? `hd-purchase-tracked:${sessionId}` : null;
    const planValue =
      plan === "annual" ? 1188
        : plan === "lifetime" ? 2888
          : plan === "credits" ? 77
            : plan === "blueprint" ? 390
              : plan === "blueprint_annual_upgrade" ? 798
                : 188;
    const currency = isEn ? "EUR" : "CZK";
    if (!trackingKey || localStorage.getItem(trackingKey) !== "true") {
      meta.purchase(plan === "credits" ? 77 : planValue, {
        content_ids: plan ? [plan] : undefined,
        content_type: "product",
        currency,
        order_id: sessionId || undefined,
        predicted_ltv: plan === "blueprint" ? 1188 : planValue,
      });
      if (trackingKey) localStorage.setItem(trackingKey, "true");
    }
  }, [isEn, plan]);

  const nextSteps = isEn ? [
    {
      icon: <Zap className="w-5 h-5 text-amber-400" />,
      title: "Generate your AI reading",
      desc: "Get a deep, personalized interpretation of your Human Design chart.",
      href: localePath("/calculate"),
      cta: "Calculate chart",
    },
    {
      icon: <BookOpen className="w-5 h-5 text-violet-400" />,
      title: "Explore the Encyclopedia",
      desc: "Dive into all 64 gates, 36 channels, and 9 centers in detail.",
      href: localePath("/encyclopedia"),
      cta: "Open encyclopedia",
    },
    {
      icon: <Star className="w-5 h-5 text-pink-400" />,
      title: "Chat with AI Guide",
      desc: "Ask your personal AI guide anything about Human Design.",
      href: localePath("/ai-guide"),
      cta: "Start chatting",
    },
  ] : [
    {
      icon: <Zap className="w-5 h-5 text-amber-400" />,
      title: "Vygenerujte AI výklad",
      desc: "Získejte hluboký, personalizovaný výklad vaší Human Design mapy.",
      href: localePath("/calculate"),
      cta: "Vypočítat mapu",
    },
    {
      icon: <BookOpen className="w-5 h-5 text-violet-400" />,
      title: "Prozkoumejte encyklopedii",
      desc: "Ponořte se do všech 64 bran, 36 drah a 9 center do detailu.",
      href: localePath("/encyclopedia"),
      cta: "Otevřít encyklopedii",
    },
    {
      icon: <Star className="w-5 h-5 text-pink-400" />,
      title: "Chat s AI průvodcem",
      desc: "Zeptejte se svého osobního AI průvodce na cokoliv o Human Designu.",
      href: localePath("/ai-guide"),
      cta: "Začít chatovat",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container max-w-3xl text-center">
          {/* Brand medallion */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="relative w-28 h-28 overflow-hidden rounded-full border-2 border-amber-200/80 bg-[#160b2f] mx-auto mb-6 shadow-2xl shadow-purple-500/25 ring-8 ring-violet-500/10"
          >
            <img src="/images/brand/veleknezka-master-v1.png" alt="" className="h-full w-full object-cover object-top" />
            <span className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full border border-white/60 bg-violet-700 text-white shadow-lg">
              {isBlueprint ? <Moon className="h-4 w-4" /> : <Crown className="h-4 w-4" />}
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Badge className="mb-4 bg-green-500/20 text-green-400 border-green-500/30 px-4 py-1.5 text-sm">
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
               {isEn ? "Payment confirmed" : "Platba potvrzena"}
            </Badge>

            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-violet-300 to-indigo-400 bg-clip-text text-transparent">
               {isBlueprint
                 ? (isEn ? "Your Blueprint is unlocked" : "Váš Blueprint je odemčený")
                 : (isEn ? "Welcome to Premium! 🎉" : "Vítejte v Premium! 🎉")}
            </h1>

            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
               {isBlueprint
                 ? (isEn
                   ? "The High Priestess will guide you through your personal report. Open a saved chart to download your PDF and continue with five in-depth AI readings."
                   : "Velekněžka vás provede osobním reportem. Otevřete uloženou mapu, stáhněte si PDF a pokračujte pěti hloubkovými AI výklady.")
                 : (isEn
                   ? "Your Premium access is now active. You can use all AI readings, PDF reports, and premium tools."
                   : "Váš Premium přístup je nyní aktivní. Můžete využívat všechny AI výklady, PDF reporty a prémiové nástroje.")}
            </p>
          </motion.div>

          {/* What's unlocked */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10"
          >
            {(isBlueprint ? [
              { icon: "📄", label: isEn ? "Premium PDF report" : "Prémiový PDF report" },
              { icon: "✨", label: isEn ? "5 follow-up AI readings" : "5 navazujících AI výkladů" },
              { icon: "🌙", label: isEn ? "Moon and current energy" : "Luna a energie období" },
            ] : [
              { icon: "∞", label: isEn ? "Generous AI access" : "Velkorysý přístup k AI výkladům" },
              { icon: "📄", label: isEn ? "PDF chart reports" : "PDF reporty mapy" },
              { icon: "🛠️", label: isEn ? "All premium tools" : "Všechny prémiové nástroje" },
            ]).map((item, i) => (
              <Card key={i} className="border-purple-500/20 bg-purple-950/10">
                <CardContent className="py-4 text-center">
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <p className="text-sm font-medium">{item.label}</p>
                </CardContent>
              </Card>
            ))}
          </motion.div>

          {isBlueprint && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mb-10 rounded-3xl border border-amber-300/60 bg-gradient-to-r from-amber-50 via-white to-violet-50 p-6 text-left shadow-lg shadow-amber-900/5 dark:border-amber-800/50 dark:from-amber-950/20 dark:via-background dark:to-violet-950/20"
            >
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-300">
                    <Clock3 className="h-4 w-4" />
                    {isEn ? "Private 48-hour offer" : "Soukromá nabídka na 48 hodin"}
                  </div>
                  <h2 className="font-serif text-2xl font-semibold">
                    {isEn ? "Turn your Blueprint into Annual Premium" : "Převeďte Blueprint na roční Premium"}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {isEn
                      ? "We credit the full Blueprint price. Pay only €31.90 and keep every report, transit and AI guide for a year."
                      : "Započítáme celou cenu Blueprintu. Doplatíte jen 798 Kč a na rok získáte všechny reporty, tranzity a AI průvodkyni."}
                  </p>
                </div>
                <Button
                  size="lg"
                  onClick={handleAnnualUpgrade}
                  disabled={createCheckout.isPending}
                  className="shrink-0 bg-amber-600 text-white hover:bg-amber-700"
                >
                  <Crown className="mr-2 h-4 w-4" />
                  {isEn ? "Upgrade for €31.90" : "Přejít na roční za 798 Kč"}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Next steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <h2 className="text-xl font-semibold mb-4 flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              {isEn ? "What would you like to do next?" : "Co chcete dělat jako první?"}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {nextSteps.map((step, i) => (
                <Link key={i} href={step.href}>
                  <Card className="border-border/50 hover:border-primary/40 transition-all cursor-pointer group hover:shadow-md hover:-translate-y-0.5">
                    <CardContent className="p-5 text-left">
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        {step.icon}
                      </div>
                      <h3 className="font-semibold text-sm mb-1">{step.title}</h3>
                      <p className="text-xs text-muted-foreground mb-3">{step.desc}</p>
                      <span className="text-xs text-primary font-medium flex items-center gap-1">
                        {step.cta} <ArrowRight className="w-3 h-3" />
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            <Button
              variant="outline"
              onClick={() => navigate(localePath("/dashboard"))}
              className="gap-2"
            >
              {isEn ? "Go to my dashboard" : "Přejít na dashboard"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
