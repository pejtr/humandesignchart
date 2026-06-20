import { getDb } from "../db";
import { users, charts } from "../../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";
import { calculateTransitGates } from "../routers/transit";
import { invokeLLM } from "../_core/llm";
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

            const text = response.choices?.[0]?.message?.content;

            console.log(`[DailyTransitJob] Notification for user ${user.id} (${user.name}): ${text}`);

            // TODO: Actually send notification via push/email
            // For now, we simulate success

        } catch (error) {
            console.error(`[DailyTransitJob] Error processing user ${user.id}:`, error);
        }
    }

    console.log("[DailyTransitJob] Finished processing.");
}
