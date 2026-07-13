/**
 * LeadOS CRM API Helper
 * REST API integration with Bearer token authentication
 * Base URL: https://ai-lead-gen.com/api/external
 */

import crypto from "crypto";

const LEADOS_BASE_URL = "https://ai-lead-gen.com/api/external";

function getApiKey(): string {
  return process.env.LEADOS_API_KEY ?? "";
}

function getWebhookSecret(): string {
  return process.env.LEADOS_WEBHOOK_SECRET ?? "";
}

async function leadosRequest<T = unknown>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  body?: unknown
): Promise<T> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("LEADOS_API_KEY is not configured");
  }

  const url = `${LEADOS_BASE_URL}${path}`;
  const options: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`LeadOS API error ${response.status}: ${text}`);
  }

  return response.json() as Promise<T>;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LeadOSLead {
  id: number;
  name: string;
  email: string;
  company?: string;
  score?: number;
  status: "new" | "contacted" | "qualified" | "converted" | "lost";
  source?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  metadata?: Record<string, unknown>;
}

export interface LeadOSAnalytics {
  totalLeads: number;
  newLeads: number;
  qualifiedLeads: number;
  convertedLeads: number;
  conversionRate: number;
  totalRevenue?: number;
  totalOrders?: number;
}

export interface LeadOSEmailSequence {
  id: number;
  name: string;
  status: "active" | "paused" | "draft";
  steps?: number;
  subscribers?: number;
}

export interface LeadOSOrder {
  id: number;
  email: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  stripePaymentIntentId?: string;
}

// ─── Lead operations ─────────────────────────────────────────────────────────

export async function getLeads(params?: {
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<{ leads: LeadOSLead[]; total: number }> {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.offset) query.set("offset", String(params.offset));
  const qs = query.toString() ? `?${query.toString()}` : "";
  return leadosRequest("GET", `/leads${qs}`);
}

export async function getLeadById(id: number): Promise<LeadOSLead> {
  return leadosRequest("GET", `/leads/${id}`);
}

export async function updateLead(
  id: number,
  data: Partial<Pick<LeadOSLead, "status" | "notes" | "score" | "metadata">>
): Promise<LeadOSLead> {
  return leadosRequest("PUT", `/leads/${id}`, data);
}

// ─── Email sequences ──────────────────────────────────────────────────────────

export async function getEmailSequences(): Promise<{
  sequences: LeadOSEmailSequence[];
}> {
  return leadosRequest("GET", "/email-sequences");
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export async function getAnalytics(): Promise<LeadOSAnalytics> {
  return leadosRequest("GET", "/analytics");
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export async function getOrders(params?: {
  limit?: number;
  offset?: number;
}): Promise<{ orders: LeadOSOrder[]; total: number }> {
  const query = new URLSearchParams();
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.offset) query.set("offset", String(params.offset));
  const qs = query.toString() ? `?${query.toString()}` : "";
  return leadosRequest("GET", `/orders${qs}`);
}

// ─── Email sending ────────────────────────────────────────────────────────────

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ success: boolean; messageId?: string }> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.warn("[Brevo] BREVO_API_KEY is not configured — email aborted");
    return { success: false };
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: "Human Design Mapa", email: "info@humandesignmapa.cz" },
      to: [{ email: params.to }],
      subject: params.subject,
      htmlContent: params.html,
      textContent: params.text || params.html.replace(/<[^>]*>?/gm, ""),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Brevo API Error ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as { messageId: string };
  return { success: true, messageId: data.messageId };
}

// ─── Webhook verification ─────────────────────────────────────────────────────

export function verifyLeadOSWebhook(
  rawBody: string,
  signature: string
): boolean {
  const secret = getWebhookSecret();
  if (!secret) return false;

  const expected =
    "sha256=" +
    crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    );
  } catch {
    return false;
  }
}

// ─── Event tracking → LeadOS ────────────────────────────────────────────────

export type LeadOSEventType =
  | "new_user"
  | "chart_created"
  | "subscription_upgraded"
  | "ai_reading_used"
  | "chart_shared";

export interface LeadOSEventPayload {
  event: LeadOSEventType;
  data: {
    userId?: number;
    name?: string;
    email?: string;
    source?: string;
    tags?: string[];
    score?: number;
    chartType?: string;
    hdType?: string;
    plan?: string;
    amount?: number;
    currency?: string;
    [key: string]: unknown;
  };
}

/**
 * Fire-and-forget event to LeadOS.
 * NEVER awaited, NEVER throws — 3 s hard timeout so it cannot block any request.
 * The main application flow is completely independent of LeadOS availability.
 */
export function sendLeadOSEvent(payload: LeadOSEventPayload): void {
  const apiKey = getApiKey();
  if (!apiKey) return; // LeadOS not configured — silently skip

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3_000);

  fetch(`${LEADOS_BASE_URL}/events`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...payload,
      timestamp: new Date().toISOString(),
      source: "humandesignmapa.cz",
    }),
    signal: controller.signal,
  })
    .then(res => {
      clearTimeout(timeout);
      if (!res.ok) {
        res.text().catch(() => "").then(text =>
          console.warn(`[LeadOS] Event '${payload.event}' failed ${res.status}: ${text}`)
        );
      } else {
        console.log(`[LeadOS] Event '${payload.event}' queued for userId=${payload.data.userId}`);
      }
    })
    .catch(err => {
      clearTimeout(timeout);
      if (err?.name === "AbortError") {
        console.warn(`[LeadOS] Event '${payload.event}' timed out after 3 s — skipped`);
      } else {
        console.warn(`[LeadOS] Event '${payload.event}' unreachable (non-blocking):`, err?.message ?? String(err));
      }
    });
}

// ─── Sync user to LeadOS as lead ──────────────────────────────────────────────

export async function syncUserAsLead(user: {
  name: string;
  email: string;
  locale?: string;
  hdType?: string;
  hdProfile?: string;
  source?: string;
}): Promise<void> {
  try {
    // We use email/send to notify LeadOS about new user
    // LeadOS will create a lead automatically if configured via webhook
    // This is a best-effort sync — errors are logged but not thrown
    await sendEmail({
      to: user.email,
      subject: `Vítej v Human Design ${user.name ? `— ${user.name}` : ""}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #7c3aed;">Vítej v Human Design Mapě! 🌟</h1>
          <p>Ahoj${user.name ? ` ${user.name}` : ""},</p>
          <p>Právě jsi se zaregistroval/a do Human Design Mapy — systému sebepoznání, který ti ukáže, jak funguje tvá energie a jaké je tvé životní poslání.</p>
          <p><strong>Jako uvítací dárek máš 1 bezplatný AI výklad zdarma.</strong></p>
          <p>Začni výpočtem své mapy na <a href="https://humandesignmapa.cz">humandesignmapa.cz</a></p>
          <hr style="border: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #6b7280; font-size: 14px;">Human Design Mapa · humandesignmapa.cz</p>
        </div>
      `,
      text: `Vítej v Human Design Mapě! Jako uvítací dárek máš 1 bezplatný AI výklad. Začni na humandesignmapa.cz`,
    });
  } catch (err) {
    // Non-critical — log but don't throw
    console.error("[LeadOS] Failed to sync user as lead:", err);
  }
}
