import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import {
    getChartById, getUserById, countAiReadingsByUser, getDb,
} from "../db";
import { isPremiumUser, canGenerateAiReading } from "../stripeProducts";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

// Shared channel definitions for composite analysis
const CHANNELS: [number, number][] = [
    [1, 8], [2, 14], [3, 60], [4, 63], [5, 15], [6, 59], [7, 31], [9, 52], [10, 20], [10, 34], [10, 57],
    [11, 56], [12, 22], [13, 33], [16, 48], [17, 62], [18, 58], [19, 49], [20, 34], [20, 57],
    [21, 45], [23, 43], [24, 61], [25, 51], [26, 44], [27, 50], [28, 38], [29, 46], [30, 41],
    [32, 54], [34, 57], [35, 36], [37, 40], [39, 55], [42, 53], [47, 64],
];

function findElectromagnetic(gatesA: Set<number>, gatesB: Set<number>) {
    const electromagnetic: Array<{ gate1: number; gate2: number; fromA: number; fromB: number }> = [];
    for (const [g1, g2] of CHANNELS) {
        if (gatesA.has(g1) && gatesB.has(g2) && !gatesA.has(g2) && !gatesB.has(g1)) {
            electromagnetic.push({ gate1: g1, gate2: g2, fromA: g1, fromB: g2 });
        } else if (gatesB.has(g1) && gatesA.has(g2) && !gatesB.has(g2) && !gatesA.has(g1)) {
            electromagnetic.push({ gate1: g1, gate2: g2, fromA: g2, fromB: g1 });
        }
    }
    return electromagnetic;
}

const roleLabels: Record<string, string> = {
    partner: "romantický partner", partnerka: "romantická partnerka",
    manzel: "manžel", manzelka: "manželka",
    sef: "šéf", sefova: "šéfová",
    kolega: "kolega", pritel: "přítel", pritelkyne: "přítelkyně",
    rodic: "rodič", dite: "dítě", sourozenec: "sourozenec",
    kamarad: "kamarád", klient: "klient", mentor: "mentor", jine: "jiná osoba",
};

export const compositeRouter = router({
    analyze: protectedProcedure
        .input(z.object({
            chartIdA: z.number(),
            chartIdB: z.number(),
        }))
        .query(async ({ ctx, input }) => {
            const chartA = await getChartById(input.chartIdA, ctx.user.id);
            const chartB = await getChartById(input.chartIdB, ctx.user.id);
            if (!chartA || !chartB) throw new Error("Chart not found");
            const dataA = chartA.chartData as any;
            const dataB = chartB.chartData as any;
            const gatesA = new Set<number>(dataA.activatedGates || []);
            const gatesB = new Set<number>(dataB.activatedGates || []);

            const electromagnetic = findElectromagnetic(gatesA, gatesB);

            const shared: Array<{ gate1: number; gate2: number }> = [];
            for (const [g1, g2] of CHANNELS) {
                const aHasBoth = gatesA.has(g1) && gatesA.has(g2);
                const bHasBoth = gatesB.has(g1) && gatesB.has(g2);
                if (aHasBoth || bHasBoth) shared.push({ gate1: g1, gate2: g2 });
            }

            const centersA: Record<string, boolean> = {};
            const centersB: Record<string, boolean> = {};
            for (const c of (dataA.centers || [])) centersA[c.name] = c.defined;
            for (const c of (dataB.centers || [])) centersB[c.name] = c.defined;
            const centerNames = ["Head", "Ajna", "Throat", "G", "Heart", "Sacral", "Solar Plexus", "Spleen", "Root"];
            const centerCompatibility = centerNames.map(name => ({
                name,
                aState: centersA[name] ?? false,
                bState: centersB[name] ?? false,
                interaction: centersA[name] && !centersB[name] ? "conditioning" :
                    !centersA[name] && centersB[name] ? "conditioning" :
                        centersA[name] && centersB[name] ? "amplification" : "open",
            }));
            const emScore = Math.min(electromagnetic.length * 15, 45);
            const sharedScore = Math.min(shared.length * 5, 20);
            const typeScore = dataA.type === dataB.type ? 10 :
                (["Generator", "Manifesting Generator"].includes(dataA.type) && ["Generator", "Manifesting Generator"].includes(dataB.type)) ? 8 : 5;
            const defScore = dataA.definition === dataB.definition ? 10 : 5;
            const compatibilityScore = Math.min(emScore + sharedScore + typeScore + defScore + 20, 100);
            return {
                chartA: { id: chartA.id, name: chartA.name, data: dataA },
                chartB: { id: chartB.id, name: chartB.name, data: dataB },
                electromagnetic,
                sharedChannels: shared,
                centerCompatibility,
                compatibilityScore,
                summary: { totalConnections: electromagnetic.length + shared.length },
            };
        }),

    aiReading: protectedProcedure
        .input(z.object({
            chartIdA: z.number(),
            chartIdB: z.number(),
            locale: z.string().default("cs"),
        }))
        .mutation(async ({ ctx, input }) => {
            const userRecord = await getUserById(ctx.user.id);
            if (!userRecord) throw new TRPCError({ code: "UNAUTHORIZED", message: "User not found" });
            const totalReadings = await countAiReadingsByUser(ctx.user.id);
            const canRead = canGenerateAiReading(userRecord, totalReadings);
            if (!canRead.allowed) throw new TRPCError({ code: "PAYMENT_REQUIRED", message: "Premium required" });
            const chartA = await getChartById(input.chartIdA, ctx.user.id);
            const chartB = await getChartById(input.chartIdB, ctx.user.id);
            if (!chartA || !chartB) throw new Error("Chart not found");
            const dA = chartA.chartData as any;
            const dB = chartB.chartData as any;
            const gatesA = new Set<number>(dA.activatedGates || []);
            const gatesB = new Set<number>(dB.activatedGates || []);
            const em: string[] = [];
            for (const [g1, g2] of CHANNELS) {
                if (gatesA.has(g1) && gatesB.has(g2) && !gatesA.has(g2) && !gatesB.has(g1)) em.push(`${g1}-${g2}`);
                else if (gatesB.has(g1) && gatesA.has(g2) && !gatesB.has(g2) && !gatesA.has(g1)) em.push(`${g1}-${g2}`);
            }
            const gatesAArr = Array.from(gatesA).sort((a, b) => a - b);
            const gatesBArr = Array.from(gatesB).sort((a, b) => a - b);
            const isCs = input.locale === "cs";
            const prompt = isCs
                ? `Jsi expert na Human Design vztahovou analýzu.\n\n${chartA.name}: Typ ${dA.type}, Profil ${dA.profile} ${dA.profileName}, Autorita ${dA.authority}, Definice ${dA.definition}\nBrány: ${gatesAArr.join(", ")}\n\n${chartB.name}: Typ ${dB.type}, Profil ${dB.profile} ${dB.profileName}, Autorita ${dB.authority}, Definice ${dB.definition}\nBrány: ${gatesBArr.join(", ")}\n\nElektromagnetická spojení: ${em.length > 0 ? em.join(", ") : "žádná"}\n\nNapiš hlubokou vztahovou analýzu v češtině:\n## 1. Dynamika vztahu\n## 2. Elektromagnetická přitažlivost\n## 3. Výzvy a třecí plochy\n## 4. Jak spolu fungovat nejlépe\n## 5. Kondicionování a vliv\n## 6. Doporučení pro vztah`
                : `You are a Human Design relationship expert.\n\n${chartA.name}: Type ${dA.type}, Profile ${dA.profile} ${dA.profileName}, Authority ${dA.authority}\nGates: ${gatesAArr.join(", ")}\n\n${chartB.name}: Type ${dB.type}, Profile ${dB.profile} ${dB.profileName}, Authority ${dB.authority}\nGates: ${gatesBArr.join(", ")}\n\nElectromagnetic connections: ${em.length > 0 ? em.join(", ") : "none"}\n\nWrite a deep relationship analysis:\n## 1. Relationship Dynamics\n## 2. Electromagnetic Attraction\n## 3. Challenges and Friction\n## 4. How to Function Best Together\n## 5. Conditioning and Influence\n## 6. Relationship Recommendations`;
            const response = await invokeLLM({
                messages: [
                    { role: "system", content: isCs ? "Jsi expert na Human Design a vztahovou analýzu. Píšeš v češtině, hluboce a empaticky." : "You are a Human Design relationship expert. Write deeply and empathetically." },
                    { role: "user", content: prompt },
                ],
            });
            const content = response.choices[0]?.message?.content || "";
            // Deduct credit
            const db = await getDb();
            if (db && !isPremiumUser(userRecord)) {
                if (userRecord.aiReadingCredits > 0) {
                    await db.update(users).set({ aiReadingCredits: userRecord.aiReadingCredits - 1 }).where(eq(users.id, ctx.user.id));
                }
            }
            return { content };
        }),

    roleCompatibility: protectedProcedure
        .input(z.object({
            chartIdA: z.number(),
            chartIdB: z.number(),
            roleTag: z.string(),
            locale: z.string().default("cs"),
        }))
        .mutation(async ({ ctx, input }) => {
            const userRecord = await getUserById(ctx.user.id);
            if (!userRecord) throw new TRPCError({ code: "UNAUTHORIZED", message: "User not found" });
            const totalReadings = await countAiReadingsByUser(ctx.user.id);
            const canRead = canGenerateAiReading(userRecord, totalReadings);
            if (!canRead.allowed) throw new TRPCError({ code: "PAYMENT_REQUIRED", message: "Premium required" });
            const chartA = await getChartById(input.chartIdA, ctx.user.id);
            const chartB = await getChartById(input.chartIdB, ctx.user.id);
            if (!chartA || !chartB) throw new Error("Chart not found");
            const dA = chartA.chartData as any;
            const dB = chartB.chartData as any;
            const gatesA = new Set<number>(dA.activatedGates || []);
            const gatesB = new Set<number>(dB.activatedGates || []);
            const em: string[] = [];
            for (const [g1, g2] of CHANNELS) {
                if (gatesA.has(g1) && gatesB.has(g2) && !gatesA.has(g2) && !gatesB.has(g1)) em.push(`${g1}-${g2}`);
                else if (gatesB.has(g1) && gatesA.has(g2) && !gatesB.has(g2) && !gatesA.has(g1)) em.push(`${g1}-${g2}`);
            }
            const roleLabel = roleLabels[input.roleTag] || input.roleTag;
            const isCs = input.locale === "cs";
            const prompt = isCs
                ? `Jsi expert na Human Design. Analyzuj vztah mezi dvěma lidmi v roli: ${roleLabel}.\n\n${chartA.name} (Ty): Typ ${dA.type}, Profil ${dA.profile} ${dA.profileName}, Autorita ${dA.authority}, Definice ${dA.definition}\nBrány: ${Array.from(gatesA).sort((a, b) => a - b).join(", ")}\n\n${chartB.name} (${roleLabel}): Typ ${dB.type}, Profil ${dB.profile} ${dB.profileName}, Autorita ${dB.authority}, Definice ${dB.definition}\nBrány: ${Array.from(gatesB).sort((a, b) => a - b).join(", ")}\n\nElektromagnetická spojení: ${em.length > 0 ? em.join(", ") : "žádná"}\n\nNapiš hlubokou analýzu vztahu v roli "${roleLabel}" v češtině:\n## 1. Dynamika v roli ${roleLabel}\n## 2. Co se máte naučit od sebe navzájem\n## 3. Výzvy specifické pro tuto roli\n## 4. Jak nejlépe fungovat jako ${roleLabel}\n## 5. Denní interakce a energie\n## 6. Doporučení pro harmonii`
                : `You are a Human Design expert. Analyze the relationship in the role: ${roleLabel}.\n\n${chartA.name} (You): Type ${dA.type}, Profile ${dA.profile} ${dA.profileName}, Authority ${dA.authority}\nGates: ${Array.from(gatesA).sort((a, b) => a - b).join(", ")}\n\n${chartB.name} (${roleLabel}): Type ${dB.type}, Profile ${dB.profile} ${dB.profileName}, Authority ${dB.authority}\nGates: ${Array.from(gatesB).sort((a, b) => a - b).join(", ")}\n\nElectromagnetic connections: ${em.length > 0 ? em.join(", ") : "none"}\n\nWrite a deep role-specific relationship analysis:\n## 1. Dynamics in the ${roleLabel} role\n## 2. What you can learn from each other\n## 3. Challenges specific to this role\n## 4. How to function best as ${roleLabel}\n## 5. Daily interactions and energy\n## 6. Recommendations for harmony`;
            const response = await invokeLLM({
                messages: [
                    { role: "system", content: isCs ? "Jsi expert na Human Design a vztahovou analýzu. Píšeš v češtině, hluboce a empaticky, se zaměřením na konkrétní roli vztahu." : "You are a Human Design relationship expert. Write deeply and empathetically, focusing on the specific relationship role." },
                    { role: "user", content: prompt },
                ],
            });
            const content = response.choices[0]?.message?.content || "";
            const db = await getDb();
            if (db && !isPremiumUser(userRecord)) {
                if (userRecord.aiReadingCredits > 0) {
                    await db.update(users).set({ aiReadingCredits: userRecord.aiReadingCredits - 1 }).where(eq(users.id, ctx.user.id));
                }
            }
            return { content, roleLabel };
        }),
});
