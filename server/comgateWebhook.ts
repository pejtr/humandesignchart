import { Request, Response } from "express";
import { checkComgateStatus } from "./_core/comgate";
import { fulfillCreditsOrder, fulfillGiftVoucherOrder, fulfillLifetimeOrder, trackAffiliateCommission } from "./services/payment";

export async function handleComgateWebhook(req: Request, res: Response) {
    try {
        const { transId } = req.body;
        if (!transId) {
            return res.status(400).send("Missing transId");
        }

        const comgateInfo = await checkComgateStatus(transId);

        if (comgateInfo.status !== "PAID") {
            return res.status(200).send("code=0&message=OK");
        }

        if (!comgateInfo.refId) {
            console.warn(`[Comgate Webhook] PAID transId ${transId} has no refId. Assuming manual test.`);
            return res.status(200).send("code=0&message=OK");
        }

        let metadata: Record<string, string> = {};
        try {
            const buf = Buffer.from(comgateInfo.refId, "base64");
            metadata = JSON.parse(buf.toString("utf8"));
            console.log(`[Comgate Webhook] Decoded metadata:`, metadata);
        } catch (e) {
            console.warn(`[Comgate Webhook] Could not parse refId as metadata.`, comgateInfo.refId);
        }

        const userId = metadata.u ? parseInt(metadata.u) : null;
        const plan = metadata.p;
        const affiliateCode = metadata.a;

        if (!userId || !plan) {
            console.warn(`[Comgate Webhook] Missing userId or plan in metadata for transId ${transId}`);
            return res.status(200).send("code=0&message=OK");
        }

        if (plan === "credits") {
            await fulfillCreditsOrder(userId, 5, "Comgate");
        } else if (plan === "gift_monthly" || plan === "gift_annual") {
            const giftPlan = plan === "gift_monthly" ? "monthly" : "annual";
            await fulfillGiftVoucherOrder(userId, giftPlan, {
                userId,
                plan: giftPlan,
                recipientEmail: metadata.recEmail,
                recipientName: metadata.recName,
                senderName: metadata.sndName,
                personalMessage: metadata.message,
            }, "Comgate");
        } else if (plan === "lifetime") {
            const amountCzk = comgateInfo.price ? parseFloat(comgateInfo.price) / 100 : 2888;
            await fulfillLifetimeOrder(userId, amountCzk, transId, "Comgate");
            if (affiliateCode) {
                await trackAffiliateCommission(affiliateCode, userId, amountCzk, transId);
            }
        }

        return res.status(200).send("code=0&message=OK");
    } catch (err) {
        console.error("[Comgate Webhook error]", err);
        return res.status(500).send("code=1&message=Internal Server Error");
    }
}
