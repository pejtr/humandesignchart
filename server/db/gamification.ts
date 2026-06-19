import { eq } from "drizzle-orm";
import { users, creditTransactions } from "../../drizzle/schema";
import { getDb } from "./index";

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

    const today = new Date().toISOString().slice(0, 10);
    const user = await db.select({
        currentStreak: users.currentStreak,
        longestStreak: users.longestStreak,
        lastLoginDate: users.lastLoginDate,
        aiReadingCredits: users.aiReadingCredits,
        totalCreditsEarned: users.totalCreditsEarned,
    }).from(users).where(eq(users.id, userId)).limit(1);

    if (!user[0]) throw new Error("User not found");
    const { currentStreak, longestStreak, lastLoginDate } = user[0];

    if (lastLoginDate === today) {
        return { streakUpdated: false, newStreak: currentStreak, creditsAwarded: 0, streakBroken: false };
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    let newStreak: number;
    let streakBroken = false;

    if (lastLoginDate === yesterdayStr) {
        newStreak = currentStreak + 1;
    } else {
        newStreak = 1;
        streakBroken = currentStreak >= 3;
    }

    const newLongest = Math.max(longestStreak, newStreak);
    let creditsAwarded = 0;
    if (newStreak % 7 === 0) {
        creditsAwarded = 1;
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

    if (lastClaim) {
        const hoursSince = (now.getTime() - new Date(lastClaim).getTime()) / (1000 * 60 * 60);
        if (hoursSince < 24) {
            return { success: false, creditsAwarded: 0, alreadyClaimed: true };
        }
    }

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
