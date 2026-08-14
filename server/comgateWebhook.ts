import type { Request, Response } from "express";
import { checkComgateStatus } from "./_core/comgate";
import { normalizedPaymentEventSchema } from "./payments/contracts";
import { isPaymentProductKey } from "./payments/offers";
import { processPaymentEvent, recordPaymentAuditEvent } from "./payments/mysqlStore";

function decodeMetadata(refId: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(Buffer.from(refId, "base64").toString("utf8"));
    return typeof parsed === "object" && parsed !== null ? parsed as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

export async function handleComgateWebhook(req: Request, res: Response) {
  const transId = typeof req.body?.transId === "string" ? req.body.transId : null;
  if (!transId) return res.status(400).send("Missing transId");

  try {
    const info = await checkComgateStatus(transId);
    const eventId = `${transId}:${info.status}`;
    const rawPayload = { request: req.body, status: info };
    if (info.status === "CANCELLED") {
      await processPaymentEvent(normalizedPaymentEventSchema.parse({ action: "reversal", provider: "comgate", eventId, eventType: "payment.cancelled", paymentRef: transId, reason: "cancelled", rawPayload }));
      return res.status(200).send("code=0&message=OK");
    }
    if (info.status !== "PAID") return res.status(200).send("code=0&message=OK");

    const metadata = info.refId ? decodeMetadata(info.refId) : null;
    const userId = Number(metadata?.u);
    const productKey = metadata?.p;
    const currency = info.curr?.toUpperCase();
    const amountMinor = Number(info.price);
    if (!metadata || !Number.isInteger(userId) || userId <= 0 || !isPaymentProductKey(productKey) || (currency !== "CZK" && currency !== "EUR") || !Number.isInteger(amountMinor) || amountMinor < 0) {
      await recordPaymentAuditEvent({ provider: "comgate", eventId, eventType: "payment.paid", code: "UNMATCHABLE_PAYMENT", message: "Verified Comgate payment has invalid or missing server metadata.", rawPayload, paymentRef: transId });
      return res.status(200).send("code=0&message=OK");
    }

    const normalized = normalizedPaymentEventSchema.parse({
      action: "purchase",
      provider: "comgate",
      eventId,
      eventType: "payment.paid",
      userId,
      productKey,
      paymentRef: transId,
      amountMinor,
      offerAmountMinor: amountMinor,
      currency,
      partnerAddon: metadata.partner === 1,
      affiliateCode: typeof metadata.a === "string" ? metadata.a : undefined,
      recipientEmail: typeof metadata.recEmail === "string" ? metadata.recEmail : undefined,
      recipientName: typeof metadata.recName === "string" ? metadata.recName : undefined,
      senderName: typeof metadata.sndName === "string" ? metadata.sndName : undefined,
      personalMessage: typeof metadata.message === "string" ? metadata.message : undefined,
      rawPayload,
    });
    await processPaymentEvent(normalized);
    return res.status(200).send("code=0&message=OK");
  } catch (error) {
    console.error("[Comgate Webhook] Processing failed", error);
    return res.status(500).send("code=1&message=Internal Server Error");
  }
}
