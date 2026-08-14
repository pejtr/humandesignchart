import { STRIPE_PRODUCTS } from "../stripeProducts";

export const PAYMENT_PRODUCT_KEYS = [
  "monthly",
  "annual",
  "lifetime",
  "credits",
  "brainwave_audio",
  "blueprint",
  "blueprint_annual_upgrade",
  "gift_monthly",
  "gift_annual",
] as const;

export type PaymentProductKey = (typeof PAYMENT_PRODUCT_KEYS)[number];
export type PaymentCurrency = "CZK" | "EUR";

const PRODUCT_BY_KEY = {
  monthly: STRIPE_PRODUCTS.PREMIUM_MONTHLY,
  annual: STRIPE_PRODUCTS.PREMIUM_ANNUAL,
  lifetime: STRIPE_PRODUCTS.PREMIUM_LIFETIME,
  credits: STRIPE_PRODUCTS.CREDIT_PACK,
  brainwave_audio: STRIPE_PRODUCTS.BRAINWAVE_AUDIO,
  blueprint: STRIPE_PRODUCTS.BLUEPRINT,
  blueprint_annual_upgrade: STRIPE_PRODUCTS.BLUEPRINT_ANNUAL_UPGRADE,
  gift_monthly: STRIPE_PRODUCTS.GIFT_MONTHLY,
  gift_annual: STRIPE_PRODUCTS.GIFT_ANNUAL,
} as const;

export function isPaymentProductKey(value: unknown): value is PaymentProductKey {
  return typeof value === "string" && PAYMENT_PRODUCT_KEYS.includes(value as PaymentProductKey);
}

export function getOfferAmountMinor(
  productKey: PaymentProductKey,
  currency: PaymentCurrency,
  partnerAddon = false,
): number {
  const product = PRODUCT_BY_KEY[productKey];
  const base = currency === "CZK" ? product.pricesCzk : product.pricesEur;
  if (productKey !== "blueprint" || !partnerAddon) return base;
  const addon = STRIPE_PRODUCTS.BLUEPRINT_PARTNER_ADDON;
  return base + (currency === "CZK" ? addon.pricesCzk : addon.pricesEur);
}

export function getOfferName(productKey: PaymentProductKey): string {
  return PRODUCT_BY_KEY[productKey].name;
}
