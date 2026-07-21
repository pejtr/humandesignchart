import { useState, useEffect } from "react";
import { AIChatBox, Message } from "./AIChatBox";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { Bot, X, Maximize2, Minimize2, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { getLoginUrl } from "@/const";

export function FloatingChatGuide() {
    const { isAuthenticated } = useAuth();
    const { locale } = useLanguage();
    const isEn = locale === "en";

    const [isOpen, setIsOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const welcomeMessage = isEn
        ? "Hi! I'm your AI Human Design guide. Ask me anything about your chart, type, strategy, or transits!"
        : "Ahoj! Jsem tvůj AI průvodce Human Designem. Zeptej se mě na cokoliv o tvé mapě, typu, strategii nebo tranzitech!";

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

    if (typeof window !== 'undefined' && window.location.pathname.includes('/ai-guide')) {
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
                        className="fixed bottom-[5.5rem] right-4 md:bottom-6 md:right-6 z-50 lg:bottom-10 lg:right-10"
                    >
                        <Button
                            onClick={() => setIsOpen(true)}
                            className="w-14 h-14 rounded-full shadow-2xl bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 flex items-center justify-center p-0 border-0"
                        >
                            <Sparkles className="w-6 h-6 text-white" />
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
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shrink-0">
                                    <Sparkles className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold leading-none">{isEn ? "AI HD Guide" : "AI HD Průvodce"}</h3>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">{isEn ? "Online" : "Aktivní"}</p>
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
                                    {isEn ? "Please sign in to chat with your personal AI guide." : "Pro chatování s AI průvodcem se prosím přihlaste."}
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
                                placeholder={isEn ? "Ask something..." : "Zeptejte se na cokoliv..."}
                                className="border-none rounded-none shadow-none flex-1"
                                height="100%"
                                suggestedPrompts={isEn
                                    ? ["What varies in my design?", "Explain my profile", "How does emotional authority work?"]
                                    : ["Jaký je dnes můj tranzit?", "Vysvětli mi můj profil", "Jak funguje emocionální autorita?"]}
                            />
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
