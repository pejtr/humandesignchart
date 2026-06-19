import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
    processStreakCheckIn, claimDailyReward, calculateUserLevel,
} from "../db";

export const gamificationRouter = router({
    checkIn: protectedProcedure.mutation(async ({ ctx }) => {
        const result = await processStreakCheckIn(ctx.user.id);
        return result;
    }),

    claimDailyReward: protectedProcedure.mutation(async ({ ctx }) => {
        const result = await claimDailyReward(ctx.user.id);
        return result;
    }),

    getStats: protectedProcedure.query(async ({ ctx }) => {
        const db = await (await import("../db")).getDb();
        if (!db) throw new Error("Database not available");
        const { eq: eqOp } = await import("drizzle-orm");
        const { users: usersTable, referrals: referralsTable } = await import("../../drizzle/schema");
        const user = await db.select().from(usersTable).where(eqOp(usersTable.id, ctx.user.id)).limit(1);
        if (!user[0]) throw new Error("User not found");
        const u = user[0];

        const referralRows = await db.select().from(referralsTable).where(eqOp(referralsTable.referrerId, ctx.user.id));
        const totalReferrals = referralRows.length;

        const subMonths = u.subscriptionStatus === "active" ? 1 : 0;
        const level = calculateUserLevel(u.totalCreditsEarned, totalReferrals, subMonths);

        const now = new Date();
        const lastClaim = u.lastDailyRewardAt;
        const dailyRewardAvailable = !lastClaim || (now.getTime() - new Date(lastClaim).getTime()) >= 24 * 60 * 60 * 1000;

        return {
            currentStreak: u.currentStreak,
            longestStreak: u.longestStreak,
            level,
            totalCreditsEarned: u.totalCreditsEarned,
            aiReadingCredits: u.aiReadingCredits,
            dailyRewardAvailable,
            lastDailyRewardAt: u.lastDailyRewardAt,
            totalReferrals,
        };
    }),
});
