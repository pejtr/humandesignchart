import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = (file: string) =>
  readFileSync(resolve(process.cwd(), "client/src/pages", file), "utf8");

describe("P0 purchase and lead tracking integrity", () => {
  it("records exactly one GA4 purchase event, using the standard lowercase name", () => {
    const payment = source("PaymentSuccess.tsx");
    expect(payment.match(/trackGA4Event\("purchase"/g)).toHaveLength(1);
    expect(payment).not.toMatch(/trackGA4Event\("Purchase"/);
    expect(payment).toContain("verifyPaymentQuery.data?.verified && refId");
    expect(payment).toContain("hd-purchase-tracked:");
  });

  it("does not attribute a free chart calculation as an account registration", () => {
    const calculator = source("ChartCalculator.tsx");
    expect(calculator).toContain('trackGA4Event("ChartGenerated"');
    expect(calculator).not.toContain('measureOpenAIAdsEvent("registration_completed"');
  });

  it("tracks a checkout start only after checkout creation succeeds", () => {
    const pricing = source("Pricing.tsx");
    expect(pricing).toContain('trackGA4Event("CheckoutStarted"');
    expect(pricing).toContain('measureOpenAIAdsEvent("checkout_started"');
    expect(pricing.indexOf('trackGA4Event("CheckoutStarted"')).toBeGreaterThan(pricing.indexOf("onSuccess:"));
  });
});
