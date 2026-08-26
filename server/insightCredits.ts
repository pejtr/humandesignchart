/**
 * MAAT NEUROHIVE 5.55 — Insight Credits Economy
 *
 * Rules:
 * - Internal, non-transferable credits.
 * - NOT displayed on public landing pages as an investment/token speculation.
 * - NO credit trading, NO birth data monetization.
 * - Earning mechanisms: Marie Plus subscription allowance, constructive feedback (positive or critical), completed referrals, research experiments.
 * - Spending mechanisms: Extra deep AI readings, audio interpretations, relationship dynamics, extended exports.
 */

export type CreditEarnReason = "marie_plus_allowance" | "constructive_feedback" | "referral_completed" | "research_participation";
export type CreditSpendReason = "extra_ai_reading" | "audio_interpretation" | "relationship_dynamics_export" | "extended_pdf_export";

export interface CreditTransactionRecord {
  userId: number;
  amount: number; // positive for earn, negative for spend
  reason: CreditEarnReason | CreditSpendReason;
  metadata?: Record<string, any>;
  createdAt: string;
}

export class InsightCreditsEngine {
  /** Credit rewards schedule */
  public static readonly REWARDS: Record<CreditEarnReason, number> = {
    marie_plus_allowance: 10,     // 10 monthly credits included in Marie Plus
    constructive_feedback: 3,     // 3 credits for detailed feedback (independent of rating)
    referral_completed: 5,        // 5 credits when referred user completes chart calculation
    research_participation: 5,    // 5 credits for opting into research experiment
  };

  /** Credit costs schedule */
  public static readonly COSTS: Record<CreditSpendReason, number> = {
    extra_ai_reading: 2,
    audio_interpretation: 3,
    relationship_dynamics_export: 4,
    extended_pdf_export: 2,
  };

  /** Validate if user has sufficient credits to spend */
  public static canSpend(currentBalance: number, reason: CreditSpendReason): { allowed: boolean; required: number } {
    const required = this.COSTS[reason] ?? 1;
    return {
      allowed: currentBalance >= required,
      required,
    };
  }

  /** Calculate new balance after transaction */
  public static calculateNewBalance(currentBalance: number, amountDelta: number): number {
    return Math.max(0, currentBalance + amountDelta);
  }
}
