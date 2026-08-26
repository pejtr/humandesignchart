import { MaatGate, type SystemHealthMetrics, type MaatPolicyCheckResult } from "./gate";
import { MaatLedger, type RevenueInputs, type SurplusCalculationResult } from "./ledger";

export interface HoukavecRecommendation {
  id: string;
  category: "pricing" | "retention" | "content" | "segmentation";
  title: string;
  recommendation: string;
  impactEstimate: string;
  requiresHumanApproval: true;
}

/**
 * Houkavec Advisory Engine
 * Proposes optimal offers, segments, and experiments — does NOT auto-execute anything.
 * Finding ≠ Action. Recommendation ≠ Permission.
 */
export class HoukavecEngine {
  public static getRecommendations(metrics: {
    freeConversionRate: number; // e.g. 0.04 (4%)
    mariePlusRetentionMonth1: number; // e.g. 0.65 (65%)
  }): HoukavecRecommendation[] {
    const recommendations: HoukavecRecommendation[] = [];

    if (metrics.freeConversionRate < 0.05) {
      recommendations.push({
        id: "rec_deep_reading_price_test",
        category: "pricing",
        title: "Test Deep Reading Price Interval (390 CZK vs 490 CZK)",
        recommendation: "Run a clean price test for Deep Reading single purchase. Focus messaging on practical application in work/relationships.",
        impactEstimate: "+15% to +25% conversion lift on initial offer",
        requiresHumanApproval: true,
      });
    }

    if (metrics.mariePlusRetentionMonth1 < 0.70) {
      recommendations.push({
        id: "rec_marie_plus_retention_transits",
        category: "retention",
        title: "Optimize Personalized Daily Transit Digest",
        recommendation: "Ensure Marie Plus subscribers receive personalized morning gate activations in their reflection journal.",
        impactEstimate: "+10% to +18% 30-day subscriber retention",
        requiresHumanApproval: true,
      });
    }

    return recommendations;
  }
}

export { MaatGate, MaatLedger };
