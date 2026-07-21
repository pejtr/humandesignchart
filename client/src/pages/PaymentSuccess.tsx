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
import { Crown, Sparkles, ArrowRight, BookOpen, Zap, Star, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";

export default function PaymentSuccess() {
  const { locale, localePath } = useLanguage();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const isEn = locale === "en";
  const meta = useMetaPixel();

  // Refetch subscription status after successful payment
  const utils = trpc.useUtils();
  useEffect(() => {
    // Invalidate subscription status so it refreshes
    utils.subscription.status.invalidate();
    document.title = isEn ? "✨ Payment Successful — Welcome to Premium!" : "✨ Platba úspěšná — Vítejte v Premium!";

    // Track Purchase event (META Pixel + Conversions API) — fires once per mount
    const plan = new URLSearchParams(window.location.search).get("plan") as
      | "monthly"
      | "annual"
      | "credits"
      | "lifetime"
      | null;
    const planValue =
      plan === "annual" ? 1188 : plan === "lifetime" ? 2888 : plan === "credits" ? 77 : 188;
    const currency = isEn ? "EUR" : "CZK";
    meta.purchase(plan === "credits" ? 77 : planValue, {
      content_ids: plan ? [plan] : undefined,
      content_type: "product",
      currency,
      predicted_ltv: plan === "annual" ? 1188 : plan === "lifetime" ? 2888 : plan === "credits" ? 77 : 188,
    });
  }, [isEn]);

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
          {/* Celebration animation */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-purple-500/30"
          >
            <Crown className="w-12 h-12 text-white" />
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
              {isEn ? "Welcome to Premium! 🎉" : "Vítejte v Premium! 🎉"}
            </h1>

            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              {isEn
                ? "Your subscription is now active. You have unlimited access to all AI readings, PDF reports, and premium tools."
                : "Vaše předplatné je nyní aktivní. Máte neomezený přístup ke všem AI výkladům, PDF reportům a prémiových nástrojům."}
            </p>
          </motion.div>

          {/* What's unlocked */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10"
          >
            {[
              { icon: "∞", label: isEn ? "Unlimited AI readings" : "Neomezené AI výklady" },
              { icon: "📄", label: isEn ? "PDF chart reports" : "PDF reporty mapy" },
              { icon: "🛠️", label: isEn ? "All premium tools" : "Všechny prémiové nástroje" },
            ].map((item, i) => (
              <Card key={i} className="border-purple-500/20 bg-purple-950/10">
                <CardContent className="py-4 text-center">
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <p className="text-sm font-medium">{item.label}</p>
                </CardContent>
              </Card>
            ))}
          </motion.div>

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
