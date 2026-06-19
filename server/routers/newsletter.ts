import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { newsletterSubscribers } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const newsletterRouter = router({
    subscribe: publicProcedure
        .input(z.object({
            email: z.string().email(),
            locale: z.string().default("cs"),
            source: z.string().default("popup"),
        }))
        .mutation(async ({ input }) => {
            const db = await getDb();
            if (!db) throw new Error("Database unavailable");
            const existing = await db.select().from(newsletterSubscribers)
                .where(eq(newsletterSubscribers.email, input.email.toLowerCase())).limit(1);
            if (existing.length > 0) {
                return { success: true, alreadySubscribed: true };
            }
            await db.insert(newsletterSubscribers).values({
                email: input.email.toLowerCase(),
                locale: input.locale,
                source: input.source,
            });
            try {
                const { notifyOwner } = await import("../_core/notification");
                await notifyOwner({
                    title: "New Newsletter Subscriber ✨",
                    content: `${input.email} subscribed (locale: ${input.locale}, source: ${input.source})`,
                });
            } catch { }
            return { success: true, alreadySubscribed: false };
        }),
});
