/**
 * Stripe Webhook Handler
 * Handles subscription lifecycle events and payment completions.
 */
import Stripe from "stripe";
import { Express, Request, Response } from "express";
import { getUserByOpenId, updateUserSubscription, addAiReadingCredits, createGiftVoucher, getUserById, getUserByAffiliateCode, createAffiliateConversion, addCreditsWithLog, logCreditTransaction } from "./db";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";
import { sendLeadOSEvent } from "./leados";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export function getStripe(): Stripe | null {
  if (!stripeSecretKey) return null;
  return new Stripe(stripeSecretKey, { apiVersion: "2026-02-25.clover" });
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
        return res.status(200).json({ received: true });
      }

      const sig = req.headers["stripe-signature"] as string;
      const rawBody = (req as any).rawBody || JSON.stringify(req.body);

      let event: Stripe.Event;

      try {
        if (webhookSecret && sig) {
          event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
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

  if (mode === "subscription" && session.subscription) {
    // Subscription purchase — handled by subscription.created event
    const planLabel = session.metadata?.plan === "annual" ? "Roční Premium" : "Měsíční Premium";
    const customerEmail = session.metadata?.customer_email || session.customer_email || "neznámý";
    const customerName = session.metadata?.customer_name || "nový zákazník";

    // --- Affiliate commission tracking ---
    const affiliateCode = session.metadata?.affiliate_code;
    if (affiliateCode) {
      try {
        const affiliate = await getUserByAffiliateCode(affiliateCode);
        if (affiliate && affiliate.isAffiliate && affiliate.id !== userId) {
          // Determine commission rate based on tier
          const rateMap: Record<string, number> = { bronze: 0.20, silver: 0.22, gold: 0.25 };
          const commissionRate = rateMap[affiliate.affiliateTier ?? "bronze"] ?? 0.20;
          // Amount in CZK (from Stripe amount_total in haléře → CZK)
          const amountCzk = session.amount_total ? session.amount_total / 100 : (session.metadata?.plan === "annual" ? 888 : 88);
          const commissionAmount = Math.round(amountCzk * commissionRate * 100) / 100;

          await createAffiliateConversion({
            affiliateUserId: affiliate.id,
            convertedUserId: userId,
            stripeSubscriptionId: session.subscription as string || null,
            amount: amountCzk,
            commissionRate,
            commissionAmount,
            status: "pending",
          });

          // Log credit transaction for audit
          await logCreditTransaction(affiliate.id, 0, "affiliate_commission", {
            convertedUserId: userId,
            commissionAmount,
            commissionRate,
            sessionId: session.id,
          });

          console.log(`[Stripe Webhook] Affiliate commission: ${commissionAmount} CZK (${commissionRate * 100}%) for affiliate ${affiliate.id} from user ${userId}`);

          try {
            await notifyOwner({
              title: `🤝 Affiliate konverze: ${commissionAmount} CZK`,
              content: `Affiliate ${affiliate.name || affiliate.id} (kód: ${affiliateCode}) získal provizi ${commissionAmount} CZK (${commissionRate * 100}%) za konverzi uživatele ${userId}.\nSesion: ${session.id}`,
            });
          } catch (e) {
            console.warn("[Stripe Webhook] Failed to notify owner about affiliate conversion:", e);
          }
        }
      } catch (e) {
        console.error("[Stripe Webhook] Affiliate commission error:", e);
      }
    }
    // --- End affiliate tracking ---

    try {
      await notifyOwner({
        title: `🎉 Nové předplatné: ${planLabel}`,
        content: `Zákazník ${customerName} (${customerEmail}) si zakoupil ${planLabel}.\n\nUser ID: ${userId}\nSession ID: ${session.id}\nČas: ${new Date().toLocaleString("cs-CZ")}`,
      });
    } catch (e) {
      console.warn("[Stripe Webhook] Failed to send owner notification:", e);
    }
    // Fire subscription_upgraded event to LeadOS
    sendLeadOSEvent({
      event: "subscription_upgraded",
      data: {
        userId: userId ?? undefined,
        email: session.metadata?.customer_email || (session as any).customer_email || undefined,
        plan: "premium",
        amount: session.amount_total ? session.amount_total / 100 : undefined,
        currency: session.currency?.toUpperCase() ?? "CZK",
        score: 100,
      },
    });
    console.log(`[Stripe Webhook] Subscription checkout completed for user ${userId}`);
  } else if (mode === "payment") {
    // One-time payment: credits or gift voucher
    if (plan === "credits") {
      await addAiReadingCredits(userId, 5);
      const customerEmail = session.metadata?.customer_email || session.customer_email || "neznámý";
      const customerName = session.metadata?.customer_name || "zákazník";
      try {
        await notifyOwner({
          title: `💳 Nákup kreditů (5× AI výklad)`,
          content: `${customerName} (${customerEmail}) zakoupil balíček 5 AI výkladů.\n\nUser ID: ${userId}\nČas: ${new Date().toLocaleString("cs-CZ")}`,
        });
      } catch (e) {
        console.warn("[Stripe Webhook] Failed to send owner notification:", e);
      }
      console.log(`[Stripe Webhook] Added 5 credits to user ${userId}`);
    } else if (plan === "gift_monthly" || plan === "gift_annual") {
      // Create gift voucher
      const code = generateVoucherCode();
      const giftPlan = plan === "gift_monthly" ? "monthly" : "annual";
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1); // Valid for 1 year

      await createGiftVoucher({
        code,
        purchasedByUserId: userId,
        recipientEmail: session.metadata?.recipient_email || null,
        recipientName: session.metadata?.recipient_name || null,
        senderName: session.metadata?.sender_name || null,
        personalMessage: session.metadata?.personal_message || null,
        plan: giftPlan,
        creditsAmount: 0,
        stripePaymentIntentId: session.payment_intent as string || null,
        isRedeemed: false,
        expiresAt,
      });
      // Notify owner about gift voucher purchase
      try {
        const recipientEmail = session.metadata?.recipient_email || "neznámý";
        const senderName = session.metadata?.sender_name || "zákazník";
        await notifyOwner({
          title: `🎁 Dárkový poukaz zakoupen (${giftPlan})`,
          content: `${senderName} zakoupil dárkový poukaz pro ${recipientEmail}.\nKód: ${code}\nUser ID: ${userId}\nČas: ${new Date().toLocaleString("cs-CZ")}`,
        });
      } catch (e) {
        console.warn("[Stripe Webhook] Failed to send owner notification:", e);
      }
      console.log(`[Stripe Webhook] Created gift voucher ${code} for user ${userId}`);
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

function generateVoucherCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "HD-";
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    if (i < 3) code += "-";
  }
  return code;
}
