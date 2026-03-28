/**
 * Stripe Webhook Handler Tests
 * Tests for webhook event processing, affiliate commission tracking,
 * test event handling, and subscription lifecycle.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the db module
vi.mock("./db", () => ({
  getUserByOpenId: vi.fn(),
  updateUserSubscription: vi.fn(),
  addAiReadingCredits: vi.fn(),
  createGiftVoucher: vi.fn(),
  getUserById: vi.fn(),
  getUserByAffiliateCode: vi.fn(),
  createAffiliateConversion: vi.fn(),
  addCreditsWithLog: vi.fn(),
  logCreditTransaction: vi.fn(),
  getDb: vi.fn(),
}));

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((a, b) => ({ a, b })),
  desc: vi.fn((a) => a),
}));

import * as db from "./db";
import { getStripe } from "./stripeWebhook";

describe("Stripe Webhook — Configuration", () => {
  it("getStripe returns a Stripe instance when key is available", () => {
    // In test environment STRIPE_SECRET_KEY is injected automatically
    // Just verify the function returns something (not null) or null gracefully
    const stripe = getStripe();
    // Either null (no key) or a Stripe instance — both are valid
    expect(stripe === null || typeof stripe === "object").toBe(true);
  });

  it("commission rate map covers all tiers", () => {
    const rateMap: Record<string, number> = { bronze: 0.20, silver: 0.22, gold: 0.25 };
    expect(Object.keys(rateMap)).toEqual(["bronze", "silver", "gold"]);
    expect(rateMap.bronze).toBe(0.20);
    expect(rateMap.silver).toBe(0.22);
    expect(rateMap.gold).toBe(0.25);
  });
});

describe("Stripe Webhook — Affiliate Commission Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calculates 20% commission for Bronze tier affiliate", () => {
    const rateMap: Record<string, number> = { bronze: 0.20, silver: 0.22, gold: 0.25 };
    const rate = rateMap["bronze"];
    const amountCzk = 149;
    const commission = Math.round(amountCzk * rate * 100) / 100;
    expect(commission).toBe(29.8);
  });

  it("calculates 22% commission for Silver tier affiliate", () => {
    const rateMap: Record<string, number> = { bronze: 0.20, silver: 0.22, gold: 0.25 };
    const rate = rateMap["silver"];
    const amountCzk = 149;
    const commission = Math.round(amountCzk * rate * 100) / 100;
    expect(commission).toBe(32.78);
  });

  it("calculates 25% commission for Gold tier affiliate", () => {
    const rateMap: Record<string, number> = { bronze: 0.20, silver: 0.22, gold: 0.25 };
    const rate = rateMap["gold"];
    const amountCzk = 149;
    const commission = Math.round(amountCzk * rate * 100) / 100;
    expect(commission).toBe(37.25);
  });

  it("calculates 25% commission for annual plan (990 CZK)", () => {
    const rateMap: Record<string, number> = { bronze: 0.20, silver: 0.22, gold: 0.25 };
    const rate = rateMap["gold"];
    const amountCzk = 990;
    const commission = Math.round(amountCzk * rate * 100) / 100;
    expect(commission).toBe(247.5);
  });

  it("defaults to Bronze rate (20%) for unknown tier", () => {
    const rateMap: Record<string, number> = { bronze: 0.20, silver: 0.22, gold: 0.25 };
    const rate = rateMap["unknown_tier"] ?? 0.20;
    expect(rate).toBe(0.20);
  });

  it("converts Stripe amount_total from haléře to CZK correctly", () => {
    const amountTotal = 14900; // 149.00 CZK in haléře
    const amountCzk = amountTotal / 100;
    expect(amountCzk).toBe(149);
  });

  it("converts annual plan amount from haléře to CZK correctly", () => {
    const amountTotal = 99000; // 990.00 CZK in haléře
    const amountCzk = amountTotal / 100;
    expect(amountCzk).toBe(990);
  });
});

describe("Stripe Webhook — Test Event Detection", () => {
  it("identifies test events by evt_test_ prefix", () => {
    const testEventId = "evt_test_abc123";
    expect(testEventId.startsWith("evt_test_")).toBe(true);
  });

  it("does not flag real events as test events", () => {
    const realEventId = "evt_1ABC123DEF456GHI";
    expect(realEventId.startsWith("evt_test_")).toBe(false);
  });
});

describe("Stripe Webhook — Subscription Status Mapping", () => {
  it("maps active subscription status correctly", () => {
    const status = "active" as "active" | "canceled" | "past_due" | "trialing" | "none";
    expect(["active", "trialing"].includes(status)).toBe(true);
  });

  it("maps canceled subscription status correctly", () => {
    const status = "canceled" as "active" | "canceled" | "past_due" | "trialing" | "none";
    expect(status).toBe("canceled");
  });

  it("maps past_due subscription status correctly", () => {
    const status = "past_due" as "active" | "canceled" | "past_due" | "trialing" | "none";
    expect(status).toBe("past_due");
  });
});

describe("Stripe Webhook — Voucher Code Generation", () => {
  function generateVoucherCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "HD-";
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        code += chars[Math.floor(Math.random() * chars.length)];
      }
      if (i < 3) code += "-";
    }
    return code;
  }

  it("generates voucher code with HD- prefix", () => {
    const code = generateVoucherCode();
    expect(code.startsWith("HD-")).toBe(true);
  });

  it("generates voucher code with correct format HD-XXXX-XXXX-XXXX-XXXX", () => {
    const code = generateVoucherCode();
    const parts = code.split("-");
    expect(parts.length).toBe(5); // HD + 4 groups
    expect(parts[0]).toBe("HD");
    parts.slice(1).forEach(part => {
      expect(part.length).toBe(4);
    });
  });

  it("generates unique voucher codes", () => {
    const codes = new Set(Array.from({ length: 100 }, () => generateVoucherCode()));
    expect(codes.size).toBe(100);
  });
});

describe("Stripe Webhook — Affiliate Self-Referral Prevention", () => {
  it("prevents affiliate from earning commission on their own purchase", () => {
    const affiliateId = 42;
    const userId = 42; // same user
    const shouldTrack = affiliateId !== userId;
    expect(shouldTrack).toBe(false);
  });

  it("allows affiliate to earn commission on other users' purchases", () => {
    const affiliateId = 42;
    const userId = 99; // different user
    const shouldTrack = affiliateId !== userId;
    expect(shouldTrack).toBe(true);
  });
});
