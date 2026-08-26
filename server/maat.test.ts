import { describe, it, expect } from "vitest";
import { MaatGate, MaatLedger, HoukavecEngine } from "./maat";

describe("MAAT NEUROHIVE 5.55 — Governance & Ledger Engine", () => {
  it("should enforce MAAT Veto policies correctly", () => {
    expect(MaatGate.validateMonetizationAction("AUTOMATIC_PRICE_CHANGE").allowed).toBe(false);
    expect(MaatGate.validateMonetizationAction("IN_MAP_ADS").allowed).toBe(false);
    expect(MaatGate.validateMonetizationAction("LIFETIME_UNLIMITED_AI").allowed).toBe(false);
    expect(MaatGate.validateMonetizationAction("DUPLICATE_VIP_CLUB").allowed).toBe(false);
    expect(MaatGate.validateMonetizationAction("SELL_USER_DATA").allowed).toBe(false);

    expect(MaatGate.validateMonetizationAction("OFFER_DEEP_READING").allowed).toBe(true);
    expect(MaatGate.validateMonetizationAction("OFFER_MARIE_PLUS").allowed).toBe(true);
  });

  it("should evaluate system health gate correctly", () => {
    const healthy = MaatGate.evaluateSystemHealth({
      reliabilityPercent: 99.8,
      refundRatePercent: 1.2,
      aiCostToRevenueRatio: 0.20,
      securityIncidentsCount: 0,
    });
    expect(healthy.healthStatus).toBe("GREEN");
    expect(healthy.discretionaryPayoutAllowed).toBe(true);

    const degraded = MaatGate.evaluateSystemHealth({
      reliabilityPercent: 98.2,
      refundRatePercent: 6.5,
      aiCostToRevenueRatio: 0.30,
      securityIncidentsCount: 0,
    });
    expect(degraded.healthStatus).toBe("YELLOW");
    expect(degraded.discretionaryPayoutAllowed).toBe(false);
  });

  it("should calculate 88.8 Capital Architecture surplus allocations accurately", () => {
    const result = MaatLedger.calculateCapitalArchitecture({
      grossRevenueCzk: 100000,
      vatRatePercent: 21,
      refundsCzk: 1000,
      merchantFeePercent: 1.5,
      aiTokenCostCzk: 10000,
      infrastructureCostCzk: 5000,
      supportCostCzk: 3000,
    });

    expect(result.grossRevenueCzk).toBe(100000);
    expect(result.netSurplusCzk).toBeGreaterThan(0);
    expect(result.allocations.retainedInSystemCzk).toBeGreaterThan(result.allocations.maxExternalExtractionCzk);
  });

  it("should generate non-executing Houkavec advisory recommendations", () => {
    const recs = HoukavecEngine.getRecommendations({
      freeConversionRate: 0.03,
      mariePlusRetentionMonth1: 0.60,
    });
    expect(recs.length).toBeGreaterThan(0);
    expect(recs.every(r => r.requiresHumanApproval)).toBe(true);
  });
});
