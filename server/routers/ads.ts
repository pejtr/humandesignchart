import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { adminProcedure, router } from "../_core/trpc";
import {
  ADS_DATE_RANGES,
  getCampaignReport,
  isGoogleAdsConfigured,
  type AdsDateRange,
} from "../_core/googleAds";

/**
 * Google Ads reporting — admin-only and strictly read-only. These procedures
 * never create campaigns or change budgets; they only pull performance data.
 */
export const adsRouter = router({
  // Lets the admin UI show a "connect Google Ads" hint instead of erroring.
  status: adminProcedure.query(() => ({
    configured: isGoogleAdsConfigured(),
  })),

  campaignReport: adminProcedure
    .input(
      z
        .object({
          range: z.enum(ADS_DATE_RANGES).default("LAST_30_DAYS"),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const range: AdsDateRange = input?.range ?? "LAST_30_DAYS";
      try {
        const rows = await getCampaignReport({ range });
        const totals = rows.reduce(
          (acc, r) => ({
            impressions: acc.impressions + r.impressions,
            clicks: acc.clicks + r.clicks,
            cost: acc.cost + r.cost,
            conversions: acc.conversions + r.conversions,
          }),
          { impressions: 0, clicks: 0, cost: 0, conversions: 0 }
        );
        return { range, rows, totals };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Google Ads request failed",
        });
      }
    }),
});
