import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useLocation } from "wouter";
import { cs } from "@shared/i18n/cs";
import { en } from "@shared/i18n/en";

export type Locale = "cs" | "en";

interface LanguageContextValue {
  locale: Locale;
  t: typeof cs;
  /** Build a path with the current locale prefix */
  localePath: (path: string) => string;
  /** Switch language — returns the new URL */
  switchLocaleUrl: (newLocale: Locale) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

/**
 * Extract locale from the current URL path.
 * /en/... → "en", /cs/... → "cs", anything else → default
 */
function getLocaleFromPath(path: string): Locale {
  if (path.startsWith("/en/") || path === "/en") return "en";
  if (path.startsWith("/cs/") || path === "/cs") return "cs";
  // Legacy routes without prefix default to Czech (existing behavior)
  return "cs";
}

/**
 * Strip the locale prefix from a path.
 * /en/calculate → /calculate, /cs/blog → /blog
 */
function stripLocale(path: string): string {
  if (path.startsWith("/en/")) return path.slice(3);
  if (path.startsWith("/cs/")) return path.slice(3);
  if (path === "/en" || path === "/cs") return "/";
  return path;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const locale = getLocaleFromPath(location);

  const translations = locale === "en" ? en : cs;

  const value = useMemo<LanguageContextValue>(() => ({
    locale,
    t: translations as typeof cs,
    localePath: (path: string) => {
      // Root path
      if (path === "/") return `/${locale}`;
      // Already has locale prefix
      if (path.startsWith(`/${locale}/`)) return path;
      // Strip any existing locale prefix and add current one
      const clean = stripLocale(path);
      return `/${locale}${clean}`;
    },
    switchLocaleUrl: (newLocale: Locale) => {
      const clean = stripLocale(location);
      if (clean === "/") return `/${newLocale}`;
      return `/${newLocale}${clean}`;
    },
  }), [locale, location, translations]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    // Fallback for components outside provider (shouldn't happen)
    return {
      locale: "cs" as Locale,
      t: cs,
      localePath: (path: string) => path,
      switchLocaleUrl: (newLocale: Locale) => `/${newLocale}`,
    };
  }
  return ctx;
}

export { stripLocale, getLocaleFromPath };
