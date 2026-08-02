import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sparkles, MessageSquare, Send, X, Bot, User, Crown } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { Link } from "wouter";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function SmartChatWidget() {
  const { locale, localePath } = useLanguage();
  const isEn = locale === "en";
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [credits, setCredits] = useState(3);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: isEn
        ? "Hello! I am AI Marie. Ask me anything about your Human Design chart, relationships, or career strategy."
        : "Dobrý den! Jsem AI Marie. Zeptejte se mě na cokoliv ohledně vaší Human Design mapy, vztahů či profesní strategie.",
    },
  ]);

  const handleSend = () => {
    if (!input.trim()) return;
    if (credits <= 0) {
      toast.info(
        isEn
          ? "You used all free AI credits! Upgrade to VIP for unlimited chat."
          : "Vyčerpali jste volné kredity! Přejděte na VIP členství pro neomezený chat s AI Marií."
      );
      return;
    }

    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setCredits(prev => prev - 1);
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: isEn
            ? `Based on your chart, respecting your emotional authority will guide you smoothly through this decision about: "${userMsg}".`
            : `Na základě vaší mapy a vaší emociální autority vám doporučuji nespěchat a dopřát si čas pro správné navnímání této situace: "${userMsg}".`,
        },
      ]);
    }, 1200);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-6 z-50 p-3.5 rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white shadow-2xl hover:scale-105 transition-all flex items-center gap-2 group"
      >
        <Sparkles className="w-5 h-5 animate-pulse text-amber-300" />
        <span className="text-xs font-bold hidden sm:inline group-hover:inline">
          {isEn ? "Ask AI Marie" : "Zeptat se AI Marie"}
        </span>
        <span className="w-5 h-5 rounded-full bg-amber-400 text-purple-950 font-extrabold text-[10px] flex items-center justify-center">
          {credits}
        </span>
      </button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 border border-purple-300/40 dark:border-purple-800/40 bg-background/95 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden flex flex-col max-h-[500px]">
      <CardHeader className="p-4 bg-gradient-to-r from-purple-950 via-pink-950 to-background text-white flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-purple-500/20 text-amber-300">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-1.5">
              AI Marie Asistentka
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </CardTitle>
            <span className="text-[10px] text-purple-200/80">
              {isEn ? `${credits} free questions left` : `Zbývají ${credits} bezplatné dotazy`}
            </span>
          </div>
        </div>

        <button onClick={() => setIsOpen(false)} className="text-white/60 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </CardHeader>

      <CardContent className="p-4 space-y-3 overflow-y-auto flex-1 text-xs">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {m.role === "assistant" && (
              <div className="w-6 h-6 rounded-full bg-purple-600/20 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5" />
              </div>
            )}
            <div
              className={`p-3 rounded-2xl max-w-[80%] leading-relaxed ${
                m.role === "user"
                  ? "bg-purple-600 text-white rounded-br-none"
                  : "bg-muted text-foreground border border-border/50 rounded-bl-none"
              }`}
            >
              {m.content}
            </div>
            {m.role === "user" && (
              <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="w-3.5 h-3.5 animate-spin text-purple-500" />
            <span>{isEn ? "Marie is thinking..." : "Marie přemýšlí nad vaší mapou..."}</span>
          </div>
        )}
      </CardContent>

      {credits <= 0 ? (
        <CardFooter className="p-3 bg-purple-950/20 border-t border-border flex flex-col gap-2">
          <div className="text-[11px] text-center text-muted-foreground">
            {isEn ? "Out of free credits." : "Bezplatné kredity vyčerpány."}
          </div>
          <Button
            size="sm"
            className="w-full bg-gradient-to-r from-amber-500 to-purple-600 text-white font-bold text-xs h-9 rounded-xl gap-1.5"
            asChild
          >
            <Link href={localePath("/pricing")}>
              <Crown className="w-3.5 h-3.5 text-amber-300" />
              {isEn ? "Odemknout Neomezené VIP" : "Odemknout Neomezené VIP"}
            </Link>
          </Button>
        </CardFooter>
      ) : (
        <CardFooter className="p-3 border-t border-border flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSend()}
            placeholder={isEn ? "Ask about your chart..." : "Zeptejte se na vaši mapu..."}
            className="text-xs h-9 rounded-xl bg-muted/50"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="h-9 w-9 rounded-xl bg-purple-600 hover:bg-purple-700 text-white shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
