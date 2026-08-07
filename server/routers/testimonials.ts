import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { testimonials, users } from "../../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export const testimonialsRouter = router({
  submit: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        hdType: z.string().max(50).optional(),
        text: z.string().min(10).max(500),
        rating: z.number().int().min(1).max(5).default(5),
        locale: z.enum(["cs", "en"]).default("cs"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const [result] = await db.insert(testimonials).values({
        userId: ctx.user.id,
        name: input.name,
        hdType: input.hdType ?? null,
        text: input.text,
        rating: input.rating,
        locale: input.locale,
        status: "pending",
      });

      return { id: (result as { insertId: number }).insertId, success: true };
    }),

  getApproved: publicProcedure
    .input(
      z.object({
        locale: z.enum(["cs", "en"]).default("cs"),
        limit: z.number().int().min(1).max(20).default(6),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select({
          id: testimonials.id,
          name: testimonials.name,
          hdType: testimonials.hdType,
          text: testimonials.text,
          rating: testimonials.rating,
          createdAt: testimonials.createdAt,
        })
        .from(testimonials)
        .where(
          and(
            eq(testimonials.status, "approved"),
            eq(testimonials.locale, input.locale)
          )
        )
        .orderBy(desc(testimonials.createdAt))
        .limit(input.limit);
    }),

  getStats: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { count: 0, avgRating: 0 };
    const [result] = await db
      .select({
        count: sql<number>`count(*)`,
        avgRating: sql<number>`coalesce(avg(${testimonials.rating}), 0)`,
      })
      .from(testimonials)
      .where(eq(testimonials.status, "approved"));
    return {
      count: result?.count ?? 0,
      avgRating: Number(result?.avgRating ?? 0),
    };
  }),
});
