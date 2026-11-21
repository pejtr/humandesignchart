import { getOfferAmountMinor } from "./offers";
import { resolveHonorariumSelection } from "./honorarium";
import type {
  NormalizedPaymentEvent,
  PaymentProcessResult,
  PaymentPurchaseEvent,
  PaymentReversalEvent,
} from "./contracts";

export type StoredPaymentStatus = "received" | "processing" | "fulfilled" | "failed" | "audit" | "reversed";

export interface ClaimedPaymentEvent {
  id: number;
  status: StoredPaymentStatus;
}

export interface OriginalPaymentEvent {
  id: number;
  status: StoredPaymentStatus;
}

export interface PaymentTransaction {
  claim(event: NormalizedPaymentEvent): Promise<ClaimedPaymentEvent>;
  validatePurchase(event: PaymentPurchaseEvent): Promise<{ code: string; message: string } | null>;
  fulfillPurchase(paymentEventId: number, event: PaymentPurchaseEvent): Promise<void>;
  findOriginalPurchase(provider: NormalizedPaymentEvent["provider"], paymentRef: string): Promise<OriginalPaymentEvent | null>;
  reversePurchase(originalPaymentEventId: number, reversalEventId: number, event: PaymentReversalEvent): Promise<void>;
  markStatus(paymentEventId: number, status: StoredPaymentStatus, details?: { code?: string; message?: string; reversalOfPaymentEventId?: number }): Promise<void>;
}

export interface PaymentStore {
  transaction<T>(work: (tx: PaymentTransaction) => Promise<T>): Promise<T>;
}

export async function processNormalizedPaymentEvent(
  store: PaymentStore,
  event: NormalizedPaymentEvent,
): Promise<PaymentProcessResult> {
  return store.transaction(async (tx) => {
    const claimed = await tx.claim(event);
    if (["fulfilled", "audit", "reversed"].includes(claimed.status)) {
      return { outcome: "duplicate", paymentEventId: claimed.id };
    }

    if (event.action === "purchase") {
      if (event.productKey === "blueprint") {
        let honorarium;
        try {
          honorarium = resolveHonorariumSelection({
            productId: event.productKey,
            currency: event.currency,
            partnerAddon: event.partnerAddon,
            voluntaryTopUpMinor: event.voluntaryTopUpMinor ?? 0,
          });
        } catch (error) {
          await tx.markStatus(claimed.id, "audit", {
            code: "HONORARIUM_SELECTION_INVALID",
            message: error instanceof Error ? error.message : "Invalid honorarium selection",
          });
          return { outcome: "audit", paymentEventId: claimed.id, code: "HONORARIUM_SELECTION_INVALID" };
        }
        if (event.minimumAmountMinor !== honorarium.minimumAmountMinor || event.offerAmountMinor !== honorarium.totalAmountMinor || event.amountMinor !== honorarium.totalAmountMinor) {
          await tx.markStatus(claimed.id, "audit", {
            code: "HONORARIUM_AMOUNT_MISMATCH",
            message: `Expected minimum ${honorarium.minimumAmountMinor} and total ${honorarium.totalAmountMinor} ${event.currency}`,
          });
          return { outcome: "audit", paymentEventId: claimed.id, code: "HONORARIUM_AMOUNT_MISMATCH" };
        }
      }
      const expected = getOfferAmountMinor(event.productKey, event.currency, event.partnerAddon);
      if (event.productKey !== "blueprint" && event.offerAmountMinor !== expected) {
        await tx.markStatus(claimed.id, "audit", {
          code: "OFFER_AMOUNT_MISMATCH",
          message: `Expected ${expected} ${event.currency}, received offer subtotal ${event.offerAmountMinor}`,
        });
        return { outcome: "audit", paymentEventId: claimed.id, code: "OFFER_AMOUNT_MISMATCH" };
      }
      if (event.productKey !== "blueprint" && event.amountMinor > event.offerAmountMinor) {
        await tx.markStatus(claimed.id, "audit", {
          code: "PAID_AMOUNT_INVALID",
          message: `Paid amount ${event.amountMinor} exceeds offer subtotal ${event.offerAmountMinor}`,
        });
        return { outcome: "audit", paymentEventId: claimed.id, code: "PAID_AMOUNT_INVALID" };
      }

      const validationFailure = await tx.validatePurchase(event);
      if (validationFailure) {
        await tx.markStatus(claimed.id, "audit", validationFailure);
        return { outcome: "audit", paymentEventId: claimed.id, code: validationFailure.code };
      }

      await tx.fulfillPurchase(claimed.id, event);
      await tx.markStatus(claimed.id, "fulfilled");
      return { outcome: "fulfilled", paymentEventId: claimed.id };
    }

    const original = await tx.findOriginalPurchase(event.provider, event.paymentRef);
    if (!original) {
      await tx.markStatus(claimed.id, "audit", {
        code: "ORIGINAL_PAYMENT_NOT_FOUND",
        message: `No fulfilled purchase found for payment reference ${event.paymentRef}`,
      });
      return { outcome: "audit", paymentEventId: claimed.id, code: "ORIGINAL_PAYMENT_NOT_FOUND" };
    }
    if (original.status === "reversed") {
      await tx.markStatus(claimed.id, "fulfilled", { reversalOfPaymentEventId: original.id });
      return { outcome: "duplicate", paymentEventId: claimed.id };
    }

    await tx.reversePurchase(original.id, claimed.id, event);
    await tx.markStatus(original.id, "reversed");
    await tx.markStatus(claimed.id, "fulfilled", { reversalOfPaymentEventId: original.id });
    return { outcome: "reversed", paymentEventId: claimed.id };
  });
}
