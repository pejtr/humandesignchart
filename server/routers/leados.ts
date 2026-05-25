/**
 * LeadOS CRM tRPC Router
 * Admin-only procedures for CRM integration
 */

import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  getLeads,
  getLeadById,
  updateLead,
  getEmailSequences,
  getAnalytics,
  getOrders,
  sendEmail,
} from "../leados";

// Admin guard middleware
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin only" });
  }
  return next({ ctx });
});

export const leadosRouter = router({
  // ── Analytics ─────────────────────────────────────────────────────────────
  getAnalytics: adminProcedure.query(async () => {
    try {
      return await getAnalytics();
    } catch (err) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: err instanceof Error ? err.message : "LeadOS analytics failed",
      });
    }
  }),

  // ── Leads ─────────────────────────────────────────────────────────────────
  getLeads: adminProcedure
    .input(
      z.object({
        status: z
          .enum(["new", "contacted", "qualified", "converted", "lost"])
          .optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      try {
        return await getLeads(input);
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err instanceof Error ? err.message : "LeadOS leads failed",
        });
      }
    }),

  getLead: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      try {
        return await getLeadById(input.id);
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err instanceof Error ? err.message : "LeadOS lead fetch failed",
        });
      }
    }),

  updateLead: adminProcedure
    .input(
      z.object({
        id: z.number(),
        status: z
          .enum(["new", "contacted", "qualified", "converted", "lost"])
          .optional(),
        notes: z.string().optional(),
        score: z.number().min(0).max(100).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      try {
        return await updateLead(id, data);
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err instanceof Error ? err.message : "LeadOS update failed",
        });
      }
    }),

  // ── Email Sequences ────────────────────────────────────────────────────────
  getEmailSequences: adminProcedure.query(async () => {
    try {
      return await getEmailSequences();
    } catch (err) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: err instanceof Error ? err.message : "LeadOS sequences failed",
      });
    }
  }),

  // ── Orders ────────────────────────────────────────────────────────────────
  getOrders: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      try {
        return await getOrders(input);
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err instanceof Error ? err.message : "LeadOS orders failed",
        });
      }
    }),

  // ── Email sending ──────────────────────────────────────────────────────────
  sendEmail: adminProcedure
    .input(
      z.object({
        to: z.string().email(),
        subject: z.string().min(1).max(200),
        html: z.string().min(1),
        text: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        return await sendEmail(input);
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err instanceof Error ? err.message : "LeadOS email failed",
        });
      }
    }),
});
