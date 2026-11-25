import { getPragueDay } from "../server/services/pragueDailyCache";
import { dailyEmailMessage, type DailyEmailEnv } from "./daily-agent-email";

export async function deliverDailyBatch(env: DailyEmailEnv, now = new Date(), send = fetch) {
  const db = env.HD_DAILY_EMAIL_DB;
  if (env.HD_DAILY_EMAIL_ENABLED !== "true" || !db || !env.BREVO_API_KEY || !env.BREVO_SENDER_EMAIL) {
    return { status: "DISABLED", sent: 0 };
  }
  const hour = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Prague", hour: "2-digit", hourCycle: "h23" }).format(now);
  if (hour !== "08") return { status: "OUTSIDE_WINDOW", sent: 0 };
  const day = getPragueDay(now);
  // Max 20 recipients per tick, 80 per day with the proposed 15-min cron.
  // Budget and provider quota must be approved before enablement.
  const candidates = await db.prepare(`SELECT p.user_id FROM hd_daily_preferences p
    WHERE p.enabled=1 AND NOT EXISTS(SELECT 1 FROM hd_daily_delivery d WHERE d.user_id=p.user_id AND d.day=?)
    ORDER BY p.user_id LIMIT 20`).bind(day).all();
  let sent = 0;
  for (const candidate of candidates.results ?? []) {
    const id = candidate.user_id;
    const claim = await db.prepare("INSERT OR IGNORE INTO hd_daily_delivery(user_id,day,state) VALUES(?,?,'CLAIMED')").bind(id,day).run();
    if (claim.meta?.changes !== 1) continue;
    let state = "UNKNOWN";
    try {
      const p = await db.prepare("SELECT email,locale,enabled,unsubscribe_token FROM hd_daily_preferences WHERE user_id=?").bind(id).first();
      if (!p || p.enabled !== 1) state = "CANCELLED";
      else {
        const message = dailyEmailMessage(p.locale,p.unsubscribe_token,now);
        const response = await send("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: { "api-key": env.BREVO_API_KEY, "content-type": "application/json", "accept": "application/json" },
          body: JSON.stringify({
            sender: { email: env.BREVO_SENDER_EMAIL, name: p.locale === "cs" ? "Human Design Mapa" : "Human Design Chart" },
            to: [{ email: p.email }], ...message,
          }),
          signal: AbortSignal.timeout(12000),
        });
        // Accepted by provider is not evidence of inbox delivery.
        if (response.ok) { state = "SENT"; sent++; }
        else state = response.status >= 500 ? "UNKNOWN" : "FAILED";
      }
    } catch { /* Ambiguous send: never blindly retry; owner reconciliation required. */ }
    await db.prepare("UPDATE hd_daily_delivery SET state=?,updated_at=CURRENT_TIMESTAMP WHERE user_id=? AND day=?").bind(state,id,day).run();
  }
  return { status: "COMPLETE", sent };
}

export default {
  async scheduled(controller: { scheduledTime: number }, env: DailyEmailEnv) {
    const result = await deliverDailyBatch(env, new Date(controller.scheduledTime));
    console.log("[hd-daily-delivery]", result.status, result.sent);
  },
};
