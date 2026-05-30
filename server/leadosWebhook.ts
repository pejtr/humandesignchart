/**
 * LeadOS CRM Webhook Handler
 * Receives events: new_lead, lead_status_changed, new_order, quiz_completed
 * Verifies HMAC-SHA256 signature from X-LeadOS-Signature header
 */

import express, { type Express } from "express";
import { verifyLeadOSWebhook } from "./leados";
import { notifyOwner } from "./_core/notification";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export interface LeadOSWebhookPayload {
  event: "new_lead" | "lead_status_changed" | "new_order" | "quiz_completed" | "new_campaign";
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
      const { name, email, oldStatus, newStatus, note } = payload.data;
      const userId = payload.data.userId as number | undefined;
      console.log(`[LeadOS] Lead status changed: ${name} ${oldStatus} → ${newStatus}`);

      // Sync CRM status back to HDM database
      if (userId) {
        try {
          const db = await getDb();
          if (db) await db.update(users)
            .set({
              crmStatus: newStatus ?? null,
              crmNote: (note as string | undefined) ?? null,
              crmUpdatedAt: Date.now(),
            })
            .where(eq(users.id, userId));
          console.log(`[LeadOS] CRM status synced to user ${userId}: ${newStatus}`);
        } catch (err) {
          console.error(`[LeadOS] Failed to sync CRM status for user ${userId}:`, err);
        }
      } else if (email) {
        // Fallback: find user by email
        try {
          const db = await getDb();
          if (db) await db.update(users)
            .set({
              crmStatus: newStatus ?? null,
              crmNote: (note as string | undefined) ?? null,
              crmUpdatedAt: Date.now(),
            })
            .where(eq(users.email, email as string));
          console.log(`[LeadOS] CRM status synced to user by email ${email}: ${newStatus}`);
        } catch (err) {
          console.error(`[LeadOS] Failed to sync CRM status by email ${email}:`, err);
        }
      }

      if (newStatus === "converted") {
        await notifyOwner({
          title: `💰 Lead konvertován v LeadOS!`,
          content: `**${name || email}** byl označen jako konvertovaný zákazník.${note ? `\nPoznámka: ${note}` : ""}`,
        }).catch(() => {});
      }
      break;
    }

    case "new_campaign": {
      const { campaignName, targetCount, email } = payload.data as { campaignName?: string; targetCount?: number; email?: string };
      console.log(`[LeadOS] New campaign launched: ${campaignName} (${targetCount} recipients)`);
      await notifyOwner({
        title: `📧 LeadOS: Nová email kampaň spustěna`,
        content: `Kampaň: **${campaignName || "Neznámá"}**\nPočet příjemců: ${targetCount ?? "neznámo"}${email ? `\nSpouštěcč: ${email}` : ""}`,
      }).catch(() => {});
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
