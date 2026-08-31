import { STRIPE_PRODUCTS } from "../stripeProducts";

export type PublicOfferLocale = "cs" | "en";

/**
 * Public, read-only representation of the only checkout offer shown on the
 * pricing route. Monetary values remain in minor units and come from the same
 * server catalog used by payment validation.
 */
export function getBlueprintOffer(locale: PublicOfferLocale) {
  const isCzech = locale === "cs";
  const blueprint = STRIPE_PRODUCTS.BLUEPRINT;
  const partnerAddon = STRIPE_PRODUCTS.BLUEPRINT_PARTNER_ADDON;

  return {
    productKey: "blueprint" as const,
    name: isCzech ? "Osobní Human Design Blueprint" : "Personal Human Design Blueprint",
    currency: isCzech ? "CZK" : "EUR",
    amountMinor: isCzech ? blueprint.pricesCzk : blueprint.pricesEur,
    partnerAddon: {
      productKey: "blueprint_partner" as const,
      amountMinor: isCzech ? partnerAddon.pricesCzk : partnerAddon.pricesEur,
    },
    delivery: isCzech ? "Přístup po potvrzení platby" : "Access after payment confirmation",
    honorarium: {
      minimumAmountMinor: isCzech ? blueprint.pricesCzk : blueprint.pricesEur,
      suggestedTotalsMinor: isCzech ? [blueprint.pricesCzk, 39000, 59000] : [blueprint.pricesEur],
      maxVoluntaryTopUpMinor: 1_000_000,
    },
    benefits: isCzech
      ? [
          "Osobní PDF Blueprint",
          "5 navazujících AI výkladů",
          "Praktický výklad typu, autority a profilu",
        ]
      : [
          "Personal PDF Blueprint",
          "5 follow-up AI readings",
          "Practical interpretation of type, authority and profile",
        ],
  };
}

/**
 * Direction agreed for a future controlled release. These entries are not
 * payment products and cannot be sent to checkout until real provider price
 * IDs and unit economics have been approved.
 */
export const PROPOSED_MARIE_TIERS = [
  { key: "pulse", name: "Pulse", monthlyCzk: 6900, recommendedMonthlyCzk: 9900, annualCzk: 69000, recommendedAnnualCzk: 99000, activation: "HOLD" as const },
  { key: "plus", name: "Plus", monthlyCzk: 14900, recommendedMonthlyCzk: 19900, annualCzk: 149000, recommendedAnnualCzk: 199000, activation: "HOLD" as const },
  { key: "circle", name: "Circle", monthlyCzk: 29900, recommendedMonthlyCzk: 39900, annualCzk: 299000, recommendedAnnualCzk: 399000, activation: "HOLD" as const },
] as const;
