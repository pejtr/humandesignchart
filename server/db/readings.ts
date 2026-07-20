import { eq, and, desc, gte, sql } from "drizzle-orm";
import { aiReadings, InsertAiReading, charts } from "../../drizzle/schema";
import { getDb } from "./index";

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

export async function countAiReadingsByUser(userId: number) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.select({ count: sql<number>`count(*)` }).from(aiReadings).where(eq(aiReadings.userId, userId));
    return result[0]?.count ?? 0;
}

export async function countAiReadingsByUserToday(userId: number) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const result = await db.select({ count: sql<number>`count(*)` })
        .from(aiReadings)
        .where(
            and(
                eq(aiReadings.userId, userId),
                gte(aiReadings.createdAt, startOfToday.toISOString())
            )
        );
    return result[0]?.count ?? 0;
}
