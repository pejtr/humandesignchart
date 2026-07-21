import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useLocation } from "wouter";
import { cs } from "@shared/i18n/cs";
import { en } from "@shared/i18n/en";
import { ru } from "@shared/i18n/ru";
import { uk } from "@shared/i18n/uk";
import { de } from "@shared/i18n/de";
import { hu } from "@shared/i18n/hu";

export type Locale = "cs" | "en" | "ru" | "uk" | "de" | "hu";

const TRANSLATIONS: Record<Locale, typeof cs> = {
  cs,
  en: en as typeof cs,
  ru: ru as typeof cs,
  uk: uk as typeof cs,
  de: de as typeof cs,
  hu: hu as typeof cs,
};

interface LanguageContextValue {
  locale: Locale;
  t: typeof cs;
  localePath: (path: string) => string;
  switchLocaleUrl: (newLocale: Locale) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const ALL_LOCALES: Locale[] = ["cs", "en", "ru", "uk", "de", "hu"];

function getLocaleFromPath(path: string): Locale {
  for (const l of ALL_LOCALES) {
    if (path.startsWith(`/${l}/`) || path === `/${l}`) return l;
  }
  return "cs";
}

function stripLocale(path: string): string {
  for (const l of ALL_LOCALES) {
    if (path.startsWith(`/${l}/`)) return path.slice(3);
    if (path === `/${l}`) return "/";
  }
  return path;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const locale = getLocaleFromPath(location);

  const value = useMemo<LanguageContextValue>(() => ({
    locale,
    t: TRANSLATIONS[locale] ?? TRANSLATIONS.en,
    localePath: (path: string) => {
      if (path === "/") return `/${locale}`;
      if (path.startsWith(`/${locale}/`)) return path;
      const clean = stripLocale(path);
      return `/${locale}${clean}`;
    },
    switchLocaleUrl: (newLocale: Locale) => {
      const clean = stripLocale(location);
      if (clean === "/") return `/${newLocale}`;
      return `/${newLocale}${clean}`;
    },
  }), [locale, location]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
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