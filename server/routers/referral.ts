import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import {
    getUserById, getUserByReferralCode, setUserReferralCode,
    createReferral, getReferralByReferredUser, getReferralsByReferrer,
    addAiReadingCredits,
} from "../db";
import crypto from "crypto";

export const referralRouter = router({
    getInfo: protectedProcedure.query(async ({ ctx }) => {
        let user = await getUserById(ctx.user.id);
        if (!user) throw new Error("User not found");

        if (!user.referralCode) {
            const code = crypto.randomBytes(4).toString("hex").toUpperCase();
            await setUserReferralCode(user.id, code);
            user = { ...user, referralCode: code };
        }

        const allReferrals = await getReferralsByReferrer(user.id);
        const completed = allReferrals.filter(r => r.status === "completed").length;
        const pending = allReferrals.filter(r => r.status === "pending").length;

        return {
            referralCode: user.referralCode!,
            totalInvited: allReferrals.length,
            completedReferrals: completed,
            pendingReferrals: pending,
            creditsEarned: completed,
        };
    }),

    applyReferral: protectedProcedure
        .input(z.object({ referralCode: z.string().min(1).max(16) }))
        .mutation(async ({ ctx, input }) => {
            const newUser = ctx.user;

            const existingReferral = await getReferralByReferredUser(newUser.id);
            if (existingReferral) return { success: false, reason: "already_referred" };

            const referrer = await getUserByReferralCode(input.referralCode.toUpperCase());
            if (!referrer) return { success: false, reason: "invalid_code" };

            if (referrer.id === newUser.id) return { success: false, reason: "self_referral" };

            await createReferral({
                referrerId: referrer.id,
                referredUserId: newUser.id,
                referralCode: input.referralCode.toUpperCase(),
                status: "completed",
                referrerCredited: 1,
                referredCredited: 1,
                completedAt: new Date().toISOString(),
            });

            await addAiReadingCredits(referrer.id, 1);
            await addAiReadingCredits(newUser.id, 1);

            try {
                const { notifyOwner } = await import("../_core/notification");
                await notifyOwner({
                    title: "New Referral Completed 🎉",
                    content: `${newUser.name || newUser.openId} signed up via referral code ${input.referralCode} from ${referrer.name || referrer.openId}. Both received 1 free reading credit.`,
                });
            } catch { }

            return { success: true, creditsAwarded: 1 };
        }),

    validateCode: publicProcedure
        .input(z.object({ code: z.string() }))
        .query(async ({ input }) => {
            if (!input.code) return { valid: false };
            const referrer = await getUserByReferralCode(input.code.toUpperCase());
            if (!referrer) return { valid: false };
            return { valid: true, referrerName: referrer.name || "a friend" };
        }),
});
