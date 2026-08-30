import { getDb } from "../db";
import { users, charts } from "../../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";
import { getDailyTransitSnapshot } from "../routers/transit";
import { invokeLLM } from "../_core/llm";
import { createNotification, hasDailyTransitNotification } from "../db.notifications";
import { broadcastToUser } from "../notificationBroadcast";
import { sendEmail } from "../leados";
import type { HumanDesignChartData } from "../../shared/types";
import { isPremiumUser } from "../stripeProducts";
import { getPragueDay } from "../services/pragueDailyCache";

const PLANET_SYMBOLS: Record<string, string> = {
    Sun: "☉", Moon: "☽", Mercury: "☿", Venus: "♀", Mars: "♂",
    Jupiter: "♃", Saturn: "♄", Uranus: "⛢", Neptune: "♆", Pluto: "♇",
    "North Node": "☊", "South Node": "☋",
};

type TransitEmailUser = Parameters<typeof isPremiumUser>[0] & {
    notificationPreferences?: unknown;
};

export function shouldReceiveDailyTransit(user: TransitEmailUser): boolean {
    const preferences = user.notificationPreferences as { dailyTransit?: boolean } | null;
    return preferences?.dailyTransit === true && isPremiumUser(user);
}

function escapeHtml(value: string): string {
    return value.replace(/[&<>'"]/g, char => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
    })[char] ?? char);
}

export function buildDailyTransitEmail(input: {
    dateLabel: string;
    insight: string;
    type?: string;
    profile?: string;
    sunGate?: string;
    earthGate?: string;
}): string {
    const insight = escapeHtml(input.insight);
    const design = [input.type, input.profile ? `profil ${input.profile}` : ""].filter(Boolean).join(" · ");
    const gates = [input.sunGate ? `Slunce ${input.sunGate}` : "", input.earthGate ? `Země ${input.earthGate}` : ""].filter(Boolean).join(" · ");
    return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:24px;background:#faf8f5;font-family:Arial,sans-serif;color:#21182f">
<div style="max-width:580px;margin:auto;background:#fff;border:1px solid #eadff7;border-radius:18px;overflow:hidden">
  <div style="background:linear-gradient(135deg,#6d28d9,#8b5cf6);padding:28px 32px;color:#fff">
    <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;opacity:.85">Vaše denní Human Design energie</div>
    <h1 style="margin:8px 0 0;font:26px Georgia,serif">${escapeHtml(input.dateLabel)}</h1>
  </div>
  <div style="padding:30px 32px">
    ${design ? `<p style="margin:0 0 14px;color:#6d28d9;font-weight:700">${escapeHtml(design)}</p>` : ""}
    <p style="margin:0 0 20px;font-size:17px;line-height:1.65">${insight}</p>
    ${gates ? `<p style="margin:0 0 24px;padding:12px 14px;border-radius:10px;background:#f6f1fc;color:#5b4775;font-size:13px">${escapeHtml(gates)}</p>` : ""}
    <a href="https://www.humandesignmapa.cz/cs/daily-transit" style="display:inline-block;background:#6d28d9;color:#fff;text-decoration:none;padding:12px 22px;border-radius:9px;font-weight:700">Otevřít dnešní výklad</a>
  </div>
  <div style="padding:16px 32px;border-top:1px solid #eee7f5;color:#8b8197;font-size:11px">Tento Premium přehled posíláme podle nastavení oznámení ve vašem účtu.</div>
</div></body></html>`;
}

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

    const premiumUsers = eligibleUsers.filter(shouldReceiveDailyTransit);
    const pragueDay = getPragueDay();
    const dailySnapshot = await getDailyTransitSnapshot();
    console.log(`[DailyTransitJob] Found ${premiumUsers.length} Premium users with daily email enabled.`);

    for (const user of premiumUsers) {
        try {
            if (await hasDailyTransitNotification(user.id, pragueDay)) {
                console.log(`[DailyTransitJob] Daily transit already delivered to user ${user.id} for ${pragueDay}.`);
                continue;
            }
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
            const { transitGates } = dailySnapshot;

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

            // 5. Send the Premium digest before writing the durable delivery marker.
            if (user.email) {
                const today = new Date().toLocaleDateString("cs-CZ", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    timeZone: "Europe/Prague",
                });
                const sun = transitGates.find(gate => gate.planet === "Sun");
                const earth = transitGates.find(gate => gate.planet === "Earth");
                const html = buildDailyTransitEmail({
                    dateLabel: today,
                    insight: text,
                    type: chartData.type,
                    profile: chartData.profile,
                    sunGate: sun ? `Brána ${sun.gate}.${sun.line}` : undefined,
                    earthGate: earth ? `Brána ${earth.gate}.${earth.line}` : undefined,
                });
                const emailResult = await sendEmail({
                    to: user.email,
                    subject: `Denní tranzit Human Design · ${today}`,
                    html,
                    text,
                });
                if (!emailResult.success) throw new Error("Daily transit email provider rejected delivery");
            }

            // 6. The dated notification is also the idempotency marker for this user/day.
            const notif = await createNotification({
                userId: user.id,
                type: "system",
                title: "Denní tranzit",
                message: text,
                data: { transitSummary, dailyTransitDate: pragueDay, premiumDigest: true },
            });
            if (notif) broadcastToUser(user.id, notif);

        } catch (error) {
            console.error(`[DailyTransitJob] Error processing user ${user.id}:`, error);
        }
    }

    console.log("[DailyTransitJob] Finished processing.");
}
