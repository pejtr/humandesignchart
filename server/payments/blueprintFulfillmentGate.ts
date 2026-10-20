/**
 * A gateway callback can confirm money movement, but cannot invent a
 * personalized Blueprint. The matching order + original chart must exist.
 */
export type BlueprintCaptureOrder = {
  chart_snapshot_id: string | null;
  customer_email: string | null;
  offer_key: string | null;
  amount_minor: number | string | null;
  currency: string | null;
  payment_status: string | null;
};

export type BlueprintCaptureMetadata = {
  offerKey: string;
  amount: number;
  currency: string;
  customerEmail: string;
};

export type BlueprintFulfillmentBlocker =
  | "CHART_SNAPSHOT_REQUIRED"
  | "ORDER_DATA_MISMATCH"
  | "ORDER_NOT_READY";

export function getBlueprintFulfillmentBlocker(
  order: BlueprintCaptureOrder | null,
  event: BlueprintCaptureMetadata,
  snapshotExists: boolean,
): BlueprintFulfillmentBlocker | null {
  // Never mint a "FULFILLED" row for an unknown payment reference.
  if (!order?.chart_snapshot_id || !snapshotExists) return "CHART_SNAPSHOT_REQUIRED";
  if (!["CREATED", "PAID"].includes(String(order.payment_status))) return "ORDER_NOT_READY";
  if (
    order.offer_key !== event.offerKey ||
    Number(order.amount_minor) !== Number(event.amount) ||
    String(order.currency).toUpperCase() !== event.currency.toUpperCase() ||
    !order.customer_email ||
    order.customer_email.trim().toLowerCase() !== event.customerEmail.trim().toLowerCase()
  ) {
    return "ORDER_DATA_MISMATCH";
  }
  return null;
}
