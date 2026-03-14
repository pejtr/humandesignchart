import { eq, and, desc, gt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, charts, InsertChart, aiReadings, InsertAiReading, sharedCharts, InsertSharedChart, giftVouchers, InsertGiftVoucher, referrals, InsertReferral } from "../drizzle/schema";
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
