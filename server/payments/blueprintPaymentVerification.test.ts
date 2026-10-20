import { describe, expect, it } from "vitest";
import { isVerifiedBlueprintPayment } from "./blueprintPaymentVerification";

const order = { payment_status: "CREATED", offer_key: "hd-blueprint-en", amount_minor: 1590, currency: "EUR" };
const paid = { status: "PAID", offerKey: "hd-blueprint-en", amountMinor: 1590, currency: "EUR" };

describe("Blueprint payment verification: fail closed", () => {
  it("rejects a paid gateway result without a matching local order", () => {
    expect(isVerifiedBlueprintPayment(null, paid)).toBe(false);
  });
  it("rejects provider offers with wrong amount, currency or offer", () => {
    expect(isVerifiedBlueprintPayment(order, { ...paid, amountMinor: 1 })).toBe(false);
    expect(isVerifiedBlueprintPayment(order, { ...paid, currency: "CZK" })).toBe(false);
    expect(isVerifiedBlueprintPayment(order, { ...paid, offerKey: "other" })).toBe(false);
    expect(isVerifiedBlueprintPayment(order, { ...paid, amountMinor: undefined })).toBe(false);
  });
  it("rejects non-canonical or corrupted local offers", () => {
    expect(isVerifiedBlueprintPayment({ ...order, amount_minor: 1 }, paid)).toBe(false);
    expect(isVerifiedBlueprintPayment({ ...order, offer_key: "unapproved" }, paid)).toBe(false);
  });
  it("accepts matching paid gateway status or previously trusted local PAID", () => {
    expect(isVerifiedBlueprintPayment(order, paid)).toBe(true);
    expect(isVerifiedBlueprintPayment(order, { ...paid, status: "CREATED" })).toBe(false);
    expect(isVerifiedBlueprintPayment({ ...order, payment_status: "PAID" }, null)).toBe(true);
    expect(isVerifiedBlueprintPayment({ ...order, payment_status: "CREATED" }, null)).toBe(false);
  });
  it("handles the canonical Czech payment and rejects a cross-offer match", () => {
    const cz = { payment_status: "CREATED", offer_key: "hd-blueprint-cz", amount_minor: 29000, currency: "CZK" };
    expect(isVerifiedBlueprintPayment(cz, { status: "PAID", offerKey: "hd-blueprint-cz", amountMinor: 29000, currency: "CZK" })).toBe(true);
    expect(isVerifiedBlueprintPayment(cz, paid)).toBe(false);
  });
});
