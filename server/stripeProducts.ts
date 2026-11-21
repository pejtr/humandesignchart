/**
 * Stripe Products & Prices Configuration
 * Human Design App — MAAT NeuroHive 5.55 Offer Stack
 *
 * Prices in CZK (Czech Koruna) and EUR.
 */

export const STRIPE_PRODUCTS = {
  // 1. MARIE PLUS — Regenerative Subscription (189 CZK/mo, 1190 CZK/yr)
  PREMIUM_MONTHLY: {
    name: "Marie Plus — Měsíční Předplatné / Monthly",
    description: "Personalizované denní tranzity, týdenní digest, reflexní deník, vztahové mapy, fair AI kvóta",
    pricesCzk: 18900, // 189 CZK in haléře
    pricesEur: 790,   // 7.90 EUR in cents
    interval: "month" as const,
    metadata: { plan: "monthly" },
  },
  PREMIUM_ANNUAL: {
    name: "Marie Plus — Roční Předplatné / Annual",
    description: "Vše z měsíční Marie Plus s výhodnější roční platbou 1 190 Kč",
    pricesCzk: 119000, // 1 190 CZK in haléře
    pricesEur: 4800,   // 48.00 EUR in cents
    interval: "year" as const,
    metadata: { plan: "annual" },
  },

  // 2. DEEP READING — Primary Single-Purchase Product (390 - 490 CZK)
  BLUEPRINT: {
    name: "Deep Reading — Kompletní Osobní Rozbor (PDF + Audio)",
    description: "Personalizovaný strukturovaný výklad, praktické využití v životě, PDF i audio v jednom balíčku, trvalý přístup",
    pricesCzk: 29000, // transparent minimum honorarium; voluntary support is calculated separately
    pricesEur: 1590,  // 15.90 EUR
    metadata: { plan: "blueprint" },
  },
  DEEP_READING_TEST_490: {
    name: "Deep Reading — Kompletní Osobní Rozbor (PDF + Audio)",
    description: "Personalizovaný strukturovaný výklad, praktické využití v životě, PDF i audio v jednom balíčku, trvalý přístup",
    pricesCzk: 49000, // 490 CZK test variant
    pricesEur: 1990,  // 19.90 EUR
    metadata: { plan: "blueprint_490" },
  },

  // 3. RELATIONSHIP DYNAMICS — Contextual Product for 2+ Charts
  RELATIONSHIP_DYNAMICS: {
    name: "Relationship Dynamics — Kontextový Vztahový Rozbor",
    description: "Propojení a energetický vliv dvou osobních map bez arbitrárních procent kompatibility",
    pricesCzk: 29000, // 290 CZK
    pricesEur: 1190,  // 11.90 EUR
    metadata: { plan: "relationship_dynamics" },
  },

  BLUEPRINT_ANNUAL_UPGRADE: {
    name: "Roční Marie Plus po Deep Reading",
    description: "Doplatek roční Marie Plus po zakoupení Deep Reading",
    pricesCzk: 80000, // existing upgrade contract; legacy Blueprint purchases remain compatible
    pricesEur: 3210,
    metadata: { plan: "blueprint_annual_upgrade" },
  },
  // Deprecated/Legacy compatibility aliases
  PREMIUM_LIFETIME: {
    name: "Human Design Premium — Deprecated",
    description: "MAAT Veto: Lifetime unlimited plan is deprecated in favor of Marie Plus.",
    pricesCzk: 288800,
    pricesEur: 11500,
    interval: "payment" as const,
    metadata: { plan: "lifetime", deprecated: "true" },
  },
  CREDIT_PACK: {
    name: "Human Design AI Credits — 5 výkladů",
    description: "Doplňkové AI kredity pro nepředplatitele",
    pricesCzk: 7700,
    pricesEur: 299,
    metadata: { plan: "credits", credits: "5" },
  },
  BRAINWAVE_AUDIO: {
    name: "Human Design Audio",
    description: "Integrováno do balíčku Deep Reading",
    pricesCzk: 19500,
    pricesEur: 790,
    metadata: { plan: "brainwave_audio" },
  },
  BLUEPRINT_PARTNER_ADDON: {
    name: "Partnerský Blueprint doplněk",
    description: "Integrováno do Relationship Dynamics",
    pricesCzk: 19000,
    pricesEur: 790,
    metadata: { plan: "blueprint_partner" },
  },
  GIFT_MONTHLY: {
    name: "Dárkový poukaz — Premium Měsíc / Gift Voucher Monthly",
    description: "Dárkový poukaz na 1 měsíc Premium | Gift voucher for 1 month Premium",
    pricesCzk: 18800,
    pricesEur: 749,
    metadata: { plan: "gift_monthly" },
  },
  GIFT_ANNUAL: {
    name: "Dárkový poukaz — Premium Rok / Gift Voucher Annual",
    description: "Dárkový poukaz na 1 rok Premium | Gift voucher for 1 year Premium",
    pricesCzk: 118800,
    pricesEur: 4700,
    metadata: { plan: "gift_annual" },
  },
} as const;

export type StripePlanKey = keyof typeof STRIPE_PRODUCTS;

/** Free tier limits */
export const FREE_TIER = {
  AI_READINGS_LIMIT: 1,  // one complete free reading demonstrates value without replacing the paid product
  SAVED_CHARTS_LIMIT: 3, // 3 saved charts for free users
} as const;

/** Check if a user has premium access */
export function isPremiumUser(user: {
  subscriptionStatus: string;
  subscriptionPlan: string;
  subscriptionCurrentPeriodEnd: Date | string | null;
  aiReadingCredits: number;
}): boolean {
  if (user.subscriptionPlan === "lifetime") {
    return true; // Lifetime plan is always valid forever
  }
  if (user.subscriptionStatus === "active" || user.subscriptionStatus === "trialing") {
    // Check if subscription hasn't expired
    if (user.subscriptionCurrentPeriodEnd) {
      const end = new Date(user.subscriptionCurrentPeriodEnd);
      return end > new Date();
    }
    return true;
  }
  return false;
}

/** Check if user can generate an AI reading */
export function canGenerateAiReading(user: {
  subscriptionStatus: string;
  subscriptionPlan: string;
  subscriptionCurrentPeriodEnd: Date | string | null;
  aiReadingCredits: number;
}, totalReadingsCount: number): { allowed: boolean; reason?: string } {
  if (isPremiumUser(user)) {
    return { allowed: true };
  }
  if (user.aiReadingCredits > 0) {
    return { allowed: true };
  }
  if (totalReadingsCount < FREE_TIER.AI_READINGS_LIMIT) {
    return { allowed: true };
  }
  return {
    allowed: false,
    reason: "free_limit_reached",
  };
}
