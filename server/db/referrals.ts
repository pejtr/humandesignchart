import { eq, desc } from "drizzle-orm";
import { giftVouchers, InsertGiftVoucher, referrals, InsertReferral, users } from "../../drizzle/schema";
import { getDb } from "./index";

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
