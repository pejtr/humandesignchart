import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Send, User, Bot, LogIn, Loader2, ChevronDown } from "lucide-react";
import { Streamdown } from "streamdown";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

const SUGGESTED_QUESTIONS = [
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

export default function AiGuide() {
  const { isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Ahoj! 👋 Jsem váš AI průvodce Human Designem. Můžete se mě zeptat na cokoliv o systému Human Design — typy, centra, brány, dráhy, autority, profily, tranzity a mnoho dalšího. Jak vám mohu pomoci?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const askMutation = trpc.ai.askGuide.useMutation();

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
      });

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: result.content,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Omlouvám se, došlo k chybě při zpracování vaší otázky. Zkuste to prosím znovu.",
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
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="container max-w-2xl text-center">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Bot className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-serif font-bold mb-4">AI průvodce Human Designem</h1>
            <p className="text-muted-foreground mb-8">
              Přihlaste se pro přístup k AI průvodci, který vám zodpoví jakékoliv otázky o Human Designu.
            </p>
            <a href={getLoginUrl()}>
              <Button size="lg" className="gap-2">
                <LogIn className="w-5 h-5" />
                Přihlásit se
              </Button>
            </a>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20 pb-4 flex flex-col">
        <div className="container max-w-4xl flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-3 py-4 border-b mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-serif font-semibold">AI průvodce Human Designem</h1>
              <p className="text-xs text-muted-foreground">Zeptejte se na cokoliv o Human Designu</p>
            </div>
            <Badge variant="outline" className="ml-auto text-xs">
              <Sparkles className="w-3 h-3 mr-1" />
              AI
            </Badge>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2" style={{ maxHeight: "calc(100vh - 260px)" }}>
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
                      : "bg-primary/10 text-primary"
                  }`}>
                    {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/70 text-foreground"
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
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div className="bg-muted/70 rounded-2xl px-4 py-3">
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

          {/* Suggested questions (show only at start) */}
          {messages.length <= 1 && (
            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <ChevronDown className="w-3 h-3" />
                Navrhované otázky
              </p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_QUESTIONS.slice(0, 6).map((q, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="text-xs h-auto py-1.5 px-3"
                    onClick={() => handleSend(q)}
                  >
                    {q}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="border-t pt-4">
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
                placeholder="Zeptejte se na cokoliv o Human Designu..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" disabled={!input.trim() || isLoading} size="icon">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
