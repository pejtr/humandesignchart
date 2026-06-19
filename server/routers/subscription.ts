import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { countAiReadingsByUser, updateUserSubscription, getUserById } from "../db";
import { getStripe } from "../stripeWebhook";
import { isPremiumUser, canGenerateAiReading, FREE_TIER } from "../stripeProducts";
import { ENV } from "../_core/env";

export const subscriptionRouter = router({
    status: protectedProcedure.query(async ({ ctx }) => {
        const user = ctx.user;
        const totalReadings = await countAiReadingsByUser(user.id);
        const premium = isPremiumUser(user);
        const isOwner = !!ENV.ownerOpenId && user.openId === ENV.ownerOpenId;
        return {
            isPremium: premium,
            plan: user.subscriptionPlan,
            status: user.subscriptionStatus,
            currentPeriodEnd: user.subscriptionCurrentPeriodEnd,
            aiReadingCredits: user.aiReadingCredits,
            totalReadings,
            freeReadingsLeft: premium ? null : Math.max(0, FREE_TIER.AI_READINGS_LIMIT - totalReadings),
            canGenerateReading: canGenerateAiReading(user, totalReadings).allowed,
            isOwner,
        };
    }),

    createCheckout: protectedProcedure
        .input(z.object({
            plan: z.enum(["monthly", "annual", "credits", "gift_monthly", "gift_annual"]),
            locale: z.string().default("cs"),
            origin: z.string(),
            recipientEmail: z.string().email().optional(),
            recipientName: z.string().optional(),
            senderName: z.string().optional(),
            personalMessage: z.string().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            const stripe = getStripe();
            if (!stripe) throw new Error("Stripe not configured");

            const user = ctx.user;
            const isGift = input.plan.startsWith("gift_");
            const isSubscription = input.plan === "monthly" || input.plan === "annual";
            const isCzech = input.locale === "cs";

            let customerId = user.stripeCustomerId;
            if (!customerId) {
                const customer = await stripe.customers.create({
                    email: user.email || undefined,
                    name: user.name || undefined,
                    metadata: { user_id: user.id.toString() },
                });
                customerId = customer.id;
                await updateUserSubscription(user.id, { stripeCustomerId: customerId });
            }

            const priceData = {
                monthly: { czk: 8800, eur: 349, name: "Human Design Premium — Měsíční" },
                annual: { czk: 88800, eur: 3500, name: "Human Design Premium — Roční" },
                credits: { czk: 4400, eur: 179, name: "Human Design AI Credits (5×)" },
                gift_monthly: { czk: 8800, eur: 349, name: "Dárkový poukaz — Premium Měsíc" },
                gift_annual: { czk: 88800, eur: 3500, name: "Dárkový poukaz — Premium Rok" },
            }[input.plan];

            const currency = isCzech ? "czk" : "eur";
            const unitAmount = isCzech ? priceData.czk : priceData.eur;

            const metadata: Record<string, string> = {
                user_id: user.id.toString(),
                customer_email: user.email || "",
                customer_name: user.name || "",
                plan: input.plan,
            };

            if (isGift) {
                if (input.recipientEmail) metadata.recipient_email = input.recipientEmail;
                if (input.recipientName) metadata.recipient_name = input.recipientName;
                if (input.senderName) metadata.sender_name = input.senderName;
                if (input.personalMessage) metadata.personal_message = input.personalMessage.slice(0, 500);
            }

            const successUrl = `${input.origin}/${input.locale}/payment/success?plan=${input.plan}`;
            const cancelUrl = `${input.origin}/${input.locale}/payment/cancel`;

            if (isSubscription) {
                const session = await stripe.checkout.sessions.create({
                    mode: "subscription",
                    customer: customerId,
                    client_reference_id: user.id.toString(),
                    metadata,
                    allow_promotion_codes: true,
                    line_items: [{
                        price_data: {
                            currency,
                            unit_amount: unitAmount,
                            recurring: { interval: input.plan === "monthly" ? "month" : "year" },
                            product_data: {
                                name: priceData.name,
                                metadata: { plan: input.plan },
                            },
                        },
                        quantity: 1,
                    }],
                    subscription_data: { metadata: { plan: input.plan } },
                    success_url: successUrl,
                    cancel_url: cancelUrl,
                });
                return { url: session.url };
            } else {
                const session = await stripe.checkout.sessions.create({
                    mode: "payment",
                    customer: customerId,
                    client_reference_id: user.id.toString(),
                    metadata,
                    allow_promotion_codes: true,
                    line_items: [{
                        price_data: {
                            currency,
                            unit_amount: unitAmount,
                            product_data: { name: priceData.name },
                        },
                        quantity: 1,
                    }],
                    success_url: successUrl,
                    cancel_url: cancelUrl,
                });
                return { url: session.url };
            }
        }),

    cancel: protectedProcedure.mutation(async ({ ctx }) => {
        const stripe = getStripe();
        if (!stripe) throw new Error("Stripe not configured");
        const user = ctx.user;
        if (!user.stripeSubscriptionId) throw new Error("No active subscription");
        await stripe.subscriptions.update(user.stripeSubscriptionId, {
            cancel_at_period_end: true,
        });
        return { success: true };
    }),

    reactivate: protectedProcedure.mutation(async ({ ctx }) => {
        const stripe = getStripe();
        if (!stripe) throw new Error("Stripe not configured");
        const user = ctx.user;
        if (!user.stripeSubscriptionId) throw new Error("No subscription found");
        await stripe.subscriptions.update(user.stripeSubscriptionId, {
            cancel_at_period_end: false,
        });
        return { success: true };
    }),

    portalSession: protectedProcedure
        .input(z.object({ origin: z.string(), locale: z.string().default("cs") }))
        .mutation(async ({ ctx, input }) => {
            const stripe = getStripe();
            if (!stripe) throw new Error("Stripe not configured");
            const user = ctx.user;
            if (!user.stripeCustomerId) throw new Error("No Stripe customer found");
            const session = await stripe.billingPortal.sessions.create({
                customer: user.stripeCustomerId,
                return_url: `${input.origin}/${input.locale}/dashboard`,
            });
            return { url: session.url };
        }),
});
