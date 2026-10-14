/**
 * Base price per checkout plan in minor units (haléře / cents), by charged
 * currency. Single source for what `subscription.createCheckout` charges and
 * what the success page reports to analytics, so the two cannot drift.
 * Blueprint is the honorarium minimum; add-ons and voluntary top-ups are extra.
 */
export const CHECKOUT_PRICES_MINOR = {
  monthly: { CZK: 18900, EUR: 790 },
  annual: { CZK: 119000, EUR: 4800 },
  lifetime: { CZK: 288800, EUR: 11500 },
  credits: { CZK: 7700, EUR: 299 },
  brainwave_audio: { CZK: 19500, EUR: 790 },
  blueprint: { CZK: 29000, EUR: 1590 },
  blueprint_annual_upgrade: { CZK: 80000, EUR: 3210 },
  gift_monthly: { CZK: 18800, EUR: 749 },
  gift_annual: { CZK: 118800, EUR: 4700 },
} as const;

export type CheckoutPlan = keyof typeof CHECKOUT_PRICES_MINOR;
export type CheckoutCurrency = "CZK" | "EUR";

export function isCheckoutPlan(value: unknown): value is CheckoutPlan {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(CHECKOUT_PRICES_MINOR, value);
}
