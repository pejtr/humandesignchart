import { z } from "zod";
import { getSessionUser, type AuthEnv } from "./googleOAuth";
import { buildAgentDailyReading } from "./daily-agent-data";
import { publicSeoUrlFromRequest } from "./social-meta";

export type DailyEmailEnv = AuthEnv & {
  HD_DAILY_EMAIL_ENABLED?: string;
  HD_DAILY_EMAIL_DB?: any;
  BREVO_API_KEY?: string;
  BREVO_SENDER_EMAIL?: string;
};
const CONSENT = "daily-transit-service-v1";
const responseHeaders = { "cache-control": "no-store, private", "x-robots-tag": "noindex", "referrer-policy": "no-referrer" };
const json = (value: unknown, status = 200) => Response.json(value, { status, headers: responseHeaders });
const input = z.object({ enabled: z.boolean(), locale: z.enum(["cs", "en"]), consent: z.boolean() }).strict();

export async function handleDailyEmail(request: Request, env: DailyEmailEnv): Promise<Response> {
  const url = new URL(request.url);
  const db = env.HD_DAILY_EMAIL_DB;
  if (!db) return json({ available: false }, 503);
  try {
    if (url.pathname === "/api/daily-agent/email/unsubscribe") {
      const token = url.searchParams.get("token") || "";
      if (!/^[a-f0-9]{64}$/.test(token)) return json({ error: "INVALID_TOKEN" }, 400);
      if (request.method === "GET") {
        // Link scanners may visit GET; only an explicit POST disables delivery.
        return new Response('<!doctype html><html lang="en"><meta charset="utf-8"><title>Daily Human Design</title><main><h1>Stop daily emails / Ukončit denní e-maily</h1><form method="post"><button type="submit">Unsubscribe / Odhlásit odběr</button></form></main></html>', {
          headers: { ...responseHeaders, "content-type": "text/html; charset=utf-8", "content-security-policy": "default-src 'none'; form-action 'self'; frame-ancestors 'none'" },
        });
      }
      if (request.method !== "POST") return json({ error: "METHOD_NOT_ALLOWED" }, 405);
      await db.prepare("UPDATE hd_daily_preferences SET enabled=0,updated_at=CURRENT_TIMESTAMP WHERE unsubscribe_token=?").bind(token).run();
      return new Response("Daily email disabled / Denní e-maily vypnuty.", { headers: { ...responseHeaders, "content-type": "text/plain; charset=utf-8" } });
    }
    const user = await getSessionUser(request, env);
    if (!user || !Number.isInteger(user.id)) return json({ error: "SIGN_IN_REQUIRED" }, 401);
    if (request.method === "GET") {
      const row = await db.prepare("SELECT email,locale,enabled FROM hd_daily_preferences WHERE user_id=?").bind(user.id).first();
      return json({ available: env.HD_DAILY_EMAIL_ENABLED === "true",
        enabled: row?.enabled === 1 && row.email === user.email, locale: row?.locale ?? "en" });
    }
    if (request.method !== "POST") return json({ error: "METHOD_NOT_ALLOWED" }, 405);
    if (request.headers.get("origin") !== publicSeoUrlFromRequest(request).origin) return json({ error: "ORIGIN_MISMATCH" }, 403);
    if (!request.headers.get("content-type")?.startsWith("application/json")) return json({ error: "INVALID_CONTENT_TYPE" }, 415);
    // Bound the request even if Content-Length is omitted.
    const reader = request.body?.getReader();
    if (!reader) return json({ error: "INVALID_INPUT" }, 400);
    let size = 0, raw = "";
    const decoder = new TextDecoder();
    try {
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        size += chunk.value.byteLength;
        if (size > 1024) { await reader.cancel(); return json({ error: "BODY_TOO_LARGE" }, 413); }
        raw += decoder.decode(chunk.value, { stream: true });
      }
      raw += decoder.decode();
    } finally { reader.releaseLock(); }
    let value: unknown;
    try { value = JSON.parse(raw); } catch { return json({ error: "INVALID_INPUT" }, 400); }
    const parsed = input.safeParse(value);
    if (!parsed.success) return json({ error: "INVALID_INPUT" }, 400);
    const { enabled, locale, consent } = parsed.data;
    if (!enabled) {
      await db.prepare("UPDATE hd_daily_preferences SET enabled=0,updated_at=CURRENT_TIMESTAMP WHERE user_id=?").bind(user.id).run();
      return json({ enabled: false });
    }
    if (env.HD_DAILY_EMAIL_ENABLED !== "true" || !consent) return json({ error: "EXPLICIT_OPT_IN_REQUIRED_OR_UNAVAILABLE" }, 403);
    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)), v => v.toString(16).padStart(2, "0")).join("");
    await db.prepare(`INSERT INTO hd_daily_preferences(user_id,email,locale,enabled,unsubscribe_token,consent_version,consent_at)
      VALUES(?,?,?,1,?,?,CURRENT_TIMESTAMP)
      ON CONFLICT(user_id) DO UPDATE SET email=excluded.email,locale=excluded.locale,enabled=1,
      unsubscribe_token=CASE WHEN hd_daily_preferences.email=excluded.email THEN hd_daily_preferences.unsubscribe_token ELSE excluded.unsubscribe_token END,
      consent_version=excluded.consent_version,consent_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP`)
      .bind(user.id,user.email,locale,token,CONSENT).run();
    return json({ enabled: true, locale });
  } catch { return json({ error: "DAILY_EMAIL_UNAVAILABLE" }, 503); }
}

export function dailyEmailMessage(locale: "cs" | "en", token: string, now = new Date()) {
  const daily = buildAgentDailyReading(locale, [], now);
  const en = locale === "en";
  const base = en ? "https://humandesignchart.app" : "https://humandesignmapa.cz";
  const unsubscribe = base + "/api/daily-agent/email/unsubscribe?token=" + encodeURIComponent(token);
  return {
    subject: (en ? "Human Design Daily — " : "Denní Human Design — ") + daily.date,
    textContent: [daily.interpretation, daily.reflection, daily.disclaimer, daily.sourceUrl,
      (en ? "Disable daily service emails: " : "Vypnout denní e-maily: ") + unsubscribe].join("\n\n"),
  };
}
