/**
 * Shared affiliate commission configuration.
 * SINGLE SOURCE OF TRUTH — all payment providers and routers must import from here.
 */

export const AFFILIATE_COMMISSION_RATES: Record<string, number> = {
  bronze: 0.20,
  silver: 0.25,
  gold: 0.30,
};

export const AFFILIATE_TIER_THRESHOLDS = {
  silver: 6,
  gold: 21,
} as const;

export function getAffiliateTier(activeConversions: number): "bronze" | "silver" | "gold" {
  if (activeConversions >= AFFILIATE_TIER_THRESHOLDS.gold) return "gold";
  if (activeConversions >= AFFILIATE_TIER_THRESHOLDS.silver) return "silver";
  return "bronze";
}

export function getCommissionRate(tier: string): number {
  return AFFILIATE_COMMISSION_RATES[tier] ?? AFFILIATE_COMMISSION_RATES.bronze;
}
