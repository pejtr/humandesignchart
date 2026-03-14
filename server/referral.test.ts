import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock DB helpers ─────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getUserById: vi.fn(),
  getUserByReferralCode: vi.fn(),
  setUserReferralCode: vi.fn(),
  createReferral: vi.fn(),
  getReferralByReferredUser: vi.fn(),
  getReferralsByReferrer: vi.fn(),
  addAiReadingCredits: vi.fn(),
}));

import {
  getUserById,
  getUserByReferralCode,
  setUserReferralCode,
  createReferral,
  getReferralByReferredUser,
  getReferralsByReferrer,
  addAiReadingCredits,
} from "./db";

// ─── Referral logic helpers (extracted for unit testing) ─────────────────────

/**
 * Generates a referral code for a user if they don't have one.
 * Returns the existing or newly generated code.
 */
async function ensureReferralCode(userId: number): Promise<string> {
  const user = await getUserById(userId);
  if (!user) throw new Error("User not found");
  if (user.referralCode) return user.referralCode;
  const crypto = await import("crypto");
  const code = crypto.randomBytes(4).toString("hex").toUpperCase();
  await setUserReferralCode(userId, code);
  return code;
}

/**
 * Applies a referral code for a new user.
 * Returns success/failure with a reason.
 */
async function applyReferral(
  newUserId: number,
  referralCode: string
): Promise<{ success: boolean; reason?: string }> {
  const existing = await getReferralByReferredUser(newUserId);
  if (existing) return { success: false, reason: "already_referred" };

  const referrer = await getUserByReferralCode(referralCode.toUpperCase());
  if (!referrer) return { success: false, reason: "invalid_code" };
  if (referrer.id === newUserId) return { success: false, reason: "self_referral" };

  await createReferral({
    referrerId: referrer.id,
    referredUserId: newUserId,
    referralCode: referralCode.toUpperCase(),
    status: "completed",
    referrerCredited: true,
    referredCredited: true,
    completedAt: new Date(),
  });

  await addAiReadingCredits(referrer.id, 1);
  await addAiReadingCredits(newUserId, 1);

  return { success: true };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("Referral Program", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("ensureReferralCode", () => {
    it("returns existing code if user already has one", async () => {
      vi.mocked(getUserById).mockResolvedValue({
        id: 1,
        referralCode: "ABCD1234",
      } as any);

      const code = await ensureReferralCode(1);
      expect(code).toBe("ABCD1234");
      expect(setUserReferralCode).not.toHaveBeenCalled();
    });

    it("generates and saves a new code if user has none", async () => {
      vi.mocked(getUserById).mockResolvedValue({
        id: 1,
        referralCode: null,
      } as any);
      vi.mocked(setUserReferralCode).mockResolvedValue(undefined);

      const code = await ensureReferralCode(1);
      expect(code).toMatch(/^[A-F0-9]{8}$/);
      expect(setUserReferralCode).toHaveBeenCalledWith(1, code);
    });

    it("throws if user not found", async () => {
      vi.mocked(getUserById).mockResolvedValue(null);
      await expect(ensureReferralCode(999)).rejects.toThrow("User not found");
    });
  });

  describe("applyReferral", () => {
    it("awards 1 credit to both referrer and new user on success", async () => {
      vi.mocked(getReferralByReferredUser).mockResolvedValue(null);
      vi.mocked(getUserByReferralCode).mockResolvedValue({ id: 10 } as any);
      vi.mocked(createReferral).mockResolvedValue(1 as any);
      vi.mocked(addAiReadingCredits).mockResolvedValue(undefined);

      const result = await applyReferral(20, "ABCD1234");

      expect(result).toEqual({ success: true });
      expect(addAiReadingCredits).toHaveBeenCalledWith(10, 1); // referrer
      expect(addAiReadingCredits).toHaveBeenCalledWith(20, 1); // new user
      expect(addAiReadingCredits).toHaveBeenCalledTimes(2);
    });

    it("rejects if user was already referred", async () => {
      vi.mocked(getReferralByReferredUser).mockResolvedValue({ id: 5 } as any);

      const result = await applyReferral(20, "ABCD1234");
      expect(result).toEqual({ success: false, reason: "already_referred" });
      expect(addAiReadingCredits).not.toHaveBeenCalled();
    });

    it("rejects if referral code is invalid", async () => {
      vi.mocked(getReferralByReferredUser).mockResolvedValue(null);
      vi.mocked(getUserByReferralCode).mockResolvedValue(null);

      const result = await applyReferral(20, "INVALID");
      expect(result).toEqual({ success: false, reason: "invalid_code" });
      expect(addAiReadingCredits).not.toHaveBeenCalled();
    });

    it("rejects self-referral", async () => {
      vi.mocked(getReferralByReferredUser).mockResolvedValue(null);
      vi.mocked(getUserByReferralCode).mockResolvedValue({ id: 20 } as any);

      const result = await applyReferral(20, "SELFCODE");
      expect(result).toEqual({ success: false, reason: "self_referral" });
      expect(addAiReadingCredits).not.toHaveBeenCalled();
    });

    it("normalizes referral code to uppercase", async () => {
      vi.mocked(getReferralByReferredUser).mockResolvedValue(null);
      vi.mocked(getUserByReferralCode).mockResolvedValue({ id: 10 } as any);
      vi.mocked(createReferral).mockResolvedValue(1 as any);
      vi.mocked(addAiReadingCredits).mockResolvedValue(undefined);

      await applyReferral(20, "abcd1234");
      expect(getUserByReferralCode).toHaveBeenCalledWith("ABCD1234");
    });
  });
});
