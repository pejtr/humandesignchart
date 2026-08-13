import type Stripe from "stripe";

/**
 * Creates a Checkout Session using the payment methods configured in Stripe.
 *
 * Managed/Dynamic Payments rejects an explicit `payment_method_types` list.
 * Strip it defensively so a future checkout edit cannot reintroduce the
 * production failure while Stripe still chooses eligible wallets and methods.
 */
export function createManagedCheckoutSession(
  stripe: Stripe,
  params: Stripe.Checkout.SessionCreateParams,
) {
  const { payment_method_types: _unsupported, ...managedParams } = params;
  return stripe.checkout.sessions.create(managedParams);
}
