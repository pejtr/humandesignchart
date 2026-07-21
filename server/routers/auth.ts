import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "../_core/cookies";
import { publicProcedure, router } from "../_core/trpc";
import { countTotalCharts } from "../db";

export const authRouter = router({
    me: publicProcedure.query(opts => {
        const u = opts.ctx.user;
        if (!u) return null;
        return {
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            subscriptionPlan: u.subscriptionPlan,
            subscriptionStatus: u.subscriptionStatus,
            aiReadingCredits: u.aiReadingCredits,
            createdAt: u.createdAt,
        };
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
        return { success: true } as const;
    }),
});

export const publicStatsRouter = router({
    chartCount: publicProcedure.query(async () => {
        const count = await countTotalCharts();
        return { count: count + 12847 };
    }),
});
