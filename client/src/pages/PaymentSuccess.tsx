import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useMetaPixel } from "@/hooks/useMetaPixel";
import { trackGA4Event } from "@/hooks/useGA4";
import { getRedditClickIdForCapi } from "@/hooks/useRedditPixel";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Crown,
  Sparkles,
  ArrowRight,
  BookOpen,
  Zap,
  Star,
  CheckCircle2,
  Moon,
  Clock3,
  Download,
  Loader2,
  FileText,
} from "lucide-react";
import { Link } from "wouter";
import { readChartDraft } from "@/lib/chartDraft";
import { generateChartPDF } from "@/lib/pdfExport";

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
    | "brainwave_audio"
    | "blueprint"
    | "blueprint_annual_upgrade"
    | null;
  const isBlueprint = plan === "blueprint";

  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const refId =
    searchParams.get("refId") ||
    searchParams.get("id") ||
    searchParams.get("session_id") ||
    (typeof window !== "undefined" ? JSON.parse(sessionStorage.getItem("hd_pending_checkout") || "{}")?.refId : "") ||
    "";

  const urlToken = searchParams.get("token") || "";
  const [tokenInput, setTokenInput] = useState("");
  const [enteredToken, setEnteredToken] = useState("");
  const activeToken =
    urlToken ||
    enteredToken ||
    (typeof window !== "undefined" && refId ? sessionStorage.getItem("hd_download_token_" + refId) || "" : "");

  useEffect(() => {
    if (urlToken && refId && typeof window !== "undefined") {
      sessionStorage.setItem("hd_download_token_" + refId, urlToken);
    }
  }, [urlToken, refId]);

  const contentQuery = trpc.content.getHdContent.useQuery();
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const verifyPaymentQuery = trpc.subscription.verifyPayment.useQuery(
    { refId },
    {
      enabled: Boolean(refId),
      refetchInterval: (query) => (query.state.data?.verified ? false : 2500),
    }
  );

  const orderQuery = trpc.subscription.getOrder.useQuery(
    { token: activeToken, refId: refId || undefined },
    {
      enabled: Boolean(activeToken && activeToken.length >= 16),
      refetchInterval: (query) => (query.state.data?.paymentStatus === "PAID" ? false : 2500),
      retry: false,
    }
  );

  const isEntitled = Boolean(orderQuery.data?.paymentStatus === "PAID");

  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoverySent, setRecoverySent] = useState(false);
  const [aiReadingPrompt, setAiReadingPrompt] = useState("");
  const [aiReadingResult, setAiReadingResult] = useState<string | null>(null);

  const requestRecoveryMutation = trpc.subscription.requestAccessRecovery.useMutation({
    onSuccess: () => setRecoverySent(true),
  });

  const redeemAiMutation = trpc.subscription.redeemAiReading.useMutation({
    onSuccess: (data) => {
      setAiReadingResult(data.reading);
      orderQuery.refetch();
    },
  });

  const recordDownloadMutation = trpc.subscription.recordDownload.useMutation();

  const chartDraft = typeof window !== "undefined" ? readChartDraft() : null;
  const parsedChart = chartDraft?.chart ? JSON.parse(chartDraft.chart) : null;
  const parsedMeta = chartDraft?.meta ? JSON.parse(chartDraft.meta) : null;

  // STRICT ENTITLEMENT GATE: activeChart is ONLY populated when the order is authoritatively PAID
  const activeChart = isEntitled ? (orderQuery.data?.chartData || parsedChart) : null;

  const handleDownloadBlueprint = async () => {
    if (!isEntitled || !activeChart || !activeToken) {
      navigate(localePath("/calculate"));
      return;
    }
    setGeneratingPdf(true);
    try {
      const customerName =
        parsedMeta?.name ||
        orderQuery.data?.customerName ||
        (isEn ? "Personal Blueprint" : "Osobní Blueprint");
      await generateChartPDF(activeChart, customerName, contentQuery.data, undefined, isEn ? "en" : "cs");
      if (activeToken && activeToken.length >= 16) {
        recordDownloadMutation.mutate({ token: activeToken });
      }
    } catch (err) {
      console.error("PDF generation error:", err);
    } finally {
      setGeneratingPdf(false);
    }
  };

  const createCheckout = trpc.subscription.createCheckout.useMutation({
    onSuccess: data => data.url && window.location.assign(data.url),
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
      redditClickId: getRedditClickIdForCapi(),
    });
  };

  // Refetch subscription status after successful payment
  const utils = trpc.useUtils();
  useEffect(() => {
    utils.subscription.status.invalidate();
    document.title = isEn
      ? "✨ Payment Successful — Welcome to Premium!"
      : "✨ Platba úspěšná — Vítejte v Premium!";

    if (verifyPaymentQuery.data?.verified && refId) {
      localStorage.setItem("hd_blueprint_access_" + refId, "true");
      localStorage.setItem("hd_active_blueprint_ref", refId);

      const trackingKey = `hd-purchase-tracked:${refId}`;
      if (
        sessionStorage.getItem(trackingKey) !== "true" &&
        localStorage.getItem(trackingKey) !== "true"
      ) {
        const val = (verifyPaymentQuery.data.amountMinor || (isEn ? 1590 : 29000)) / 100;
        const cur = verifyPaymentQuery.data.currency || (isEn ? "EUR" : "CZK");
        meta.purchase(val, {
          content_name: "Personal Human Design Blueprint",
          content_category: "report",
          content_ids: ["blueprint"],
          content_type: "product",
          currency: cur,
        });
        trackGA4Event("purchase", {
          transaction_id: refId,
          value: val,
          currency: cur,
          items: [{ item_name: "Personal Human Design Blueprint", price: val, quantity: 1 }],
        });
        trackGA4Event("Purchase", {
          transaction_id: refId,
          value: val,
          currency: cur,
          items: [{ item_name: "Personal Human Design Blueprint", price: val, quantity: 1 }],
        });
        sessionStorage.setItem(trackingKey, "true");
        localStorage.setItem(trackingKey, "true");
      }
    }
  }, [isEn, plan, verifyPaymentQuery.data?.verified, refId]);

  const nextSteps = isEn
    ? [
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
      ]
    : [
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
            <img
              src="/images/brand/veleknezka-master-v1.png"
              alt=""
              className="h-full w-full object-cover object-top"
            />
            <span className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full border border-white/60 bg-violet-700 text-white shadow-lg">
              {isBlueprint ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Crown className="h-4 w-4" />
              )}
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Badge className={`mb-4 px-4 py-1.5 text-sm ${isEntitled ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-amber-500/20 text-amber-400 border-amber-500/30"}`}>
              {isEntitled ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-1.5 inline" />
                  {isEn ? `Access verified · ${refId || activeToken.slice(0, 8)}` : `Přístup ověřen · ${refId || activeToken.slice(0, 8)}`}
                </>
              ) : activeToken ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 inline animate-spin" />
                  {isEn ? "Verifying payment status…" : "Ověřujeme stav platby…"}
                </>
              ) : (
                <>
                  <Clock3 className="w-4 h-4 mr-1.5 inline" />
                  {isEn ? "Verification required" : "Vyžadováno ověření"}
                </>
              )}
            </Badge>

            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-violet-300 to-indigo-400 bg-clip-text text-transparent">
              {isBlueprint
                ? isEntitled
                  ? isEn
                    ? "Your Blueprint is unlocked"
                    : "Váš Blueprint je odemčený"
                  : isEn
                    ? "Blueprint Access Verification"
                    : "Ověření přístupu k Blueprintu"
                : isEn
                  ? "Welcome to Premium! 🎉"
                  : "Vítejte v Premium! 🎉"}
            </h1>

            <p className="text-lg text-muted-foreground mb-6 max-w-xl mx-auto">
              {isBlueprint
                ? isEntitled
                  ? isEn
                    ? "Your personalized Blueprint with complete 7-day integration workbook has been prepared. Download your PDF below."
                    : "Váš osobní Blueprint s kompletním 7denním integračním plánem je připraven. Stáhněte si své PDF níže."
                  : isEn
                    ? "A confirmed paid order is required to access your Personal Blueprint and generate the PDF report."
                    : "Pro stažení osobního Blueprintu a vygenerování PDF reportu je vyžadována potvrzená zaplacená objednávka."
                : isEn
                  ? "Your Premium access is now active. You can use all AI readings, PDF reports, and premium tools."
                  : "Váš Premium přístup je nyní aktivní. Můžete využívat všechny AI výklady, PDF reporty a prémiové nástroje."}
            </p>

            {isBlueprint && (
              <Card className={`my-6 border-2 p-6 text-center shadow-xl ${isEntitled ? "border-emerald-500/40 bg-emerald-950/20" : "border-amber-500/40 bg-amber-950/20"}`}>
                <CardContent className="space-y-4 p-0">
                  <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${isEntitled ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>
                    <FileText className="h-7 w-7" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-serif font-bold text-foreground">
                      {isEntitled
                        ? isEn ? "Download Your Blueprint PDF" : "Stáhnout Váš osobní Blueprint"
                        : isEn ? "Unlock Your Blueprint" : "Odemknout Váš osobní Blueprint"}
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground max-w-md mx-auto">
                      {isEntitled
                        ? isEn
                          ? "Personalized analysis of centers, gates, channels + the full 7-day integration workbook."
                          : "Osobní rozbor center, bran, drah + kompletní 7denní plán integrace do praxe."
                        : isEn
                          ? "Enter your secure access token from your confirmation email or request a recovery link."
                          : "Zadejte svůj bezpečnostní přístupový kód z potvrzovacího e-mailu nebo si nechte poslat odkaz."}
                    </p>
                  </div>
                  {isEntitled && activeChart ? (
                    <div className="space-y-6 pt-2">
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Button
                          size="lg"
                          onClick={handleDownloadBlueprint}
                          disabled={generatingPdf}
                          className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-6 px-8 rounded-xl shadow-md cursor-pointer"
                        >
                          {generatingPdf ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              {isEn ? "Generating PDF…" : "Generuji PDF…"}
                            </>
                          ) : (
                            <>
                              <Download className="mr-2 h-5 w-5" />
                              {isEn ? "Download Personal Blueprint (PDF)" : "Stáhnout osobní Blueprint (PDF)"}
                            </>
                          )}
                        </Button>
                        <Link href={localePath("/calculate")}>
                          <Button variant="outline" size="lg" className="w-full sm:w-auto py-6 rounded-xl">
                            {isEn ? "Open Interactive Chart" : "Otevřít interaktivní mapu"}
                          </Button>
                        </Link>
                      </div>

                      {/* 5 AI Readings Redemption Widget */}
                      <div className="mt-6 border-t border-emerald-500/20 pt-6 text-left max-w-lg mx-auto">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-semibold flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-amber-400" />
                            {isEn ? "Included AI Readings" : "Zahrnuté AI výklady"}
                          </h3>
                          <Badge variant="outline" className="border-amber-400/40 text-amber-300">
                            {orderQuery.data?.aiReadingCredits ?? 5} / 5 {isEn ? "credits left" : "kreditů zbývá"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">
                          {isEn
                            ? "Ask your personalized AI guide a question about your centers, authority, or life purpose."
                            : "Položte svému osobnímu AI průvodci otázku k vašim centrům, autoritě nebo životnímu poslání."}
                        </p>
                        {(orderQuery.data?.aiReadingCredits ?? 5) > 0 ? (
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <Input
                                type="text"
                                placeholder={isEn ? "What does my emotional authority mean in relationships?" : "Co znamená moje emoční autorita ve vztazích?"}
                                value={aiReadingPrompt}
                                onChange={(e) => setAiReadingPrompt(e.target.value)}
                                className="text-xs"
                              />
                              <Button
                                size="sm"
                                onClick={() => redeemAiMutation.mutate({ token: activeToken, prompt: aiReadingPrompt })}
                                disabled={redeemAiMutation.isPending}
                                className="whitespace-nowrap"
                              >
                                {redeemAiMutation.isPending ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : isEn ? (
                                  "Ask AI"
                                ) : (
                                  "Získat výklad"
                                )}
                              </Button>
                            </div>
                            {redeemAiMutation.isError && (
                              <p className="text-xs text-red-400">{redeemAiMutation.error.message}</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-amber-400 font-medium">
                            {isEn
                              ? "All 5 included AI readings have been used. Upgrade to Annual Premium for unlimited access."
                              : "Všech 5 zahrnutých AI výkladů bylo vyčerpáno. Přejděte na Roční Premium pro neomezený přístup."}
                          </p>
                        )}
                        {aiReadingResult && (
                          <div className="mt-3 p-3 rounded-lg bg-background/80 border border-violet-500/30 text-xs text-foreground">
                            <div className="font-semibold text-violet-300 mb-1">
                              {isEn ? "AI Guide Interpretation:" : "Výklad AI průvodce:"}
                            </div>
                            {aiReadingResult}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="pt-2 max-w-sm mx-auto space-y-4">
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">
                          {isEn
                            ? "Enter the secure access token from your confirmation email:"
                            : "Zadejte bezpečnostní přístupový kód z potvrzovacího e-mailu:"}
                        </p>
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            placeholder="tok_..."
                            value={tokenInput}
                            onChange={(e) => setTokenInput(e.target.value)}
                            className="text-xs"
                          />
                          <Button
                            size="sm"
                            onClick={() => setEnteredToken(tokenInput.trim())}
                            disabled={tokenInput.trim().length < 16 || orderQuery.isFetching}
                          >
                            {orderQuery.isFetching ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : isEn ? (
                              "Unlock"
                            ) : (
                              "Odemknout"
                            )}
                          </Button>
                        </div>
                        {orderQuery.isError && (
                          <p className="text-xs text-red-500">{orderQuery.error.message}</p>
                        )}
                      </div>

                      <div className="border-t border-border/40 pt-3 space-y-2">
                        <p className="text-xs text-muted-foreground">
                          {isEn
                            ? "Lost your access link or viewing on another browser?"
                            : "Nemáte přístupový odkaz nebo jste v jiném prohlížeči?"}
                        </p>
                        <div className="flex gap-2">
                          <Input
                            type="email"
                            placeholder={isEn ? "buyer@example.com" : "vas@email.cz"}
                            value={recoveryEmail}
                            onChange={(e) => setRecoveryEmail(e.target.value)}
                            className="text-xs"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => requestRecoveryMutation.mutate({ email: recoveryEmail.trim(), refId: refId || undefined, locale })}
                            disabled={!recoveryEmail.includes("@") || requestRecoveryMutation.isPending}
                          >
                            {requestRecoveryMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : isEn ? (
                              "Send Link"
                            ) : (
                              "Zaslat odkaz"
                            )}
                          </Button>
                        </div>
                        {recoverySent && (
                          <p className="text-xs text-green-400">
                            {isEn
                              ? "If a paid order was found, a recovery link was sent to your email."
                              : "Pokud byla nalezena zaplacená objednávka, odkaz byl odeslán na váš e-mail."}
                          </p>
                        )}
                      </div>

                      <Link href={localePath("/calculate")}>
                        <Button variant="ghost" size="sm" className="w-full text-xs">
                          {isEn ? "Calculate New Chart / Order Blueprint" : "Vypočítat mapu / Objednat Blueprint"}
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </motion.div>

          {/* What's unlocked */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10"
          >
            {(isBlueprint
              ? [
                  {
                    icon: "📄",
                    label: isEn ? "Premium PDF report" : "Prémiový PDF report",
                  },
                  {
                    icon: "✨",
                    label: isEn
                      ? "5 follow-up AI readings"
                      : "5 navazujících AI výkladů",
                  },
                  {
                    icon: "🌙",
                    label: isEn
                      ? "Moon and current energy"
                      : "Luna a energie období",
                  },
                ]
              : [
                  {
                    icon: "∞",
                    label: isEn
                      ? "Generous AI access"
                      : "Velkorysý přístup k AI výkladům",
                  },
                  {
                    icon: "📄",
                    label: isEn ? "PDF chart reports" : "PDF reporty mapy",
                  },
                  {
                    icon: "🛠️",
                    label: isEn
                      ? "All premium tools"
                      : "Všechny prémiové nástroje",
                  },
                ]
            ).map((item, i) => (
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
                    {isEn
                      ? "Private 48-hour offer"
                      : "Soukromá nabídka na 48 hodin"}
                  </div>
                  <h2 className="font-serif text-2xl font-semibold">
                    {isEn
                      ? "Turn your Blueprint into Annual Premium"
                      : "Převeďte Blueprint na roční Premium"}
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
              {isEn
                ? "What would you like to do next?"
                : "Co chcete dělat jako první?"}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {nextSteps.map((step, i) => (
                <Link key={i} href={step.href}>
                  <Card className="border-border/50 hover:border-primary/40 transition-all cursor-pointer group hover:shadow-md hover:-translate-y-0.5">
                    <CardContent className="p-5 text-left">
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        {step.icon}
                      </div>
                      <h3 className="font-semibold text-sm mb-1">
                        {step.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-3">
                        {step.desc}
                      </p>
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
