import { useEffect, useState } from "react";
import { useSEO, OG_IMAGES } from "@/hooks/useSEO";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import {
  Check,
  Sparkles,
  Gift,
  CreditCard,
  Zap,
  Star,
  Crown,
  Lock,
  Moon,
  FileText,
  Heart,
} from "lucide-react";
import { CheckoutOrderBump } from "@/components/CheckoutOrderBump";
import { GiftVoucherModal } from "@/components/GiftVoucherModal";
import { TeamDesignAudit } from "@/components/TeamDesignAudit";
import { VipClubBanner } from "@/components/VipClubBanner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useMetaPixel } from "@/hooks/useMetaPixel";
import { getRedditClickIdForCapi } from "@/hooks/useRedditPixel";

type CheckoutPlan =
  | "monthly"
  | "annual"
  | "lifetime"
  | "credits"
  | "blueprint"
  | "blueprint_annual_upgrade"
  | "gift_monthly"
  | "gift_annual";

export default function Pricing() {
  const { t, locale } = useLanguage();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const p = t.pricing;
  const { viewContent, initiateCheckout } = useMetaPixel();

  const [giftForm, setGiftForm] = useState({
    recipientEmail: "",
    recipientName: "",
    senderName: "",
    personalMessage: "",
  });
  const [voucherCode, setVoucherCode] = useState("");
  const [includePartnerAddon, setIncludePartnerAddon] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);

  useEffect(() => {
    viewContent({
      content_name: "Personal Human Design Blueprint",
      content_category: "report",
      content_ids: ["blueprint"],
      content_type: "product",
      value: 390,
    });
  }, [viewContent]);

  // Set page title
  const isEn = locale === "en";
  useSEO(
    isEn
      ? {
          title: "✨ Pricing — Human Design Premium 🔮",
          description:
            "Upgrade to Human Design Premium for unlimited AI readings, PDF reports, and all tools.",
          ogImage: OG_IMAGES.pricing,
          keywords:
            "human design premium, human design subscription, human design AI reading",
          locale: "en_US",
          jsonLd: {
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "FAQPage",
                mainEntity: [
                  {
                    "@type": "Question",
                    name: "Can I cancel anytime?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "Yes, you can cancel your subscription at any time. You will retain access until the end of the billing period.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "What payment methods are accepted?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "We accept all major credit and debit cards via Stripe. Your payment is secure and encrypted.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "Is there a free trial?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "Yes — every new user gets one complete AI reading to experience the quality before purchasing.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "How do gift vouchers work?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "After purchase, you receive a unique voucher code by email. The recipient enters the code on our site to activate their Premium access.",
                    },
                  },
                ],
              },
            ],
          },
        }
      : {
          title: "✨ Ceník — Human Design Premium 🔮",
          description:
            "Upgradujte na Human Design Premium pro neomezené AI výklady, PDF reporty a všechny nástroje.",
          ogImage: OG_IMAGES.pricing,
          keywords:
            "human design premium, human design předplatné, human design AI výklad",
          locale: "cs_CZ",
          jsonLd: {
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "FAQPage",
                mainEntity: [
                  {
                    "@type": "Question",
                    name: "Mohu zrušit kdykoli?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "Ano, předplatné můžete zrušit kdykoli. Přístup si zachováte do konce fakturačního období.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "Jaké platební metody jsou přijímány?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "Přijímáme všechny hlavní kreditní a debetní karty přes Stripe. Vaše platba je bezpečná a šifrovaná.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "Je k dispozici zkušební verze?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "Ano — každý nový uživatel dostane jeden kompletní AI výklad, aby si mohl kvalitu vyzkoušet před nákupem.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "Jak fungují dárkové poukazy?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "Po nákupu obdržíte unikátní kód poukazu e-mailem. Příjemce zadá kód na našem webu a aktivuje si Premium přístup.",
                    },
                  },
                ],
              },
            ],
          },
        }
  );

  const { data: subStatus } = trpc.subscription.status.useQuery(undefined, {
    enabled: !!user,
  });

  const createCheckout = trpc.subscription.createCheckout.useMutation({
    onSuccess: data => {
      if (data.url) {
        window.location.assign(data.url);
        toast.info(
          locale === "cs"
            ? "Přesměrování na platební bránu..."
            : "Redirecting to checkout..."
        );
      }
    },
    onError: err => {
      toast.error(err.message);
    },
  });

  const redeemVoucher = trpc.giftVoucher.redeem.useMutation({
    onSuccess: () => {
      toast.success(p.voucherSuccess);
      setVoucherCode("");
    },
    onError: err => {
      const msg = err.message;
      if (msg === "already_redeemed") toast.error(p.voucherAlreadyUsed);
      else if (msg === "expired") toast.error(p.voucherExpired);
      else toast.error(p.voucherInvalid);
    },
  });

  const handleCheckout = (plan: CheckoutPlan) => {
    if (!user) {
      window.location.href = getLoginUrl();
      return;
    }
    const isGift = plan.startsWith("gift_");
    const values: Record<CheckoutPlan, number> = {
      monthly: 188,
      annual: 1188,
      lifetime: 2888,
      credits: 77,
      blueprint: includePartnerAddon ? 580 : 390,
      blueprint_annual_upgrade: 798,
      gift_monthly: 188,
      gift_annual: 1188,
    };
    initiateCheckout(values[plan], {
      content_name:
        plan === "blueprint" ? "Personal Human Design Blueprint" : plan,
      content_category: plan === "blueprint" ? "report" : "subscription",
      content_ids:
        plan === "blueprint" && includePartnerAddon
          ? ["blueprint", "blueprint_partner"]
          : [plan],
      content_type: "product",
      num_items: plan === "blueprint" && includePartnerAddon ? 2 : 1,
    });
    createCheckout.mutate({
      plan,
      locale,
      origin: window.location.origin,
      includePartnerAddon: plan === "blueprint" && includePartnerAddon,
      redditClickId: getRedditClickIdForCapi(),
      ...(isGift
        ? {
            recipientEmail: giftForm.recipientEmail || undefined,
            recipientName: giftForm.recipientName || undefined,
            senderName: giftForm.senderName || undefined,
            personalMessage: giftForm.personalMessage || undefined,
          }
        : {}),
    });
  };

  const handleRedeem = () => {
    if (!user) {
      window.location.href = getLoginUrl();
      return;
    }
    if (!voucherCode.trim()) return;
    redeemVoucher.mutate({ code: voucherCode.trim() });
  };

  const isCzech = locale === "cs";
  const isPremium = subStatus?.isPremium;
  const freeReadingsLeft = subStatus?.freeReadingsLeft ?? 1;

  const freeFeatures = isCzech
    ? [
        "1 kompletní AI výklad zdarma",
        "Neomezené výpočty mapy",
        "Přístup do encyklopedie",
        "Základní bodygraph",
      ]
    : [
        "1 complete AI reading for free",
        "Unlimited chart calculations",
        "Encyclopedia access",
        "Basic bodygraph",
      ];

  const premiumFeatures = isCzech
    ? [
        "Neomezené AI výklady",
        "Stažení PDF reportu mapy",
        "Všechny nástroje (tranzity, návratové mapy, srovnání)",
        "I Ching věštírna",
        "Rozšířená databáze celebrit",
        "Prioritní podpora",
        "Denní & týdenní tranzity na email (lze vypnout)",
      ]
    : [
        "Unlimited AI readings",
        "PDF chart report download",
        "All tools (transits, return charts, comparison)",
        "I Ching oracle",
        "Extended celebrities database",
        "Priority support",
        "Daily & weekly transits by email (can be disabled)",
      ];

  const faqItems = isCzech
    ? [
        {
          q: "Mohu zrušit kdykoli?",
          a: "Ano, předplatné můžete zrušit kdykoli. Přístup si zachováte do konce fakturačního období.",
        },
        {
          q: "Jaké platební metody jsou přijímány?",
          a: "Přijímáme všechny hlavní kreditní a debetní karty přes Stripe. Vaše platba je bezpečná a šifrovaná.",
        },
        {
          q: "Je k dispozici zkušební verze?",
          a: "Ano — každý nový uživatel dostane jeden kompletní AI výklad, aby si mohl kvalitu vyzkoušet před nákupem.",
        },
        {
          q: "Jak fungují dárkové poukazy?",
          a: "Po nákupu obdržíte unikátní kód poukazu e-mailem. Příjemce zadá kód na našem webu a aktivuje si Premium přístup.",
        },
      ]
    : [
        {
          q: "Can I cancel anytime?",
          a: "Yes, you can cancel your subscription at any time. You will retain access until the end of the billing period.",
        },
        {
          q: "What payment methods are accepted?",
          a: "We accept all major credit and debit cards via Stripe. Your payment is secure and encrypted.",
        },
        {
          q: "Is there a free trial?",
          a: "Yes — every new user gets one complete AI reading to experience the quality before purchasing.",
        },
        {
          q: "How do gift vouchers work?",
          a: "After purchase, you receive a unique voucher code by email. The recipient enters the code on our site to activate their Premium access.",
        },
      ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-b from-purple-950/30 via-background to-background pt-28 pb-12">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent pointer-events-none" />
        {/* Sacred Geometry Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <svg
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-[0.04]"
            viewBox="0 0 400 400"
            fill="none"
          >
            <circle
              cx="200"
              cy="200"
              r="180"
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-purple-300"
            />
            <circle
              cx="200"
              cy="200"
              r="140"
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-purple-300"
            />
            <circle
              cx="200"
              cy="200"
              r="100"
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-purple-300"
            />
            <circle
              cx="200"
              cy="200"
              r="60"
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-purple-300"
            />
            {/* Flower of Life petals */}
            <circle
              cx="200"
              cy="140"
              r="60"
              stroke="currentColor"
              strokeWidth="0.3"
              className="text-violet-300"
            />
            <circle
              cx="252"
              cy="170"
              r="60"
              stroke="currentColor"
              strokeWidth="0.3"
              className="text-violet-300"
            />
            <circle
              cx="252"
              cy="230"
              r="60"
              stroke="currentColor"
              strokeWidth="0.3"
              className="text-violet-300"
            />
            <circle
              cx="200"
              cy="260"
              r="60"
              stroke="currentColor"
              strokeWidth="0.3"
              className="text-violet-300"
            />
            <circle
              cx="148"
              cy="230"
              r="60"
              stroke="currentColor"
              strokeWidth="0.3"
              className="text-violet-300"
            />
            <circle
              cx="148"
              cy="170"
              r="60"
              stroke="currentColor"
              strokeWidth="0.3"
              className="text-violet-300"
            />
            {/* Triangle */}
            <polygon
              points="200,50 350,310 50,310"
              stroke="currentColor"
              strokeWidth="0.4"
              fill="none"
              className="text-amber-300"
            />
            <polygon
              points="200,350 50,90 350,90"
              stroke="currentColor"
              strokeWidth="0.4"
              fill="none"
              className="text-amber-300"
            />
          </svg>
        </div>
        <div className="container max-w-4xl text-center relative z-10">
          <Badge className="mb-4 bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30 px-4 py-1">
            <Sparkles className="w-3 h-3 mr-1" />
            {isCzech ? "Odemkněte svůj potenciál" : "Unlock your potential"}
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-700 via-violet-600 to-indigo-700 dark:from-purple-300 dark:via-violet-200 dark:to-indigo-300 bg-clip-text text-transparent">
            {p.pageTitle}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {p.pageSubtitle}
          </p>
          {user && !isPremium && (
            <div className="mt-4 inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-full px-4 py-2 text-sm text-amber-700 dark:text-amber-300">
              <Zap className="w-4 h-4" />
              {isCzech
                ? `Zbývá vám ${freeReadingsLeft} bezplatný výklad`
                : `You have ${freeReadingsLeft} free reading${freeReadingsLeft !== 1 ? "s" : ""} left`}
            </div>
          )}
          {isPremium && (
            <div className="mt-4 inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 rounded-full px-4 py-2 text-sm text-purple-700 dark:text-purple-300">
              <Crown className="w-4 h-4" />
              {isCzech ? "Jste Premium člen!" : "You are a Premium member!"}
            </div>
          )}
        </div>
      </div>

      <div className="container max-w-5xl pb-20">
        <Tabs defaultValue="plans" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-10 max-w-md mx-auto">
            <TabsTrigger value="plans">
              {isCzech ? "Plány" : "Plans"}
            </TabsTrigger>
            <TabsTrigger value="gift">
              <Gift className="w-4 h-4 mr-1" />
              {isCzech ? "Dárek" : "Gift"}
            </TabsTrigger>
            <TabsTrigger value="redeem">
              <CreditCard className="w-4 h-4 mr-1" />
              {isCzech ? "Uplatnit" : "Redeem"}
            </TabsTrigger>
          </TabsList>

          {/* Plans Tab */}
          <TabsContent value="plans">
            <Card
              id="blueprint"
              className="mb-12 overflow-hidden border-violet-300/70 bg-gradient-to-br from-[#fbf8ff] via-white to-amber-50/70 shadow-xl shadow-violet-950/5 dark:border-violet-700/50 dark:from-violet-950/30 dark:via-background dark:to-amber-950/10"
            >
              <div className="grid lg:grid-cols-[0.72fr_1.28fr]">
                <div className="relative min-h-[320px] overflow-hidden bg-[#160b2f]">
                  <img
                    src="/images/brand/veleknezka-master-v1.png"
                    alt={
                      isCzech
                        ? "Marie, průvodkyně osobním Human Design Blueprintem"
                        : "Marie, guide to your personal Human Design Blueprint"
                    }
                    className="absolute inset-0 h-full w-full object-cover object-top opacity-90"
                    loading="eager"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#160b2f] via-transparent to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-amber-200">
                      <Moon className="h-4 w-4" />{" "}
                      {isCzech ? "Marie vás provede" : "Guided by Marie"}
                    </div>
                    <p className="font-serif text-2xl leading-tight">
                      {isCzech
                        ? "Vaše mapa. Vaše rozhodování. Váš další krok."
                        : "Your chart. Your decisions. Your next step."}
                    </p>
                  </div>
                </div>

                <CardContent className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <Badge className="border-0 bg-violet-700 text-white">
                      {isCzech ? "Nejlepší první krok" : "Best first step"}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="border-amber-400/60 text-amber-800 dark:text-amber-300"
                    >
                      {isCzech
                        ? "Jednorázově · bez předplatného"
                        : "One-time · no subscription"}
                    </Badge>
                  </div>
                  <h2 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
                    {isCzech
                      ? "Osobní Human Design Blueprint"
                      : "Personal Human Design Blueprint"}
                  </h2>
                  <p className="mt-3 max-w-2xl text-muted-foreground">
                    {isCzech
                      ? "Praktický osobní report, který propojí váš typ, autoritu, profil, centra, Lunu a aktuální tranzity do srozumitelného návodu pro každodenní rozhodování."
                      : "A practical personal report connecting your type, authority, profile, centers, Moon and current transits into clear guidance for everyday decisions."}
                  </p>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {[
                      {
                        icon: FileText,
                        text: isCzech
                          ? "1 prémiový PDF report"
                          : "1 premium PDF report",
                      },
                      {
                        icon: Sparkles,
                        text: isCzech
                          ? "5 navazujících AI výkladů"
                          : "5 follow-up AI readings",
                      },
                      {
                        icon: Moon,
                        text: isCzech
                          ? "Luna a energie období"
                          : "Moon and current energy",
                      },
                      {
                        icon: Zap,
                        text: isCzech
                          ? "Praktické kroky pro práci a vztahy"
                          : "Practical steps for work and relationships",
                      },
                    ].map(({ icon: Icon, text }) => (
                      <div
                        key={text}
                        className="flex items-center gap-2 text-sm"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span>{text}</span>
                      </div>
                    ))}
                  </div>

                  <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/70 p-4 transition-colors hover:bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/20">
                    <Checkbox
                      checked={includePartnerAddon}
                      onCheckedChange={checked =>
                        setIncludePartnerAddon(checked === true)
                      }
                      aria-label={
                        isCzech
                          ? "Přidat partnerský Blueprint"
                          : "Add Partner Blueprint"
                      }
                      className="mt-0.5"
                    />
                    <span className="flex-1">
                      <span className="flex flex-wrap items-center gap-2 font-medium">
                        <Heart className="h-4 w-4 text-rose-500" />
                        {isCzech
                          ? "Přidat partnerský Blueprint"
                          : "Add Partner Blueprint"}
                        <Badge
                          variant="outline"
                          className="border-rose-300 text-rose-700 dark:text-rose-300"
                        >
                          + {isCzech ? "190 Kč" : "€7.90"}
                        </Badge>
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {isCzech
                          ? "Druhý PDF report a dalších 5 AI výkladů pro partnera nebo dítě."
                          : "A second PDF report and 5 more AI readings for a partner or child."}
                      </span>
                    </span>
                  </label>

                  <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-3xl font-bold">
                        {isCzech
                          ? includePartnerAddon
                            ? "580 Kč"
                            : "390 Kč"
                          : includePartnerAddon
                            ? "€23.80"
                            : "€15.90"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {isCzech
                          ? "Do 48 hodin lze cenu Blueprintu započíst do ročního Premium."
                          : "Apply the Blueprint price toward Annual Premium within 48 hours."}
                      </div>
                    </div>
                    <Button
                      size="lg"
                      className="min-w-56 bg-gradient-to-r from-violet-700 to-purple-600 text-white shadow-lg shadow-violet-700/20 hover:from-violet-800 hover:to-purple-700"
                      disabled={createCheckout.isPending}
                      onClick={() => handleCheckout("blueprint")}
                    >
                      <Moon className="mr-2 h-4 w-4" />
                      {isCzech
                        ? "Odemknout můj Blueprint"
                        : "Unlock my Blueprint"}
                    </Button>
                  </div>
                </CardContent>
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 mt-6">
              {/* Free Plan */}
              <Card className="border-border/50 bg-card/50">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-muted-foreground">
                      {p.freePlan}
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl">
                    0 {isCzech ? "Kč" : "€"}
                  </CardTitle>
                  <CardDescription>
                    {isCzech ? "Navždy zdarma" : "Forever free"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {freeFeatures.map((f, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{f}</span>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    className="w-full mt-4"
                    disabled={!user || isPremium === false}
                    onClick={() =>
                      !user && (window.location.href = getLoginUrl())
                    }
                  >
                    {!user
                      ? p.startFree
                      : isCzech
                        ? "Váš aktuální plán"
                        : "Your current plan"}
                  </Button>
                </CardContent>
              </Card>

              {/* Monthly Plan */}
              <Card className="border-purple-500/50 bg-purple-950/10 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-purple-600 text-white px-3 py-1">
                    <Star className="w-3 h-3 mr-1" />
                    {p.mostPopular}
                  </Badge>
                </div>
                <CardHeader className="pb-4 pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className="bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30">
                      {p.monthlyPlan}
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl">
                    {isCzech ? "188 Kč" : "€7.49"}
                    <span className="text-sm font-normal text-muted-foreground ml-1">
                      {p.perMonth}
                    </span>
                  </CardTitle>
                  <CardDescription>
                    {isCzech ? "Zrušte kdykoli" : "Cancel anytime"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {premiumFeatures.map((f, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                  <Button
                    className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white"
                    disabled={createCheckout.isPending || isPremium}
                    onClick={() => handleCheckout("monthly")}
                  >
                    {isPremium ? p.currentPlan : p.getMonthly}
                  </Button>
                </CardContent>
              </Card>

              {/* Annual Plan */}
              <Card className="border-violet-500/50 bg-violet-950/10 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-violet-600 text-white px-3 py-1">
                    <Zap className="w-3 h-3 mr-1" />
                    {p.bestValue}
                  </Badge>
                </div>
                <CardHeader className="pb-4 pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30">
                      {p.annualPlan}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-green-400 border-green-500/30 text-xs"
                    >
                      Ušetříte 47 %
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl">
                    {isCzech ? "1 188 Kč" : "€47"}
                    <span className="text-sm font-normal text-muted-foreground ml-1">
                      {p.perYear}
                    </span>
                  </CardTitle>
                  <CardDescription>
                    {isCzech ? "≈ 99 Kč/měsíc · " : "≈ €3.91/month · "}
                    {p.billedAnnually}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {premiumFeatures.map((f, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-violet-400 mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                  <Button
                    className="w-full mt-4 bg-violet-600 hover:bg-violet-700 text-white"
                    disabled={createCheckout.isPending || isPremium}
                    onClick={() => handleCheckout("annual")}
                  >
                    {isPremium ? p.currentPlan : p.getAnnual}
                  </Button>
                </CardContent>
              </Card>

              {/* Lifetime Plan */}
              <Card className="border-amber-500/50 bg-amber-950/10 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-amber-600 text-white px-3 py-1 border-none shadow-orange-500/20 shadow-lg">
                    <Crown className="w-3 h-3 mr-1" />
                    {isCzech ? "Exkluzivně" : "Exclusive"}
                  </Badge>
                </div>
                <CardHeader className="pb-4 pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className="bg-amber-500/20 text-amber-500 dark:text-amber-400 border-amber-500/30">
                      {isCzech ? "Doživotní" : "Lifetime"}
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl">
                    {isCzech ? "2 888 Kč" : "€115"}
                  </CardTitle>
                  <CardDescription>
                    {isCzech ? "Jednorázově napořád" : "One-time forever"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {premiumFeatures.map((f, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                  <Button
                    className="w-full mt-4 bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/30 shadow-lg border-none"
                    disabled={
                      createCheckout.isPending ||
                      (user && user.subscriptionPlan === "lifetime")
                    }
                    onClick={() => handleCheckout("lifetime")}
                  >
                    {user && user.subscriptionPlan === "lifetime"
                      ? p.currentPlan
                      : isCzech
                        ? "Získat Doživotně"
                        : "Get Lifetime"}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Credit Pack */}
            <Card className="border-amber-500/30 bg-amber-950/10 mb-10">
              <CardContent className="flex flex-col md:flex-row items-center justify-between gap-4 py-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <div className="font-semibold flex items-center gap-2">
                      {p.creditPack}
                      <Badge
                        variant="outline"
                        className="text-amber-400 border-amber-500/30 text-xs"
                      >
                        {isCzech ? "77 Kč" : "€2.99"}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {p.creditPackDesc}
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="border-amber-500/50 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 shrink-0"
                  disabled={createCheckout.isPending}
                  onClick={() => handleCheckout("credits")}
                >
                  {p.buyCredits}
                </Button>
              </CardContent>
            </Card>

          </TabsContent>

          {/* Gift Tab */}
          <TabsContent value="gift">
            <div className="max-w-xl mx-auto">
              <Card className="border-pink-500/30 bg-pink-950/10">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center">
                      <Gift className="w-5 h-5 text-pink-400" />
                    </div>
                    <div>
                      <CardTitle>{p.giftVoucher}</CardTitle>
                      <CardDescription>{p.giftVoucherDesc}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm mb-1 block">
                        {p.recipientEmail}
                      </Label>
                      <Input
                        type="email"
                        placeholder="jan@example.cz"
                        value={giftForm.recipientEmail}
                        onChange={e =>
                          setGiftForm(f => ({
                            ...f,
                            recipientEmail: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-sm mb-1 block">
                        {p.recipientName}
                      </Label>
                      <Input
                        placeholder={
                          isCzech ? "Jméno příjemce" : "Recipient name"
                        }
                        value={giftForm.recipientName}
                        onChange={e =>
                          setGiftForm(f => ({
                            ...f,
                            recipientName: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-sm mb-1 block">
                        {p.senderName}
                      </Label>
                      <Input
                        placeholder={isCzech ? "Vaše jméno" : "Your name"}
                        value={giftForm.senderName}
                        onChange={e =>
                          setGiftForm(f => ({
                            ...f,
                            senderName: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm mb-1 block">
                      {p.personalMessage}
                    </Label>
                    <Textarea
                      placeholder={
                        isCzech
                          ? "Napište osobní zprávu..."
                          : "Write a personal message..."
                      }
                      value={giftForm.personalMessage}
                      onChange={e =>
                        setGiftForm(f => ({
                          ...f,
                          personalMessage: e.target.value,
                        }))
                      }
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <Button
                      variant="outline"
                      className="border-pink-500/50 text-pink-700 dark:text-pink-300 hover:bg-pink-500/10"
                      disabled={createCheckout.isPending}
                      onClick={() => handleCheckout("gift_monthly")}
                    >
                      <Gift className="w-4 h-4 mr-2" />
                      {p.giftMonthly}
                      <span className="ml-auto text-xs opacity-70">
                        {isCzech ? "188 Kč" : "€7.49"}
                      </span>
                    </Button>
                    <Button
                      className="bg-pink-600 hover:bg-pink-700 text-white"
                      disabled={createCheckout.isPending}
                      onClick={() => handleCheckout("gift_annual")}
                    >
                      <Gift className="w-4 h-4 mr-2" />
                      {p.giftAnnual}
                      <span className="ml-auto text-xs opacity-70">
                        {isCzech ? "1 188 Kč" : "€47"}
                      </span>
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    {isCzech
                      ? "Po platbě obdržíte kód poukazu e-mailem. Příjemce ho zadá na webu."
                      : "After payment, you will receive the voucher code by email. The recipient enters it on the site."}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Redeem Tab */}
          <TabsContent value="redeem">
            <div className="max-w-md mx-auto">
              <Card className="border-teal-500/30 bg-teal-950/10">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-teal-400" />
                    </div>
                    <div>
                      <CardTitle>{p.redeemVoucher}</CardTitle>
                      <CardDescription>
                        {isCzech
                          ? "Zadejte kód poukazu pro aktivaci Premium"
                          : "Enter your voucher code to activate Premium"}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm mb-1 block">
                      {p.voucherCode}
                    </Label>
                    <Input
                      placeholder="HD-XXXX-XXXX-XXXX-XXXX"
                      value={voucherCode}
                      onChange={e =>
                        setVoucherCode(e.target.value.toUpperCase())
                      }
                      className="font-mono tracking-wider"
                    />
                  </div>
                  <Button
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                    disabled={redeemVoucher.isPending || !voucherCode.trim()}
                    onClick={handleRedeem}
                  >
                    {redeemVoucher.isPending
                      ? isCzech
                        ? "Uplatňuji..."
                        : "Redeeming..."
                      : p.redeemCode}
                  </Button>
                  {!user && (
                    <p className="text-xs text-center text-muted-foreground">
                      {isCzech
                        ? "Pro uplatnění poukazu se musíte přihlásit."
                        : "You need to sign in to redeem a voucher."}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Secure payments note */}
        <div className="mt-12 text-center">
          <p className="text-xs text-muted-foreground">
            {isCzech
              ? "Platby jsou zpracovávány bezpečně přes Stripe"
              : "Payments are processed securely via Stripe"}
            {" · "}
            <Lock className="w-3 h-3 inline" />
          </p>
        </div>

        {/* FAQ Section */}
        <div className="mt-20">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-3 bg-gradient-to-r from-purple-700 via-violet-600 to-indigo-700 dark:from-purple-300 dark:via-violet-200 dark:to-indigo-300 bg-clip-text text-transparent">
              {isCzech ? "Často kladené otázky" : "Frequently Asked Questions"}
            </h2>
            <p className="text-muted-foreground">
              {isCzech
                ? "Vše, co potřebujete vědět o Human Design Premium"
                : "Everything you need to know about Human Design Premium"}
            </p>
          </div>
          <div className="max-w-2xl mx-auto">
            <Accordion type="single" collapsible className="space-y-3">
              {faqItems.map((item, idx) => (
                <AccordionItem
                  key={idx}
                  value={`faq-${idx}`}
                  className="border border-border/50 rounded-xl px-5 bg-card/50 backdrop-blur-sm data-[state=open]:border-purple-500/30 data-[state=open]:bg-purple-500/5 transition-colors"
                >
                  <AccordionTrigger className="text-left font-medium text-foreground hover:text-purple-300 transition-colors py-4 [&[data-state=open]>svg]:text-purple-400">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-4 leading-relaxed">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>

        <div className="container max-w-4xl mx-auto my-8">
          <VipClubBanner />
          <TeamDesignAudit />
        </div>
      </div>

      <GiftVoucherModal open={showGiftModal} onOpenChange={setShowGiftModal} />
      <Footer />
    </div>
  );
}
