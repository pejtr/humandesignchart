import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import { Check, Sparkles, Gift, CreditCard, Zap, Star, Crown, Lock } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Pricing() {
  const { t, locale } = useLanguage();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const p = t.pricing;

  const [giftForm, setGiftForm] = useState({
    recipientEmail: "",
    recipientName: "",
    senderName: "",
    personalMessage: "",
  });
  const [voucherCode, setVoucherCode] = useState("");

  // Set page title
  useEffect(() => {
    const isEn = locale === "en";
    document.title = isEn
      ? `✨ Pricing — Human Design Premium 🔮`
      : `✨ Ceník — Human Design Premium 🔮`;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", isEn
      ? "Upgrade to Human Design Premium for unlimited AI readings, PDF reports, and all tools."
      : "Upgradujte na Human Design Premium pro neomezené AI výklady, PDF reporty a všechny nástroje.");
  }, [locale]);

  const { data: subStatus } = trpc.subscription.status.useQuery(undefined, {
    enabled: !!user,
  });

  const createCheckout = trpc.subscription.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, "_blank");
        toast.info(locale === "cs" ? "Přesměrování na platební bránu..." : "Redirecting to checkout...");
      }
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const redeemVoucher = trpc.giftVoucher.redeem.useMutation({
    onSuccess: () => {
      toast.success(p.voucherSuccess);
      setVoucherCode("");
    },
    onError: (err) => {
      const msg = err.message;
      if (msg === "already_redeemed") toast.error(p.voucherAlreadyUsed);
      else if (msg === "expired") toast.error(p.voucherExpired);
      else toast.error(p.voucherInvalid);
    },
  });

  const handleCheckout = (plan: "monthly" | "annual" | "credits" | "gift_monthly" | "gift_annual") => {
    if (!user) {
      window.location.href = getLoginUrl();
      return;
    }
    const isGift = plan.startsWith("gift_");
    createCheckout.mutate({
      plan,
      locale,
      origin: window.location.origin,
      ...(isGift ? {
        recipientEmail: giftForm.recipientEmail || undefined,
        recipientName: giftForm.recipientName || undefined,
        senderName: giftForm.senderName || undefined,
        personalMessage: giftForm.personalMessage || undefined,
      } : {}),
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

  // Urgency countdown — ends at next Sunday midnight (resets weekly)
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    const getNextSunday = () => {
      const now = new Date();
      const day = now.getDay(); // 0=Sun, 1=Mon...
      const daysUntilSunday = day === 0 ? 7 : 7 - day;
      const next = new Date(now);
      next.setDate(now.getDate() + daysUntilSunday);
      next.setHours(23, 59, 59, 0);
      return next;
    };
    const target = getNextSunday();
    const tick = () => {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) { setTimeLeft({ hours: 0, minutes: 0, seconds: 0 }); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft({ hours: h, minutes: m, seconds: s });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const freeFeatures = isCzech ? [
    "1 bezplatný AI výklad",
    "Neomezené výpočty mapy",
    "Přístup do encyklopedie",
    "Základní bodygraph",
  ] : [
    "1 free AI reading",
    "Unlimited chart calculations",
    "Encyclopedia access",
    "Basic bodygraph",
  ];

  const premiumFeatures = isCzech ? [
    "Neomezené AI výklady",
    "Stažení PDF reportu mapy",
    "Všechny nástroje (tranzity, návratové mapy, srovnání)",
    "I Ching věštírna",
    "Databáze celebrit",
    "Prioritní podpora",
  ] : [
    "Unlimited AI readings",
    "PDF chart report download",
    "All tools (transits, return charts, comparison)",
    "I Ching oracle",
    "Celebrities database",
    "Priority support",
  ];

  const faqItems = isCzech ? [
    { q: "Mohu zrušit kdykoli?", a: "Ano, předplatné můžete zrušit kdykoli. Přístup si zachováte do konce fakturačního období." },
    { q: "Jaké platební metody jsou přijímány?", a: "Přijímáme všechny hlavní kreditní a debetní karty přes Stripe. Vaše platba je bezpečná a šifrovaná." },
    { q: "Je k dispozici zkušební verze?", a: "Ano — každý nový uživatel dostane 1 bezplatný AI výklad, aby si mohl vyzkoušet kvalitu před upgradem." },
    { q: "Jak fungují dárkové poukazy?", a: "Po nákupu obdržíte unikátní kód poukazu e-mailem. Příjemce zadá kód na našem webu a aktivuje si Premium přístup." },
  ] : [
    { q: "Can I cancel anytime?", a: "Yes, you can cancel your subscription at any time. You will retain access until the end of the billing period." },
    { q: "What payment methods are accepted?", a: "We accept all major credit and debit cards via Stripe. Your payment is secure and encrypted." },
    { q: "Is there a free trial?", a: "Yes — every new user gets 1 free AI reading to experience the quality before upgrading." },
    { q: "How do gift vouchers work?", a: "After purchase, you receive a unique voucher code by email. The recipient enters the code on our site to activate their Premium access." },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-b from-purple-950/30 via-background to-background pt-28 pb-12">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent pointer-events-none" />
        {/* Sacred Geometry Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-[0.04]" viewBox="0 0 400 400" fill="none">
            <circle cx="200" cy="200" r="180" stroke="currentColor" strokeWidth="0.5" className="text-purple-300" />
            <circle cx="200" cy="200" r="140" stroke="currentColor" strokeWidth="0.5" className="text-purple-300" />
            <circle cx="200" cy="200" r="100" stroke="currentColor" strokeWidth="0.5" className="text-purple-300" />
            <circle cx="200" cy="200" r="60" stroke="currentColor" strokeWidth="0.5" className="text-purple-300" />
            {/* Flower of Life petals */}
            <circle cx="200" cy="140" r="60" stroke="currentColor" strokeWidth="0.3" className="text-violet-300" />
            <circle cx="252" cy="170" r="60" stroke="currentColor" strokeWidth="0.3" className="text-violet-300" />
            <circle cx="252" cy="230" r="60" stroke="currentColor" strokeWidth="0.3" className="text-violet-300" />
            <circle cx="200" cy="260" r="60" stroke="currentColor" strokeWidth="0.3" className="text-violet-300" />
            <circle cx="148" cy="230" r="60" stroke="currentColor" strokeWidth="0.3" className="text-violet-300" />
            <circle cx="148" cy="170" r="60" stroke="currentColor" strokeWidth="0.3" className="text-violet-300" />
            {/* Triangle */}
            <polygon points="200,50 350,310 50,310" stroke="currentColor" strokeWidth="0.4" fill="none" className="text-amber-300" />
            <polygon points="200,350 50,90 350,90" stroke="currentColor" strokeWidth="0.4" fill="none" className="text-amber-300" />
          </svg>
        </div>
        <div className="container max-w-4xl text-center relative z-10">
          <Badge className="mb-4 bg-purple-500/20 text-purple-300 border-purple-500/30 px-4 py-1">
            <Sparkles className="w-3 h-3 mr-1" />
            {isCzech ? "Odemkněte svůj potenciál" : "Unlock your potential"}
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-300 via-violet-200 to-indigo-300 bg-clip-text text-transparent">
            {p.pageTitle}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {p.pageSubtitle}
          </p>
          {user && !isPremium && (
            <div className="mt-4 inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-full px-4 py-2 text-sm text-amber-300">
              <Zap className="w-4 h-4" />
              {isCzech
                ? `Zbývá vám ${freeReadingsLeft} bezplatný výklad`
                : `You have ${freeReadingsLeft} free reading${freeReadingsLeft !== 1 ? "s" : ""} left`}
            </div>
          )}
          {isPremium && (
            <div className="mt-4 inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 rounded-full px-4 py-2 text-sm text-purple-300">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 mt-6">
              {/* Free Plan */}
              <Card className="border-border/50 bg-card/50">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-muted-foreground">{p.freePlan}</Badge>
                  </div>
                  <CardTitle className="text-2xl">0 {isCzech ? "Kč" : "€"}</CardTitle>
                  <CardDescription>{isCzech ? "Navždy zdarma" : "Forever free"}</CardDescription>
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
                    onClick={() => !user && (window.location.href = getLoginUrl())}
                  >
                    {!user ? p.startFree : (isCzech ? "Váš aktuální plán" : "Your current plan")}
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
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">{p.monthlyPlan}</Badge>
                  </div>
                  <CardTitle className="text-2xl">
                    {isCzech ? "88 Kč" : "€3.49"}
                    <span className="text-sm font-normal text-muted-foreground ml-1">{p.perMonth}</span>
                  </CardTitle>
                  <CardDescription>{isCzech ? "Zrušte kdykoli" : "Cancel anytime"}</CardDescription>
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
                {/* Urgency timer banner */}
                <div className="absolute -top-8 left-0 right-0 flex justify-center">
                  <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-full px-3 py-1 text-xs text-amber-300">
                    <span className="animate-pulse w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                    {isCzech ? "Sleva končí za" : "Offer ends in"}
                    <span className="font-mono font-bold">
                      {String(timeLeft.hours).padStart(2, "0")}:{String(timeLeft.minutes).padStart(2, "0")}:{String(timeLeft.seconds).padStart(2, "0")}
                    </span>
                  </div>
                </div>
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-violet-600 text-white px-3 py-1">
                    <Zap className="w-3 h-3 mr-1" />
                    {p.bestValue}
                  </Badge>
                </div>
                <CardHeader className="pb-4 pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30">{p.annualPlan}</Badge>
                    <Badge variant="outline" className="text-green-400 border-green-500/30 text-xs">{p.savePercent}</Badge>
                  </div>
                  <CardTitle className="text-2xl">
                    {isCzech ? "888 Kč" : "€35"}
                    <span className="text-sm font-normal text-muted-foreground ml-1">{p.perYear}</span>
                  </CardTitle>
                  <CardDescription>
                    {isCzech ? "≈ 74 Kč/měsíc · " : "≈ €2.92/month · "}{p.billedAnnually}
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
                      <Badge variant="outline" className="text-amber-400 border-amber-500/30 text-xs">
                        {isCzech ? "44 Kč" : "€1.79"}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">{p.creditPackDesc}</div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="border-amber-500/50 text-amber-300 hover:bg-amber-500/10 shrink-0"
                  disabled={createCheckout.isPending}
                  onClick={() => handleCheckout("credits")}
                >
                  {p.buyCredits}
                </Button>
              </CardContent>
            </Card>

            {/* FAQ */}
            <div className="max-w-2xl mx-auto">
              <h2 className="text-xl font-semibold text-center mb-6">
                {isCzech ? "Časté otázky" : "Frequently Asked Questions"}
              </h2>
              <Accordion type="single" collapsible className="space-y-2">
                {faqItems.map((item, i) => (
                  <AccordionItem key={i} value={`faq-${i}`} className="border border-border/50 rounded-lg px-4">
                    <AccordionTrigger className="text-sm font-medium">{item.q}</AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">{item.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
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
                      <Label className="text-sm mb-1 block">{p.recipientEmail}</Label>
                      <Input
                        type="email"
                        placeholder="jan@example.cz"
                        value={giftForm.recipientEmail}
                        onChange={e => setGiftForm(f => ({ ...f, recipientEmail: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label className="text-sm mb-1 block">{p.recipientName}</Label>
                      <Input
                        placeholder={isCzech ? "Jméno příjemce" : "Recipient name"}
                        value={giftForm.recipientName}
                        onChange={e => setGiftForm(f => ({ ...f, recipientName: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label className="text-sm mb-1 block">{p.senderName}</Label>
                      <Input
                        placeholder={isCzech ? "Vaše jméno" : "Your name"}
                        value={giftForm.senderName}
                        onChange={e => setGiftForm(f => ({ ...f, senderName: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm mb-1 block">{p.personalMessage}</Label>
                    <Textarea
                      placeholder={isCzech ? "Napište osobní zprávu..." : "Write a personal message..."}
                      value={giftForm.personalMessage}
                      onChange={e => setGiftForm(f => ({ ...f, personalMessage: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <Button
                      variant="outline"
                      className="border-pink-500/50 text-pink-300 hover:bg-pink-500/10"
                      disabled={createCheckout.isPending}
                      onClick={() => handleCheckout("gift_monthly")}
                    >
                      <Gift className="w-4 h-4 mr-2" />
                      {p.giftMonthly}
                      <span className="ml-auto text-xs opacity-70">{isCzech ? "88 Kč" : "€3.49"}</span>
                    </Button>
                    <Button
                      className="bg-pink-600 hover:bg-pink-700 text-white"
                      disabled={createCheckout.isPending}
                      onClick={() => handleCheckout("gift_annual")}
                    >
                      <Gift className="w-4 h-4 mr-2" />
                      {p.giftAnnual}
                      <span className="ml-auto text-xs opacity-70">{isCzech ? "888 Kč" : "€35"}</span>
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
                        {isCzech ? "Zadejte kód poukazu pro aktivaci Premium" : "Enter your voucher code to activate Premium"}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm mb-1 block">{p.voucherCode}</Label>
                    <Input
                      placeholder="HD-XXXX-XXXX-XXXX-XXXX"
                      value={voucherCode}
                      onChange={e => setVoucherCode(e.target.value.toUpperCase())}
                      className="font-mono tracking-wider"
                    />
                  </div>
                  <Button
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                    disabled={redeemVoucher.isPending || !voucherCode.trim()}
                    onClick={handleRedeem}
                  >
                    {redeemVoucher.isPending
                      ? (isCzech ? "Uplatňuji..." : "Redeeming...")
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

        {/* Test card info */}
        <div className="mt-12 text-center">
          <p className="text-xs text-muted-foreground">
            {isCzech
              ? "Testovací platba: karta 4242 4242 4242 4242 · libovolné datum a CVC"
              : "Test payment: card 4242 4242 4242 4242 · any expiry and CVC"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {isCzech
              ? "Platby jsou zpracovávány bezpečně přes Stripe"
              : "Payments are processed securely via Stripe"}
            {" · "}
            <Lock className="w-3 h-3 inline" />
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
