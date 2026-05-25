/**
 * LeadOS CRM Webhook Handler
 * Receives events: new_lead, lead_status_changed, new_order, quiz_completed
 * Verifies HMAC-SHA256 signature from X-LeadOS-Signature header
 */

import express, { type Express } from "express";
import { verifyLeadOSWebhook } from "./leados";
import { notifyOwner } from "./_core/notification";

export interface LeadOSWebhookPayload {
  event: "new_lead" | "lead_status_changed" | "new_order" | "quiz_completed";
  timestamp: string;
  data: {
    id?: number;
    name?: string;
    company?: string;
    email?: string;
    score?: number;
    status?: string;
    oldStatus?: string;
    newStatus?: string;
    amount?: number;
    currency?: string;
    quizName?: string;
    answers?: Record<string, unknown>;
    [key: string]: unknown;
  };
}

export function registerLeadOSWebhook(app: Express): void {
  // Must use express.raw BEFORE express.json() for signature verification
  app.post(
    "/api/leados/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      const signature = req.headers["x-leados-signature"] as string;
      const rawBody = req.body instanceof Buffer ? req.body.toString("utf8") : String(req.body);

      // Verify signature if secret is configured
      const webhookSecret = process.env.LEADOS_WEBHOOK_SECRET;
      if (webhookSecret && signature) {
        const isValid = verifyLeadOSWebhook(rawBody, signature);
        if (!isValid) {
          console.warn("[LeadOS Webhook] Invalid signature — rejecting request");
          return res.status(401).json({ error: "Invalid signature" });
        }
      }

      let payload: LeadOSWebhookPayload;
      try {
        payload = JSON.parse(rawBody);
      } catch {
        return res.status(400).json({ error: "Invalid JSON payload" });
      }

      console.log(`[LeadOS Webhook] Event: ${payload.event}`, {
        id: payload.data?.id,
        email: payload.data?.email,
        timestamp: payload.timestamp,
      });

      try {
        await handleLeadOSEvent(payload);
      } catch (err) {
        console.error("[LeadOS Webhook] Handler error:", err);
        // Return 200 to prevent LeadOS from retrying — we logged the error
      }

      return res.json({ received: true });
    }
  );
}

async function handleLeadOSEvent(payload: LeadOSWebhookPayload): Promise<void> {
  switch (payload.event) {
    case "new_lead": {
      const { name, email, company, score } = payload.data;
      console.log(`[LeadOS] New lead: ${name} <${email}> score=${score}`);
      // Notify owner about new lead
      await notifyOwner({
        title: `🎯 Nový lead v LeadOS CRM`,
        content: `**${name || "Neznámý"}** (${email || "bez emailu"})${company ? ` — ${company}` : ""}${score ? ` | Skóre: ${score}` : ""}`,
      }).catch(() => {});
      break;
    }

    case "lead_status_changed": {
      const { name, email, oldStatus, newStatus } = payload.data;
      console.log(`[LeadOS] Lead status changed: ${name} ${oldStatus} → ${newStatus}`);
      if (newStatus === "converted") {
        await notifyOwner({
          title: `💰 Lead konvertován v LeadOS!`,
          content: `**${name || email}** byl označen jako konvertovaný zákazník.`,
        }).catch(() => {});
      }
      break;
    }

    case "new_order": {
      const { email, amount, currency } = payload.data;
      console.log(`[LeadOS] New order: ${email} ${amount} ${currency}`);
      await notifyOwner({
        title: `🛒 Nová objednávka v LeadOS`,
        content: `${email} — ${amount} ${currency?.toUpperCase() || "CZK"}`,
      }).catch(() => {});
      break;
    }

    case "quiz_completed": {
      const { email, quizName } = payload.data;
      console.log(`[LeadOS] Quiz completed: ${email} — ${quizName}`);
      break;
    }

    default:
      console.log(`[LeadOS Webhook] Unhandled event: ${(payload as LeadOSWebhookPayload).event}`);
  }
}
