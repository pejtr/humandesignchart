import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Crown, X, Compass, Zap } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface EventItem {
  id: string;
  name: string;
  city: string;
  actionCs: string;
  actionEn: string;
  typeBadge?: string;
  timeAgoCs: string;
  timeAgoEn: string;
  icon: "sparkles" | "crown" | "compass";
}

const SAMPLE_EVENTS: EventItem[] = [
  {
    id: "1",
    name: "Eva",
    city: "Praha",
    actionCs: "si vygenerovala svou mapu",
    actionEn: "generated her bodygraph",
    typeBadge: "Generátor 3/5",
    timeAgoCs: "před 2 minutami",
    timeAgoEn: "2 min ago",
    icon: "sparkles",
  },
  {
    id: "2",
    name: "Martin",
    city: "Brno",
    actionCs: "aktivoval Premium členství",
    actionEn: "unlocked Premium membership",
    typeBadge: "Manifestor 1/3",
    timeAgoCs: "před 5 minutami",
    timeAgoEn: "5 min ago",
    icon: "crown",
  },
  {
    id: "3",
    name: "Lucie",
    city: "Ostrava",
    actionCs: "spočítala partnerský rozbor",
    actionEn: "calculated partner compatibility",
    typeBadge: "Projektor 4/6",
    timeAgoCs: "před 9 minutami",
    timeAgoEn: "9 min ago",
    icon: "compass",
  },
  {
    id: "4",
    name: "David",
    city: "Plzeň",
    actionCs: "objevil svůj Inkarnační kříž",
    actionEn: "discovered his Incarnation Cross",
    typeBadge: "Reflektor 2/4",
    timeAgoCs: "před 12 minutami",
    timeAgoEn: "12 min ago",
    icon: "sparkles",
  },
  {
    id: "5",
    name: "Klára",
    city: "Bratislava",
    actionCs: "vygenerovala AI výklad autority",
    actionEn: "generated AI authority reading",
    typeBadge: "M. Generátor 6/2",
    timeAgoCs: "před 18 minutami",
    timeAgoEn: "18 min ago",
    icon: "crown",
  },
];

export function SocialProofTicker() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [currentEvent, setCurrentEvent] = useState<EventItem | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if dismissed in this session
    if (sessionStorage.getItem("socialProofTickerDismissed")) {
      setIsDismissed(true);
      return;
    }

    let currentIndex = 0;
    const initialTimer = setTimeout(() => {
      setCurrentEvent(SAMPLE_EVENTS[0]);
    }, 6000);

    const interval = setInterval(() => {
      setCurrentEvent(null);
      setTimeout(() => {
        currentIndex = (currentIndex + 1) % SAMPLE_EVENTS.length;
        setCurrentEvent(SAMPLE_EVENTS[currentIndex]);
      }, 600);
    }, 24000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);

  if (isDismissed || !currentEvent) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem("socialProofTickerDismissed", "true");
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.9 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="fixed bottom-4 left-4 z-40 max-w-[320px] sm:max-w-[360px] bg-white/95 dark:bg-[#120e24]/95 backdrop-blur-md border border-purple-200/50 dark:border-purple-800/40 rounded-2xl p-3.5 shadow-xl shadow-purple-900/10 pointer-events-auto"
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 shrink-0 mt-0.5">
            {currentEvent.icon === "crown" ? (
              <Crown className="w-4 h-4" />
            ) : currentEvent.icon === "compass" ? (
              <Compass className="w-4 h-4" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
          </div>

          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-semibold text-foreground">
                {currentEvent.name} ({currentEvent.city})
              </span>
              {currentEvent.typeBadge && (
                <span className="text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded-full font-medium">
                  {currentEvent.typeBadge}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
              {isEn ? currentEvent.actionEn : currentEvent.actionCs}
            </p>
            <span className="text-[10px] text-muted-foreground/70 block mt-1">
              {isEn ? currentEvent.timeAgoEn : currentEvent.timeAgoCs} • Ověřeno
            </span>
          </div>

          <button
            onClick={handleDismiss}
            className="text-muted-foreground/50 hover:text-foreground transition-colors p-1"
            aria-label="Zavřít"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
