/**
 * MAAT NEUROHIVE 5.55 — Economic Ledger & Capital Architecture 88.8
 *
 * Formula:
 * Net Surplus = Gross Revenue (excl. VAT) - Refunds - Merchant Fees - AI Token Costs - Infrastructure - Support - Tax Reserves
 *
 * 88.8 Capital Allocation:
 * - 33.3% Reliability, QA, Security, Privacy
 * - 22.2% Growth, Content, SEO, Distribution
 * - 11.1% Financial & Refund Reserve
 * - 11.1% R&D & AI Efficiency
 * - 11.1% Human & Ecological Impact
 * - 11.2% Max External Extraction (88.8% retained inside system)
 */

export interface RevenueInputs {
  grossRevenueCzk: number;
  vatRatePercent?: number;       // default 21%
  refundsCzk?: number;
  merchantFeePercent?: number;   // e.g. 1.2% average (Stripe/Comgate)
  aiTokenCostCzk?: number;
  infrastructureCostCzk?: number;
  supportCostCzk?: number;
  taxReservePercent?: number;    // default 15%
}

export interface SurplusCalculationResult {
  grossRevenueCzk: number;
  revenueExclVatCzk: number;
  vatAmountCzk: number;
  refundsCzk: number;
  merchantFeesCzk: number;
  aiTokenCostCzk: number;
  infrastructureCostCzk: number;
  supportCostCzk: number;
  taxReservesCzk: number;
  totalExpensesCzk: number;
  netSurplusCzk: number;
  allocations: {
    reliabilityAndSecurityCzk: number; // 33.3%
    growthAndSeoCzk: number;           // 22.2%
    financialReserveCzk: number;       // 11.1%
    rdAndAiEfficiencyCzk: number;      // 11.1%
    humanImpactCzk: number;            // 11.1%
    maxExternalExtractionCzk: number;  // 11.2%
    retainedInSystemCzk: number;       // 88.8%
  };
}

export class MaatLedger {
  public static calculateCapitalArchitecture(inputs: RevenueInputs): SurplusCalculationResult {
    const vatRate = (inputs.vatRatePercent ?? 21) / 100;
    const gross = Math.max(0, inputs.grossRevenueCzk);
    
    // Revenue excluding VAT
    const vatAmount = gross * (vatRate / (1 + vatRate));
    const revenueExclVat = gross - vatAmount;

    const refunds = Math.max(0, inputs.refundsCzk ?? 0);
    const merchantFeeRate = (inputs.merchantFeePercent ?? 1.5) / 100;
    const merchantFees = gross * merchantFeeRate;
    
    const aiTokenCost = Math.max(0, inputs.aiTokenCostCzk ?? 0);
    const infrastructureCost = Math.max(0, inputs.infrastructureCostCzk ?? 0);
    const supportCost = Math.max(0, inputs.supportCostCzk ?? 0);

    const preTaxMargin = Math.max(0, revenueExclVat - refunds - merchantFees - aiTokenCost - infrastructureCost - supportCost);
    const taxReserveRate = (inputs.taxReservePercent ?? 15) / 100;
    const taxReserves = preTaxMargin * taxReserveRate;

    const totalExpenses = refunds + merchantFees + aiTokenCost + infrastructureCost + supportCost + taxReserves;
    const netSurplus = Math.max(0, revenueExclVat - totalExpenses);

    // 88.8 Capital Architecture Allocations
    const reliabilityAndSecurityCzk = Math.round(netSurplus * 0.333);
    const growthAndSeoCzk = Math.round(netSurplus * 0.222);
    const financialReserveCzk = Math.round(netSurplus * 0.111);
    const rdAndAiEfficiencyCzk = Math.round(netSurplus * 0.111);
    const humanImpactCzk = Math.round(netSurplus * 0.111);
    const maxExternalExtractionCzk = Math.round(netSurplus * 0.112);

    const retainedInSystemCzk = reliabilityAndSecurityCzk + growthAndSeoCzk + financialReserveCzk + rdAndAiEfficiencyCzk + humanImpactCzk;

    return {
      grossRevenueCzk: Math.round(gross),
      revenueExclVatCzk: Math.round(revenueExclVat),
      vatAmountCzk: Math.round(vatAmount),
      refundsCzk: Math.round(refunds),
      merchantFeesCzk: Math.round(merchantFees),
      aiTokenCostCzk: Math.round(aiTokenCost),
      infrastructureCostCzk: Math.round(infrastructureCost),
      supportCostCzk: Math.round(supportCost),
      taxReservesCzk: Math.round(taxReserves),
      totalExpensesCzk: Math.round(totalExpenses),
      netSurplusCzk: Math.round(netSurplus),
      allocations: {
        reliabilityAndSecurityCzk,
        growthAndSeoCzk,
        financialReserveCzk,
        rdAndAiEfficiencyCzk,
        humanImpactCzk,
        maxExternalExtractionCzk,
        retainedInSystemCzk,
      },
    };
  }
}
