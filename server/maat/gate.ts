/**
 * MAAT NEUROHIVE 5.55 — Governance & Safety Gate
 * Rule: Finding ≠ Action. Recommendation ≠ Permission. Evidence ≠ automatic decision.
 */

export type HealthStatus = "GREEN" | "YELLOW" | "RED";

export interface MaatPolicyCheckResult {
  allowed: boolean;
  reason?: string;
  code: string;
}

export interface SystemHealthMetrics {
  healthStatus: HealthStatus;
  reliabilityPercent: number; // e.g. 99.8%
  privacyCompliant: boolean;
  refundRatePercent: number;  // e.g. 1.2%
  aiMarginHealthy: boolean;
  discretionaryPayoutAllowed: boolean;
  activeGateWarnings: string[];
}

/**
 * MAAT Veto Rules Enforcer
 */
export class MaatGate {
  /**
   * Evaluates system health and determines whether discretionary external payouts (11.2%) are allowed.
   */
  public static evaluateSystemHealth(metrics: {
    reliabilityPercent: number;
    refundRatePercent: number;
    aiCostToRevenueRatio: number;
    securityIncidentsCount: number;
  }): SystemHealthMetrics {
    const warnings: string[] = [];
    let healthStatus: HealthStatus = "GREEN";

    if (metrics.reliabilityPercent < 99.0) {
      healthStatus = "YELLOW";
      warnings.push(`Reliability dropped to ${metrics.reliabilityPercent.toFixed(1)}% (Threshold: 99.0%)`);
    }

    if (metrics.refundRatePercent > 5.0) {
      healthStatus = "YELLOW";
      warnings.push(`Refund rate spiked to ${metrics.refundRatePercent.toFixed(1)}% (Threshold: 5.0%)`);
    }

    if (metrics.aiCostToRevenueRatio > 0.45) {
      healthStatus = "YELLOW";
      warnings.push(`AI cost to revenue ratio high at ${(metrics.aiCostToRevenueRatio * 100).toFixed(1)}%`);
    }

    if (metrics.securityIncidentsCount > 0 || metrics.reliabilityPercent < 95.0 || metrics.refundRatePercent > 10.0) {
      healthStatus = "RED";
      warnings.push("CRITICAL: Health gate triggered RED state due to security/reliability threshold breach.");
    }

    const discretionaryPayoutAllowed = healthStatus === "GREEN";

    return {
      healthStatus,
      reliabilityPercent: metrics.reliabilityPercent,
      privacyCompliant: metrics.securityIncidentsCount === 0,
      refundRatePercent: metrics.refundRatePercent,
      aiMarginHealthy: metrics.aiCostToRevenueRatio <= 0.45,
      discretionaryPayoutAllowed,
      activeGateWarnings: warnings,
    };
  }

  /**
   * MAAT Policy Guard for product offers and monetization actions.
   */
  public static validateMonetizationAction(actionType: string, payload?: any): MaatPolicyCheckResult {
    switch (actionType) {
      case "AUTOMATIC_PRICE_CHANGE":
        // Automatic price mutations by AI/Neuron are strictly prohibited without explicit human authorization
        return {
          allowed: false,
          code: "MAAT_VETO_AUTO_PRICING",
          reason: "MAAT Rule: Automatic price modification by AI is forbidden. Human approval required.",
        };

      case "IN_MAP_ADS":
        // Park ads inside personal chart maps are strictly forbidden
        return {
          allowed: false,
          code: "MAAT_VETO_PARK_ADS",
          reason: "MAAT Rule: Displaying ads inside personal Human Design charts destroys user trust.",
        };

      case "LIFETIME_UNLIMITED_AI":
        // Lifetime unlimited AI is forbidden as non-viable long-term
        return {
          allowed: false,
          code: "MAAT_VETO_LIFETIME_AI",
          reason: "MAAT Rule: Lifetime plans with unlimited AI token usage are economically non-viable.",
        };

      case "DUPLICATE_VIP_CLUB":
        // Duplicate VIP club alongside regular subscription is forbidden
        return {
          allowed: false,
          code: "MAAT_VETO_DUPLICATE_VIP",
          reason: "MAAT Rule: Duplicate VIP products create confusion. Subscriptions must be unified under Marie Plus.",
        };

      case "AGGRESSIVE_POPUP_COUPON":
        // Aggressive popup coupon detector in checkout is forbidden
        return {
          allowed: false,
          code: "MAAT_VETO_POPUP_COUPON",
          reason: "MAAT Rule: Aggressive coupon popups degrade checkout trust. Keep checkout clean.",
        };

      case "SELL_USER_DATA":
        // Selling birth or personal data is strictly forbidden
        return {
          allowed: false,
          code: "MAAT_VETO_DATA_SALE",
          reason: "MAAT Rule: User birth and personal data must NEVER be sold or monetized to third parties.",
        };

      case "OFFER_DEEP_READING":
      case "OFFER_MARIE_PLUS":
      case "OFFER_RELATIONSHIP_DYNAMICS":
      case "OFFER_B2B_PLASTEV":
      case "OFFER_FREE_MAP":
        return {
          allowed: true,
          code: "MAAT_APPROVED",
        };

      default:
        return {
          allowed: true,
          code: "MAAT_PASSED",
        };
    }
  }
}
