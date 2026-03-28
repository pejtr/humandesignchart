import { eq, and, desc, gt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, charts, InsertChart, aiReadings, InsertAiReading, sharedCharts, InsertSharedChart, giftVouchers, InsertGiftVoucher, referrals, InsertReferral, creditTransactions, affiliateConversions, InsertAffiliateConversion, affiliatePayouts, InsertAffiliatePayout } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ─── Chart Operations ────────────────────────────────────────────────────────

export async function createChart(chart: InsertChart) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(charts).values(chart);
  return result[0].insertId;
}

export async function getUserCharts(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(charts).where(eq(charts.userId, userId)).orderBy(desc(charts.updatedAt));
}

export async function getChartById(chartId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(charts)
    .where(and(eq(charts.id, chartId), eq(charts.userId, userId)))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateChart(chartId: number, userId: number, data: Partial<InsertChart>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(charts).set(data).where(and(eq(charts.id, chartId), eq(charts.userId, userId)));
}

export async function deleteChart(chartId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(charts).where(and(eq(charts.id, chartId), eq(charts.userId, userId)));
}

export async function toggleFavorite(chartId: number, userId: number, isFavorite: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(charts).set({ isFavorite }).where(and(eq(charts.id, chartId), eq(charts.userId, userId)));
}

// ─── AI Reading Operations ───────────────────────────────────────────────────

export async function createAiReading(reading: InsertAiReading) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(aiReadings).values(reading);
  return result[0].insertId;
}

export async function getAiReadings(chartId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(aiReadings)
    .where(and(eq(aiReadings.chartId, chartId), eq(aiReadings.userId, userId)))
    .orderBy(desc(aiReadings.createdAt));
}

export async function getAllReadingsByUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Join with charts to get chart name
  const rows = await db
    .select({
      id: aiReadings.id,
      chartId: aiReadings.chartId,
      readingType: aiReadings.readingType,
      content: aiReadings.content,
      rating: aiReadings.rating,
      createdAt: aiReadings.createdAt,
      chartName: charts.name,
    })
    .from(aiReadings)
    .leftJoin(charts, eq(aiReadings.chartId, charts.id))
    .where(eq(aiReadings.userId, userId))
    .orderBy(desc(aiReadings.createdAt));
  return rows;
}

export async function updateReadingRating(readingId: number, userId: number, rating: "up" | "down" | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(aiReadings)
    .set({ rating })
    .where(and(eq(aiReadings.id, readingId), eq(aiReadings.userId, userId)));
}

export async function getReadingById(readingId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(aiReadings)
    .where(and(eq(aiReadings.id, readingId), eq(aiReadings.userId, userId)))
    .limit(1);
  return result[0] ?? null;
}

// ─── Shared Reading Operations ──────────────────────────────────────────────

// ─── Shared Chart Operations ────────────────────────────────────────────────

export async function createSharedChart(data: InsertSharedChart) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(sharedCharts).values(data);
  return data.token;
}

export async function getSharedChart(token: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(sharedCharts)
    .where(eq(sharedCharts.token, token))
    .limit(1);
  if (result.length === 0) return null;
  const chart = result[0];
  // Check expiration
  if (chart.expiresAt && new Date(chart.expiresAt) < new Date()) return null;
  return chart;
}

// ─── Subscription / User Billing Operations ─────────────────────────────────

export async function updateUserSubscription(userId: number, data: {
  stripeCustomerId?: string;
  stripeSubscriptionId?: string | null;
  subscriptionStatus?: "active" | "canceled" | "past_due" | "trialing" | "none";
  subscriptionPlan?: "monthly" | "annual" | "none";
  subscriptionCurrentPeriodEnd?: Date | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set(data).where(eq(users.id, userId));
}

export async function addAiReadingCredits(userId: number, credits: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const user = await db.select({ credits: users.aiReadingCredits }).from(users).where(eq(users.id, userId)).limit(1);
  const current = user[0]?.credits ?? 0;
  await db.update(users).set({ aiReadingCredits: current + credits }).where(eq(users.id, userId));
}

export async function consumeAiReadingCredit(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const user = await db.select({ credits: users.aiReadingCredits }).from(users).where(eq(users.id, userId)).limit(1);
  const current = user[0]?.credits ?? 0;
  if (current > 0) {
    await db.update(users).set({ aiReadingCredits: current - 1 }).where(eq(users.id, userId));
    return true;
  }
  return false;
}

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result[0] ?? null;
}

export async function countAiReadingsByUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(aiReadings).where(eq(aiReadings.userId, userId));
  return result.length;
}

// ─── Gift Voucher Operations ─────────────────────────────────────────────────

export async function createGiftVoucher(voucher: InsertGiftVoucher) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(giftVouchers).values(voucher);
  return result[0].insertId;
}

export async function getGiftVoucherByCode(code: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(giftVouchers).where(eq(giftVouchers.code, code)).limit(1);
  return result[0] ?? null;
}

export async function redeemGiftVoucher(code: string, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(giftVouchers)
    .set({ isRedeemed: true, redeemedByUserId: userId, redeemedAt: new Date() })
    .where(eq(giftVouchers.code, code));
}

// ─── Referral Operations ───────────────────────────────────────────────────────────────────────

export async function getUserByReferralCode(code: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(users).where(eq(users.referralCode, code)).limit(1);
  return result[0] ?? null;
}

export async function setUserReferralCode(userId: number, code: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ referralCode: code }).where(eq(users.id, userId));
}

export async function createReferral(data: InsertReferral) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(referrals).values(data);
  return result[0].insertId;
}

export async function getReferralByReferredUser(referredUserId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(referrals).where(eq(referrals.referredUserId, referredUserId)).limit(1);
  return result[0] ?? null;
}

export async function getReferralsByReferrer(referrerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(referrals).where(eq(referrals.referrerId, referrerId)).orderBy(desc(referrals.createdAt));
}

export async function markReferralCompleted(referralId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(referrals)
    .set({ status: "completed", referrerCredited: true, referredCredited: true, completedAt: new Date() })
    .where(eq(referrals.id, referralId));
}

// ─── Gamification Operations ──────────────────────────────────────────────────

export async function logCreditTransaction(userId: number, amount: number, reason: string, metadata?: Record<string, unknown>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(creditTransactions).values({ userId, amount, reason, metadata: metadata ?? null });
}

export async function addCreditsWithLog(userId: number, amount: number, reason: string, metadata?: Record<string, unknown>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const user = await db.select({ credits: users.aiReadingCredits, totalEarned: users.totalCreditsEarned }).from(users).where(eq(users.id, userId)).limit(1);
  const current = user[0]?.credits ?? 0;
  const totalEarned = user[0]?.totalEarned ?? 0;
  await db.update(users).set({
    aiReadingCredits: current + amount,
    totalCreditsEarned: totalEarned + (amount > 0 ? amount : 0),
  }).where(eq(users.id, userId));
  await logCreditTransaction(userId, amount, reason, metadata);
}

export async function processStreakCheckIn(userId: number): Promise<{ streakUpdated: boolean; newStreak: number; creditsAwarded: number; streakBroken: boolean }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const user = await db.select({
    currentStreak: users.currentStreak,
    longestStreak: users.longestStreak,
    lastLoginDate: users.lastLoginDate,
    aiReadingCredits: users.aiReadingCredits,
    totalCreditsEarned: users.totalCreditsEarned,
  }).from(users).where(eq(users.id, userId)).limit(1);

  if (!user[0]) throw new Error("User not found");

  const { currentStreak, longestStreak, lastLoginDate } = user[0];

  // Already checked in today
  if (lastLoginDate === today) {
    return { streakUpdated: false, newStreak: currentStreak, creditsAwarded: 0, streakBroken: false };
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  let newStreak: number;
  let streakBroken = false;

  if (lastLoginDate === yesterdayStr) {
    // Consecutive day
    newStreak = currentStreak + 1;
  } else {
    // Streak broken
    newStreak = 1;
    streakBroken = currentStreak >= 3;
  }

  const newLongest = Math.max(longestStreak, newStreak);

  // Award 0.1 credit per day (stored as integer: 1 = 0.1 credits via 10x multiplier)
  // We use integer credits, so award 1 credit per 10 days, or use a fractional approach
  // For simplicity: award 1 credit every 7-day streak milestone, 0 otherwise
  let creditsAwarded = 0;
  if (newStreak % 7 === 0) {
    creditsAwarded = 1; // 1 free reading every 7-day streak
  }

  await db.update(users).set({
    currentStreak: newStreak,
    longestStreak: newLongest,
    lastLoginDate: today,
    aiReadingCredits: user[0].aiReadingCredits + creditsAwarded,
    totalCreditsEarned: user[0].totalCreditsEarned + creditsAwarded,
  }).where(eq(users.id, userId));

  if (creditsAwarded > 0) {
    await logCreditTransaction(userId, creditsAwarded, "streak_bonus", { streakDay: newStreak });
  }

  return { streakUpdated: true, newStreak, creditsAwarded, streakBroken };
}

export async function claimDailyReward(userId: number): Promise<{ success: boolean; creditsAwarded: number; alreadyClaimed: boolean }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const user = await db.select({
    lastDailyRewardAt: users.lastDailyRewardAt,
    aiReadingCredits: users.aiReadingCredits,
    totalCreditsEarned: users.totalCreditsEarned,
  }).from(users).where(eq(users.id, userId)).limit(1);

  if (!user[0]) throw new Error("User not found");

  const now = new Date();
  const lastClaim = user[0].lastDailyRewardAt;

  // Check if already claimed today (24h cooldown)
  if (lastClaim) {
    const hoursSince = (now.getTime() - new Date(lastClaim).getTime()) / (1000 * 60 * 60);
    if (hoursSince < 24) {
      return { success: false, creditsAwarded: 0, alreadyClaimed: true };
    }
  }

  // Random reward: 1 credit (simplified — could be 0.1-0.5 with fractional system)
  const creditsAwarded = 1;

  await db.update(users).set({
    lastDailyRewardAt: now,
    aiReadingCredits: user[0].aiReadingCredits + creditsAwarded,
    totalCreditsEarned: user[0].totalCreditsEarned + creditsAwarded,
  }).where(eq(users.id, userId));

  await logCreditTransaction(userId, creditsAwarded, "daily_reward");

  return { success: true, creditsAwarded, alreadyClaimed: false };
}

export function calculateUserLevel(totalCreditsEarned: number, totalReferrals: number, subscriptionMonths: number): "searcher" | "awakened" | "initiated" | "guide" | "master" {
  if (subscriptionMonths >= 12 || totalReferrals >= 50) return "master";
  if (totalReferrals >= 21) return "guide";
  if (subscriptionMonths >= 1 || totalReferrals >= 5) return "initiated";
  if (totalCreditsEarned >= 3 || totalReferrals >= 1) return "awakened";
  return "searcher";
}

// ─── Affiliate Operations ─────────────────────────────────────────────────────

export async function activateAffiliate(userId: number, affiliateCode: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ isAffiliate: true, affiliateCode }).where(eq(users.id, userId));
}

export async function getUserByAffiliateCode(code: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(users).where(eq(users.affiliateCode, code)).limit(1);
  return result[0] ?? null;
}

export async function createAffiliateConversion(data: InsertAffiliateConversion) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(affiliateConversions).values(data);
  // Update affiliate's pending payout
  await db.update(users).set({
    affiliateTotalEarned: (await db.select({ v: users.affiliateTotalEarned }).from(users).where(eq(users.id, data.affiliateUserId)).limit(1))[0]?.v ?? 0 + data.commissionAmount,
    affiliatePendingPayout: (await db.select({ v: users.affiliatePendingPayout }).from(users).where(eq(users.id, data.affiliateUserId)).limit(1))[0]?.v ?? 0 + data.commissionAmount,
  }).where(eq(users.id, data.affiliateUserId));
  return result[0].insertId;
}

export async function getAffiliateConversions(affiliateUserId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(affiliateConversions)
    .where(eq(affiliateConversions.affiliateUserId, affiliateUserId))
    .orderBy(desc(affiliateConversions.createdAt));
}

export async function createAffiliatePayout(data: InsertAffiliatePayout) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(affiliatePayouts).values(data);
  return result[0].insertId;
}

export async function getAffiliatePayouts(affiliateUserId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(affiliatePayouts)
    .where(eq(affiliatePayouts.affiliateUserId, affiliateUserId))
    .orderBy(desc(affiliatePayouts.createdAt));
}
