/**
 * Stripe Products & Prices Configuration
 * Human Design App — Premium Subscription Plans
 *
 * Prices in CZK (Czech Koruna) and EUR.
 * These are created dynamically on first checkout if not yet in Stripe.
 */

export const STRIPE_PRODUCTS = {
  PREMIUM_MONTHLY: {
    name: "Human Design Premium — Měsíční / Monthly",
    description: "Neomezené AI výklady, PDF reporty, všechny nástroje | Unlimited AI readings, PDF reports, all tools",
    pricesCzk: 18800, // 188 CZK in haléře
    pricesEur: 749,   // 7.49 EUR in cents
    interval: "month" as const,
    metadata: { plan: "monthly" },
  },
  PREMIUM_ANNUAL: {
    name: "Human Design Premium — Roční / Annual",
    description: "Vše z měsíčního plánu + úspora cca 47 % | Everything in monthly + ~47% savings",
    pricesCzk: 118800, // 1188 CZK in haléře
    pricesEur: 4700,  // 47 EUR in cents
    interval: "year" as const,
    metadata: { plan: "annual" },
  },
  PREMIUM_LIFETIME: {
    name: "Human Design Premium — Doživotně / Lifetime",
    description: "Exkluzivní VIP přístup navždy bez dalších poplatků | Exclusive VIP access forever with no recurring fees",
    pricesCzk: 288800, // 2888 CZK in haléře
    pricesEur: 11500,  // 115 EUR in cents
    interval: "payment" as const, // one-time payment
    metadata: { plan: "lifetime" },
  },
  CREDIT_PACK: {
    name: "Human Design AI Credits — 5 výkladů / 5 readings",
    description: "5 AI výkladů bez předplatného | 5 AI readings without subscription",
    pricesCzk: 7700, // 77 CZK in haléře
    pricesEur: 299,  // 2.99 EUR in cents
    metadata: { plan: "credits", credits: "5" },
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
  AI_READINGS_LIMIT: 3,  // 3 free AI readings per user (daily)
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
