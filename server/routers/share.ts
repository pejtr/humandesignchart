import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { createSharedChart, getSharedChart } from "../db";
import crypto from "crypto";

export const shareRouter = router({
    createLink: publicProcedure
        .input(z.object({
            chartData: z.unknown().refine((value) => {
                try {
                    return JSON.stringify(value).length <= 250_000;
                } catch {
                    return false;
                }
            }, "Chart data is too large"),
            ownerName: z.string().trim().max(255).optional(),
        }))
        .mutation(async ({ input }) => {
            const token = crypto.randomBytes(16).toString("hex");
            const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
            await createSharedChart({
                token,
                chartData: input.chartData,
                ownerName: input.ownerName || null,
                expiresAt,
            });
            return { token };
        }),

    getShared: publicProcedure
        .input(z.object({ token: z.string() }))
        .query(async ({ input }) => {
            const shared = await getSharedChart(input.token);
            if (!shared) return null;
            return {
                chartData: shared.chartData,
                ownerName: shared.ownerName,
                createdAt: shared.createdAt,
            };
        }),
});
