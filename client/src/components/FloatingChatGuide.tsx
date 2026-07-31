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
        ? "Welcome. I am the High Priestess, your personal Human Design guide. Ask me about your chart, decisions, relationships or current energy."
        : "Vítejte. Jsem Velekněžka, vaše osobní průvodkyně Human Designem. Zeptejte se mě na svou mapu, rozhodování, vztahy nebo dnešní energii.";

    const [messages, setMessages] = useState<Message[]>([
        { role: "assistant", content: welcomeMessage }
    ]);

    const [conversationId, setConversationId] = useState<number | null>(null);
    const [loadedConvId, setLoadedConvId] = useState<number | null>(null);

    const askMutation = trpc.ai.askGuide.useMutation();
    const getOrCreateConv = trpc.chat.getOrCreateConversation.useMutation();
    const saveMessagesMutation = trpc.chat.saveMessages.useMutation();

    const { data: charts } = trpc.chart.list.useQuery(undefined, { enabled: isAuthenticated });
    const primaryChartId = charts?.[0]?.id ?? null;

    const { data: historyData } = trpc.chat.getHistory.useQuery(
        { conversationId: conversationId ?? 0 },
        { enabled: isAuthenticated && !!conversationId }
    );

    useEffect(() => {
        if (!isAuthenticated) return;
        if (!isOpen && !conversationId) return; // Don't create DB record until opened
        if (conversationId) return;

        getOrCreateConv.mutateAsync({ locale: locale as "cs" | "en", chartId: primaryChartId }).then(conv => {
            setConversationId(conv.id);
        }).catch(() => { });
    }, [isAuthenticated, locale, primaryChartId, isOpen, conversationId, getOrCreateConv]);

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
                .map(m => ({ role: m.role as "user" | "assistant", content: m.content }));

            const result = await askMutation.mutateAsync({
                question: content,
                history,
                locale,
                chartId: primaryChartId ?? undefined,
            });

            const assistantMsg: Message = { role: "assistant", content: result.content };
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
            setMessages(prev => [...prev, {
                role: "assistant",
                content: isEn ? "An error occurred. Please try again." : "Došlo k chybě. Zkuste to prosím znovu."
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (location.includes('/ai-guide')) {
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
                            aria-label={isEn ? "Open the High Priestess AI guide" : "Otevřít Velekněžku, AI průvodkyni"}
                            title={isEn ? "The High Priestess — personal guide" : "Velekněžka — osobní průvodkyně"}
                            className="group relative w-16 h-16 overflow-visible rounded-full border-2 border-amber-100/90 bg-[#160b2f] p-0 text-white shadow-[0_14px_38px_rgba(76,29,149,0.28)] ring-4 ring-violet-500/10 transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.03] hover:shadow-[0_18px_46px_rgba(76,29,149,0.38)]"
                        >
                            <span className="absolute -inset-2 -z-10 rounded-full bg-violet-500/20 blur-lg transition-opacity group-hover:bg-violet-400/35" aria-hidden="true" />
                            <img
                                src="/images/brand/veleknezka-master-v1.png"
                                alt=""
                                className="h-full w-full rounded-full object-cover object-[center_16%]"
                            />
                            <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-white/80 bg-violet-700 shadow-md" aria-hidden="true">
                                <Moon className="h-3.5 w-3.5 -rotate-12 text-amber-100" />
                            </span>
                            <span className="pointer-events-none absolute right-full top-1/2 mr-3 hidden -translate-y-1/2 whitespace-nowrap rounded-full border border-violet-200/70 bg-white/95 px-3 py-1.5 text-xs font-medium text-violet-950 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 lg:block dark:bg-violet-950/95 dark:text-violet-100">
                                {isEn ? "Ask the High Priestess" : "Zeptejte se Velekněžky"}
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
                                <div className="w-9 h-9 overflow-hidden rounded-full border border-amber-200/70 bg-[#160b2f] shrink-0">
                                    <img src="/images/brand/veleknezka-master-v1.png" alt="" className="h-full w-full object-cover object-[center_16%]" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold leading-none">{isEn ? "The High Priestess" : "Velekněžka"}</h3>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">{isEn ? "Your personal guide" : "Vaše osobní průvodkyně"}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="w-8 h-8 hover:bg-muted" onClick={() => setIsExpanded(!isExpanded)}>
                                    {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                                </Button>
                                <Button variant="ghost" size="icon" className="w-8 h-8 hover:bg-muted" onClick={() => setIsOpen(false)}>
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>

                        {!isAuthenticated ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-card">
                                <Sparkles className="w-12 h-12 text-purple-300 mb-4" />
                                <p className="text-sm text-muted-foreground mb-4">
                                    {isEn ? "Please sign in to chat with your personal guide." : "Pro rozhovor s Velekněžkou se prosím přihlaste."}
                                </p>
                                <Button onClick={() => window.location.href = getLoginUrl()}>
                                    {isEn ? "Sign in" : "Přihlásit se"}
                                </Button>
                            </div>
                        ) : (
                            <AIChatBox
                                messages={messages}
                                onSendMessage={handleSendMessage}
                                isLoading={isLoading}
                                placeholder={isEn ? "Ask the High Priestess..." : "Zeptejte se Velekněžky..."}
                                className="border-none rounded-none shadow-none flex-1"
                                height="100%"
                                suggestedPrompts={isEn
                                    ? ["What varies in my design?", "Explain my profile", "How does emotional authority work?"]
                                    : ["Jaká je dnes moje energie?", "Vysvětli mi můj profil", "Jak mám použít svou autoritu?"]}
                            />
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
