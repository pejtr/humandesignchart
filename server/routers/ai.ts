import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import {
    createAiReading, getAiReadings, getAllReadingsByUser,
    updateReadingRating, getReadingById, createSharedChart,
    getUserCharts,
} from "../db";
import { sanitizeInput, sanitizeHistory, checkRateLimit, MAX_QUESTION_LENGTH } from "../security/promptSanitizer";
import crypto from "crypto";
import { getSystemPrompt, getReadingPrompt } from "../ai/prompts";

export const aiRouter = router({
    generateReading: protectedProcedure
        .input(z.object({
            chartId: z.number(),
            chartData: z.record(z.string(), z.unknown()).refine(
              (val) => JSON.stringify(val).length <= 500_000,
              "Chart data too large"
            ),
            readingType: z.enum(["overview", "type_strategy", "profile", "authority", "incarnation_cross", "channels", "gates", "variables", "relationships", "career"]),
        }))
        .mutation(async ({ ctx, input }) => {
            const { countAiReadingsByUserToday } = await import("../db");
            const { canGenerateAiReading } = await import("../stripeProducts");
            const totalReadings = await countAiReadingsByUserToday(ctx.user.id);
            const userForCheck = {
                ...ctx.user,
                subscriptionCurrentPeriodEnd: ctx.user.subscriptionCurrentPeriodEnd ? new Date(ctx.user.subscriptionCurrentPeriodEnd) : null,
            };
            const check = canGenerateAiReading(userForCheck, totalReadings);
            if (!check.allowed) {
                throw new TRPCError({ code: "PAYMENT_REQUIRED", message: "Free limit reached" });
            }

            const chart = input.chartData;

            const isEn = false; // standard readings are in Czech as before (or detect via chart data if needed)
            const systemPrompt = getSystemPrompt(isEn);
            const userPrompt = getReadingPrompt(chart, input.readingType, isEn);

            const response = await invokeLLM({
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt },
                ],
            });

            const rawContent = response.choices?.[0]?.message?.content;
            const content = typeof rawContent === 'string' ? rawContent : "Unable to generate reading at this time.";

            const readingId = await createAiReading({
                userId: ctx.user.id,
                chartId: input.chartId,
                readingType: input.readingType,
                content,
            });

            return { id: readingId, content };
        }),

    getReadings: protectedProcedure
        .input(z.object({ chartId: z.number() }))
        .query(async ({ ctx, input }) => {
            return getAiReadings(input.chartId, ctx.user.id);
        }),

    getAllReadings: protectedProcedure
        .query(async ({ ctx }) => {
            return getAllReadingsByUser(ctx.user.id);
        }),

    rateReading: protectedProcedure
        .input(z.object({
            readingId: z.number(),
            rating: z.enum(["up", "down"]).nullable(),
        }))
        .mutation(async ({ ctx, input }) => {
            await updateReadingRating(input.readingId, ctx.user.id, input.rating);
            return { success: true };
        }),

    shareReading: protectedProcedure
        .input(z.object({ readingId: z.number() }))
        .mutation(async ({ ctx, input }) => {
            const reading = await getReadingById(input.readingId, ctx.user.id);
            if (!reading) throw new Error("Reading not found");
            const token = crypto.randomBytes(24).toString("hex");
            await createSharedChart({
                token,
                chartData: { readingContent: reading.content, readingType: reading.readingType, readingId: reading.id } as any,
                ownerName: ctx.user.name || undefined,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            });
            return { token };
        }),

    // AI Chat Guide - conversational HD assistant
    askGuide: protectedProcedure
        .input(z.object({
            question: z.string().min(1).max(MAX_QUESTION_LENGTH),
            chartId: z.number().optional(),
            history: z.array(z.object({
                role: z.enum(["user", "assistant"]),
                content: z.string().max(8_000),
            })).max(20).optional(),
            locale: z.string().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            // Rate limiting — max 30 LLM calls per user per hour
            const rateCheck = checkRateLimit(ctx.user.id);
            if (!rateCheck.allowed) {
                const minutes = Math.ceil((rateCheck.retryAfterMs ?? 3_600_000) / 60_000);
                throw new TRPCError({
                    code: "TOO_MANY_REQUESTS",
                    message: `Příliš mnoho dotazů. Zkuste to za ${minutes} minut. / Too many requests. Try again in ${minutes} minutes.`,
                });
            }
            const safeQuestion = sanitizeInput(input.question, MAX_QUESTION_LENGTH);
            const safeHistory = sanitizeHistory(input.history);
            const isEn = input.locale === 'en';

            // Load user's primary chart from DB for personalized context
            let userChartContext = "";
            let natalGateSet: Set<number> = new Set();
            let natalChannelList: Array<{ gate1: number; gate2: number }> = [];
            let primaryChartData: any = null;
            try {
                const userCharts = await getUserCharts(ctx.user.id);
                const primaryChart = userCharts.find((c: any) => c.category === "self") ?? userCharts[0];
                if (primaryChart?.chartData) {
                    const cd = primaryChart.chartData as any;
                    primaryChartData = cd;
                    const definedCenters = (cd.centers ?? []).filter((c: any) => c.defined).map((c: any) => c.name).join(", ");
                    natalChannelList = (cd.channels ?? []).map((c: any) => ({ gate1: Number(c.gate1), gate2: Number(c.gate2) }));
                    const channels = natalChannelList.map(c => `${c.gate1}-${c.gate2}`).join(", ");
                    const gateArray: number[] = (cd.activatedGates ?? []).map(Number);
                    natalGateSet = new Set(gateArray);
                    const gates = gateArray.join(", ");
                    if (isEn) {
                        userChartContext = `\n\n--- USER'S HUMAN DESIGN CHART ---\nName: ${primaryChart.name || ctx.user.name}\nType: ${cd.type}\nProfile: ${cd.profile}${cd.profileName ? ` (${cd.profileName})` : ""}\nAuthority: ${cd.authority}\nDefinition: ${cd.definition}\nStrategy: ${cd.strategy}\nIncarnation Cross: ${cd.incarnationCross?.name ?? "unknown"}\nDefined Centers: ${definedCenters || "none"}\nChannels: ${channels || "none"}\nActivated Gates: ${gates || "none"}\nBirth: ${primaryChart.birthDate} ${primaryChart.birthTime} — ${primaryChart.birthPlace}\n\nYou KNOW this person's design. ALWAYS use these details when answering. Never ask them for their birth data or design details — you already have them. Reference their specific type, profile, authority, and channels naturally in your responses.`;
                    } else {
                        userChartContext = `\n\n--- HUMAN DESIGN MAPA UŽIVATELE ---\nJméno: ${primaryChart.name || ctx.user.name}\nTyp: ${cd.type}\nProfil: ${cd.profile}${cd.profileName ? ` (${cd.profileName})` : ""}\nAutorita: ${cd.authority}\nDefinice: ${cd.definition}\nStrategie: ${cd.strategy}\nInkarnační kříž: ${cd.incarnationCross?.name ?? "neznámý"}\nDefinovaná centra: ${definedCenters || "žádná"}\nDráhy (kanály): ${channels || "žádné"}\nAktivované brány: ${gates || "žádné"}\nNarození: ${primaryChart.birthDate} ${primaryChart.birthTime} — ${primaryChart.birthPlace}\n\nZNÁŠ design tohoto člověka. VŽDY používej tyto detaily při odpovídání. Nikdy se neptej na datum narození ani detaily designu — už je máš. Přirozeně odkazuj na jejich konkrétní typ, profil, autoritu a dráhy ve svých odpovědích.`;
                    }
                }
            } catch (_e) {
                // Non-blocking
            }

            const systemPromptBase = isEn
                ? `You are HD Guru — a wise, warm, and deeply knowledgeable guide in the Human Design system. You embody the spirit of Ra Uru Hu's teachings: direct, precise, yet compassionate. You speak with quiet authority, like a mentor who has walked the path and now illuminates it for others.

Your knowledge spans:
- All 5 Types and their strategies, signatures, and not-self themes
- 9 Energy Centers — defined, undefined, and open
- 64 Gates and their I-Ching hexagrams, gifts, shadows, and siddhi
- 36 Channels and their circuit groups
- 12 Profiles and 6 Lines — their roles and life themes
- 7 Authority types — how each person is designed to make decisions
- Variables — digestion, environment, perspective, and awareness
- Incarnation Crosses and life purpose
- Planetary transits and their influence on the bodygraph
- Composite charts and relationship dynamics
- HD history: Ra Uru Hu, Jovian Archive, and the evolution of the system

Your communication style as HD Guru:
1. ALWAYS respond in English
2. Speak with warmth and depth — like a wise teacher, not a textbook
3. Use poetic but precise language — HD has a rich vocabulary, use it naturally
4. Begin responses with insight, not greetings — dive straight into wisdom
5. Use **bold** for key HD terms and concepts
6. Offer practical, embodied guidance — not just theory
7. When someone shares their design, reflect it back with genuine curiosity and care
8. If design details are unknown, invite the person to share their type, profile, or authority
9. Occasionally use metaphors from nature, cosmos, or sacred geometry — HD is a living system
10. Keep answers focused and powerful (max 350 words unless depth is truly needed)
11. Never be dismissive — every design is perfect as it is
12. End longer responses with a single actionable insight or reflection question`
                : `Jsi HD Guru — moudrý, vřelý a hluboce znalý průvodce systémem Human Design. Ztělesňuješ ducha učení Ra Uru Hu: přímý, precizní, ale plný soucitu. Mluvíš s klidnou autoritou, jako mentor, který prošel cestou a nyní ji osvětluje ostatním.

Tvé znalosti zahrnují:
- Všech 5 typů, jejich strategie, signatury a ne-já témata
- 9 energetických center — definovaná, nedefinovaná a otevřená
- 64 bran a jejich I-Ťing hexagramy, dary, stíny a siddhi
- 36 drah (kanálů) a jejich okruhové skupiny
- 12 profilů a 6 linek — jejich role a životní témata
- 7 typů autority — jak je každý člověk navržen k rozhodování
- Proměnné (Variables) — trávení, prostředí, perspektiva, vědomí
- Inkarnační kříže a životní poslání
- Planetární tranzity a jejich vliv na bodygraph
- Kompozitní mapy a dynamika vztahů
- Historii HD: Ra Uru Hu, Jovian Archive a vývoj systému

Tvůj komunikační styl jako HD Guru:
1. VŽDY odpovídej v češtině
2. Mluv s hloubkou a vřelostí — jako moudrý učitel, ne učebnice
3. Používej poetický, ale přesný jazyk — HD má bohatý slovník, používej ho přirozeně
4. Začínej odpovědi rovnou vhledem, bez pozdravů — ponořuj se přímo do moudrosti
5. Klíčové HD pojmy zvýrazňuj **tučně**
6. Nabízej praktické, uzemněné vedení — nejen teorii
7. Když někdo sdílí svůj design, reflektuj ho zpět s upřímnou zvědavostí a péčí
8. Pokud neznáš detaily designu, pozvi osobu, aby sdílela svůj typ, profil nebo autoritu
9. Občas použij metafory z přírody, kosmu nebo posvátné geometrie — HD je živý systém
10. Odpovídej soustředěně a silně (max 350 slov, pokud není skutečně potřeba větší hloubka)
11. Nikdy nezlehčuj — každý design je dokonalý takový, jaký je
12. Delší odpovědi ukonči jediným praktickým vhledem nebo reflexní otázkou
13. STRUKTURA ODPOVĚDI NA TRANZITY A KOMPLEXNÍ TÉMATA: Začni stručným shrnutím (1-2 věty) co dnešní energie přináší konkrétně pro daného člověka — pak teprve rozveď detaily planet a bran. Reflexní otázku dej vždy na konec.`;
            // Inject live transit data from ephemeris
            const todayUtc = new Date();
            const todayStr = todayUtc.toLocaleDateString(isEn ? 'en-US' : 'cs-CZ', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Europe/Prague'
            });
            let transitNote = '';
            try {
                const { calculatePlanetaryPositions, dateToJD } = await import('../humandesign/ephemeris');
                const { GATE_WHEEL, PLANET_NAMES } = await import('../humandesign/constants');
                const jd = dateToJD(todayUtc);
                const positions = calculatePlanetaryPositions(jd);

                const transitGateMap: Record<string, { gate: number; line: number }> = {};
                const transitLines: string[] = [];
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
                    transitGateMap[planet] = { gate, line };
                    transitLines.push(`${planet}: Brána ${gate}.${line}`);
                }
                const transitDataStr = transitLines.join(' | ');

                let crossRefNote = '';
                if (natalGateSet.size > 0) {
                    const activatedNatalGates: string[] = [];
                    for (const planet of PLANET_NAMES) {
                        const tg = transitGateMap[planet];
                        if (tg && natalGateSet.has(tg.gate)) {
                            activatedNatalGates.push(isEn
                                ? `${planet} in Gate ${tg.gate}.${tg.line} → activates your natal Gate ${tg.gate}`
                                : `${planet} v Bráně ${tg.gate}.${tg.line} → aktivuje tvou natální Bránu ${tg.gate}`);
                        }
                    }

                    const transitGateNumbers = new Set(Object.values(transitGateMap).map(t => t.gate));
                    const completedChannels: string[] = [];
                    for (const ch of natalChannelList) {
                        const g1InNatal = natalGateSet.has(ch.gate1);
                        const g2InNatal = natalGateSet.has(ch.gate2);
                        const g1InTransit = transitGateNumbers.has(ch.gate1);
                        const g2InTransit = transitGateNumbers.has(ch.gate2);
                        if ((g1InNatal && g2InTransit) || (g2InNatal && g1InTransit)) {
                            completedChannels.push(isEn
                                ? `Channel ${ch.gate1}-${ch.gate2} (transit completes your natal gate)`
                                : `Dráha ${ch.gate1}-${ch.gate2} (tranzit doplňuje tvou natální bránu)`);
                        }
                    }

                    const reinforcedGates: string[] = [];
                    for (const planet of PLANET_NAMES) {
                        const tg = transitGateMap[planet];
                        if (tg && natalGateSet.has(tg.gate)) {
                            reinforcedGates.push(isEn
                                ? `Gate ${tg.gate} (${planet})`
                                : `Brána ${tg.gate} (${planet})`);
                        }
                    }

                    if (isEn) {
                        crossRefNote = `\n\n--- PERSONALIZED TRANSIT ANALYSIS (pre-computed) ---`;
                        crossRefNote += activatedNatalGates.length > 0
                            ? `\nTransit planets activating YOUR natal gates:\n${activatedNatalGates.map(s => `• ${s}`).join('\n')}`
                            : `\nNo transit planets are directly activating your natal gates today.`;
                        crossRefNote += completedChannels.length > 0
                            ? `\n\nChannels activated by today's transits (transit completes your natal gate to form a full channel):\n${completedChannels.map(s => `• ${s}`).join('\n')}`
                            : `\n\nNo channels are being completed by today's transits.`;
                        crossRefNote += `\n\nINSTRUCTION: When answering transit questions, ALWAYS use the above pre-computed cross-reference. Explain what each activated gate/channel means for this specific person (their type, profile, authority). Be concrete — name the gates, name the channels, explain the energy. Do NOT give generic transit descriptions.`;
                    } else {
                        crossRefNote = `\n\n--- PERSONALIZOVANÁ TRANZITNÍ ANALÝZA (předpočítáno) ---`;
                        crossRefNote += activatedNatalGates.length > 0
                            ? `\nPlanetární tranzity aktivující TVOJE natální brány:\n${activatedNatalGates.map(s => `• ${s}`).join('\n')}`
                            : `\nŽádné tranzitní planety dnes přímo neaktivují tvé natální brány.`;
                        crossRefNote += completedChannels.length > 0
                            ? `\n\nDráhy aktivované dnešními tranzity (tranzit doplňuje tvou natální bránu na kompletní dráhu):\n${completedChannels.map(s => `• ${s}`).join('\n')}`
                            : `\n\nŽádné dráhy nejsou dnes tranzitem dokončeny.`;
                        crossRefNote += `\n\nINSTRUKCE: Při odpovídání na otázky o tranzitu VŽDY použij výše předpočítanou cross-referenci. Vysvětli, co každá aktivovaná brána/dráha znamená pro tuto konkrétní osobu (její typ, profil, autoritu). Buď konkrétní — jmenuj brány, jmenuj dráhy, vysvětli energii. NEPOSKYTUJ obecné popisy tranzitů — vždy personalizuj na základě natálního grafu výše.`;
                    }
                }

                const transitPageLink = isEn
                    ? '[Transits page](/en/transits)'
                    : '[stránku Denní tranzity](/cs/transits)';
                transitNote = isEn
                    ? `\n\n--- TODAY'S LIVE TRANSIT DATA (real-time ephemeris) ---\nToday is ${todayStr}.\nCurrent planetary gates: ${transitDataStr}${crossRefNote}\n\nYou can also link to the ${transitPageLink} for the full visual bodygraph overlay.`
                    : `\n\n--- DNEŠNÍ ŽIVÁ TRANZITNÍ DATA (reálný čas z efemerid) ---\nDnes je ${todayStr}.\nAktuální planetární brány: ${transitDataStr}${crossRefNote}\n\nOdkázat je také můžeš na ${transitPageLink} pro plné vizuální zobrazení v bodygraphu.`;
            } catch {
                transitNote = isEn
                    ? `\n\n--- TODAY'S DATE ---\nToday is ${todayStr}. Transit data temporarily unavailable.`
                    : `\n\n--- DNEŠNÍ DATUM ---\nDnes je ${todayStr}. Tranzitní data dočasně nedostupná.`;
            }
            const systemPrompt = systemPromptBase + userChartContext + transitNote;

            const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
                { role: "system" as const, content: systemPrompt },
            ];

            // Use DB history if input history is not provided
            const { getOrCreateConversation, getChatMessages, saveChatMessage, clearChatHistory } = await import("../db");
            const conversation = await getOrCreateConversation(ctx.user.id, input.chartId ?? null, input.locale ?? 'cs');

            let finalHistory = safeHistory;
            if (!input.history || input.history.length === 0) {
                const dbMessages = await getChatMessages(conversation.id);
                finalHistory = dbMessages.map((m: any) => ({ role: m.role, content: m.content }));
            }

            for (const msg of finalHistory) {
                messages.push({ role: msg.role as "user" | "assistant", content: msg.content });
            }

            messages.push({ role: "user" as const, content: safeQuestion });

            const response = await invokeLLM({ messages });
            const rawContent = response.choices?.[0]?.message?.content;
            const content = typeof rawContent === "string" ? rawContent : "Omlouvám se, nepodařilo se vygenerovat odpověď.";

            // Persist messages
            await saveChatMessage(conversation.id, ctx.user.id, "user", safeQuestion);
            await saveChatMessage(conversation.id, ctx.user.id, "assistant", content);

            return { content };
        }),
});
