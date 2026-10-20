import { getBlueprintOffer } from "./publicOfferCatalog";

type LocalOrder = {
  payment_status?: unknown;
  offer_key?: unknown;
  amount_minor?: unknown;
  currency?: unknown;
};

type ProviderStatus = {
  status?: unknown;
  offerKey?: unknown;
  amountMinor?: unknown;
  currency?: unknown;
};

/**
 * A gateway PAID status alone must not credit an unknown or mismatched order.
 * Local PAID is persisted by the trusted payment callback; otherwise require
 * a matching gateway transaction and canonical offer/price.
 */
export function isVerifiedBlueprintPayment(
  order: LocalOrder | null | undefined,
  provider: ProviderStatus | null | undefined,
): boolean {
  if (!order) return false;
  const locale =
    order.offer_key === "hd-blueprint-cz" ? "cs" :
    order.offer_key === "hd-blueprint-en" ? "en" : null;
  if (!locale) return false;
  const expected = getBlueprintOffer(locale);
  if (order.amount_minor !== expected.amountMinor || order.currency !== expected.currency) {
    return false;
  }

  if (order.payment_status === "PAID") return true;

  return Boolean(
    (provider?.status === "PAID" || provider?.status === "FULFILLED") &&
    provider.offerKey === order.offer_key &&
    provider.amountMinor === order.amount_minor &&
    provider.currency === order.currency
  );
}
