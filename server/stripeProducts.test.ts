import { describe, expect, it } from "vitest";
import { canGenerateAiReading, FREE_TIER, STRIPE_PRODUCTS } from "./stripeProducts";

const freeUser = {
  subscriptionStatus: "none",
  subscriptionPlan: "none",
  subscriptionCurrentPeriodEnd: null,
  aiReadingCredits: 0,
};

describe("monetization product ladder", () => {
  it("keeps one complete AI reading in the free tier", () => {
    expect(FREE_TIER.AI_READINGS_LIMIT).toBe(1);
    expect(canGenerateAiReading(freeUser, 0).allowed).toBe(true);
    expect(canGenerateAiReading(freeUser, 1)).toEqual({
      allowed: false,
      reason: "free_limit_reached",
    });
  });

  it("allows purchased AI credits after the free reading is used", () => {
    expect(canGenerateAiReading({ ...freeUser, aiReadingCredits: 1 }, 5).allowed).toBe(true);
  });

  it("keeps the Blueprint honorarium and existing annual-upgrade contract explicit", () => {
    const blueprint = STRIPE_PRODUCTS.BLUEPRINT.pricesCzk;
    const annualUpgrade = STRIPE_PRODUCTS.BLUEPRINT_ANNUAL_UPGRADE.pricesCzk;
    expect(blueprint).toBe(29000);
    expect(STRIPE_PRODUCTS.BLUEPRINT_PARTNER_ADDON.pricesCzk).toBe(19000);
    expect(annualUpgrade).toBe(80000);
    expect(blueprint + annualUpgrade).toBe(109000);
    expect(STRIPE_PRODUCTS.PREMIUM_ANNUAL.pricesCzk).toBe(119000);
  });

  it("prices the brainwave audio at half of the former 390 CZK offer", () => {
    expect(STRIPE_PRODUCTS.BRAINWAVE_AUDIO.pricesCzk).toBe(19500);
  });
});
