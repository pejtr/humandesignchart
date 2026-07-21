/**
 * Stripe Webhook Handler
 * Handles subscription lifecycle events and payment completions.
 */
import Stripe from "stripe";
import { Express, Request, Response } from "express";
import { updateUserSubscription } from "./db";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";
import { sendLeadOSEvent } from "./leados";
import { ENV } from "./_core/env";
import { fulfillCreditsOrder, fulfillGiftVoucherOrder, fulfillLifetimeOrder, trackAffiliateCommission } from "./services/payment";
import { trackConversion } from "./metaConversionsApi";

export function getStripe(): Stripe | null {
  if (!ENV.stripeSecretKey) return null;
  return new Stripe(ENV.stripeSecretKey, { apiVersion: "2026-02-25.clover" });
}

/** Register the Stripe webhook route — MUST be before express.json() */
export function registerStripeWebhook(app: Express) {
  app.post(
    "/api/stripe/webhook",
    // express.raw is applied per-route here
    (req: Request, res: Response, next) => {
      // If already parsed as JSON (dev), skip raw parsing
      if (req.headers["content-type"] === "application/json" && Buffer.isBuffer(req.body)) {
        return next();
      }
      // Use raw body for signature verification
      let data = "";
      req.setEncoding("utf8");
      req.on("data", (chunk) => { data += chunk; });
      req.on("end", () => {
        (req as any).rawBody = data;
        next();
      });
    },
    async (req: Request, res: Response) => {
      const stripe = getStripe();
      if (!stripe) {
        console.warn("[Stripe Webhook] Stripe not configured");
        return res.status(ENV.isProduction ? 503 : 200).json({ received: true, configured: false });
      }

      const sig = req.headers["stripe-signature"] as string;
      const rawBody = (req as any).rawBody || JSON.stringify(req.body);

      let event: Stripe.Event;

      try {
        if (ENV.stripeWebhookSecret && sig) {
          event = stripe.webhooks.constructEvent(rawBody, sig, ENV.stripeWebhookSecret);
        } else if (ENV.isProduction) {
          return res.status(400).send("Webhook signature verification is not configured");
        } else {
          // No webhook secret — parse body directly (dev/test only)
          event = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
        }
      } catch (err: any) {
        console.error("[Stripe Webhook] Signature verification failed:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      // ⚠️ CRITICAL: Handle test events
      if (event.id.startsWith("evt_test_")) {
        console.log("[Stripe Webhook] Test event detected, returning verification response");
        return res.json({ verified: true });
      }

      console.log(`[Stripe Webhook] Event: ${event.type} (${event.id})`);

      try {
        await handleStripeEvent(event);
      } catch (err) {
        console.error("[Stripe Webhook] Error handling event:", err);
        return res.status(500).json({ error: "Internal server error" });
      }

      return res.json({ received: true });
    }
  );
}

async function handleStripeEvent(event: Stripe.Event) {
  const stripe = getStripe();
  if (!stripe) return;

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutCompleted(session, stripe);
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.created": {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionUpdated(subscription);
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionDeleted(subscription);
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      await handlePaymentFailed(invoice);
      break;
    }
    default:
      console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session, stripe: Stripe) {
  const userId = session.metadata?.user_id ? parseInt(session.metadata.user_id) : null;
  if (!userId) {
    console.warn("[Stripe Webhook] checkout.session.completed: no user_id in metadata");
    return;
  }

  const mode = session.mode;
  const plan = session.metadata?.plan;
  const affiliateCode = session.metadata?.affiliate_code;

  // Fetch user for email + ip (for CAPI user matching)
  let userEmail: string | undefined;
  let userIp: string | undefined;
  let userAgent: string | undefined;
  try {
    const db = await getDb();
    if (db) {
      const u = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (u.length > 0) {
        userEmail = u[0].email ?? undefined;
        userIp = (u[0] as any).lastIp ?? undefined;
        userAgent = (u[0] as any).lastUserAgent ?? undefined;
      }
    }
  } catch (e) {
    console.warn("[Stripe Webhook] Failed to fetch user for CAPI:", e);
  }

  const currency = (session.currency?.toUpperCase() ?? "CZK") as string;
  const amountCzk = session.amount_total ? session.amount_total / 100 : (plan === "annual" ? 888 : 88);

  if (mode === "subscription" && session.subscription) {
    const planLabel = plan === "annual" ? "Roční Premium" : "Měsíční Premium";
    const customerEmail = session.metadata?.customer_email || session.customer_email || "neznámý";
    const customerName = session.metadata?.customer_name || "nový zákazník";

    // Track affiliate commission
    if (affiliateCode) {
      await trackAffiliateCommission(affiliateCode, userId, amountCzk, session.subscription as string);
    }

    // META Conversions API — server-side Purchase (dedup with client pixel via event_id)
    await trackConversion({
      eventName: "Purchase",
      email: userEmail ?? customerEmail,
      userId,
      value: amountCzk,
      currency,
      contentIds: [plan ?? "subscription"],
      contentName: "Premium Subscription",
      contentCategory: "subscription",
      predictedLtv: amountCzk,
      leadOSEvent: "subscription_upgraded",
      leadOSData: { plan: "premium" },
    });

    try {
      await notifyOwner({
        title: `🎉 Nové předplatné: ${planLabel}`,
        content: `Zákazník ${customerName} (${customerEmail}) si zakoupil ${planLabel}.\n\nUser ID: ${userId}\nSession ID: ${session.id}\nČas: ${new Date().toLocaleString("cs-CZ")}`,
      });
    } catch (e) {
      console.warn("[Stripe Webhook] Failed to send owner notification:", e);
    }
    console.log(`[Stripe Webhook] Subscription checkout completed for user ${userId}`);
  } else if (mode === "payment") {
    if (plan === "credits") {
      await fulfillCreditsOrder(userId, 5, "Stripe");
      await trackConversion({
        eventName: "Purchase",
        email: userEmail,
        userId,
        value: amountCzk,
        currency,
        contentIds: ["credits"],
        contentName: "Credit Pack",
        contentCategory: "credits",
      });
    } else if (plan === "gift_monthly" || plan === "gift_annual") {
      const giftPlan = plan === "gift_monthly" ? "monthly" : "annual";
      await fulfillGiftVoucherOrder(userId, giftPlan, {
        userId,
        plan: giftPlan,
        recipientEmail: session.metadata?.recipient_email,
        recipientName: session.metadata?.recipient_name,
        senderName: session.metadata?.sender_name,
        personalMessage: session.metadata?.personal_message,
      }, "Stripe");
    } else if (plan === "lifetime") {
      const amountCzkLifetime = session.amount_total ? session.amount_total / 100 : 2888;
      await fulfillLifetimeOrder(userId, amountCzkLifetime, session.payment_intent as string, "Stripe");
      if (affiliateCode) {
        await trackAffiliateCommission(affiliateCode, userId, amountCzkLifetime, session.payment_intent as string);
      }
      await trackConversion({
        eventName: "Purchase",
        email: userEmail,
        userId,
        value: amountCzkLifetime,
        currency,
        contentIds: ["lifetime"],
        contentName: "Lifetime Premium",
        contentCategory: "subscription",
        predictedLtv: amountCzkLifetime,
        leadOSEvent: "subscription_upgraded",
        leadOSData: { plan: "lifetime" },
      });
    }
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const db = await getDb();
  if (!db) return;

  // Find user by stripe customer ID
  const userResult = await db.select().from(users).where(eq(users.stripeCustomerId, customerId)).limit(1);
  if (userResult.length === 0) {
    console.warn(`[Stripe Webhook] No user found for customer ${customerId}`);
    return;
  }
  const user = userResult[0];

  const status = subscription.status as "active" | "canceled" | "past_due" | "trialing" | "none";
  const plan = subscription.metadata?.plan as "monthly" | "annual" | "none" || "none";
  const periodEnd = new Date((subscription as any).current_period_end * 1000);

  await updateUserSubscription(user.id, {
    stripeSubscriptionId: subscription.id,
    subscriptionStatus: status,
    subscriptionPlan: plan,
    subscriptionCurrentPeriodEnd: periodEnd,
  });

  console.log(`[Stripe Webhook] Updated subscription for user ${user.id}: ${status} (${plan})`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const db = await getDb();
  if (!db) return;

  const userResult = await db.select().from(users).where(eq(users.stripeCustomerId, customerId)).limit(1);
  if (userResult.length === 0) return;
  const user = userResult[0];

  await updateUserSubscription(user.id, {
    stripeSubscriptionId: null,
    subscriptionStatus: "canceled",
    subscriptionPlan: "none",
    subscriptionCurrentPeriodEnd: null,
  });

  console.log(`[Stripe Webhook] Subscription deleted for user ${user.id}`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const db = await getDb();
  if (!db) return;

  const userResult = await db.select().from(users).where(eq(users.stripeCustomerId, customerId)).limit(1);
  if (userResult.length === 0) return;
  const user = userResult[0];

  await updateUserSubscription(user.id, {
    subscriptionStatus: "past_due",
  });

  console.log(`[Stripe Webhook] Payment failed for user ${user.id}`);
}


