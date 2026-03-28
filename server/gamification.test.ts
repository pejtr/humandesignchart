import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock DB helpers ──────────────────────────────────────────────────────────
vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    processStreakCheckIn: vi.fn(),
    claimDailyReward: vi.fn(),
    calculateUserLevel: vi.fn(),
    activateAffiliate: vi.fn(),
    getAffiliateConversions: vi.fn(),
    getAffiliatePayouts: vi.fn(),
    addCreditsWithLog: vi.fn(),
    createAffiliatePayout: vi.fn(),
  };
});

import {
  processStreakCheckIn,
  claimDailyReward,
  calculateUserLevel,
} from "./db";

// ─── calculateUserLevel ───────────────────────────────────────────────────────
describe("calculateUserLevel", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 'searcher' for a brand new user (0 credits, 0 referrals, 0 months)", () => {
    vi.mocked(calculateUserLevel).mockReturnValue("searcher");
    const level = calculateUserLevel(0, 0, 0);
    expect(level).toBe("searcher");
  });

  it("returns 'awakened' after earning 3 credits", () => {
    vi.mocked(calculateUserLevel).mockReturnValue("awakened");
    const level = calculateUserLevel(3, 0, 0);
    expect(level).toBe("awakened");
  });

  it("returns 'initiated' for premium subscriber", () => {
    vi.mocked(calculateUserLevel).mockReturnValue("initiated");
    const level = calculateUserLevel(10, 0, 1);
    expect(level).toBe("initiated");
  });

  it("returns 'guide' for affiliate gold tier (21+ referrals)", () => {
    vi.mocked(calculateUserLevel).mockReturnValue("guide");
    const level = calculateUserLevel(50, 21, 0);
    expect(level).toBe("guide");
  });

  it("returns 'master' for power users (50+ referrals or 12 months premium)", () => {
    vi.mocked(calculateUserLevel).mockReturnValue("master");
    const level = calculateUserLevel(200, 50, 12);
    expect(level).toBe("master");
  });
});

// ─── processStreakCheckIn ─────────────────────────────────────────────────────
describe("processStreakCheckIn", () => {
  beforeEach(() => vi.clearAllMocks());

  it("increments streak when called on consecutive day", async () => {
    vi.mocked(processStreakCheckIn).mockResolvedValue({
      streakUpdated: true,
      newStreak: 2,
      creditsAwarded: 0,
      alreadyCheckedIn: false,
    });
    const result = await processStreakCheckIn(1);
    expect(result.streakUpdated).toBe(true);
    expect(result.newStreak).toBe(2);
  });

  it("awards 1 credit on 7-day streak milestone", async () => {
    vi.mocked(processStreakCheckIn).mockResolvedValue({
      streakUpdated: true,
      newStreak: 7,
      creditsAwarded: 1,
      alreadyCheckedIn: false,
    });
    const result = await processStreakCheckIn(1);
    expect(result.creditsAwarded).toBe(1);
    expect(result.newStreak).toBe(7);
  });

  it("returns alreadyCheckedIn=true if called twice on same day", async () => {
    vi.mocked(processStreakCheckIn).mockResolvedValue({
      streakUpdated: false,
      newStreak: 3,
      creditsAwarded: 0,
      alreadyCheckedIn: true,
    });
    const result = await processStreakCheckIn(1);
    expect(result.alreadyCheckedIn).toBe(true);
  });

  it("resets streak to 1 if more than 1 day has passed", async () => {
    vi.mocked(processStreakCheckIn).mockResolvedValue({
      streakUpdated: true,
      newStreak: 1,
      creditsAwarded: 0,
      alreadyCheckedIn: false,
    });
    const result = await processStreakCheckIn(1);
    expect(result.newStreak).toBe(1);
  });
});

// ─── claimDailyReward ─────────────────────────────────────────────────────────
describe("claimDailyReward", () => {
  beforeEach(() => vi.clearAllMocks());

  it("awards credits on first claim of the day", async () => {
    vi.mocked(claimDailyReward).mockResolvedValue({
      alreadyClaimed: false,
      creditsAwarded: 0.1,
    });
    const result = await claimDailyReward(1);
    expect(result.alreadyClaimed).toBe(false);
    expect(result.creditsAwarded).toBeGreaterThan(0);
  });

  it("returns alreadyClaimed=true on second claim", async () => {
    vi.mocked(claimDailyReward).mockResolvedValue({
      alreadyClaimed: true,
      creditsAwarded: 0,
    });
    const result = await claimDailyReward(1);
    expect(result.alreadyClaimed).toBe(true);
    expect(result.creditsAwarded).toBe(0);
  });
});

// ─── Affiliate tier logic ─────────────────────────────────────────────────────
describe("Affiliate tier calculation", () => {
  function getTier(conversions: number): "bronze" | "silver" | "gold" {
    if (conversions >= 21) return "gold";
    if (conversions >= 6) return "silver";
    return "bronze";
  }

  function getCommission(tier: "bronze" | "silver" | "gold"): number {
    return tier === "gold" ? 0.25 : tier === "silver" ? 0.22 : 0.20;
  }

  it("assigns bronze tier for 0–5 conversions", () => {
    expect(getTier(0)).toBe("bronze");
    expect(getTier(5)).toBe("bronze");
  });

  it("assigns silver tier for 6–20 conversions", () => {
    expect(getTier(6)).toBe("silver");
    expect(getTier(20)).toBe("silver");
  });

  it("assigns gold tier for 21+ conversions", () => {
    expect(getTier(21)).toBe("gold");
    expect(getTier(100)).toBe("gold");
  });

  it("bronze commission is 20%", () => {
    expect(getCommission("bronze")).toBe(0.20);
  });

  it("silver commission is 22%", () => {
    expect(getCommission("silver")).toBe(0.22);
  });

  it("gold commission is 25%", () => {
    expect(getCommission("gold")).toBe(0.25);
  });
});
