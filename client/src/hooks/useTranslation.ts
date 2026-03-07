import { useLanguage } from "@/contexts/LanguageContext";
import { cs } from "@shared/i18n/cs";

/**
 * Translation hook — now powered by LanguageContext.
 * Returns the correct translations based on the URL locale prefix.
 */
export function useTranslation() {
  return useLanguage();
}

/**
 * Static translation accessor (for use outside React components).
 * Always returns Czech — use useTranslation() in components instead.
 */
export function t() {
  return cs;
}
