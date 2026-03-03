import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { calculateChart } from "./humandesign";
import {
  createChart, getUserCharts, getChartById, updateChart,
  deleteChart, toggleFavorite, createAiReading, getAiReadings,
  createSharedChart, getSharedChart,
} from "./db";
import crypto from "crypto";
import { invokeLLM } from "./_core/llm";
import { BLOG_ARTICLES, BLOG_CATEGORIES } from "../shared/blogArticles";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Chart Calculation ───────────────────────────────────────────────
  chart: router({
    calculate: publicProcedure
      .input(z.object({
        name: z.string().min(1),
        birthDate: z.string(),
        birthTime: z.string(),
        birthPlace: z.string(),
        latitude: z.number(),
        longitude: z.number(),
        timezoneOffset: z.number(),
        timezone: z.string(),
      }))
      .mutation(async ({ input }) => {
        const chartData = calculateChart(
          input.birthDate,
          input.birthTime,
          input.birthPlace,
          input.latitude,
          input.longitude,
          input.timezoneOffset,
          input.timezone,
        );
        return chartData;
      }),

    // Save chart to user's collection
    save: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        birthDate: z.string(),
        birthTime: z.string(),
        birthPlace: z.string(),
        latitude: z.string(),
        longitude: z.string(),
        timezone: z.string(),
        category: z.enum(["self", "family", "friend", "client", "celebrity", "other"]).default("other"),
        chartData: z.any(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await createChart({
          userId: ctx.user.id,
          name: input.name,
          birthDate: input.birthDate,
          birthTime: input.birthTime,
          birthPlace: input.birthPlace,
          latitude: input.latitude,
          longitude: input.longitude,
          timezone: input.timezone,
          category: input.category,
          chartData: input.chartData,
        });
        return { id };
      }),

    // Get user's saved charts
    list: protectedProcedure.query(async ({ ctx }) => {
      return getUserCharts(ctx.user.id);
    }),

    // Get single chart
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return getChartById(input.id, ctx.user.id);
      }),

    // Update chart
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        category: z.enum(["self", "family", "friend", "client", "celebrity", "other"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await updateChart(id, ctx.user.id, data);
        return { success: true };
      }),

    // Delete chart
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteChart(input.id, ctx.user.id);
        return { success: true };
      }),

    // Toggle favorite
    toggleFavorite: protectedProcedure
      .input(z.object({ id: z.number(), isFavorite: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        await toggleFavorite(input.id, ctx.user.id, input.isFavorite);
        return { success: true };
      }),
  }),

  // ─── AI Readings ─────────────────────────────────────────────────────
  ai: router({
    generateReading: protectedProcedure
      .input(z.object({
        chartId: z.number(),
        chartData: z.any(),
        readingType: z.enum(["overview", "type_strategy", "profile", "authority", "incarnation_cross", "channels", "gates", "variables", "relationships", "career"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const chart = input.chartData;
        
        const prompts: Record<string, string> = {
          overview: `Provide a comprehensive overview of this Human Design chart. Type: ${chart.type}, Profile: ${chart.profile} ${chart.profileName}, Authority: ${chart.authority}, Definition: ${chart.definition}, Strategy: ${chart.strategy}. Defined Centers: ${chart.centers?.filter((c: any) => c.defined).map((c: any) => c.name).join(", ")}. Channels: ${chart.channels?.map((c: any) => `${c.gate1}-${c.gate2}`).join(", ")}. Incarnation Cross: ${chart.incarnationCross?.name}. Give deep insights about their life purpose, strengths, and how to live correctly.`,
          
          type_strategy: `Provide a deep analysis of being a ${chart.type} with the strategy "${chart.strategy}". Explain the signature theme "${chart.signature}" and the not-self theme "${chart.notSelf}". Describe the aura type "${chart.aura}" and how it affects interactions. Give practical advice for living as this type.`,
          
          profile: `Analyze the profile ${chart.profile} (${chart.profileName}) in depth. Explain the conscious line ${chart.profile?.split("/")[0]} and unconscious line ${chart.profile?.split("/")[1]}. Describe how these lines interact, the life themes, and practical implications for relationships, career, and personal growth.`,
          
          authority: `Explain the ${chart.authority} authority in detail. How should this person make decisions? What does it feel like when they follow their authority correctly vs. when they don't? Give practical exercises and tips for developing trust in this authority.`,
          
          incarnation_cross: `Analyze the incarnation cross: ${chart.incarnationCross?.name}. This is a ${chart.incarnationCross?.type}. The gates involved are ${chart.incarnationCross?.gates?.join(", ")}. Explain the life purpose, the themes of each gate in the cross, and how they work together to fulfill the person's destiny.`,
          
          channels: `Analyze the defined channels: ${chart.channels?.map((c: any) => `${c.gate1}-${c.gate2} (${c.centerA} to ${c.centerB})`).join("; ")}. For each channel, explain its energy, gifts, and challenges. Describe how these channels work together as a whole.`,
          
          gates: `Analyze the key gate activations. Personality gates: ${chart.personalityActivations?.map((a: any) => `Gate ${a.gate}.${a.line} (${a.planet})`).join(", ")}. Design gates: ${chart.designActivations?.map((a: any) => `Gate ${a.gate}.${a.line} (${a.planet})`).join(", ")}. Focus on the most significant activations and their meanings.`,
          
          variables: `Analyze the variables: Digestion: ${chart.variables?.digestion?.type} (${chart.variables?.digestion?.arrow}), Environment: ${chart.variables?.environment?.type} (${chart.variables?.environment?.arrow}), Perspective: ${chart.variables?.perspective?.type} (${chart.variables?.perspective?.arrow}), Awareness: ${chart.variables?.awareness?.type} (${chart.variables?.awareness?.arrow}). Explain what each variable means for daily life, optimal eating, living environment, and cognitive style.`,
          
          relationships: `Based on this chart (Type: ${chart.type}, Profile: ${chart.profile}, Authority: ${chart.authority}, Definition: ${chart.definition}), provide relationship guidance. What type of partners are most compatible? How does their definition affect partnerships? What electromagnetic connections should they look for?`,
          
          career: `Based on this chart (Type: ${chart.type}, Profile: ${chart.profile}, Authority: ${chart.authority}, Defined channels: ${chart.channels?.map((c: any) => `${c.gate1}-${c.gate2}`).join(", ")}), provide career guidance. What types of work environments suit them? What roles align with their design? How should they approach career decisions using their authority?`,
        };

        const systemPrompt = `Jsi expert na systém Human Design s hlubokými znalostmi Ra Uru Hu a jeho učení. Poskytuj hluboké, specifické a praktické výklady. Používej vřelý, ale profesionální tón. Strukturuj odpovědi přehledně pomocí markdown formátování. Buď specifický k danému chartu — vyhýbej se obecným radám. DŮLEŽITÉ: Vždy odpovídej v češtině. Používej správnou českou HD terminologii. NIKDY nezačínej oslovením jako "Ahoj!", "Dobrý den," nebo podobnými pozdravy — začni rovnou výkladem nebo nadpisem sekce.`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompts[input.readingType] || prompts.overview },
          ],
        });

        const rawContent = response.choices?.[0]?.message?.content;
        const content = typeof rawContent === 'string' ? rawContent : "Unable to generate reading at this time.";

        // Save the reading
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

    // AI Chat Guide - conversational HD assistant
    askGuide: protectedProcedure
      .input(z.object({
        question: z.string().min(1),
        history: z.array(z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string(),
        })).optional(),
      }))
      .mutation(async ({ input }) => {
        const systemPrompt = `Jsi odborný průvodce systémem Human Design. Máš hluboké znalosti o:
- 5 typech (Manifestor, Generátor, Manifestující Generátor, Projektor, Reflektor)
- 9 centrech a jejich funkcích
- 64 branách a jejich I-Ťing hexagramech
- 36 dráhách (kanálech)
- 12 profilech a 6 linkách
- 7 typech autority
- Proměnných (Variables) - trávení, prostředí, perspektiva, vědomí
- Inkarnačních křížích
- Tranzitních vlivech
- Kompozitních a partnerských mapách
- Historii HD (Ra Uru Hu, Jovian Archive)

Pravidla:
1. VŽDY odpovídej v češtině
2. Používej správnou českou HD terminologii (brány, dráhy, centra, mapy)
3. Buď přátelský ale profesionální
4. Strukturuj odpovědi přehledně s markdown formátováním
5. Dávej praktické rady a příklady
6. Pokud se uživatel ptá na svůj konkrétní design, zeptej se na jeho typ/profil/autoritu
7. Odpovídej stručně ale výstižně (max 300 slov pokud to není komplexní téma)`;

        const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
          { role: "system" as const, content: systemPrompt },
        ];

        // Add conversation history
        if (input.history) {
          for (const msg of input.history) {
            messages.push({ role: msg.role as "user" | "assistant", content: msg.content });
          }
        }

        messages.push({ role: "user" as const, content: input.question });

        const response = await invokeLLM({ messages });
        const rawContent = response.choices?.[0]?.message?.content;
        const content = typeof rawContent === "string" ? rawContent : "Omlouvám se, nepodařilo se vygenerovat odpověď.";

        return { content };
      }),
  }),

  // ─── Share ──────────────────────────────────────────────────────────
  share: router({
    createLink: publicProcedure
      .input(z.object({
        chartData: z.any(),
        ownerName: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const token = crypto.randomBytes(16).toString("hex");
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
        await createSharedChart({
          token,
          chartData: input.chartData,
          ownerName: input.ownerName || null,
          expiresAt,
        });
        return { token };
      }),

    getShared: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const shared = await getSharedChart(input.token);
        if (!shared) return null;
        return {
          chartData: shared.chartData,
          ownerName: shared.ownerName,
          createdAt: shared.createdAt,
        };
      }),
  }),

  // ─── Transit Calculation ─────────────────────────────────────────────
  transit: router({
    current: publicProcedure.query(async () => {
      const { calculatePlanetaryPositions, dateToJD } = await import("./humandesign/ephemeris");
      const { GATE_WHEEL, PLANET_NAMES } = await import("./humandesign/constants");
      
      const now = new Date();
      const jd = dateToJD(now);
      const positions = calculatePlanetaryPositions(jd);
      
      // Convert positions to gates
      const transitGates: Array<{ planet: string; gate: number; line: number; longitude: number }> = [];
      
      for (const planet of PLANET_NAMES) {
        const lon = positions[planet];
        const normLon = ((lon % 360) + 360) % 360;
        let gateIndex = 0;
        for (let i = GATE_WHEEL.length - 1; i >= 0; i--) {
          if (normLon >= GATE_WHEEL[i][0]) {
            gateIndex = i;
            break;
          }
        }
        const gate = GATE_WHEEL[gateIndex][1];
        const offset = normLon - GATE_WHEEL[gateIndex][0];
        const line = Math.max(1, Math.min(Math.floor(offset / 0.9375) + 1, 6));
        
        transitGates.push({ planet, gate, line, longitude: lon });
      }
      
      return {
        timestamp: now.toISOString(),
        positions,
        transitGates,
      };
    }),
  }),

  // ─── Blog ─────────────────────────────────────────────────────────────
  blog: router({
    list: publicProcedure
      .input(z.object({
        category: z.string().optional(),
      }).optional())
      .query(({ input }) => {
        let articles = BLOG_ARTICLES;
        if (input?.category) {
          articles = articles.filter(a => a.category === input.category);
        }
        return {
          articles: articles.map(({ content, ...rest }) => rest),
          categories: BLOG_CATEGORIES,
        };
      }),

    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(({ input }) => {
        const article = BLOG_ARTICLES.find(a => a.slug === input.slug);
        return article || null;
      }),
  }),
});

export type AppRouter = typeof appRouter;
