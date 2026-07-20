/**
 * LeadOS CRM tRPC Router
 * Admin-only procedures for CRM integration
 */

import { z } from "zod";
import { router, adminProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  getLeads,
  getLeadById,
  updateLead,
  getEmailSequences,
  getAnalytics,
  getOrders,
  sendEmail,
  type LeadOSLead,
  type LeadOSAnalytics,
  type LeadOSEmailSequence,
} from "../leados";
import { getDb } from "../db";
import { users, charts } from "../../drizzle/schema";
import { inArray } from "drizzle-orm";

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

  // ── CRM Dashboard: Enriched Leads (LeadOS + HD data join) ─────────────────
  getEnrichedLeads: adminProcedure
    .input(
      z.object({
        status: z
          .enum(["new", "contacted", "qualified", "converted", "lost"])
          .optional(),
        limit: z.number().min(1).max(100).default(30),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      // 1. Fetch leads from LeadOS (graceful fallback to empty)
      let leadsResult: { leads: LeadOSLead[]; total: number } = { leads: [], total: 0 };
      try {
        leadsResult = await getLeads(input);
      } catch (err) {
        console.warn("[CRM] LeadOS getLeads failed, using empty fallback:", err);
      }
      const leads = leadsResult.leads;
      if (!leads.length) return { leads: [], total: 0 };

      // 2. Join with HDM users + charts by email
      const db = await getDb();
      const emails = leads.map((l) => l.email).filter(Boolean) as string[];

      type HdmUser = {
        id: number;
        email: string | null;
        name: string | null;
        crmStatus: string | null;
        createdAt: Date;
      };
      type HdmChart = {
        userId: number;
        name: string;
        hdType: string | null;
        roleTag: string | null;
        isFavorite: boolean;
      };

      let hdmUsers: HdmUser[] = [];
      let hdmCharts: HdmChart[] = [];

      if (db && emails.length) {
        try {
          hdmUsers = await db
            .select({
              id: users.id,
              email: users.email,
              name: users.name,
              crmStatus: users.crmStatus,
              createdAt: users.createdAt,
            })
            .from(users)
            .where(inArray(users.email, emails));

          if (hdmUsers.length) {
            const userIds = hdmUsers.map((u) => u.id);
            const rawCharts = await db
              .select({
                userId: charts.userId,
                name: charts.name,
                chartData: charts.chartData,
                roleTag: charts.roleTag,
                isFavorite: charts.isFavorite,
              })
              .from(charts)
              .where(inArray(charts.userId, userIds));

            hdmCharts = rawCharts.map((c) => ({
              userId: c.userId,
              name: c.name,
              hdType:
                (c.chartData as Record<string, unknown> | null)?.type as
                  | string
                  | null ?? null,
              roleTag: c.roleTag ?? null,
              isFavorite: c.isFavorite ?? false,
            }));
          }
        } catch (err) {
          console.error("[CRM] DB join error:", err);
        }
      }

      // 3. Build enriched lead objects
      const userByEmail = new Map(hdmUsers.map((u) => [u.email, u]));
      const chartsByUserId = new Map<number, HdmChart[]>();
      for (const c of hdmCharts) {
        if (!chartsByUserId.has(c.userId)) chartsByUserId.set(c.userId, []);
        chartsByUserId.get(c.userId)!.push(c);
      }

      const enriched = leads.map((lead) => {
        const hdmUser = userByEmail.get(lead.email);
        const userCharts = hdmUser ? (chartsByUserId.get(hdmUser.id) ?? []) : [];
        const primaryChart = userCharts.find((c) => c.isFavorite) ?? userCharts[0];
        return {
          ...lead,
          hdm: hdmUser
            ? {
                registeredAt: hdmUser.createdAt,
                crmStatus: hdmUser.crmStatus,
                primaryHdType: primaryChart?.hdType ?? null,
                chartCount: userCharts.length,
                charts: userCharts.slice(0, 5).map((c) => ({
                  name: c.name,
                  hdType: c.hdType,
                  roleTag: c.roleTag,
                  isFavorite: c.isFavorite,
                })),
              }
            : null,
        };
      });

      return { leads: enriched, total: leadsResult.total };
    }),

  // ── CRM Dashboard Stats ────────────────────────────────────────────────────
  getCrmStats: adminProcedure.query(async () => {
    let analytics: LeadOSAnalytics | null = null;
    let sequences: { sequences: LeadOSEmailSequence[] } | null = null;

    try { analytics = await getAnalytics(); } catch { /* non-critical */ }
    try { sequences = await getEmailSequences(); } catch { /* non-critical */ }

    return {
      totalLeads: analytics?.totalLeads ?? 0,
      newLeads: analytics?.newLeads ?? 0,
      qualifiedLeads: analytics?.qualifiedLeads ?? 0,
      convertedLeads: analytics?.convertedLeads ?? 0,
      conversionRate: analytics?.conversionRate ?? 0,
      activeSequences:
        sequences?.sequences.filter((s) => s.status === "active").length ?? 0,
      totalSequences: sequences?.sequences.length ?? 0,
    };
  }),
});
