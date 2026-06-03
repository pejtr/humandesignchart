import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, Send, User, Bot, LogIn, Loader2, ChevronDown,
  Zap, Star, Compass, Moon, Sun, Activity, Circle, Crown,
  RotateCcw, MessageCirclePlus, MessageCircle, ChevronRight,
} from "lucide-react";
import { Streamdown } from "streamdown";
import { Link } from "wouter";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

// Ambient floating orb component
function AmbientOrbs() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Large slow orbs */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full opacity-[0.06]"
        style={{
          background: "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)",
          top: "-10%",
          left: "-10%",
        }}
        animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full opacity-[0.05]"
        style={{
          background: "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)",
          bottom: "-5%",
          right: "-5%",
        }}
        animate={{ x: [0, -50, 0], y: [0, -40, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 5 }}
      />
      <motion.div
        className="absolute w-[300px] h-[300px] rounded-full opacity-[0.04]"
        style={{
          background: "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)",
          top: "40%",
          right: "20%",
        }}
        animate={{ x: [0, 30, -20, 0], y: [0, -30, 20, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 10 }}
      />
      {/* Subtle star particles */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-primary/20"
          style={{
            left: `${10 + (i * 7.5)}%`,
            top: `${15 + (i % 4) * 20}%`,
          }}
          animate={{ opacity: [0.1, 0.5, 0.1], scale: [0.8, 1.2, 0.8] }}
          transition={{
            duration: 3 + (i % 3),
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.4,
          }}
        />
      ))}
      {/* Mandala-like ring */}
      <motion.div
        className="absolute w-[800px] h-[800px] rounded-full border border-primary/5"
        style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full border border-primary/4"
        style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
        animate={{ rotate: -360 }}
        transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}

// Profile panel component
function ProfilePanel({ locale }: { locale: string }) {
  const isEn = locale === 'en';
  const { data: charts, isLoading } = trpc.chart.list.useQuery();

  const primaryChart = useMemo(() => {
    if (!charts?.length) return null;
    // Use the first chart (most recently created, or "self" chart)
    return charts[0];
  }, [charts]);

  const chartData = primaryChart?.chartData as any;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-12 rounded-lg bg-muted/50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!primaryChart || !chartData) {
    return (
      <div className="text-center py-6">
        <Compass className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground mb-4">
          {isEn ? "No chart yet" : "Zatím žádná mapa"}
        </p>
        <Link href={`/${locale}/calculate`}>
          <Button size="sm" variant="outline" className="w-full text-xs">
            {isEn ? "Calculate my chart" : "Vypočítat mou mapu"}
          </Button>
        </Link>
      </div>
    );
  }

  const TYPE_COLORS: Record<string, string> = {
    Generator: "text-emerald-500",
    "Manifesting Generator": "text-teal-500",
    Projector: "text-blue-500",
    Manifestor: "text-violet-500",
    Reflector: "text-amber-500",
  };

  const typeColor = TYPE_COLORS[chartData.type] || "text-primary";

  const definedCenters = (chartData.centers as any[] || [])
    .filter((c: any) => c.defined)
    .map((c: any) => c.name);

  return (
    <div className="space-y-3">
      {/* Name + Type */}
      <div className="text-center pb-3 border-b border-border/40">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
          <Star className="w-6 h-6 text-primary" />
        </div>
        <p className="font-serif font-semibold text-sm leading-tight">{primaryChart.name}</p>
        <p className={`text-xs font-medium mt-0.5 ${typeColor}`}>{chartData.type}</p>
      </div>

      {/* Key data rows */}
      <div className="space-y-2">
        <ProfileRow
          icon={<Zap className="w-3.5 h-3.5" />}
          label={isEn ? "Strategy" : "Strategie"}
          value={chartData.strategy}
        />
        <ProfileRow
          icon={<Moon className="w-3.5 h-3.5" />}
          label={isEn ? "Authority" : "Autorita"}
          value={chartData.authority}
        />
        <ProfileRow
          icon={<Sun className="w-3.5 h-3.5" />}
          label={isEn ? "Profile" : "Profil"}
          value={`${chartData.profile}${chartData.profileName ? ` — ${chartData.profileName}` : ''}`}
        />
        <ProfileRow
          icon={<Activity className="w-3.5 h-3.5" />}
          label={isEn ? "Definition" : "Definice"}
          value={chartData.definition}
        />
        {chartData.incarnationCross?.name && (
          <ProfileRow
            icon={<Compass className="w-3.5 h-3.5" />}
            label={isEn ? "Cross" : "Kříž"}
            value={chartData.incarnationCross.name}
            small
          />
        )}
      </div>

      {/* Defined centers */}
      {definedCenters.length > 0 && (
        <div className="pt-2 border-t border-border/40">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
            {isEn ? "Defined Centers" : "Definovaná centra"}
          </p>
          <div className="flex flex-wrap gap-1">
            {definedCenters.map((c: string) => (
              <span key={c} className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Channels count */}
      {chartData.channels?.length > 0 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
          <span className="flex items-center gap-1">
            <Circle className="w-3 h-3" />
            {isEn ? "Channels" : "Dráhy"}
          </span>
          <span className="font-medium text-foreground">{chartData.channels.length}</span>
        </div>
      )}

      {/* Link to full chart */}
      <Link href={`/${locale}/chart/${primaryChart.id}`}>
        <Button size="sm" variant="outline" className="w-full text-xs mt-1">
          {isEn ? "View full chart" : "Zobrazit celou mapu"}
        </Button>
      </Link>
    </div>
  );
}

function ProfileRow({
  icon, label, value, small = false
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  small?: boolean;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-primary/60 mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider leading-none mb-0.5">{label}</p>
        <p className={`font-medium leading-tight ${small ? 'text-[11px]' : 'text-xs'} text-foreground/90`}>{value}</p>
      </div>
    </div>
  );
}

export default function AiGuide() {
  const { isAuthenticated } = useAuth();
  const { locale, localePath } = useLanguage();
  const isEn = locale === 'en';

  useEffect(() => {
    const title = isEn
      ? 'AI Human Design Guide — Chat with Your Personal HD Assistant'
      : 'AI Průvodce Human Design — Chat s Vaším Osobním HD Asistentem';
    const description = isEn
      ? 'Chat with your personal AI Human Design guide. Ask questions about your type, strategy, authority, profile, and get instant personalized answers based on your unique chart.'
      : 'Chatujte s vaším osobním AI průvodcem Human Design. Ptejte se na váš typ, strategii, autoritu, profil a získejte okamžité personalizované odpovědi na základě vaší jedinečné mapy.';
    const pageUrl = isEn
      ? 'https://humandesignchart.app/en/ai-guide'
      : 'https://humandesignmapa.cz/cs/ai-guide';
    const ogImage = '/manus-storage/og-ai-guide_b44c2f20.webp';

    document.title = title;

    // Helper to upsert a meta tag
    const setMeta = (selector: string, attr: string, value: string) => {
      let el = document.querySelector(selector);
      if (el) {
        el.setAttribute(attr, value);
      } else {
        el = document.createElement('meta');
        const parts = selector.match(/\[([^=]+)=["']([^"']+)["']\]/);
        if (parts) el.setAttribute(parts[1], parts[2]);
        el.setAttribute(attr, value);
        el.setAttribute('data-page-meta', 'ai-guide');
        document.head.appendChild(el);
      }
    };

    setMeta('meta[name="description"]', 'content', description);
    setMeta('meta[property="og:title"]', 'content', title);
    setMeta('meta[property="og:description"]', 'content', description);
    setMeta('meta[property="og:type"]', 'content', 'website');
    setMeta('meta[property="og:url"]', 'content', pageUrl);
    setMeta('meta[property="og:image"]', 'content', ogImage);
    setMeta('meta[property="og:image:width"]', 'content', '1200');
    setMeta('meta[property="og:image:height"]', 'content', '630');
    setMeta('meta[property="og:locale"]', 'content', isEn ? 'en_US' : 'cs_CZ');
    setMeta('meta[name="twitter:card"]', 'content', 'summary_large_image');
    setMeta('meta[name="twitter:title"]', 'content', title);
    setMeta('meta[name="twitter:description"]', 'content', description);
    setMeta('meta[name="twitter:image"]', 'content', ogImage);

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.setAttribute('href', pageUrl);
    } else {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      canonical.setAttribute('href', pageUrl);
      canonical.setAttribute('data-page-meta', 'ai-guide');
      document.head.appendChild(canonical);
    }

    // JSON-LD structured data
    let jsonLd = document.querySelector('script[data-page-jsonld="ai-guide"]');
    if (!jsonLd) {
      jsonLd = document.createElement('script');
      jsonLd.setAttribute('type', 'application/ld+json');
      jsonLd.setAttribute('data-page-jsonld', 'ai-guide');
      document.head.appendChild(jsonLd);
    }
    jsonLd.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: title,
      description,
      url: pageUrl,
      applicationCategory: 'LifestyleApplication',
      inLanguage: isEn ? 'en-US' : 'cs-CZ',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      provider: {
        '@type': 'Organization',
        name: 'Human Design Chart',
        url: isEn ? 'https://humandesignchart.app' : 'https://humandesignmapa.cz',
      },
    });

    return () => {
      document.title = isEn ? 'Free Human Design Chart Calculator & AI Reading' : 'Human Design Mapa Zdarma — Kalkulačka a AI Výklad';
      document.querySelectorAll('[data-page-meta="ai-guide"]').forEach(el => el.remove());
      document.querySelector('script[data-page-jsonld="ai-guide"]')?.remove();
    };
  }, [isEn]);

  const SUGGESTED_QUESTIONS = isEn ? [
    "What is my daily transit today?",
    "What is Human Design and how does it work?",
    "What's the difference between a Generator and a Manifestor?",
    "What does an open Sacral Center mean?",
    "How does emotional authority work?",
    "What is an incarnation cross?",
    "Explain profile 4/6",
    "How do transits work in Human Design?",
    "What are Variables in Human Design?",
    "How do I find my correct diet according to HD?",
    "What is the Not-Self theme?",
  ] : [
    "Jaký je můj denní tranzit?",
    "Co je to denní tranzit?",
    "Co je to Human Design a jak funguje?",
    "Jaký je rozdíl mezi Generátorem a Manifestorem?",
    "Co znamená mít otevřené Sakrální centrum?",
    "Jak funguje emocionální autorita?",
    "Co je to inkarnační kříž?",
    "Vysvětli mi profil 4/6",
    "Jak fungují tranzity v Human Designu?",
    "Co jsou to proměnné (Variables)?",
    "Jak najdu svou správnou stravu podle HD?",
    "Co je to Ne-Já téma?",
  ];

  const welcomeMessage = isEn
    ? "I'm your AI Human Design guide. Ask me anything about the Human Design system — types, centers, gates, channels, authorities, profiles, transits, and much more. How can I help you?"
    : "Jsem váš AI průvodce Human Designem. Můžete se mě zeptat na cokoliv o systému Human Design — typy, centra, brány, dráhy, autority, profily, tranzity a mnoho dalšího. Jak vám mohu pomoci?";

  // Subscription status for upgrade CTA
  const { data: subStatus } = trpc.subscription.status.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const isPremium = subStatus?.isPremium ?? false;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: welcomeMessage,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);

  // --- Chat persistence & threads ---
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const MAX_THREADS = 3;

  // Derived values for upgrade CTA
  const totalMessages = messages.filter(m => m.role === "user").length;
  const showUpgradeBanner = !isPremium && totalMessages >= 3 && isAuthenticated;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const askMutation = trpc.ai.askGuide.useMutation();
  const getOrCreateConv = trpc.chat.getOrCreateConversation.useMutation();
  const createConvMutation = trpc.chat.createConversation.useMutation();
  const saveMessagesMutation = trpc.chat.saveMessages.useMutation();
  const utils = trpc.useUtils();

  // List of conversations (threads)
  const { data: conversations, refetch: refetchConversations } = trpc.chat.listConversations.useQuery(
    { locale: locale as "cs" | "en" },
    { enabled: isAuthenticated }
  );

  // Load history for current conversation
  const { data: historyData } = trpc.chat.getHistory.useQuery(
    { conversationId: conversationId ?? 0 },
    { enabled: isAuthenticated && conversationId !== null && !historyLoaded }
  );

  // On mount: get or create conversation and load history
  useEffect(() => {
    if (!isAuthenticated) return;
    getOrCreateConv.mutateAsync({ locale: locale as "cs" | "en" }).then(conv => {
      setConversationId(conv.id);
    }).catch(() => {});
  }, [isAuthenticated, locale]);

  // When history loads, populate messages
  useEffect(() => {
    if (!historyData || historyLoaded) return;
    if (historyData.length > 0) {
      const loaded: Message[] = historyData.map(m => ({
        id: String(m.id),
        role: m.role as "user" | "assistant",
        content: m.content,
        timestamp: new Date(m.createdAt),
      }));
      setMessages([
        { id: "welcome", role: "assistant", content: welcomeMessage, timestamp: new Date() },
        ...loaded,
      ]);
    }
    setHistoryLoaded(true);
  }, [historyData, historyLoaded, welcomeMessage]);

  // Switch to a different thread
  const switchThread = useCallback(async (convId: number) => {
    if (convId === conversationId) return;
    setConversationId(convId);
    setHistoryLoaded(false);
    setMessages([{ id: "welcome", role: "assistant", content: welcomeMessage, timestamp: new Date() }]);
    utils.chat.getHistory.invalidate({ conversationId: convId });
  }, [conversationId, welcomeMessage, utils]);

  // Start a new thread (max 3)
  const startNewThread = useCallback(async () => {
    if ((conversations?.length ?? 0) >= MAX_THREADS) return;
    try {
      const conv = await createConvMutation.mutateAsync({ locale: locale as "cs" | "en" });
      setConversationId(conv.id);
      setHistoryLoaded(true);
      setMessages([{ id: "welcome", role: "assistant", content: welcomeMessage, timestamp: new Date() }]);
      refetchConversations();
    } catch {}
  }, [conversations, locale, welcomeMessage, createConvMutation, refetchConversations]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text?: string) => {
    const question = text || input.trim();
    if (!question || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: question,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const history = messages
        .filter(m => m.id !== "welcome")
        .slice(-10)
        .map(m => ({ role: m.role as "user" | "assistant", content: m.content }));

      const result = await askMutation.mutateAsync({
        question,
        history,
        locale,
      });

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: result.content,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMsg]);

      // Persist to DB if authenticated
      if (isAuthenticated && conversationId) {
        saveMessagesMutation.mutate({
          conversationId,
          userMessage: question,
          assistantMessage: result.content,
          locale: locale as "cs" | "en",
        });
        refetchConversations();
      }
    } catch {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: isEn
          ? "I'm sorry, an error occurred while processing your question. Please try again."
          : "Omlouvám se, došlo k chybě při zpracování vaší otázky. Zkuste to prosím znovu.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <AmbientOrbs />
        <Navbar />
        <main className="pt-24 pb-16 relative z-10">
          <div className="container max-w-2xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/10">
                <Bot className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-3xl font-serif font-bold mb-4">
                {isEn ? "AI Human Design Guide" : "AI průvodce Human Designem"}
              </h1>
              <p className="text-muted-foreground mb-8">
                {isEn
                  ? "Sign in to access the AI guide that will answer any questions about Human Design."
                  : "Přihlaste se pro přístup k AI průvodci, který vám zodpoví jakékoliv otázky o Human Designu."}
              </p>
              <a href={getLoginUrl()}>
                <Button size="lg" className="gap-2">
                  <LogIn className="w-5 h-5" />
                  {isEn ? "Sign in" : "Přihlásit se"}
                </Button>
              </a>
            </motion.div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      <AmbientOrbs />
      <Navbar />

      <main className="flex-1 pt-20 pb-20 md:pb-4 flex flex-col relative z-10">
        <div className="container max-w-6xl flex-1 flex flex-col">
          {/* Layout: profile panel left + chat right */}
          <div className="flex-1 flex gap-6 py-4">

            {/* Left: Profile Panel */}
            <aside className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-24">
                <Card className="border-border/40 bg-background/60 backdrop-blur-sm shadow-lg">
                  <CardContent className="p-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-primary" />
                      {isEn ? "My Profile" : "Můj profil"}
                    </h3>
                    <ProfilePanel locale={locale} />
                  </CardContent>
                </Card>

                {/* Quick tips */}
                <Card className="border-border/40 bg-background/60 backdrop-blur-sm mt-3">
                  <CardContent className="p-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      {isEn ? "Tips" : "Tipy"}
                    </h3>
                    <ul className="space-y-2 text-xs text-muted-foreground">
                      <li>• {isEn ? "Ask about your specific type" : "Ptejte se na svůj konkrétní typ"}</li>
                      <li>• {isEn ? "Mention your profile for personal insights" : "Zmiňte svůj profil pro osobní výklad"}</li>
                      <li>• {isEn ? "Ask about specific gates or channels" : "Ptejte se na konkrétní brány nebo dráhy"}</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </aside>

            {/* Right: Chat */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Header */}
              <div className="border-b border-border/50 mb-4 bg-background/60 backdrop-blur-sm rounded-t-xl">
                <div className="flex items-center gap-3 py-3 px-4">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Bot className="w-4.5 h-4.5 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-sm font-serif font-semibold">
                      {isEn ? "AI Human Design Guide" : "AI průvodce Human Designem"}
                    </h1>
                    <p className="text-xs text-muted-foreground">
                      {isEn ? "Ask anything about Human Design" : "Zeptejte se na cokoliv o Human Designu"}
                    </p>
                  </div>
                  <Badge variant="outline" className="ml-auto text-xs border-primary/30 text-primary">
                    <Sparkles className="w-3 h-3 mr-1" />
                    AI
                  </Badge>
                  {/* New thread button */}
                  {isAuthenticated && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 ml-1"
                      onClick={startNewThread}
                      disabled={(conversations?.length ?? 0) >= MAX_THREADS}
                      title={isEn ? `New thread (${conversations?.length ?? 0}/${MAX_THREADS})` : `Nové vlákno (${conversations?.length ?? 0}/${MAX_THREADS})`}
                    >
                      <MessageCirclePlus className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => setIsChatMinimized(v => !v)}
                    title={isChatMinimized ? (isEn ? 'Expand chat' : 'Rozbalit chat') : (isEn ? 'Minimize chat' : 'Minimalizovat chat')}
                  >
                    {isChatMinimized ? <ChevronDown className="w-4 h-4 rotate-180" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </div>
                {/* Thread tabs — shown when more than 1 conversation */}
                {isAuthenticated && conversations && conversations.length > 1 && (
                  <div className="flex gap-1 px-4 pb-2 overflow-x-auto">
                    {conversations.map((conv, idx) => (
                      <button
                        key={conv.id}
                        onClick={() => switchThread(conv.id)}
                        className={`text-[11px] px-3 py-1 rounded-full border transition-all whitespace-nowrap ${
                          conv.id === conversationId
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'border-border/50 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                        }`}
                      >
                        <MessageCircle className="w-3 h-3 inline mr-1" />
                        {conv.title || (isEn ? `Thread ${idx + 1}` : `Vlákno ${idx + 1}`)}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Minimizable chat body */}
              {!isChatMinimized && <>
              {/* Messages */}
              <div
                className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1"
                style={{ maxHeight: "calc(100vh - 300px - env(safe-area-inset-bottom, 0px))" }}
              >
                <AnimatePresence>
                  {messages.map(msg => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-primary/10 text-primary border border-primary/20"
                      }`}>
                        {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </div>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-background/80 backdrop-blur-sm border border-border/50 text-foreground shadow-sm"
                      }`}>
                        {msg.role === "assistant" ? (
                          <div className="text-sm prose prose-sm max-w-none [&_p]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mb-1 [&_ul]:mb-2 [&_li]:mb-0.5">
                            <Streamdown>{msg.content}</Streamdown>
                          </div>
                        ) : (
                          <p className="text-sm">{msg.content}</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                    <div className="bg-background/80 backdrop-blur-sm border border-border/50 rounded-2xl px-4 py-3 shadow-sm">
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Upgrade CTA banner — shown after 3 messages for free users */}
              {showUpgradeBanner && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="my-3 rounded-xl border border-purple-500/30 bg-gradient-to-r from-purple-950/40 to-violet-950/40 p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
                    <Crown className="w-4.5 h-4.5 text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-purple-200">
                      {isEn ? "Enjoying the AI Guide? ✨" : "Líbí se vám AI průvodce? ✨"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isEn
                        ? `You've sent ${totalMessages} messages. Upgrade to Premium for unlimited conversations, AI chart readings, and PDF reports.`
                        : `Odeslali jste ${totalMessages} zpráv. Upgradujte na Premium pro neomezené konverzace, AI výklady map a PDF reporty.`}
                    </p>
                  </div>
                  <Link href={localePath("/pricing")}>
                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white shrink-0 gap-1.5">
                      <Zap className="w-3.5 h-3.5" />
                      {isEn ? "Upgrade" : "Upgradovat"}
                    </Button>
                  </Link>
                </motion.div>
              )}

              {/* Input + Quick prompts */}
              <div className="border-t border-border/50 pt-3">
                {/* Always-visible quick-prompt chips */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {SUGGESTED_QUESTIONS.slice(0, 5).map((q, i) => (
                    <button
                      key={i}
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleSend(q)}
                      className="text-[11px] px-2.5 py-1 rounded-full border border-primary/25 bg-primary/5 text-primary/80 hover:bg-primary/15 hover:text-primary hover:border-primary/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {q}
                    </button>
                  ))}
                </div>
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex gap-2"
                >
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder={isEn ? "Ask anything about Human Design..." : "Zeptejte se na cokoliv o Human Designu..."}
                    disabled={isLoading}
                    className="flex-1 bg-background/60 backdrop-blur-sm border-border/50"
                  />
                  <Button type="submit" disabled={!input.trim() || isLoading} size="icon">
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </form>
              </div>
              </>}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
