import { sendLeadOSEvent } from "./leadosRemarketing";

export interface AbandonedCartPayload {
  email: string;
  name?: string;
  cartItem: string;
  priceCZK: number;
}

/**
 * Triggers automated abandoned checkout recovery email via LeadOS CRM
 * Dispatches after checkout drop-off with 15% discount code MARIE15
 */
export async function triggerAbandonedCheckoutDrip(payload: AbandonedCartPayload): Promise<boolean> {
  try {
    const success = await sendLeadOSEvent({
      email: payload.email,
      event: "checkout_abandoned",
      name: payload.name || "Návštěvník",
      data: {
        item: payload.cartItem,
        price: payload.priceCZK,
        discountCode: "MARIE15",
        discountPercent: 15,
        checkoutRecoveryUrl: `https://humandesign.cz/pricing?coupon=MARIE15`,
      },
    });

    console.log(`[Abandoned Checkout Drip] Triggered for ${payload.email} with code MARIE15`);
    return success;
  } catch (err) {
    console.error("[Abandoned Checkout Drip] Failed to send drip event:", err);
    return false;
  }
}
