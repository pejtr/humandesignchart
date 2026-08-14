import { z } from "zod";
import { PAYMENT_PRODUCT_KEYS } from "./offers";

const baseEventSchema = z.object({
  provider: z.enum(["stripe", "comgate"]),
  eventId: z.string().min(1).max(255),
  eventType: z.string().min(1).max(100),
  rawPayload: z.unknown(),
});

export const paymentPurchaseEventSchema = baseEventSchema.extend({
  action: z.literal("purchase"),
  userId: z.number().int().positive(),
  productKey: z.enum(PAYMENT_PRODUCT_KEYS),
  paymentRef: z.string().min(1).max(255),
  amountMinor: z.number().int().nonnegative(),
  offerAmountMinor: z.number().int().positive(),
  currency: z.enum(["CZK", "EUR"]),
  partnerAddon: z.boolean().default(false),
  affiliateCode: z.string().max(64).optional(),
  recipientEmail: z.string().email().optional(),
  recipientName: z.string().max(255).optional(),
  senderName: z.string().max(255).optional(),
  personalMessage: z.string().max(500).optional(),
  subscriptionId: z.string().max(255).optional(),
});

export const paymentReversalEventSchema = baseEventSchema.extend({
  action: z.literal("reversal"),
  paymentRef: z.string().min(1).max(255),
  reason: z.enum(["refund", "chargeback", "cancelled"]),
});

export const normalizedPaymentEventSchema = z.discriminatedUnion("action", [
  paymentPurchaseEventSchema,
  paymentReversalEventSchema,
]);

export type PaymentPurchaseEvent = z.infer<typeof paymentPurchaseEventSchema>;
export type PaymentReversalEvent = z.infer<typeof paymentReversalEventSchema>;
export type NormalizedPaymentEvent = z.infer<typeof normalizedPaymentEventSchema>;

export type PaymentProcessResult =
  | { outcome: "fulfilled"; paymentEventId: number }
  | { outcome: "duplicate"; paymentEventId: number }
  | { outcome: "reversed"; paymentEventId: number }
  | { outcome: "audit"; paymentEventId: number; code: string };
