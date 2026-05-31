/**
 * Shared notification type definitions and preference helpers.
 * Used by both server (filtering) and client (UI labels, icons).
 */

export const NOTIFICATION_TYPES = [
  "crm_status",
  "campaign",
  "system",
  "credit",
  "achievement",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

/** Default preferences — all types enabled */
export const DEFAULT_NOTIFICATION_PREFS: Record<NotificationType, boolean> = {
  crm_status: true,
  campaign: true,
  system: true,
  credit: true,
  achievement: true,
};

/** Human-readable labels and descriptions for each notification type (Czech) */
export const NOTIFICATION_TYPE_META: Record<
  NotificationType,
  { label: string; description: string; icon: string; color: string }
> = {
  crm_status: {
    label: "CRM Status",
    description: "Upozornění při změně vašeho CRM statusu v LeadOS (např. kontaktován, zájem, konverze).",
    icon: "🎯",
    color: "purple",
  },
  campaign: {
    label: "Email kampaně",
    description: "Oznámení o spuštění nových email kampaní a akcí Human Design Mapy.",
    icon: "📧",
    color: "green",
  },
  system: {
    label: "Systémová upozornění",
    description: "Důležité zprávy o stavu aplikace, výpadcích nebo aktualizacích.",
    icon: "ℹ️",
    color: "blue",
  },
  credit: {
    label: "AI kredity",
    description: "Upozornění při přijetí nových AI kreditů nebo při nízkém stavu kreditů.",
    icon: "⭐",
    color: "amber",
  },
  achievement: {
    label: "Úspěchy a odměny",
    description: "Gratulace při dosažení milníků — první mapa, první výklad, doporučení přítele.",
    icon: "🏆",
    color: "rose",
  },
};

/**
 * Parse and normalize notification preferences from DB JSON.
 * Always returns a complete object with all types — missing keys default to true.
 */
export function parseNotifPrefs(raw: unknown): Record<NotificationType, boolean> {
  const prefs = { ...DEFAULT_NOTIFICATION_PREFS };
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    for (const type of NOTIFICATION_TYPES) {
      const val = (raw as Record<string, unknown>)[type];
      if (typeof val === "boolean") {
        prefs[type] = val;
      }
    }
  }
  return prefs;
}

/**
 * Check if a specific notification type is enabled for a user.
 * Defaults to true if prefs are not set.
 */
export function isNotifTypeEnabled(
  rawPrefs: unknown,
  type: NotificationType
): boolean {
  return parseNotifPrefs(rawPrefs)[type] ?? true;
}
