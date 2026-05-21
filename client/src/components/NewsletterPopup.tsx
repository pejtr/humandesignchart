import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { X, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "hd_newsletter_dismissed";

export default function NewsletterPopup() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const subscribeMutation = trpc.newsletter.subscribe.useMutation({
    onSuccess: (data) => {
      if (data.alreadySubscribed) {
        setStatus("success");
      } else {
        setStatus("success");
      }
      localStorage.setItem(STORAGE_KEY, "true");
    },
    onError: (err) => {
      setStatus("error");
      setErrorMsg(err.message);
    },
  });

  useEffect(() => {
    // Only show once — never again after dismissal or subscription
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed) return;

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 30000); // 30 seconds

    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || status === "loading") return;
    setStatus("loading");
    subscribeMutation.mutate({ email, locale, source: "popup" });
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(STORAGE_KEY, "true");
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={handleDismiss}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md animate-in zoom-in-95 fade-in duration-400">
        {/* Decorative glow */}
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-violet-500/30 via-purple-500/20 to-amber-500/30 blur-xl" />

        <div className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900 via-slate-900 to-violet-950 p-8 shadow-2xl overflow-hidden">
          {/* Background sacred geometry pattern */}
          <div className="absolute inset-0 opacity-5">
            <svg viewBox="0 0 400 400" className="w-full h-full">
              <circle cx="200" cy="200" r="150" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-violet-300" />
              <circle cx="200" cy="200" r="100" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-violet-300" />
              <circle cx="200" cy="200" r="50" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-violet-300" />
              <polygon points="200,50 350,200 200,350 50,200" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-amber-300" />
              <polygon points="200,80 320,200 200,320 80,200" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-amber-300" />
            </svg>
          </div>

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-white/40 hover:text-white/80 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Content */}
          <div className="relative text-center">
            {/* Icon */}
            <div className="mx-auto mb-5 w-16 h-16 rounded-full bg-gradient-to-br from-violet-500/20 to-amber-500/20 border border-violet-400/30 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-amber-300" />
            </div>

            {/* Heading */}
            <h3 className="font-serif text-2xl font-bold text-white mb-2">
              {isEn ? "Weekly Cosmic Insights" : "Týdenní kosmické vhledy"}
            </h3>

            {/* Subheading */}
            <p className="text-violet-200/80 text-sm mb-6 max-w-xs mx-auto leading-relaxed">
              {isEn
                ? "Receive personalized Human Design transit forecasts and spiritual guidance every Monday."
                : "Každé pondělí obdržíte personalizovanou předpověď tranzitů Human Design a duchovní vedení."}
            </p>

            {status === "success" ? (
              <div className="py-4">
                <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
                  <Star className="w-6 h-6 text-emerald-300" />
                </div>
                <p className="text-emerald-300 font-medium">
                  {isEn ? "Welcome to the cosmic tribe!" : "Vítejte v kosmickém kmeni!"}
                </p>
                <p className="text-violet-200/60 text-xs mt-2">
                  {isEn
                    ? "Check your inbox for the first insight."
                    : "Zkontrolujte svou schránku pro první vhled."}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={isEn ? "your@email.com" : "vas@email.cz"}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-violet-400/50 focus:ring-1 focus:ring-violet-400/30 transition-all text-sm"
                  />
                </div>

                {status === "error" && (
                  <p className="text-red-400 text-xs">{errorMsg || (isEn ? "Something went wrong" : "Něco se pokazilo")}</p>
                )}

                <Button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-medium text-sm shadow-lg shadow-violet-500/25 transition-all duration-200 disabled:opacity-50"
                >
                  {status === "loading"
                    ? (isEn ? "Subscribing..." : "Přihlašuji...")
                    : (isEn ? "Receive Weekly Insights" : "Přihlásit se k odběru")}
                </Button>

                <p className="text-white/30 text-[11px] mt-3">
                  {isEn
                    ? "No spam. Unsubscribe anytime. Your energy is sacred."
                    : "Žádný spam. Odhlášení kdykoliv. Vaše energie je posvátná."}
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
