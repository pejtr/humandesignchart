import { eq } from "drizzle-orm";
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
            values.lastSignedIn = new Date().toISOString();
        }

        if (Object.keys(updateSet).length === 0) {
            updateSet.lastSignedIn = new Date().toISOString();
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
    subscriptionPlan: "monthly" | "annual" | "none";
    subscriptionCurrentPeriodEnd: Date | null;
}>) {
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
export async function updateUserPreferences(userId: number, preferences: any) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.update(users).set({ notificationPreferences: preferences }).where(eq(users.id, userId));
}
