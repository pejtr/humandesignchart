import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { X, Star } from "lucide-react";
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
    onSuccess: () => {
      setStatus("success");
      localStorage.setItem(STORAGE_KEY, "true");
    },
    onError: (err) => {
      setStatus("error");
      setErrorMsg(err.message);
    },
  });

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed) return;
    const timer = setTimeout(() => setIsVisible(true), 30000);
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
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleDismiss}
      />

      {/* Modal — bottom sheet on mobile, centered on desktop */}
      <div className="relative w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl overflow-hidden shadow-2xl">
        {/* Cosmic header graphic with AI-generated art */}
        <div className="relative h-36 sm:h-44 overflow-hidden">
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310419663032296198/SJUUMjJfby3uu5HSPh4u4R/newsletter-cosmic-art_8a1b6665.png"
            alt=""
            className="w-full h-full object-cover"
          />
          {/* Gradient overlay for smooth transition to white content */}
          <div className="absolute inset-x-0 bottom-0 h-12" style={{ background: 'linear-gradient(transparent, white)' }} />

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center transition-colors backdrop-blur-sm"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Content area — solid white background for maximum readability */}
        <div className="bg-white px-6 py-6 sm:px-8 sm:py-7">
          <div className="text-center">
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              {isEn ? "Weekly Cosmic Insights" : "Týdenní kosmické vhledy"}
            </h3>

            <p className="text-gray-600 text-sm leading-relaxed mb-5 max-w-xs mx-auto">
              {isEn
                ? "Receive personalized Human Design transit forecasts and spiritual guidance every Monday."
                : "Každé pondělí obdržíte personalizovanou předpověď tranzitů Human Design a duchovní vedení."}
            </p>

            {status === "success" ? (
              <div className="py-3">
                <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                  <Star className="w-6 h-6 text-emerald-500" />
                </div>
                <p className="text-emerald-700 font-medium text-sm">
                  {isEn ? "Welcome to the cosmic tribe!" : "Vítejte v kosmickém kmeni!"}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  {isEn ? "Check your inbox for the first insight." : "Zkontrolujte svou schránku pro první vhled."}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isEn ? "your@email.com" : "vas@email.cz"}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all text-sm"
                />

                {status === "error" && (
                  <p className="text-red-500 text-xs">{errorMsg || (isEn ? "Something went wrong" : "Něco se pokazilo")}</p>
                )}

                <Button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full py-3 rounded-xl text-white font-medium text-sm shadow-lg transition-all duration-200 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', boxShadow: '0 4px 14px rgba(124,58,237,0.3)' }}
                >
                  {status === "loading"
                    ? (isEn ? "Subscribing..." : "Přihlašuji...")
                    : (isEn ? "Receive Weekly Insights" : "Přihlásit se k odběru")}
                </Button>

                <p className="text-gray-400 text-[11px] pt-1">
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
