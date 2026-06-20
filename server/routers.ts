/**
 * Application Router — Aggregates all domain-specific routers.
 *
 * Each sub-router is defined in a dedicated file under `server/routers/`.
 * This file only re-exports them as a single appRouter for tRPC.
 */
import { systemRouter } from "./_core/systemRouter";
import { router } from "./_core/trpc";

// Domain-specific routers
import { notificationsRouter } from "./routers/notifications";
import { newsletterRouter } from "./routers/newsletter";
import { authRouter, publicStatsRouter } from "./routers/auth";
import { chartRouter } from "./routers/chart";
import { aiRouter } from "./routers/ai";
import { shareRouter } from "./routers/share";
import { transitRouter } from "./routers/transit";
import { blogRouter } from "./routers/blog";
import { subscriptionRouter } from "./routers/subscription";
import { giftVoucherRouter } from "./routers/gift";
import { referralRouter } from "./routers/referral";
import { gamificationRouter } from "./routers/gamification";
import { affiliateRouter } from "./routers/affiliate";
import { compositeRouter } from "./routers/composite";
import { contentRouter } from "./routers/content";

// Pre-existing routers (already extracted before this refactoring)
import { socialRouter } from "./routers/social";
import { leadosRouter } from "./routers/leados";
import { chatRouter } from "./routers/chat";
import { userRouter } from "./routers/user";

export const appRouter = router({
  system: systemRouter,
  social: socialRouter,
  leados: leadosRouter,
  chat: chatRouter,
  user: userRouter,
  notifications: notificationsRouter,
  newsletter: newsletterRouter,
  auth: authRouter,
  publicStats: publicStatsRouter,
  chart: chartRouter,
  ai: aiRouter,
  share: shareRouter,
  transit: transitRouter,
  blog: blogRouter,
  subscription: subscriptionRouter,
  giftVoucher: giftVoucherRouter,
  referral: referralRouter,
  gamification: gamificationRouter,
  affiliate: affiliateRouter,
  composite: compositeRouter,
  content: contentRouter,
});

export type AppRouter = typeof appRouter;
