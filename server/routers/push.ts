import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { savePushSubscription, removePushSubscription } from "../pushNotifications";

export const pushRouter = router({
  subscribe: protectedProcedure
    .input(
      z.object({
        endpoint: z.string(),
        keys: z.object({
          p256dh: z.string(),
          auth: z.string(),
        }),
        locale: z.string().default("cs"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await savePushSubscription(ctx.user.id, input, input.locale);
      return { success: true };
    }),

  unsubscribe: protectedProcedure
    .input(z.object({ endpoint: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await removePushSubscription(ctx.user.id, input.endpoint);
      return { success: true };
    }),
});
