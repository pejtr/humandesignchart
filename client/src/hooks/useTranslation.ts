import { cs } from "@shared/i18n/cs";

/**
 * Simple translation hook.
 * Currently returns Czech translations directly.
 * Can be extended for multi-language support later.
 */
export function useTranslation() {
  return { t: cs, locale: "cs" as const };
}

export function t() {
  return cs;
}
