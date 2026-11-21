import {
  getOfferAmountMinor,
  type PaymentCurrency,
  type PaymentProductKey,
} from "./offers";

export const MAX_VOLUNTARY_TOP_UP_MINOR = 1_000_000; // 10 000 CZK / EUR-cent equivalent; larger support needs manual care.

export type HonorariumSelection = {
  productId: PaymentProductKey;
  billingPeriod: "ONE_TIME" | "MONTHLY" | "ANNUAL";
  minimumAmountMinor: number;
  voluntaryTopUpMinor: number;
  totalAmountMinor: number;
};

export function getHonorariumPeriod(
  productKey: PaymentProductKey
): HonorariumSelection["billingPeriod"] {
  if (productKey === "monthly" || productKey === "gift_monthly")
    return "MONTHLY";
  if (
    productKey === "annual" ||
    productKey === "gift_annual" ||
    productKey === "blueprint_annual_upgrade"
  )
    return "ANNUAL";
  return "ONE_TIME";
}

/**
 * Resolves every monetary value on the server. Only Blueprint currently accepts
 * a voluntary top-up; planned Marie membership top-ups deliberately remain HOLD
 * until both payment providers can represent recurring line items safely.
 */
export function resolveHonorariumSelection(input: {
  productId: PaymentProductKey;
  currency: PaymentCurrency;
  partnerAddon?: boolean;
  voluntaryTopUpMinor?: number;
}): HonorariumSelection {
  const voluntaryTopUpMinor = input.voluntaryTopUpMinor ?? 0;
  if (
    !Number.isSafeInteger(voluntaryTopUpMinor) ||
    voluntaryTopUpMinor < 0 ||
    voluntaryTopUpMinor > MAX_VOLUNTARY_TOP_UP_MINOR
  ) {
    throw new Error("INVALID_VOLUNTARY_TOP_UP");
  }
  if (input.productId !== "blueprint" && voluntaryTopUpMinor !== 0) {
    throw new Error("RECURRING_TOP_UP_HOLD");
  }
  const minimumAmountMinor = getOfferAmountMinor(
    input.productId,
    input.currency,
    input.partnerAddon
  );
  return {
    productId: input.productId,
    billingPeriod: getHonorariumPeriod(input.productId),
    minimumAmountMinor,
    voluntaryTopUpMinor,
    totalAmountMinor: minimumAmountMinor + voluntaryTopUpMinor,
  };
}
