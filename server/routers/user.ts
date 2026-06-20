import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { updateUserPreferences } from "../db/users";

const preferencesSchema = z.object({
    dailyTransit: z.boolean(),
    system: z.boolean(),
    credits: z.boolean(),
    campaigns: z.boolean(),
});

export const userRouter = router({
    getPreferences: protectedProcedure
        .query(async ({ ctx }) => {
            const prefs = ctx.user.notificationPreferences;
            const result = preferencesSchema.safeParse(prefs);
            if (result.success) return result.data;

            return {
                dailyTransit: true,
                system: true,
                credits: true,
                campaigns: true
            };
        }),

    updatePreferences: protectedProcedure
        .input(z.object({
            dailyTransit: z.boolean(),
            system: z.boolean(),
            credits: z.boolean(),
            campaigns: z.boolean(),
        }))
        .mutation(async ({ ctx, input }) => {
            await updateUserPreferences(ctx.user.id, input);
            return { success: true };
        }),

    testDailyTransit: protectedProcedure
        .mutation(async () => {
            const { processDailyTransits } = await import("../jobs/dailyTransit");
            await processDailyTransits();
            return { success: true };
        }),
});
