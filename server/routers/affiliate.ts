import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
    activateAffiliate, getAffiliateConversions,
    getAffiliatePayouts, createAffiliatePayout,
} from "../db";
import { getAffiliateTier, getCommissionRate } from "../services/affiliate";

export const affiliateRouter = router({
    activate: protectedProcedure.mutation(async ({ ctx }) => {
        const db = await (await import("../db")).getDb();
        if (!db) throw new Error("Database not available");
        const { eq: eqOp } = await import("drizzle-orm");
        const { users: usersTable } = await import("../../drizzle/schema");
        const user = await db.select({ isAffiliate: usersTable.isAffiliate, affiliateCode: usersTable.affiliateCode }).from(usersTable).where(eqOp(usersTable.id, ctx.user.id)).limit(1);
        if (!user[0]) throw new Error("User not found");
        if (user[0].isAffiliate && user[0].affiliateCode) {
            return { success: true, affiliateCode: user[0].affiliateCode, alreadyActive: true };
        }
        const code = "AF" + Math.random().toString(36).substring(2, 8).toUpperCase();
        await activateAffiliate(ctx.user.id, code);
        return { success: true, affiliateCode: code, alreadyActive: false };
    }),

    getStats: protectedProcedure.query(async ({ ctx }) => {
        const db = await (await import("../db")).getDb();
        if (!db) throw new Error("Database not available");
        const { eq: eqOp } = await import("drizzle-orm");
        const { users: usersTable } = await import("../../drizzle/schema");
        const user = await db.select({
            isAffiliate: usersTable.isAffiliate,
            affiliateCode: usersTable.affiliateCode,
            affiliateTier: usersTable.affiliateTier,
            affiliateTotalEarned: usersTable.affiliateTotalEarned,
            affiliatePendingPayout: usersTable.affiliatePendingPayout,
        }).from(usersTable).where(eqOp(usersTable.id, ctx.user.id)).limit(1);
        if (!user[0]) throw new Error("User not found");

        const conversions = await getAffiliateConversions(ctx.user.id);
        const payouts = await getAffiliatePayouts(ctx.user.id);

        const activeConversions = conversions.filter(c => c.status !== "cancelled").length;
        const tier = getAffiliateTier(activeConversions);
        const commissionRate = getCommissionRate(tier);

        return {
            isAffiliate: user[0].isAffiliate,
            affiliateCode: user[0].affiliateCode,
            tier,
            commissionRate,
            totalEarned: user[0].affiliateTotalEarned,
            pendingPayout: user[0].affiliatePendingPayout,
            totalConversions: activeConversions,
            conversions: conversions.slice(0, 10),
            payouts: payouts.slice(0, 5),
        };
    }),

    requestPayout: protectedProcedure
        .input(z.object({
            paymentMethod: z.enum(["bank_transfer", "paypal"]),
            paymentDetails: z.string().min(5).max(200),
        }))
        .mutation(async ({ ctx, input }) => {
            const db = await (await import("../db")).getDb();
            if (!db) throw new Error("Database not available");
            const { eq: eqOp } = await import("drizzle-orm");
            const { users: usersTable } = await import("../../drizzle/schema");
            const user = await db.select({ affiliatePendingPayout: usersTable.affiliatePendingPayout }).from(usersTable).where(eqOp(usersTable.id, ctx.user.id)).limit(1);
            if (!user[0]) throw new Error("User not found");
            const pending = user[0].affiliatePendingPayout;
            if (pending < 100) throw new Error("Minimum payout is 100 CZK");

            await createAffiliatePayout({
                affiliateUserId: ctx.user.id,
                amount: pending,
                paymentMethod: input.paymentMethod,
                paymentDetails: input.paymentDetails,
                status: "requested",
            });

            await db.update(usersTable).set({ affiliatePendingPayout: 0 }).where(eqOp(usersTable.id, ctx.user.id));

            try {
                const { notifyOwner } = await import("../_core/notification");
                await notifyOwner({
                    title: "Affiliate Payout Requested 💰",
                    content: `User ID ${ctx.user.id} requested payout of ${pending} CZK via ${input.paymentMethod}.`,
                });
            } catch { }

            return { success: true, amount: pending };
        }),
});
