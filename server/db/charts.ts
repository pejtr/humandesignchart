import { eq, and, desc, sql } from "drizzle-orm";
import { charts, InsertChart, sharedCharts, InsertSharedChart } from "../../drizzle/schema";
import { getDb } from "./index";

export async function createChart(chart: InsertChart) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Production databases created by older migrations may not have the
    // schema-level default for this column. Always provide it explicitly so a
    // chart can be persisted reliably after a deployment or database restart.
    const values: InsertChart = {
        ...chart,
        isFavorite: chart.isFavorite ?? 0,
    };

    // Automatic save and the manual Save button can be triggered close
    // together. Reuse the existing chart instead of creating duplicates.
    const existing = await db
        .select({ id: charts.id })
        .from(charts)
        .where(and(
            eq(charts.userId, values.userId),
            eq(charts.name, values.name),
            eq(charts.birthDate, values.birthDate),
            eq(charts.birthTime, values.birthTime),
        ))
        .limit(1);

    if (existing[0]) {
        await db
            .update(charts)
            .set({
                birthPlace: values.birthPlace,
                latitude: values.latitude,
                longitude: values.longitude,
                timezone: values.timezone,
                category: values.category,
                chartData: values.chartData,
                updatedAt: new Date(),
            })
            .where(and(eq(charts.id, existing[0].id), eq(charts.userId, values.userId)));
        return existing[0].id;
    }

    const result = await db.insert(charts).values(values);
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
    if (chart.expiresAt && new Date(chart.expiresAt) < new Date()) return null;
    return chart;
}

export async function countTotalCharts(): Promise<number> {
    const db = await getDb();
    if (!db) return 0;
    const result = await db.select({ count: sql<number>`count(*)` }).from(charts);
    return result[0]?.count ?? 0;
}
