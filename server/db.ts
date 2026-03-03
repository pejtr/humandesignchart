import { eq, and, desc, gt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, charts, InsertChart, aiReadings, InsertAiReading, sharedCharts, InsertSharedChart } from "../drizzle/schema";
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
