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
    pricesCzk: 8800, // 88 CZK in haléře
    pricesEur: 349,   // 3.49 EUR in cents
    interval: "month" as const,
    metadata: { plan: "monthly" },
  },
  PREMIUM_ANNUAL: {
    name: "Human Design Premium — Roční / Annual",
    description: "Vše z měsíčního plánu + úspora 44 % | Everything in monthly + 44% savings",
    pricesCzk: 88800, // 888 CZK in haléře
    pricesEur: 3500,  // 35 EUR in cents
    interval: "year" as const,
    metadata: { plan: "annual" },
  },
  CREDIT_PACK: {
    name: "Human Design AI Credits — 5 výkladů / 5 readings",
    description: "5 AI výkladů bez předplatného | 5 AI readings without subscription",
    pricesCzk: 4400, // 44 CZK in haléře
    pricesEur: 179,  // 1.79 EUR in cents
    metadata: { plan: "credits", credits: "5" },
  },
  GIFT_MONTHLY: {
    name: "Dárkový poukaz — Premium Měsíc / Gift Voucher Monthly",
    description: "Dárkový poukaz na 1 měsíc Premium | Gift voucher for 1 month Premium",
    pricesCzk: 8800,
    pricesEur: 349,
    metadata: { plan: "gift_monthly" },
  },
  GIFT_ANNUAL: {
    name: "Dárkový poukaz — Premium Rok / Gift Voucher Annual",
    description: "Dárkový poukaz na 1 rok Premium | Gift voucher for 1 year Premium",
    pricesCzk: 88800,
    pricesEur: 3500,
    metadata: { plan: "gift_annual" },
  },
} as const;

export type StripePlanKey = keyof typeof STRIPE_PRODUCTS;

/** Free tier limits */
export const FREE_TIER = {
  AI_READINGS_LIMIT: 5,  // 5 free AI readings per user (lifetime)
  SAVED_CHARTS_LIMIT: 3, // 3 saved charts for free users
} as const;

/** Check if a user has premium access */
export function isPremiumUser(user: {
  subscriptionStatus: string;
  subscriptionPlan: string;
  subscriptionCurrentPeriodEnd: Date | null;
  aiReadingCredits: number;
}): boolean {
  if (user.subscriptionStatus === "active" || user.subscriptionStatus === "trialing") {
    // Check if subscription hasn't expired
    if (user.subscriptionCurrentPeriodEnd) {
      return user.subscriptionCurrentPeriodEnd > new Date();
    }
    return true;
  }
  return false;
}

/** Check if user can generate an AI reading */
export function canGenerateAiReading(user: {
  subscriptionStatus: string;
  subscriptionPlan: string;
  subscriptionCurrentPeriodEnd: Date | null;
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
