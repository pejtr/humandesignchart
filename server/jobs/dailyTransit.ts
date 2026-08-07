import { getDb } from "../db";
import { users, charts } from "../../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";
import { calculateTransitGates } from "../routers/transit";
import { invokeLLM } from "../_core/llm";
import { createNotification } from "../db.notifications";
import { broadcastToUser } from "../notificationBroadcast";
import { sendEmail } from "../leados";
import type { HumanDesignChartData } from "../../shared/types";

const PLANET_SYMBOLS: Record<string, string> = {
    Sun: "☉", Moon: "☽", Mercury: "☿", Venus: "♀", Mars: "♂",
    Jupiter: "♃", Saturn: "♄", Uranus: "⛢", Neptune: "♆", Pluto: "♇",
    "North Node": "☊", "South Node": "☋",
};

export async function processDailyTransits() {
    console.log("[DailyTransitJob] Starting processing...");
    const db = await getDb();
    if (!db) {
        console.error("[DailyTransitJob] Failed to get database connection.");
        return;
    }

    // 1. Get all users with dailyTransit enabled
    // We check the notificationPreferences JSON column
    const eligibleUsers = await db.select().from(users).where(
        sql`${users.notificationPreferences}->>'$.dailyTransit' = 'true'`
    );

    console.log(`[DailyTransitJob] Found ${eligibleUsers.length} eligible users.`);

    for (const user of eligibleUsers) {
        try {
            // 2. Find the "self" chart for the user
            const [mainChart] = await db.select()
                .from(charts)
                .where(and(eq(charts.userId, user.id), eq(charts.category, "self")))
                .limit(1);

            if (!mainChart) {
                console.log(`[DailyTransitJob] No "self" chart found for user ${user.id}, skipping.`);
                continue;
            }

            const chartData = mainChart.chartData as HumanDesignChartData;
            const natalGates = new Set(chartData.activatedGates || []);
            const { transitGates } = await calculateTransitGates();

            // 3. Generate summary for LLM
            const transitSummary = transitGates
                .map(t => `${PLANET_SYMBOLS[t.planet] || t.planet} ${t.planet}: Brána ${t.gate}.${t.line}`)
                .join(", ");

            // 4. Invoke LLM for a short notification text
            const systemPrompt = `Jsi Human Design průvodce. Vytvoř KRÁTKÉ (max 2 věty) a inspirativní upozornění na dnešní tranzit pro konkrétního uživatele.
Pravidla:
1. Odpovídej VŽDY v češtině.
2. Buď osobní a povzbudivý.
3. Zaměř se na hlavní vliv dnešního dne.
4. Nepoužívej oslovení.`;

            const userMsg = `Typ: ${chartData.type}, Profil: ${chartData.profile}
Dnešní tranzity: ${transitSummary}
Vytvoř denní inspiraci pro notifikaci.`;

            const response = await invokeLLM({
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userMsg },
                ],
            });

            const rawContent = response.choices?.[0]?.message?.content;
            if (!rawContent || typeof rawContent !== "string") {
                console.log(`[DailyTransitJob] LLM returned empty text for user ${user.id}, skipping.`);
                continue;
            }
            const text = rawContent;

            console.log(`[DailyTransitJob] Notification for user ${user.id} (${user.name}): ${text}`);

            // 5. Create in-app notification + SSE broadcast
            const notif = await createNotification({
                userId: user.id,
                type: "system",
                title: "Denní tranzit",
                message: text,
                data: { transitSummary },
            });
            if (notif) {
                broadcastToUser(user.id, {
                    id: notif.id,
                    type: "system",
                    title: notif.title,
                    message: notif.message,
                    data: notif.data,
                    createdAt: notif.createdAt,
                });
            }

            // 6. Send email if user has an email address
            if (user.email) {
                const today = new Date().toLocaleDateString("cs-CZ", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    timeZone: "Europe/Prague",
                });
                const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#faf8f5;font-family:Georgia,serif;">
<div style="max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
  <div style="background:linear-gradient(135deg,#7c2bd4,#2a9d8f);padding:28px 32px;text-align:center;">
    <p style="margin:0;color:#fff;font-size:13px;letter-spacing:3px;text-transform:uppercase;">Denní tranzit</p>
    <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">${today}</p>
  </div>
  <div style="padding:32px;">
    <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#1a1a1a;">${text}</p>
    <p style="margin:0 0 24px;font-size:13px;color:#888;line-height:1.5;">
      Otevřete svou mapu a prozkoumejte, jak dnešní tranzity ovlivňují váš design.
    </p>
    <a href="https://www.humandesignmapa.cz/cs/dashboard" style="display:inline-block;background:#7c2bd4;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;">Otevřít přehled</a>
  </div>
  <div style="padding:16px 32px;text-align:center;border-top:1px solid #f0ece6;">
    <p style="margin:0;font-size:11px;color:#aaa;">Human Design Mapa · humandesignmapa.cz</p>
  </div>
</div>
</body></html>`;
                sendEmail({
                    to: user.email,
                    subject: `Denní tranzit Human Design · ${today}`,
                    html,
                    text,
                }).catch(err =>
                    console.error(`[DailyTransitJob] Failed to send email to ${user.email}:`, err)
                );
            }

        } catch (error) {
            console.error(`[DailyTransitJob] Error processing user ${user.id}:`, error);
        }
    }

    console.log("[DailyTransitJob] Finished processing.");
}
