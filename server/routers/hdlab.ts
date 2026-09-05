import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { HdlabAnalyticsEngine, type HdlabFunnelEventName } from "../hdlabAnalytics";
import { createComgatePayment } from "../comgate";
import { TRPCError } from "@trpc/server";

export const hdlabRouter = router({
  /** P0 Measurement: Track funnel conversion events */
  trackEvent: publicProcedure
    .input(
      z.object({
        eventName: z.enum([
          "result_view",
          "offer_view",
          "checkout_start",
          "payment_success",
          "reading_delivered",
        ] as const),
        chartId: z.number().optional(),
        refId: z.string().optional(),
        amountMinor: z.number().optional(),
        metadata: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      return HdlabAnalyticsEngine.trackEvent({
        eventName: input.eventName,
        userId: ctx.user?.id,
        chartId: input.chartId,
        refId: input.refId,
        amountMinor: input.amountMinor,
        metadata: input.metadata,
      });
    }),

  /** Get conversion metrics for LAB audit */
  getMetrics: publicProcedure.query(() => {
    return HdlabAnalyticsEngine.getFunnelMetrics();
  }),

  /** P1 💰: Production Comgate Checkout for HDLAB Deep Reading (390 CZK) */
  createComgateCheckout: protectedProcedure
    .input(
      z.object({
        plan: z.enum(["blueprint", "deep_reading"]).default("blueprint"),
        chartId: z.number().optional(),
        locale: z.string().default("cs"),
        email: z.string().email().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user;
      const priceCZK = 390; // 390 CZK fixed Deep Reading offer
      const refId = `hdlab_${user.id}_${Date.now()}`;
      const email = input.email || user.email || "zakaznik@hdlab.cz";

      // 1. Log P0 Checkout Start event
      HdlabAnalyticsEngine.trackEvent({
        eventName: "checkout_start",
        userId: user.id,
        chartId: input.chartId,
        refId,
        amountMinor: priceCZK * 100,
        metadata: { provider: "comgate", plan: input.plan },
      });

      // 2. Call Comgate Payment REST API v1.0
      const paymentRes = await createComgatePayment({
        priceCZK,
        label: "HDLAB Deep Reading — Osobní Rozbor (PDF + Audio)",
        refId,
        email,
        currency: "CZK",
        method: "ALL", // Card, Apple Pay, Google Pay, Czech Bank Buttons & QR
      });

      if (!paymentRes.success || !paymentRes.redirectUrl) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: paymentRes.error || "Nepodařilo se vytvořit Comgate platbu.",
        });
      }

      return {
        redirectUrl: paymentRes.redirectUrl,
        transId: paymentRes.transId,
        refId,
      };
    }),
});
