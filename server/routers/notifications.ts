import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const notificationsRouter = router({
    getAll: protectedProcedure
        .input(z.object({ limit: z.number().min(1).max(50).optional() }).optional())
        .query(async ({ ctx, input }) => {
            const { getUserNotifications } = await import("../db.notifications");
            return getUserNotifications(ctx.user.id, input?.limit ?? 30);
        }),

    getUnreadCount: protectedProcedure
        .query(async ({ ctx }) => {
            const { getUnreadCount } = await import("../db.notifications");
            return { count: await getUnreadCount(ctx.user.id) };
        }),

    markRead: protectedProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ ctx, input }) => {
            const { markNotificationRead } = await import("../db.notifications");
            await markNotificationRead(input.id, ctx.user.id);
            return { success: true };
        }),

    markAllRead: protectedProcedure
        .mutation(async ({ ctx }) => {
            const { markAllNotificationsRead } = await import("../db.notifications");
            await markAllNotificationsRead(ctx.user.id);
            return { success: true };
        }),

    getPrefs: protectedProcedure
        .query(async ({ ctx }) => {
            const { parseNotifPrefs } = await import("../../shared/notificationTypes");
            const db = await getDb();
            if (!db) return parseNotifPrefs(null);
            const userRecord = await db.select({ notificationPrefs: users.notificationPrefs })
                .from(users).where(eq(users.id, ctx.user.id)).limit(1);
            return parseNotifPrefs(userRecord[0]?.notificationPrefs);
        }),

    updatePrefs: protectedProcedure
        .input(z.object({
            crm_status: z.boolean().optional(),
            campaign: z.boolean().optional(),
            system: z.boolean().optional(),
            credit: z.boolean().optional(),
            achievement: z.boolean().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            const { parseNotifPrefs } = await import("../../shared/notificationTypes");
            const db = await getDb();
            if (!db) return { success: false };
            const userRecord = await db.select({ notificationPrefs: users.notificationPrefs })
                .from(users).where(eq(users.id, ctx.user.id)).limit(1);
            const current = parseNotifPrefs(userRecord[0]?.notificationPrefs);
            const updated = { ...current, ...input };
            await db.update(users)
                .set({ notificationPrefs: updated })
                .where(eq(users.id, ctx.user.id));
            return { success: true, prefs: updated };
        }),
});
