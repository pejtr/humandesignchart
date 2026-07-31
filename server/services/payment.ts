/**
 * Shared payment fulfillment logic used by Stripe and Comgate webhooks.
 * Eliminates ~100 lines of duplication between webhook handlers.
 */
import {
  addAiReadingCredits,
  addBlueprintPdfCredits,
  createGiftVoucher,
  getUserByAffiliateCode,
  createAffiliateConversion,
  logCreditTransaction,
  updateUserSubscription,
  getUserById,
} from "../db";
import { notifyOwner } from "../_core/notification";
import { getCommissionRate } from "./affiliate";

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

export interface OrderMetadata {
  userId: number;
  plan: string;
  customerEmail?: string;
  customerName?: string;
  affiliateCode?: string;
  senderName?: string;
  recipientEmail?: string;
  recipientName?: string;
  personalMessage?: string;
}

export async function fulfillCreditsOrder(userId: number, quantity: number, source: string) {
  await addAiReadingCredits(userId, quantity);
  try {
    const user = await getUserById(userId);
    await notifyOwner({
      title: `💳 Nákup kreditů (${quantity}× AI) [${source}]`,
      content: `${user?.name || "zákazník"} (${user?.email || "neznámý"}) zakoupil ${quantity} AI výkladů.\nUser: ${userId}`,
    });
  } catch { /* non-critical */ }
  console.log(`[${source}] Added ${quantity} credits to user ${userId}`);
}

export async function fulfillBlueprintOrder(
  userId: number,
  includePartnerAddon: boolean,
  paymentRef: string,
  source: string,
) {
  const pdfCredits = includePartnerAddon ? 2 : 1;
  const aiCredits = includePartnerAddon ? 10 : 5;
  await Promise.all([
    addBlueprintPdfCredits(userId, pdfCredits),
    addAiReadingCredits(userId, aiCredits),
  ]);
  await logCreditTransaction(userId, aiCredits, "blueprint_purchase", {
    includePartnerAddon,
    pdfCredits,
    paymentRef,
    source,
  });

  try {
    const user = await getUserById(userId);
    await notifyOwner({
      title: `🌙 Zakoupen osobní Blueprint [${source}]`,
      content: `${user?.name || "zákazník"} (${user?.email || "neznámý"}) zakoupil Blueprint${includePartnerAddon ? " + partnerský doplněk" : ""}.\nUser ID: ${userId}`,
    });
  } catch { /* non-critical */ }
}

export async function fulfillBlueprintAnnualUpgrade(
  userId: number,
  paymentRef: string,
  source: string,
) {
  const periodEnd = new Date();
  periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  await updateUserSubscription(userId, {
    subscriptionStatus: "active",
    subscriptionPlan: "annual",
    subscriptionCurrentPeriodEnd: periodEnd,
  });
  await logCreditTransaction(userId, 0, "blueprint_annual_upgrade", { paymentRef, source });

  try {
    const user = await getUserById(userId);
    await notifyOwner({
      title: `👑 Blueprint převeden na roční Premium [${source}]`,
      content: `${user?.name || "zákazník"} (${user?.email || "neznámý"}) doplatil roční Premium.\nUser ID: ${userId}`,
    });
  } catch { /* non-critical */ }
}

export async function fulfillGiftVoucherOrder(
  userId: number,
  plan: "monthly" | "annual",
  metadata: OrderMetadata,
  source: string,
) {
  const code = generateVoucherCode();
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  await createGiftVoucher({
    code,
    purchasedByUserId: userId,
    recipientEmail: metadata.recipientEmail || null,
    recipientName: metadata.recipientName || null,
    senderName: metadata.senderName || null,
    personalMessage: metadata.personalMessage || null,
    plan,
    creditsAmount: 0,
    stripePaymentIntentId: null,
    isRedeemed: 0,
    expiresAt: expiresAt.toISOString(),
  });

  try {
    await notifyOwner({
      title: `🎁 Dárkový poukaz zakoupen [${source}]`,
      content: `${metadata.senderName || "zákazník"} zakoupil dárkový poukaz pro ${metadata.recipientEmail || "neznámý"}.\nKód: ${code}\nUser ID: ${userId}`,
    });
  } catch { /* non-critical */ }
  console.log(`[${source}] Created gift voucher ${code} for user ${userId}`);
}

export async function fulfillLifetimeOrder(
  userId: number,
  amountCzk: number,
  paymentRef: string,
  source: string,
) {
  await updateUserSubscription(userId, {
    subscriptionStatus: "active",
    subscriptionPlan: "lifetime",
    subscriptionCurrentPeriodEnd: null,
  });

  // Track affiliate commission if applicable
  const user = await getUserById(userId);
  if (user) {
    // Check if user came via affiliate link (stored in metadata upstream)
  }

  try {
    await notifyOwner({
      title: `💎 Nové doživotní ocenění (LIFETIME) [${source}]`,
      content: `${user?.name || "zákazník"} (${user?.email || "neznámý"}) si zakoupil Doživotní přístup.\nUser ID: ${userId}`,
    });
  } catch { /* non-critical */ }
  console.log(`[${source}] Upgraded user ${userId} to LIFETIME`);
}

export async function trackAffiliateCommission(
  affiliateCode: string,
  convertedUserId: number,
  amountCzk: number,
  paymentRef: string,
) {
  try {
    const affiliate = await getUserByAffiliateCode(affiliateCode);
    if (!affiliate || !affiliate.isAffiliate || affiliate.id === convertedUserId) return;

    const commissionRate = getCommissionRate(affiliate.affiliateTier ?? "bronze");
    const commissionAmount = Math.round(amountCzk * commissionRate * 100) / 100;

    await createAffiliateConversion({
      affiliateUserId: affiliate.id,
      convertedUserId,
      stripeSubscriptionId: paymentRef,
      amount: amountCzk,
      commissionRate,
      commissionAmount,
      status: "pending",
    });

    await logCreditTransaction(affiliate.id, 0, "affiliate_commission", {
      convertedUserId,
      commissionAmount,
      commissionRate,
      paymentRef,
    });

    console.log(`[Affiliate] Commission: ${commissionAmount} CZK (${commissionRate * 100}%) for affiliate ${affiliate.id} from user ${convertedUserId}`);

    try {
      await notifyOwner({
        title: `🤝 Affiliate konverze: ${commissionAmount} CZK`,
        content: `Affiliate ${affiliate.name || affiliate.id} (kód: ${affiliateCode}) získal provizi ${commissionAmount} CZK (${commissionRate * 100}%) za konverzi uživatele ${convertedUserId}.`,
      });
    } catch { /* non-critical */ }
  } catch (e) {
    console.error("[Affiliate] Commission tracking error:", e);
  }
}
