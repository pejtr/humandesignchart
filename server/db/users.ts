import { eq, sql } from "drizzle-orm";
import { users, InsertUser } from "../../drizzle/schema";
import { getDb } from "./index";
import { ENV } from "../_core/env";

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
            // The production database predates the Drizzle defaults on these
            // NOT NULL columns. Supplying them explicitly keeps new OAuth users
            // insertable without mutating existing affiliate data on updates.
            isAffiliate: user.isAffiliate ?? 0,
            affiliateTotalEarned: user.affiliateTotalEarned ?? 0,
            affiliatePendingPayout: user.affiliatePendingPayout ?? 0,
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

        const formatMysqlDate = () => new Date().toISOString().slice(0, 19).replace('T', ' ');

        if (!values.lastSignedIn) {
            values.lastSignedIn = formatMysqlDate();
        }

        if (Object.keys(updateSet).length === 0) {
            updateSet.lastSignedIn = formatMysqlDate();
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
    if (!db) return undefined;
    const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
    return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(userId: number) {
    const db = await getDb();
    if (!db) return null;
    const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    return result[0] ?? null;
}

export async function updateUserSubscription(userId: number, data: Partial<{
    stripeCustomerId: string;
    stripeSubscriptionId: string | null;
    subscriptionStatus: "active" | "canceled" | "past_due" | "trialing" | "none";
    subscriptionPlan: "monthly" | "annual" | "lifetime" | "none";
    subscriptionCurrentPeriodEnd: Date | string | null;
}>) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.update(users).set(data).where(eq(users.id, userId));
}

export async function addAiReadingCredits(userId: number, credits: number) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    // Atomic increment — no read-modify-write race condition
    await db.update(users).set({
        aiReadingCredits: sql`COALESCE(${users.aiReadingCredits}, 0) + ${credits}`,
    }).where(eq(users.id, userId));
}

export async function consumeAiReadingCredit(userId: number) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    // Atomic decrement with floor at 0 — only decrements if > 0
    const result = await db.update(users).set({
        aiReadingCredits: sql`GREATEST(COALESCE(${users.aiReadingCredits}, 0) - 1, 0)`,
    }).where(eq(users.id, userId));
    // Check if any row was affected (credits were > 0)
    return (result[0] as any).affectedRows > 0;
}
export async function updateUserPreferences(userId: number, preferences: Record<string, boolean>) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.update(users).set({ notificationPreferences: preferences }).where(eq(users.id, userId));
}
