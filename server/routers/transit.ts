import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getChartById } from "../db";
import { invokeLLM } from "../_core/llm";
import type { HumanDesignChartData } from "../../shared/types";

// Shared channel definitions for transit calculations
const CHANNELS: [number, number][] = [
    [1, 8], [2, 14], [3, 60], [4, 63], [5, 15], [6, 59], [7, 31], [8, 1], [9, 52], [10, 20],
    [11, 56], [12, 22], [13, 33], [14, 2], [15, 5], [16, 48], [17, 62], [18, 58], [19, 49],
    [20, 10], [21, 45], [22, 12], [23, 43], [24, 61], [25, 51], [26, 44], [27, 50], [28, 38],
    [29, 46], [30, 41], [31, 7], [32, 54], [33, 13], [34, 20], [35, 36], [36, 35], [37, 40],
    [38, 28], [39, 55], [40, 37], [41, 30], [42, 53], [43, 23], [44, 26], [45, 21], [46, 29],
    [47, 64], [48, 16], [49, 19], [50, 27], [51, 25], [52, 9], [53, 42], [54, 32], [55, 39],
    [56, 11], [57, 34], [58, 18], [59, 6], [60, 3], [61, 24], [62, 17], [63, 4], [64, 47],
];

const PLANET_SYMBOLS: Record<string, string> = {
    Sun: "☉", Moon: "☽", Mercury: "☿", Venus: "♀", Mars: "♂",
    Jupiter: "♃", Saturn: "♄", Uranus: "⛢", Neptune: "♆", Pluto: "♇",
    "North Node": "☊", "South Node": "☋",
};

export async function calculateTransitGates() {
    const { calculatePlanetaryPositions, dateToJD } = await import("../humandesign/ephemeris");
    const { GATE_WHEEL, PLANET_NAMES } = await import("../humandesign/constants");
    const now = new Date();
    const jd = dateToJD(now);
    const positions = calculatePlanetaryPositions(jd);
    const transitGates: Array<{ planet: string; gate: number; line: number; longitude: number }> = [];

    for (const planet of PLANET_NAMES) {
        const lon = positions[planet];
        const normLon = ((lon % 360) + 360) % 360;
        let gateIndex = 0;
        for (let i = GATE_WHEEL.length - 1; i >= 0; i--) {
            if (normLon >= GATE_WHEEL[i][0]) { gateIndex = i; break; }
        }
        const gate = GATE_WHEEL[gateIndex][1];
        const offset = normLon - GATE_WHEEL[gateIndex][0];
        const line = Math.max(1, Math.min(Math.floor(offset / 0.9375) + 1, 6));
        transitGates.push({ planet, gate, line, longitude: lon });
    }

    return { now, positions, transitGates };
}

function findActivatedChannels(
    transitGates: Array<{ planet: string; gate: number; line: number }>,
    natalGates: Set<number>,
    isEn: boolean,
) {
    const transitGateNums = new Set(transitGates.map(t => t.gate));
    const activatedChannels: Array<{ gate1: number; gate2: number; via: string }> = [];
    for (const [g1, g2] of CHANNELS) {
        const transitHasG1 = transitGateNums.has(g1);
        const transitHasG2 = transitGateNums.has(g2);
        const natalHasG1 = natalGates.has(g1);
        const natalHasG2 = natalGates.has(g2);
        if ((transitHasG1 && natalHasG2) || (transitHasG2 && natalHasG1)) {
            activatedChannels.push({
                gate1: g1, gate2: g2,
                via: transitHasG1
                    ? (isEn ? `Transit gate ${g1} + natal gate ${g2}` : `Tranzit brana ${g1} + natalální brána ${g2}`)
                    : (isEn ? `Transit gate ${g2} + natal gate ${g1}` : `Tranzit brana ${g2} + natalální brána ${g1}`),
            });
        }
    }
    return activatedChannels;
}

export const transitRouter = router({
    current: publicProcedure.query(async () => {
        const { now, positions, transitGates } = await calculateTransitGates();
        const { GATE_DESCRIPTIONS } = await import("../data/hdContent");

        const enrichedGates = transitGates.map(t => {
            const desc = GATE_DESCRIPTIONS[t.gate];
            return {
                ...t,
                theme: desc?.theme || "",
                themeEn: desc?.themeEn || "",
                description: desc?.description || "",
                descriptionEn: desc?.descriptionEn || "",
            };
        });

        return {
            timestamp: now.toISOString(),
            positions,
            transitGates: enrichedGates,
        };
    }),

    personalized: protectedProcedure
        .input(z.object({ chartId: z.number(), locale: z.string().optional() }))
        .query(async ({ ctx, input }) => {
            const isEn = input.locale === 'en';
            const chart = await getChartById(input.chartId, ctx.user.id);
            if (!chart) throw new Error("Chart not found");
            const chartData = chart.chartData as HumanDesignChartData;

            const { now, transitGates } = await calculateTransitGates();
            // Remove longitude from transit gates for this response
            const transitGatesClean = transitGates.map(({ longitude, ...rest }) => rest);

            const natalGates = new Set(chartData.activatedGates || []);
            const activatedChannels = findActivatedChannels(transitGatesClean, natalGates, isEn);
            const reinforcedGates = transitGatesClean.filter(t => natalGates.has(t.gate));

            const transitSummary = transitGatesClean
                .map(t => `${PLANET_SYMBOLS[t.planet] || t.planet} ${t.planet}: ${isEn ? 'Gate' : 'Brána'} ${t.gate}.${t.line}`)
                .join(", ");
            const channelSummary = activatedChannels.length > 0
                ? activatedChannels.map(c => `${isEn ? 'Channel' : 'Dráha'} ${c.gate1}-${c.gate2}`).join(", ")
                : (isEn ? "No activated channels today" : "Žádné aktivované dráhy dnes");
            const reinforcedSummary = reinforcedGates.length > 0
                ? reinforcedGates.map(g => `${isEn ? 'Gate' : 'Brána'} ${g.gate} (${g.planet})`).join(", ")
                : (isEn ? "No reinforcement" : "Žádné zesilování");

            const systemPrompt = isEn
                ? `You are an expert in Human Design and transits. Describe how today's planetary transits affect this specific person.

Rules:
1. ALWAYS respond in English
2. Be specific, practical, and encouraging
3. Structure: Introduction (2 sentences) | Key Transits (3-4 points) | Recommendations for today (2-3 points)
4. Use HD terminology in English
5. Max 350 words
6. Do not start with a greeting like "Hello" — begin directly with the reading or a section heading`
                : `Jsi expert na Human Design a tranzity. Popiš jak dnešní planetární tranzity ovlivňují konkrétní osobu.

Pravidla:
1. VžDY odpovídej v češtině
2. Buď konkrétní, praktický a povzbudivý
3. Strukturuj: Úvod (2 věty) | Klíčové tranzity (3-4 body) | Doporučení pro dnešek (2-3 body)
4. Používej HD terminologii v češtině
5. Max 350 slov
6. Nezmíňuj "Ahoj" ani úvodní pozdrav`;

            const userMsg = isEn
                ? `Type: ${chartData.type}, Profile: ${chartData.profile}, Authority: ${chartData.authority}
Natal gates: ${Array.from(natalGates).sort((a, b) => a - b).join(", ")}

Today's transits (${now.toLocaleDateString("en-US")}):
${transitSummary}

Activated channels by transit: ${channelSummary}
Reinforced natal gates: ${reinforcedSummary}

Create a personalized daily transit reading for this person.`
                : `Typ: ${chartData.type}, Profil: ${chartData.profile}, Autorita: ${chartData.authority}
Natalální brány: ${Array.from(natalGates).sort((a, b) => a - b).join(", ")}

Dnešní tranzity (${now.toLocaleDateString("cs-CZ")}):
${transitSummary}

Aktivované dráhy tranzitem: ${channelSummary}
Zesílené natalální brány: ${reinforcedSummary}

Vytvoř osobní denní tranzitový výklad pro tuto osobu.`;

            const response = await invokeLLM({
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userMsg },
                ],
            });
            const rawContent = response.choices?.[0]?.message?.content;
            const interpretation = typeof rawContent === "string" ? rawContent : (isEn ? "Failed to generate reading." : "Nepodařilo se vygenerovat výklad.");

            return {
                timestamp: now.toISOString(),
                transitGates: transitGatesClean,
                activatedChannels,
                reinforcedGates,
                interpretation,
                chartName: chart.name,
                chartType: chartData.type,
                chartProfile: chartData.profile,
            };
        }),

    personalizedByData: publicProcedure
        .input(z.object({
            chartData: z.record(z.unknown()).refine(
              (val) => JSON.stringify(val).length <= 500_000,
              "Chart data too large"
            ),
            locale: z.string().optional(),
        }))
        .mutation(async ({ input }) => {
            const isEn = input.locale === 'en';
            const chartData = input.chartData as HumanDesignChartData;
            const { now, transitGates } = await calculateTransitGates();
            const transitGatesClean = transitGates.map(({ longitude, ...rest }) => rest);

            const natalGates = new Set<number>((chartData.activatedGates as number[]) || []);
            const activatedChannels = findActivatedChannels(transitGatesClean, natalGates, isEn);
            const reinforcedGates = transitGatesClean.filter(t => natalGates.has(t.gate));

            const transitSummary = transitGatesClean.map(t => `${PLANET_SYMBOLS[t.planet] || t.planet} ${t.planet}: ${isEn ? 'Gate' : 'Brána'} ${t.gate}.${t.line}`).join(", ");
            const channelSummary = activatedChannels.length > 0 ? activatedChannels.map(c => `${isEn ? 'Channel' : 'Dráha'} ${c.gate1}-${c.gate2}`).join(", ") : (isEn ? "No activated channels" : "Žádné aktivované dráhy");
            const reinforcedSummary = reinforcedGates.length > 0 ? reinforcedGates.map(g => `${isEn ? 'Gate' : 'Brána'} ${g.gate} (${g.planet})`).join(", ") : (isEn ? "No reinforcement" : "Žádné zesílování");
            const systemPrompt = isEn
                ? `You are an expert in Human Design and transits. Describe how today's planetary transits affect this specific person. Rules: 1. ALWAYS respond in English 2. Be specific, practical, encouraging 3. Structure: Introduction (2 sentences) | Key Transits (3-4 points) | Recommendations for today (2-3 points) 4. Use HD terminology 5. Max 350 words 6. Do not start with a greeting`
                : `Jsi expert na Human Design a tranzity. Popiš jak dnešní planetární tranzity ovlivňují konkrétní osobu. Pravidla: 1. VžDY odpovídej v češtině 2. Buď konkrétní, praktický a povzbudivý 3. Strukturuj: Úvod (2 věty) | Klíčové tranzity (3-4 body) | Doporučení pro dnešek (2-3 body) 4. Používej HD terminologii 5. Max 350 slov 6. Nezmíňuj pozdrav`;
            const userMsg = isEn
                ? `Type: ${chartData.type}, Profile: ${chartData.profile}, Authority: ${chartData.authority}\nNatal gates: ${Array.from(natalGates).sort((a, b) => a - b).join(", ")}\nToday's transits (${now.toLocaleDateString("en-US")}): ${transitSummary}\nActivated channels: ${channelSummary}\nReinforced natal gates: ${reinforcedSummary}\nCreate a personalized daily transit reading.`
                : `Typ: ${chartData.type}, Profil: ${chartData.profile}, Autorita: ${chartData.authority}\nNatalální brány: ${Array.from(natalGates).sort((a, b) => a - b).join(", ")}\nDnešní tranzity (${now.toLocaleDateString("cs-CZ")}): ${transitSummary}\nAktivované dráhy tranzitem: ${channelSummary}\nZesílené natalální brány: ${reinforcedSummary}\nVytvoř osobní denní tranzitový výklad pro tuto osobu.`;
            const response = await invokeLLM({ messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userMsg }] });
            const rawContent = response.choices?.[0]?.message?.content;
            const interpretation = typeof rawContent === "string" ? rawContent : (isEn ? "Failed to generate reading." : "Nepodařilo se vygenerovat výklad.");
            return { timestamp: now.toISOString(), transitGates: transitGatesClean, activatedChannels, reinforcedGates, interpretation };
        }),
});
