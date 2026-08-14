import { randomBytes } from "node:crypto";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import {
  affiliateConversions,
  creditTransactions,
  entitlementLedger,
  giftVouchers,
  paymentEvents,
  users,
} from "../../drizzle/schema";
import { getDb } from "../db";
import { getCommissionRate } from "../services/affiliate";
import type { NormalizedPaymentEvent, PaymentPurchaseEvent, PaymentReversalEvent } from "./contracts";
import { processNormalizedPaymentEvent, type PaymentStore, type PaymentTransaction, type StoredPaymentStatus } from "./engine";

function voucherCode(): string {
  return `HD-${randomBytes(8).toString("hex").toUpperCase().match(/.{1,4}/g)!.join("-")}`;
}

function mysqlTimestamp(date = new Date()): string {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

function purchaseValues(event: NormalizedPaymentEvent) {
  return event.action === "purchase"
    ? {
        userId: event.userId,
        productKey: event.productKey,
        paymentRef: event.paymentRef,
        amountMinor: event.amountMinor,
        expectedAmountMinor: event.offerAmountMinor,
        currency: event.currency,
      }
    : { paymentRef: event.paymentRef };
}

class MysqlPaymentTransaction implements PaymentTransaction {
  constructor(private readonly tx: any) {}

  async claim(event: NormalizedPaymentEvent) {
    await this.tx.insert(paymentEvents).values({
      provider: event.provider,
      eventId: event.eventId,
      eventType: event.eventType,
      status: "received",
      attemptCount: 0,
      rawPayload: event.rawPayload as Record<string, unknown>,
      ...purchaseValues(event),
    }).onDuplicateKeyUpdate({
      set: { attemptCount: sql`${paymentEvents.attemptCount} + 1`, updatedAt: sql`NOW()` },
    });

    const rows = await this.tx.select().from(paymentEvents)
      .where(and(eq(paymentEvents.provider, event.provider), eq(paymentEvents.eventId, event.eventId)))
      .limit(1)
      .for("update");
    const row = rows[0];
    if (!row) throw new Error("Payment event claim failed");

    if (!["fulfilled", "audit", "reversed"].includes(row.status)) {
      await this.tx.update(paymentEvents).set({
        status: "processing",
        attemptCount: sql`${paymentEvents.attemptCount} + 1`,
        claimedAt: mysqlTimestamp(),
        errorCode: null,
        errorMessage: null,
      }).where(eq(paymentEvents.id, row.id));
    }
    return { id: row.id, status: row.status as StoredPaymentStatus };
  }

  async validatePurchase(event: PaymentPurchaseEvent) {
    const matches = await this.tx.select({ id: users.id }).from(users).where(eq(users.id, event.userId)).limit(1);
    if (matches.length === 0) {
      return { code: "USER_NOT_FOUND", message: `No user matches id ${event.userId}` };
    }
    return null;
  }

  private async addLedger(
    paymentEventId: number,
    userId: number,
    entitlementKey: string,
    quantity: number,
    metadata: Record<string, unknown> = {},
    status: "active" | "manual_review" = "active",
  ) {
    await this.tx.insert(entitlementLedger).values({
      paymentEventId,
      userId,
      entitlementKey,
      quantity,
      status,
      metadata,
      appliedAt: status === "active" ? mysqlTimestamp() : null,
    });
  }

  async fulfillPurchase(paymentEventId: number, event: PaymentPurchaseEvent) {
    const sourceMetadata = { provider: event.provider, paymentRef: event.paymentRef, productKey: event.productKey };
    if (event.productKey === "credits") {
      await this.tx.update(users).set({ aiReadingCredits: sql`COALESCE(${users.aiReadingCredits}, 0) + 5` }).where(eq(users.id, event.userId));
      await this.addLedger(paymentEventId, event.userId, "ai_reading_credits", 5, sourceMetadata);
      await this.tx.insert(creditTransactions).values({ userId: event.userId, amount: 5, reason: "credits_purchase", metadata: sourceMetadata });
    } else if (event.productKey === "blueprint") {
      const pdfCredits = event.partnerAddon ? 2 : 1;
      const aiCredits = event.partnerAddon ? 10 : 5;
      await this.tx.update(users).set({
        aiReadingCredits: sql`COALESCE(${users.aiReadingCredits}, 0) + ${aiCredits}`,
        blueprintPdfCredits: sql`COALESCE(${users.blueprintPdfCredits}, 0) + ${pdfCredits}`,
      }).where(eq(users.id, event.userId));
      await this.addLedger(paymentEventId, event.userId, "ai_reading_credits", aiCredits, sourceMetadata);
      await this.addLedger(paymentEventId, event.userId, "blueprint_pdf_credits", pdfCredits, sourceMetadata);
      await this.tx.insert(creditTransactions).values({ userId: event.userId, amount: aiCredits, reason: "blueprint_purchase", metadata: { ...sourceMetadata, partnerAddon: event.partnerAddon, pdfCredits } });
    } else if (event.productKey === "brainwave_audio") {
      await this.addLedger(paymentEventId, event.userId, "brainwave_audio", 1, sourceMetadata);
      await this.tx.insert(creditTransactions).values({ userId: event.userId, amount: 0, reason: "brainwave_audio_purchase", metadata: sourceMetadata });
    } else if (event.productKey === "gift_monthly" || event.productKey === "gift_annual") {
      const code = voucherCode();
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      await this.tx.insert(giftVouchers).values({
        code,
        purchasedByUserId: event.userId,
        recipientEmail: event.recipientEmail ?? null,
        recipientName: event.recipientName ?? null,
        senderName: event.senderName ?? null,
        personalMessage: event.personalMessage ?? null,
        plan: event.productKey === "gift_monthly" ? "monthly" : "annual",
        creditsAmount: 0,
        stripePaymentIntentId: event.paymentRef,
        isRedeemed: 0,
        expiresAt: mysqlTimestamp(expiresAt),
      });
      await this.addLedger(paymentEventId, event.userId, "gift_voucher", 1, { ...sourceMetadata, code });
    } else {
      const plan = event.productKey === "blueprint_annual_upgrade" ? "annual" : event.productKey;
      const periodEnd = new Date();
      if (plan === "monthly") periodEnd.setMonth(periodEnd.getMonth() + 1);
      if (plan === "annual") periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      await this.tx.update(users).set({
        subscriptionStatus: "active",
        subscriptionPlan: plan,
        stripeSubscriptionId: event.subscriptionId ?? undefined,
        subscriptionCurrentPeriodEnd: plan === "lifetime" ? null : mysqlTimestamp(periodEnd),
      }).where(eq(users.id, event.userId));
      await this.addLedger(paymentEventId, event.userId, `subscription:${plan}`, 1, sourceMetadata);
      if (event.productKey === "blueprint_annual_upgrade") {
        await this.tx.insert(creditTransactions).values({ userId: event.userId, amount: 0, reason: "blueprint_annual_upgrade", metadata: sourceMetadata });
      }
    }

    if (event.affiliateCode) await this.fulfillAffiliate(paymentEventId, event);
  }

  private async fulfillAffiliate(paymentEventId: number, event: PaymentPurchaseEvent) {
    const found = await this.tx.select().from(users).where(eq(users.affiliateCode, event.affiliateCode!)).limit(1);
    const affiliate = found[0];
    if (!affiliate || !affiliate.isAffiliate || affiliate.id === event.userId) return;

    if (event.currency !== "CZK") {
      await this.addLedger(paymentEventId, event.userId, "affiliate_commission", event.amountMinor, {
        affiliateUserId: affiliate.id,
        currency: event.currency,
        reason: "CURRENCY_REQUIRES_MANUAL_CONVERSION",
      }, "manual_review");
      return;
    }

    const rate = getCommissionRate(affiliate.affiliateTier ?? "bronze");
    const amountCzk = event.amountMinor / 100;
    const commission = Math.round(amountCzk * rate * 100) / 100;
    await this.tx.insert(affiliateConversions).values({
      paymentEventId,
      affiliateUserId: affiliate.id,
      convertedUserId: event.userId,
      stripeSubscriptionId: event.paymentRef,
      amount: amountCzk,
      commissionRate: rate,
      commissionAmount: commission,
      status: "pending",
    });
    await this.tx.update(users).set({
      affiliateTotalEarned: sql`COALESCE(${users.affiliateTotalEarned}, 0) + ${commission}`,
      affiliatePendingPayout: sql`COALESCE(${users.affiliatePendingPayout}, 0) + ${commission}`,
    }).where(eq(users.id, affiliate.id));
    await this.addLedger(paymentEventId, event.userId, "affiliate_commission", Math.round(commission * 100), { affiliateUserId: affiliate.id, currency: "CZK" });
  }

  async findOriginalPurchase(provider: NormalizedPaymentEvent["provider"], paymentRef: string) {
    const rows = await this.tx.select().from(paymentEvents).where(and(
      eq(paymentEvents.provider, provider),
      eq(paymentEvents.paymentRef, paymentRef),
      inArray(paymentEvents.status, ["fulfilled", "reversed"]),
    )).orderBy(desc(paymentEvents.id)).limit(1).for("update");
    const row = rows[0];
    return row ? { id: row.id, status: row.status as StoredPaymentStatus } : null;
  }

  async reversePurchase(originalPaymentEventId: number, _reversalEventId: number, _event: PaymentReversalEvent) {
    const entries = await this.tx.select().from(entitlementLedger)
      .where(and(eq(entitlementLedger.paymentEventId, originalPaymentEventId), eq(entitlementLedger.status, "active")))
      .for("update");

    for (const entry of entries) {
      if (entry.entitlementKey === "ai_reading_credits") {
        await this.tx.update(users).set({ aiReadingCredits: sql`GREATEST(COALESCE(${users.aiReadingCredits}, 0) - ${entry.quantity}, 0)` }).where(eq(users.id, entry.userId));
      } else if (entry.entitlementKey === "blueprint_pdf_credits") {
        await this.tx.update(users).set({ blueprintPdfCredits: sql`GREATEST(COALESCE(${users.blueprintPdfCredits}, 0) - ${entry.quantity}, 0)` }).where(eq(users.id, entry.userId));
      } else if (entry.entitlementKey.startsWith("subscription:")) {
        const plan = entry.entitlementKey.split(":")[1];
        await this.tx.update(users).set({ subscriptionStatus: "canceled", subscriptionPlan: "none", subscriptionCurrentPeriodEnd: null })
          .where(and(eq(users.id, entry.userId), eq(users.subscriptionPlan, plan as "monthly" | "annual" | "lifetime")));
      } else if (entry.entitlementKey === "gift_voucher") {
        const metadata = entry.metadata as { code?: string } | null;
        if (metadata?.code) {
          const gifts = await this.tx.select().from(giftVouchers).where(eq(giftVouchers.code, metadata.code)).limit(1).for("update");
          if (gifts[0]?.isRedeemed) {
            await this.tx.update(entitlementLedger).set({ status: "manual_review", reversedAt: mysqlTimestamp() }).where(eq(entitlementLedger.id, entry.id));
            continue;
          }
          await this.tx.delete(giftVouchers).where(eq(giftVouchers.code, metadata.code));
        }
      } else if (entry.entitlementKey === "affiliate_commission") {
        const conversion = await this.tx.select().from(affiliateConversions).where(eq(affiliateConversions.paymentEventId, originalPaymentEventId)).limit(1).for("update");
        const row = conversion[0];
        if (row && row.status !== "paid") {
          await this.tx.update(affiliateConversions).set({ status: "cancelled" }).where(eq(affiliateConversions.id, row.id));
          await this.tx.update(users).set({
            affiliateTotalEarned: sql`GREATEST(COALESCE(${users.affiliateTotalEarned}, 0) - ${row.commissionAmount}, 0)`,
            affiliatePendingPayout: sql`GREATEST(COALESCE(${users.affiliatePendingPayout}, 0) - ${row.commissionAmount}, 0)`,
          }).where(eq(users.id, row.affiliateUserId));
        } else if (row?.status === "paid") {
          await this.tx.update(entitlementLedger).set({ status: "manual_review", reversedAt: mysqlTimestamp() }).where(eq(entitlementLedger.id, entry.id));
          continue;
        }
      }
      await this.tx.update(entitlementLedger).set({ status: "reversed", reversedAt: mysqlTimestamp() }).where(eq(entitlementLedger.id, entry.id));
    }
  }

  async markStatus(paymentEventId: number, status: StoredPaymentStatus, details: { code?: string; message?: string; reversalOfPaymentEventId?: number } = {}) {
    await this.tx.update(paymentEvents).set({
      status,
      errorCode: details.code ?? null,
      errorMessage: details.message ?? null,
      reversalOfPaymentEventId: details.reversalOfPaymentEventId,
      processedAt: ["fulfilled", "audit", "reversed"].includes(status) ? mysqlTimestamp() : null,
    }).where(eq(paymentEvents.id, paymentEventId));
  }
}

export async function processPaymentEvent(event: NormalizedPaymentEvent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const store: PaymentStore = {
    transaction: (work) => db.transaction((tx: any) => work(new MysqlPaymentTransaction(tx))),
  };
  try {
    return await processNormalizedPaymentEvent(store, event);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await db.insert(paymentEvents).values({
      provider: event.provider,
      eventId: event.eventId,
      eventType: event.eventType,
      status: "failed",
      attemptCount: 1,
      rawPayload: event.rawPayload as Record<string, unknown>,
      errorCode: "PROCESSING_FAILED",
      errorMessage: message.slice(0, 4000),
      ...purchaseValues(event),
    }).onDuplicateKeyUpdate({ set: { status: "failed", errorCode: "PROCESSING_FAILED", errorMessage: message.slice(0, 4000), updatedAt: sql`NOW()` } });
    throw error;
  }
}

export async function recordPaymentAuditEvent(input: {
  provider: "stripe" | "comgate";
  eventId: string;
  eventType: string;
  code: string;
  message: string;
  rawPayload: unknown;
  paymentRef?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(paymentEvents).values({
    provider: input.provider,
    eventId: input.eventId,
    eventType: input.eventType,
    status: "audit",
    attemptCount: 1,
    rawPayload: input.rawPayload as Record<string, unknown>,
    paymentRef: input.paymentRef,
    errorCode: input.code,
    errorMessage: input.message.slice(0, 4000),
    processedAt: mysqlTimestamp(),
  }).onDuplicateKeyUpdate({
    set: { attemptCount: sql`${paymentEvents.attemptCount} + 1`, updatedAt: sql`NOW()` },
  });
}
