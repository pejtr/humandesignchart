import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import {
    consumeBlueprintPdfCredit,
    countAiReadingsByUser,
    hasRecentCreditTransaction,
    updateUserSubscription,
} from "../db";
import { getStripe } from "../stripeWebhook";
import { isPremiumUser, canGenerateAiReading, FREE_TIER } from "../stripeProducts";
import { ENV } from "../_core/env";
import { createManagedCheckoutSession } from "../stripeCheckout";

export const subscriptionRouter = router({
    status: protectedProcedure.query(async ({ ctx }) => {
        const user = ctx.user;
        const totalReadings = await countAiReadingsByUser(user.id);
        const premium = isPremiumUser(user);
        return {
            isPremium: premium,
            plan: user.subscriptionPlan,
            status: user.subscriptionStatus,
            currentPeriodEnd: user.subscriptionCurrentPeriodEnd,
            aiReadingCredits: user.aiReadingCredits,
            blueprintPdfCredits: user.blueprintPdfCredits,
            totalReadings,
            freeReadingsLeft: premium ? null : Math.max(0, FREE_TIER.AI_READINGS_LIMIT - totalReadings),
            canGenerateReading: canGenerateAiReading(user, totalReadings).allowed,
            isOwner: !!ENV.ownerOpenId && user.openId === ENV.ownerOpenId,
        };
    }),
    createCheckout: protectedProcedure
        .input(z.object({
            plan: z.enum(["monthly", "annual", "lifetime", "credits", "brainwave_audio", "blueprint", "blueprint_annual_upgrade", "gift_monthly", "gift_annual"]),
            locale: z.string().default("cs"),
            origin: z.string(),
            includePartnerAddon: z.boolean().default(false),
            recipientEmail: z.string().email().optional(),
            recipientName: z.string().optional(),
            senderName: z.string().optional(),
            personalMessage: z.string().optional(),
            redditClickId: z.string().max(255).optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            const stripe = getStripe();
            if (!stripe) throw new Error("Stripe not configured");
            const user = ctx.user;
            const isGift = input.plan.startsWith("gift_");
            const isSubscription = input.plan === "monthly" || input.plan === "annual";
            const isCzech = input.locale === "cs";
            if (input.plan === "blueprint_annual_upgrade") {
                const eligibleSince = new Date(Date.now() - 48 * 60 * 60 * 1000);
                const eligible = await hasRecentCreditTransaction(user.id, "blueprint_purchase", eligibleSince);
                if (!eligible) {
                    throw new TRPCError({
                        code: "FORBIDDEN",
                        message: "Zvýhodněný doplatek je dostupný 48 hodin po nákupu Blueprintu.",
                    });
                }
            }
            let customerId = user.stripeCustomerId;
            if (!customerId) {
                const customer = await stripe.customers.create({ email: user.email || undefined, name: user.name || undefined, metadata: { user_id: user.id.toString() } });
                customerId = customer.id;
                await updateUserSubscription(user.id, { stripeCustomerId: customerId });
            }
            const priceData = {
                monthly: { czk: 18800, eur: 749, name: "Human Design Premium - Mesicni", taxCode: "txcd_10103000" },
                annual: { czk: 118800, eur: 4700, name: "Human Design Premium - Rocni", taxCode: "txcd_10103000" },
                lifetime: { czk: 288800, eur: 11500, name: "Human Design Premium - Dozivotne", taxCode: "txcd_10103000" },
                credits: { czk: 7700, eur: 299, name: "Human Design AI Credits (5x)", taxCode: "txcd_10105001" },
                brainwave_audio: { czk: 19500, eur: 790, name: "12minutove Human Design binauralni audio", taxCode: "txcd_10701411" },
                blueprint: { czk: 39000, eur: 1590, name: "Osobni Human Design Blueprint", taxCode: "txcd_10701411" },
                blueprint_annual_upgrade: { czk: 79800, eur: 3190, name: "Rocni Premium - doplatek po Blueprintu", taxCode: "txcd_10103000" },
                gift_monthly: { czk: 18800, eur: 749, name: "Darkovy poukaz - Premium Mesic", taxCode: "txcd_10103000" },
                gift_annual: { czk: 118800, eur: 4700, name: "Darkovy poukaz - Premium Rok", taxCode: "txcd_10103000" },
            }[input.plan];
            const currency = isCzech ? "czk" : "eur";
            const unitAmount = isCzech ? priceData.czk : priceData.eur;
            const partnerAddonAmount = isCzech ? 19000 : 790;
            const metadata: Record<string, string> = {
                user_id: user.id.toString(),
                customer_email: user.email || "",
                customer_name: user.name || "",
                plan: input.plan,
                partner_addon: input.plan === "blueprint" && input.includePartnerAddon ? "true" : "false",
            };
            if (input.redditClickId) metadata.rdt_cid = input.redditClickId;
            if (isGift) {
                if (input.recipientEmail) metadata.recipient_email = input.recipientEmail;
                if (input.recipientName) metadata.recipient_name = input.recipientName;
                if (input.senderName) metadata.sender_name = input.senderName;
                if (input.personalMessage) metadata.personal_message = input.personalMessage.slice(0, 500);
            }
            const successUrl = `${input.origin}/${input.locale}/payment/success?plan=${input.plan}&session_id={CHECKOUT_SESSION_ID}`;
            const cancelUrl = `${input.origin}/${input.locale}/payment/cancel`;

            if (!isSubscription && isCzech && ENV.comgateMerchantId) {
                const { createComgateCheckoutSession } = await import("../_core/comgate");
                
                const rawMeta: any = {
                        u: user.id,
                        p: input.plan,
                        email: user.email,
                        name: user.name,
                        partner: input.plan === "blueprint" && input.includePartnerAddon ? 1 : 0,
                };
                if (input.recipientEmail) rawMeta.recEmail = input.recipientEmail;
                if (input.recipientName) rawMeta.recName = input.recipientName;
                if (input.senderName) rawMeta.sndName = input.senderName;
                
                const refId = Buffer.from(JSON.stringify(rawMeta)).toString("base64").substring(0, 255);

                try {
                    const comgateRes = await createComgateCheckoutSession({
                        price: unitAmount + (input.plan === "blueprint" && input.includePartnerAddon ? partnerAddonAmount : 0),
                        currency: "CZK",
                        label: priceData.name,
                        refId: refId,
                        email: user.email || "neznamy@zakaznik.cz",
                        lang: "cs"
                    });
                    return { url: comgateRes.redirectUrl };
                } catch (e: any) {
                    console.error("[Comgate API error]", e);
                }
            }

            if (isSubscription) {
                const session = await createManagedCheckoutSession(stripe, {
                    mode: "subscription",
                    customer: customerId,
                    client_reference_id: user.id.toString(),
                    metadata,
                    allow_promotion_codes: true,
                    // Stripe Managed Payments selects eligible methods dynamically.
                    // Apple Pay / Google Pay remain available through card wallets;
                    // PayPal appears only when the account, currency and buyer qualify.
                    line_items: [{
                        price_data: {
                            currency,
                            unit_amount: unitAmount,
                            recurring: { interval: input.plan === "monthly" ? "month" : "year" },
                            product_data: {
                                name: priceData.name,
                                tax_code: priceData.taxCode,
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
                const lineItems: any[] = [{
                    price_data: {
                        currency,
                        unit_amount: unitAmount,
                        product_data: {
                            name: priceData.name,
                            tax_code: priceData.taxCode,
                            metadata: { plan: input.plan },
                        },
                    },
                    quantity: 1,
                }];
                if (input.plan === "blueprint" && input.includePartnerAddon) {
                    lineItems.push({
                        price_data: {
                            currency,
                            unit_amount: partnerAddonAmount,
                            product_data: {
                                tax_code: "txcd_10701411",
                                name: isCzech ? "Partnerský Blueprint doplněk" : "Partner Blueprint add-on",
                                metadata: { plan: "blueprint_partner" },
                            },
                        },
                        quantity: 1,
                    });
                }
                const session = await createManagedCheckoutSession(stripe, {
                    mode: "payment",
                    customer: customerId,
                    client_reference_id: user.id.toString(),
                    metadata,
                    allow_promotion_codes: true,
                    line_items: lineItems,
                    success_url: successUrl,
                    cancel_url: cancelUrl,
                });
                return { url: session.url };
            }
        }),

    consumeBlueprintPdf: protectedProcedure.mutation(async ({ ctx }) => {
        if (isPremiumUser(ctx.user)) return { consumed: false, isPremium: true };
        const consumed = await consumeBlueprintPdfCredit(ctx.user.id);
        if (!consumed) {
            throw new TRPCError({ code: "PAYMENT_REQUIRED", message: "Blueprint PDF kredit není k dispozici." });
        }
        return { consumed: true, isPremium: false };
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
