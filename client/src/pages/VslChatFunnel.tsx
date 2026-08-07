import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sparkles, Send, Bot, User, CheckCircle2, Lock, ArrowRight, ShieldCheck, Star } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "wouter";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface ChatMessage {
  role: "assistant" | "user";
  content: string;
  options?: string[];
}

export default function VslChatFunnel() {
  const { locale, localePath } = useLanguage();
  const isEn = locale === "en";

  const [step, setStep] = useState(0);
  const [userName, setUserName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: isEn
        ? "Welcome! I am AI Marie. Before I calculate your personal Human Design Blueprint, what is your first name?"
        : "Vítejte! Jsem AI Marie. Než vám vypočítám vaši osobní Human Design mapu, jak se jmenujete?",
    },
  ]);
  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showPitch, setShowPitch] = useState(false);

  const handleSend = (userText?: string) => {
    const text = userText || inputVal;
    if (!text.trim()) return;

    setInputVal("");
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      if (step === 0) {
        setUserName(text);
        setStep(1);
        setMessages(prev => [
          ...prev,
          {
            role: "assistant",
            content: isEn
              ? `Těší mě, ${text}! Kdy jste se narodil/a? (Napište datum narození nebo vyšte ranní/večerní čas)`
              : `Těší mě, ${text}! Kdy jste se narodil/a? (Zadejte prosím vaše datum narození)`,
          },
        ]);
      } else if (step === 1) {
        setBirthDate(text);
        setStep(2);
        setMessages(prev => [
          ...prev,
          {
            role: "assistant",
            content: isEn
              ? `Calculating chart for ${userName} (${text})... I see a powerful open Emotional Center! What is your biggest challenge right now?`
              : `Počítám mapu pro uživatele ${userName} (${text})... Vidím ve vaší energetické mřížce silné Otevřené Emoční Centrum! Co vás v tuto chvíli nejvíce trápí?`,
            options: [
              isEn ? "Career & Purpose" : "Kariéra a Životní Směr",
              isEn ? "Love & Relationships" : "Láska a Vztahová Harmonie",
              isEn ? "Inner Peace & Stress" : "Vnitřní Mír a Přetížení",
            ],
          },
        ]);
      } else if (step === 2) {
        setStep(3);
        setShowPitch(true);
        setMessages(prev => [
          ...prev,
          {
            role: "assistant",
            content: isEn
              ? `Thank you, ${userName}. Based on your unique chart configuration, your Emotional Authority holds the key to your success. Watch this personal video reading summary below!`
              : `Děkuji, ${userName}. Na základě vaší uniktání energetické mapy drží vaše Emoční Autorita klíč k vaší životní lehkosti. Níže pro vás mám kompletní osobní videorozbor!`,
          },
        ]);
      }
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <Navbar />

      <main className="flex-1 container max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Interactive VSL Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-600/30 to-amber-500/30 text-amber-300 text-xs font-bold border border-amber-400/40">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            {isEn ? "Interactive AI Reading & VSL Experience" : "Interaktivní AI Výklad & VSL Zkušenost z Reklamy"}
          </div>

          <h1 className="text-3xl sm:text-5xl font-serif font-bold text-white tracking-tight leading-tight">
            {isEn
              ? "Discover Your Hidden Energetic Power with AI Marie"
              : "Odhalte Své Skryté Energetické Nastavení s AI Marií"}
          </h1>
          <p className="text-sm sm:text-base text-purple-200/80 max-w-2xl mx-auto">
            {isEn
              ? "Answer 3 quick questions to calculate your exact Human Design chart and unlock your custom 2026 reading."
              : "Odpovězte na 3 rychlé otázky. AI Marie spočítá vaši mapu a odhalí vaše otevřená centra v reálném čase."}
          </p>
        </div>

        {/* Conversational VSL Chat Box */}
        <Card className="border border-purple-500/30 bg-slate-900/90 backdrop-blur-xl rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4 max-w-2xl mx-auto">
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 text-sm">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-400 to-purple-600 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-slate-950 font-bold" />
                  </div>
                )}
                <div className="space-y-2 max-w-[85%]">
                  <div
                    className={`p-4 rounded-2xl leading-relaxed ${
                      m.role === "user"
                        ? "bg-purple-600 text-white rounded-br-none"
                        : "bg-slate-800 text-purple-100 border border-purple-500/20 rounded-bl-none"
                    }`}
                  >
                    {m.content}
                  </div>

                  {m.options && (
                    <div className="flex flex-col gap-2 pt-1">
                      {m.options.map((opt, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(opt)}
                          className="p-3 rounded-xl bg-purple-950/60 hover:bg-purple-800 text-amber-300 font-semibold text-xs border border-purple-500/40 text-left transition-all flex items-center justify-between"
                        >
                          <span>{opt}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-xs text-purple-300">
                <Sparkles className="w-4 h-4 animate-spin text-amber-400" />
                <span>{isEn ? "Marie is analyzing your chart..." : "AI Marie analyzuje vaši mapu..."}</span>
              </div>
            )}
          </div>

          {!showPitch && (
            <div className="flex gap-2 pt-2 border-t border-purple-500/20">
              <Input
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSend()}
                placeholder={isEn ? "Type your answer..." : "Napište vaši odpověď..."}
                className="bg-slate-950 border-purple-500/30 text-white text-sm h-11 rounded-xl"
              />
              <Button
                onClick={() => handleSend()}
                className="bg-gradient-to-r from-amber-400 to-purple-600 text-slate-950 font-bold h-11 px-5 rounded-xl gap-1.5 shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          )}
        </Card>

        {/* High-Converting VSL Pitch Video & Offer */}
        {showPitch && (
          <div className="space-y-6 max-w-2xl mx-auto text-center animate-in fade-in slide-in-from-bottom duration-700">
            {/* VSL Video Mockup */}
            <div className="relative aspect-video rounded-3xl bg-slate-900 border-2 border-amber-400/60 overflow-hidden shadow-2xl flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg mb-3 cursor-pointer hover:scale-110 transition-all">
                <Bot className="w-8 h-8" />
              </div>
              <h3 className="font-serif text-xl font-bold text-white">
                {isEn ? `Osobní Videorozbor pro Uživatele ${userName}` : `Osobní Videorozbor pro Uživatele ${userName}`}
              </h3>
              <p className="text-xs text-purple-200/80 mt-1">
                {isEn ? "Click to start 5-minute video pitch with AI Marie" : "Klikněte pro spuštění 5minutové videoprezentace s AI Marií"}
              </p>
            </div>

            {/* Direct Response Checkout Offer Card */}
            <Card className="border-2 border-amber-400 bg-gradient-to-br from-purple-950 via-slate-900 to-amber-950 text-white rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-amber-300">
                  {isEn ? "Exclusive 50% Off VSL Offer" : "Exkluzivní 50% Sleva z Reklamního VSL Funnelu"}
                </span>
                <h3 className="text-2xl sm:text-3xl font-serif font-bold text-white">
                  {isEn ? "Unlock Your Complete 25-Page HD Blueprint" : "Odemkněte Váš Kompletní 25-Stránkový HD Blueprint"}
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-left">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{isEn ? "All 9 Centers Explained" : "Rozbor všech 9 centr"}</span>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{isEn ? "Career & Money Gates" : "Kariérní & Finanční brány"}</span>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>{isEn ? "Audio Reading Included" : "Audio výklad v ceně"}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-white/10">
                <div className="text-center sm:text-left">
                  <div className="text-xs text-muted-foreground">{isEn ? "VSL Promo Price:" : "Akční Reklamní Cena:"}</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-amber-300">199 Kč</span>
                    <span className="text-xs text-muted-foreground line-through">390 Kč</span>
                  </div>
                </div>

                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-gradient-to-r from-amber-400 via-purple-500 to-indigo-600 hover:scale-105 text-slate-950 font-extrabold text-sm h-12 px-8 rounded-2xl shadow-xl gap-2"
                  asChild
                >
                  <Link href={localePath("/pricing") + "?coupon=VSL50"}>
                    <Sparkles className="w-4 h-4 fill-current" />
                    {isEn ? "Claim 50% Off Blueprint Now" : "Získat 50% Slevu a Stáhnout Blueprint"}
                  </Link>
                </Button>
              </div>
            </Card>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
