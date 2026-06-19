import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import {
    getGiftVoucherByCode, redeemGiftVoucher,
    addAiReadingCredits, updateUserSubscription,
} from "../db";

export const giftVoucherRouter = router({
    redeem: protectedProcedure
        .input(z.object({ code: z.string().min(1).toUpperCase() }))
        .mutation(async ({ ctx, input }) => {
            const voucher = await getGiftVoucherByCode(input.code.trim().toUpperCase());
            if (!voucher) throw new Error("invalid_code");
            if (voucher.isRedeemed) throw new Error("already_redeemed");
            if (voucher.expiresAt && new Date(voucher.expiresAt) < new Date()) throw new Error("expired");

            const user = ctx.user;
            await redeemGiftVoucher(voucher.code, user.id);

            if (voucher.plan === "credits") {
                await addAiReadingCredits(user.id, voucher.creditsAmount || 5);
            } else {
                const periodEnd = new Date();
                periodEnd.setMonth(periodEnd.getMonth() + (voucher.plan === "annual" ? 12 : 1));
                await updateUserSubscription(user.id, {
                    subscriptionStatus: "active",
                    subscriptionPlan: voucher.plan,
                    subscriptionCurrentPeriodEnd: periodEnd,
                });
            }

            return { success: true, plan: voucher.plan };
        }),

    check: publicProcedure
        .input(z.object({ code: z.string() }))
        .query(async ({ input }) => {
            const voucher = await getGiftVoucherByCode(input.code.trim().toUpperCase());
            if (!voucher) return { valid: false, reason: "not_found" };
            if (voucher.isRedeemed) return { valid: false, reason: "already_redeemed" };
            if (voucher.expiresAt && new Date(voucher.expiresAt) < new Date()) return { valid: false, reason: "expired" };
            return { valid: true, plan: voucher.plan };
        }),
});
