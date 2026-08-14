import Stripe from "stripe";
import type { Express, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { users } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { getDb, updateUserSubscription } from "./db";
import { normalizedPaymentEventSchema } from "./payments/contracts";
import { isPaymentProductKey } from "./payments/offers";
import { processPaymentEvent, recordPaymentAuditEvent } from "./payments/mysqlStore";
import { trackConversion } from "./metaConversionsApi";

export function getStripe(): Stripe | null {
  if (!ENV.stripeSecretKey) return null;
  return new Stripe(ENV.stripeSecretKey, { apiVersion: "2026-02-25.clover" });
}

function idOf(value: string | { id: string } | null | undefined): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

function safePayload(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value));
}

/** Register before express.json(): Stripe signatures require the untouched body. */
export function registerStripeWebhook(app: Express) {
  app.post(
    "/api/stripe/webhook",
    (req: Request, _res: Response, next) => {
      let data = "";
      req.setEncoding("utf8");
      req.on("data", (chunk) => { data += chunk; });
      req.on("end", () => { (req as Request & { rawBody?: string }).rawBody = data; next(); });
    },
    async (req: Request, res: Response) => {
      const stripe = getStripe();
      if (!stripe) return res.status(ENV.isProduction ? 503 : 200).json({ received: true, configured: false });
      const signature = req.headers["stripe-signature"] as string | undefined;
      const rawBody = (req as Request & { rawBody?: string }).rawBody ?? JSON.stringify(req.body);
      let event: Stripe.Event;
      try {
        if (ENV.stripeWebhookSecret && signature) {
          event = stripe.webhooks.constructEvent(rawBody, signature, ENV.stripeWebhookSecret);
        } else if (ENV.isProduction) {
          return res.status(400).send("Webhook signature verification is not configured");
        } else {
          event = JSON.parse(rawBody) as Stripe.Event;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return res.status(400).send(`Webhook Error: ${message}`);
      }

      if (event.id.startsWith("evt_test_")) return res.json({ verified: true });
      try {
        await handleStripeEvent(event);
        return res.json({ received: true });
      } catch (error) {
        console.error("[Stripe Webhook] Processing failed", error);
        return res.status(500).json({ error: "Internal server error" });
      }
    },
  );
}

export async function handleStripeEvent(event: Stripe.Event) {
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    await processCheckout(event);
    return;
  }
  if (event.type === "charge.refunded") {
    const charge = event.data.object as Stripe.Charge;
    const paymentRef = idOf(charge.payment_intent);
    if (!paymentRef || charge.amount_refunded !== charge.amount) {
      await recordPaymentAuditEvent({
        provider: "stripe",
        eventId: event.id,
        eventType: event.type,
        code: paymentRef ? "PARTIAL_REFUND_MANUAL_REVIEW" : "PAYMENT_REFERENCE_MISSING",
        message: "Only a full refund with a payment_intent can be compensated automatically.",
        rawPayload: safePayload(event),
        paymentRef: paymentRef ?? undefined,
      });
      return;
    }
    await processPaymentEvent(normalizedPaymentEventSchema.parse({
      action: "reversal",
      provider: "stripe",
      eventId: event.id,
      eventType: event.type,
      paymentRef,
      reason: "refund",
      rawPayload: safePayload(event),
    }));
    return;
  }
  if (event.type === "charge.dispute.created") {
    const dispute = event.data.object as Stripe.Dispute;
    const paymentRef = idOf(dispute.payment_intent);
    if (!paymentRef) {
      await recordPaymentAuditEvent({ provider: "stripe", eventId: event.id, eventType: event.type, code: "PAYMENT_REFERENCE_MISSING", message: "Dispute has no payment_intent.", rawPayload: safePayload(event) });
      return;
    }
    await processPaymentEvent(normalizedPaymentEventSchema.parse({ action: "reversal", provider: "stripe", eventId: event.id, eventType: event.type, paymentRef, reason: "chargeback", rawPayload: safePayload(event) }));
    return;
  }
  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.created") {
    await updateSubscription(event.data.object as Stripe.Subscription);
  } else if (event.type === "customer.subscription.deleted") {
    await deleteSubscription(event.data.object as Stripe.Subscription);
  } else if (event.type === "invoice.payment_failed") {
    await markPaymentFailed(event.data.object as Stripe.Invoice);
  }
}

async function processCheckout(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;
  const userId = Number(session.metadata?.user_id);
  const productKey = session.metadata?.plan;
  const paymentRef = session.mode === "subscription" ? idOf(session.subscription) : idOf(session.payment_intent);
  const currency = session.currency?.toUpperCase();
  if (!Number.isInteger(userId) || userId <= 0 || !isPaymentProductKey(productKey) || !paymentRef || (currency !== "CZK" && currency !== "EUR") || session.amount_subtotal == null || session.amount_total == null) {
    await recordPaymentAuditEvent({
      provider: "stripe",
      eventId: event.id,
      eventType: event.type,
      code: "UNMATCHABLE_CHECKOUT",
      message: "Checkout is missing a valid user, product, payment reference, currency or amount.",
      rawPayload: safePayload(event),
      paymentRef: paymentRef ?? undefined,
    });
    return;
  }

  const normalized = normalizedPaymentEventSchema.parse({
    action: "purchase",
    provider: "stripe",
    eventId: event.id,
    eventType: event.type,
    userId,
    productKey,
    paymentRef,
    amountMinor: session.amount_total,
    offerAmountMinor: session.amount_subtotal,
    currency,
    partnerAddon: session.metadata?.partner_addon === "true",
    affiliateCode: session.metadata?.affiliate_code || undefined,
    recipientEmail: session.metadata?.recipient_email || undefined,
    recipientName: session.metadata?.recipient_name || undefined,
    senderName: session.metadata?.sender_name || undefined,
    personalMessage: session.metadata?.personal_message || undefined,
    subscriptionId: idOf(session.subscription) ?? undefined,
    rawPayload: safePayload(event),
  });
  const result = await processPaymentEvent(normalized);
  if (result.outcome === "fulfilled") {
    void trackConversion({
      eventName: "Purchase",
      eventId: session.id,
      redditClickId: session.metadata?.rdt_cid,
      userId,
      email: session.customer_email ?? undefined,
      value: session.amount_total / 100,
      currency,
      contentIds: [productKey],
      contentName: productKey,
      contentCategory: session.mode === "subscription" ? "subscription" : "digital_product",
    }).catch((error) => console.warn("[Stripe Webhook] Conversion telemetry failed", error));
  }
}

async function findUserByCustomer(customer: string | Stripe.Customer | Stripe.DeletedCustomer | null) {
  const customerId = idOf(customer);
  const db = await getDb();
  if (!db || !customerId) return null;
  const rows = await db.select().from(users).where(eq(users.stripeCustomerId, customerId)).limit(1);
  return rows[0] ?? null;
}

async function updateSubscription(subscription: Stripe.Subscription) {
  const user = await findUserByCustomer(subscription.customer);
  if (!user) return;
  const allowedStatuses = ["active", "canceled", "past_due", "trialing", "none"] as const;
  const status = allowedStatuses.includes(subscription.status as typeof allowedStatuses[number]) ? subscription.status as typeof allowedStatuses[number] : "none";
  const plan = subscription.metadata?.plan === "annual" ? "annual" : "monthly";
  const periodEndSeconds = (subscription as Stripe.Subscription & { current_period_end?: number }).current_period_end;
  await updateUserSubscription(user.id, { stripeSubscriptionId: subscription.id, subscriptionStatus: status, subscriptionPlan: plan, subscriptionCurrentPeriodEnd: periodEndSeconds ? new Date(periodEndSeconds * 1000) : null });
}

async function deleteSubscription(subscription: Stripe.Subscription) {
  const user = await findUserByCustomer(subscription.customer);
  if (user) await updateUserSubscription(user.id, { stripeSubscriptionId: null, subscriptionStatus: "canceled", subscriptionPlan: "none", subscriptionCurrentPeriodEnd: null });
}

async function markPaymentFailed(invoice: Stripe.Invoice) {
  const user = await findUserByCustomer(invoice.customer);
  if (user) await updateUserSubscription(user.id, { subscriptionStatus: "past_due" });
}
