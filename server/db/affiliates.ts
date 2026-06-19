import { eq, desc } from "drizzle-orm";
import { users, affiliateConversions, InsertAffiliateConversion, affiliatePayouts, InsertAffiliatePayout } from "../../drizzle/schema";
import { getDb } from "./index";

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
    const aff = await db.select({ total: users.affiliateTotalEarned, pending: users.affiliatePendingPayout }).from(users).where(eq(users.id, data.affiliateUserId)).limit(1);
    const currentTotal = aff[0]?.total ?? 0;
    const currentPending = aff[0]?.pending ?? 0;

    await db.update(users).set({
        affiliateTotalEarned: currentTotal + data.commissionAmount,
        affiliatePendingPayout: currentPending + data.commissionAmount,
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
