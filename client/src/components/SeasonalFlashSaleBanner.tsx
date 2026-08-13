import { useState } from "react";
import { ArrowRight, X } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

export function SeasonalFlashSaleBanner() {
  const { locale, localePath } = useLanguage();
  const isEn = locale === "en";
  const [dismissed, setDismissed] = useState(
    () =>
      typeof window !== "undefined" &&
      window.sessionStorage.getItem("seasonal-promo-dismissed") === "1",
  );

  if (dismissed) return null;

  const dismiss = () => {
    window.sessionStorage.setItem("seasonal-promo-dismissed", "1");
    setDismissed(true);
  };

  return (
    <div className="relative z-20 border-b border-purple-200/60 bg-purple-50/95 px-3 py-1.5 text-purple-950 dark:border-purple-800/50 dark:bg-[#160d2b]/95 dark:text-purple-100">
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 text-center text-[11px] sm:text-xs">
        <span className="truncate">
          {isEn
            ? "Seasonal offer · Save 40% on your personal Blueprint"
            : "Sezónní nabídka · Osobní rozbor nyní o 40 % výhodněji"}
        </span>
        <Link
          href={localePath("/pricing")}
          className="inline-flex shrink-0 items-center gap-1 font-semibold text-purple-700 hover:text-purple-900 dark:text-purple-300 dark:hover:text-white"
        >
          {isEn ? "View offer" : "Zobrazit"}
          <ArrowRight className="h-3 w-3" />
        </Link>
        <button
          type="button"
          onClick={dismiss}
          className="ml-1 shrink-0 rounded p-0.5 text-purple-500 transition-colors hover:bg-purple-100 hover:text-purple-900 dark:hover:bg-purple-900/50 dark:hover:text-white"
          aria-label={isEn ? "Close offer" : "Zavřít nabídku"}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
