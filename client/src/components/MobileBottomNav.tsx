import { useLocation, Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { Map, BookOpen, Sparkles, User, Home, Send, Loader2 } from "lucide-react";
import { useRef, useState, useEffect } from "react";

/**
 * Fixed bottom navigation bar for mobile devices.
 * On the AI Guide page, shows a chat input row above the nav icons.
 */

// Global event bus for chat input communication
const AI_GUIDE_SEND_EVENT = "ai-guide-send";
const AI_GUIDE_LOADING_EVENT = "ai-guide-loading";

export function dispatchAiGuideSend(message: string) {
  window.dispatchEvent(new CustomEvent(AI_GUIDE_SEND_EVENT, { detail: { message } }));
}

export function setAiGuideLoading(loading: boolean) {
  window.dispatchEvent(new CustomEvent(AI_GUIDE_LOADING_EVENT, { detail: { loading } }));
}

export function MobileBottomNav() {
  const [location] = useLocation();
  const { locale, localePath } = useLanguage();
  const { isAuthenticated } = useAuth();
  const isCs = locale === "cs";
  const inputRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isAiGuide = location.includes("/ai-guide");

  // Listen for loading state changes from AiGuide
  useEffect(() => {
    const handler = (e: Event) => {
      setIsLoading((e as CustomEvent).detail.loading);
    };
    window.addEventListener(AI_GUIDE_LOADING_EVENT, handler);
    return () => window.removeEventListener(AI_GUIDE_LOADING_EVENT, handler);
  }, []);

  const handleSend = () => {
    const msg = input.trim();
    if (!msg || isLoading) return;
    setInput("");
    dispatchAiGuideSend(msg);
  };

  const navItems = [
    { id: "home",     href: localePath("/"),          icon: Home,     label: isCs ? "Domů" : "Home" },
    { id: "chart",    href: localePath("/calculate"),  icon: Map,      label: isCs ? "Mapa" : "Chart" },
    { id: "ai-guide", href: localePath("/ai-guide"),   icon: Sparkles, label: "AI Guide" },
    { id: "blog",     href: localePath("/blog"),       icon: BookOpen, label: "Blog" },
    { id: "profile",  href: isAuthenticated ? localePath("/dashboard") : localePath("/calculate"), icon: User, label: isCs ? "Profil" : "Profile" },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden backdrop-blur-md border-t border-border/50"
      style={{
        background: "var(--background)",
        boxShadow: "0 -2px 16px oklch(0.55 0.22 300 / 0.10)",
      }}
    >
      {/* Chat input row — only on AI Guide page */}
      {isAiGuide && (
        <div className="px-3 pt-2 pb-1 border-b border-border/30">
          <form
            onSubmit={e => { e.preventDefault(); handleSend(); }}
            className="flex gap-2 items-center"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={isCs ? "Zeptejte se na cokoliv o Human Designu..." : "Ask anything about Human Design..."}
              disabled={isLoading}
              className="flex-1 h-9 px-3 text-sm rounded-lg border border-border/50 bg-background/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="h-9 w-9 shrink-0 rounded-lg bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 transition-opacity"
            >
              {isLoading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Send className="w-4 h-4" />
              }
            </button>
          </form>
        </div>
      )}

      {/* Nav icons */}
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive =
            location === item.href ||
            (item.href !== localePath("/") && location.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link key={item.id} href={item.href}>
              <button className="relative flex flex-col items-center justify-center gap-0.5 w-14 h-14 rounded-xl transition-all">
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    isActive ? "text-purple-600 dark:text-purple-400" : "text-muted-foreground"
                  }`}
                />
                <span
                  className={`text-[10px] font-medium transition-colors ${
                    isActive ? "text-purple-600 dark:text-purple-400" : "text-muted-foreground"
                  }`}
                >
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute bottom-1 w-5 h-0.5 rounded-full bg-purple-500" />
                )}
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
