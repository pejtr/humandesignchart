import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { AIChatBox, Message } from "./AIChatBox";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { Moon, X, Maximize2, Minimize2, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { getLoginUrl } from "@/const";

export function FloatingChatGuide() {
  const { isAuthenticated } = useAuth();
  const { locale } = useLanguage();
  const [location] = useLocation();
  const isEn = locale === "en";

  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const welcomeMessage = isEn
    ? "Welcome. I am Marie, your personal Human Design guide. Ask me about your chart, decisions, relationships or current energy."
    : "Vítejte. Jsem Marie, vaše osobní průvodkyně Human Designem. Zeptejte se mě na svou mapu, rozhodování, vztahy nebo dnešní energii.";

  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: welcomeMessage },
  ]);

  const [conversationId, setConversationId] = useState<number | null>(null);
  const [loadedConvId, setLoadedConvId] = useState<number | null>(null);

  const askMutation = trpc.ai.askGuide.useMutation();
  const getOrCreateConv = trpc.chat.getOrCreateConversation.useMutation();
  const saveMessagesMutation = trpc.chat.saveMessages.useMutation();

  const { data: charts } = trpc.chart.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const primaryChartId = charts?.[0]?.id ?? null;

  const { data: historyData } = trpc.chat.getHistory.useQuery(
    { conversationId: conversationId ?? 0 },
    { enabled: isAuthenticated && !!conversationId }
  );

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!isOpen && !conversationId) return; // Don't create DB record until opened
    if (conversationId) return;

    getOrCreateConv
      .mutateAsync({ locale: locale as "cs" | "en", chartId: primaryChartId })
      .then(conv => {
        setConversationId(conv.id);
      })
      .catch(() => {});
  }, [
    isAuthenticated,
    locale,
    primaryChartId,
    isOpen,
    conversationId,
    getOrCreateConv,
  ]);

  useEffect(() => {
    if (!historyData || conversationId === null) return;
    if (conversationId === loadedConvId) return;
    setLoadedConvId(conversationId);

    if (historyData.length > 0) {
      const loaded: Message[] = historyData.map((m: any) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));
      setMessages([{ role: "assistant", content: welcomeMessage }, ...loaded]);
    }
  }, [historyData, conversationId, loadedConvId, welcomeMessage]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMsg: Message = { role: "user", content };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const history = messages
        .filter(m => m.role !== "system" && m.content !== welcomeMessage)
        .slice(-10)
        .map(m => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));

      const result = await askMutation.mutateAsync({
        question: content,
        history,
        locale,
        chartId: primaryChartId ?? undefined,
      });

      const assistantMsg: Message = {
        role: "assistant",
        content: result.content,
      };
      setMessages(prev => [...prev, assistantMsg]);

      if (isAuthenticated && conversationId) {
        saveMessagesMutation.mutate({
          conversationId,
          userMessage: content,
          assistantMessage: result.content,
          locale: locale as "cs" | "en",
        });
      }
    } catch {
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: isEn
            ? "An error occurred. Please try again."
            : "Došlo k chybě. Zkuste to prosím znovu.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (location.includes("/ai-guide")) {
    return null;
  }

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-[4.5rem] right-4 md:bottom-4 md:right-20 z-50 lg:bottom-6 lg:right-24"
          >
            <Button
              onClick={() => setIsOpen(true)}
              aria-label={
                isEn
                  ? "Open ORACULUM"
                  : "Otevřít ORACULUM"
              }
              title={
                isEn ? "ORACULUM — Observatory Intelligence" : "ORACULUM — Observatorní Inteligenci"
              }
              className="group relative w-14 h-14 overflow-visible rounded-full border-2 border-amber-400/80 bg-[#111A2E] p-0 text-white shadow-xl ring-4 ring-amber-500/10 transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.03]"
            >
              <span
                className="absolute -inset-2 -z-10 rounded-full bg-amber-500/20 blur-lg transition-opacity group-hover:bg-amber-400/35"
                aria-hidden="true"
              />
              <div className="h-full w-full rounded-full bg-gradient-to-br from-[#1A1D24] via-[#111A2E] to-[#0A0D14] flex items-center justify-center font-serif text-lg font-bold text-[#C59235]">
                ✦
              </div>
              <span className="pointer-events-none absolute right-full top-1/2 mr-3 hidden -translate-y-1/2 whitespace-nowrap rounded-full border border-amber-300/70 bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-900 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 lg:block">
                {isEn ? "Ask ORACULUM" : "Zeptat se ORACULA"}
              </span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              width: isExpanded ? "90vw" : "360px",
              height: isExpanded ? "85vh" : "550px",
              maxWidth: isExpanded ? "1200px" : "100%",
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
            className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 lg:bottom-10 lg:right-10 z-50 flex flex-col bg-background border border-border shadow-2xl overflow-hidden sm:rounded-2xl w-full h-[100dvh]"
          >
            <div className="flex items-center justify-between p-3 border-b bg-muted/30">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full border border-amber-400/70 bg-[#111A2E] text-[#C59235] flex items-center justify-center font-serif font-bold text-sm shrink-0">
                  ✦
                </div>
                <div>
                  <h3 className="text-sm font-serif font-bold leading-none text-foreground">ORACULUM</h3>
                  <p class="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold mt-0.5">
                    {isEn ? "Observatory Core v3.3" : "Observatorní Inteligenci v3.3"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 hover:bg-muted"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 hover:bg-muted"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {!isAuthenticated ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-card">
                <Sparkles className="w-12 h-12 text-purple-300 mb-4" />
                <p className="text-sm text-muted-foreground mb-4">
                  {isEn
                    ? "Please sign in to chat with Marie."
                    : "Pro rozhovor s Marií se prosím přihlaste."}
                </p>
                <Button onClick={() => (window.location.href = getLoginUrl())}>
                  {isEn ? "Sign in" : "Přihlásit se"}
                </Button>
              </div>
            ) : (
              <AIChatBox
                messages={messages}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                placeholder={isEn ? "Ask Marie..." : "Zeptejte se Marie..."}
                className="min-h-0 flex-1 rounded-none border-none shadow-none"
                height="auto"
                emptyStateMessage={isEn ? "Ask Marie your first question" : "Zeptejte se Marie na první otázku"}
                suggestedPrompts={
                  isEn
                    ? [
                        "What varies in my design?",
                        "Explain my profile",
                        "How does emotional authority work?",
                      ]
                    : [
                        "Jaká je dnes moje energie?",
                        "Vysvětli mi můj profil",
                        "Jak mám použít svou autoritu?",
                      ]
                }
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
