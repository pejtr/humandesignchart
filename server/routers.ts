import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { socialRouter } from "./routers/social";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { calculateChart } from "./humandesign";
import {
  createChart, getUserCharts, getChartById, updateChart,
  deleteChart, toggleFavorite, createAiReading, getAiReadings,
  getAllReadingsByUser, updateReadingRating, getReadingById,
  createSharedChart, getSharedChart,
  countAiReadingsByUser, updateUserSubscription, addAiReadingCredits,
  getGiftVoucherByCode, redeemGiftVoucher, createGiftVoucher, getUserById,
  getUserByReferralCode, setUserReferralCode, createReferral,
  getReferralByReferredUser, getReferralsByReferrer,
  processStreakCheckIn, claimDailyReward, calculateUserLevel,
  addCreditsWithLog, activateAffiliate, getUserByAffiliateCode,
  createAffiliateConversion, getAffiliateConversions,
  createAffiliatePayout, getAffiliatePayouts,
} from "./db";
import { getStripe } from "./stripeWebhook";
import { isPremiumUser, canGenerateAiReading, FREE_TIER } from "./stripeProducts";
import { users, newsletterSubscribers } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import crypto from "crypto";
import { invokeLLM } from "./_core/llm";
import { ENV } from "./_core/env";
import { BLOG_ARTICLES, BLOG_CATEGORIES } from "../shared/blogArticles";
import { BLOG_ARTICLES_EN } from "../shared/blogArticlesEn";

export const appRouter = router({
  system: systemRouter,
  social: socialRouter,

  // ─── Newsletter ─────────────────────────────────────────────────────
  newsletter: router({
    subscribe: publicProcedure
      .input(z.object({
        email: z.string().email(),
        locale: z.string().default("cs"),
        source: z.string().default("popup"),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");
        // Check for existing subscriber
        const existing = await db.select().from(newsletterSubscribers)
          .where(eq(newsletterSubscribers.email, input.email.toLowerCase())).limit(1);
        if (existing.length > 0) {
          return { success: true, alreadySubscribed: true };
        }
        await db.insert(newsletterSubscribers).values({
          email: input.email.toLowerCase(),
          locale: input.locale,
          source: input.source,
        });
        // Notify owner
        try {
          const { notifyOwner } = await import("./_core/notification");
          await notifyOwner({
            title: "New Newsletter Subscriber ✨",
            content: `${input.email} subscribed (locale: ${input.locale}, source: ${input.source})`,
          });
        } catch {}
        return { success: true, alreadySubscribed: false };
      }),
  }),
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
        // Store as a shared chart with reading content embedded
        await createSharedChart({
          token,
          chartData: { readingContent: reading.content, readingType: reading.readingType, readingId: reading.id } as any,
          ownerName: ctx.user.name || undefined,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });
        return { token };
      }),

    // AI Chat Guide - conversational HD assistant
     askGuide: protectedProcedure
      .input(z.object({
        question: z.string().min(1),
        history: z.array(z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string(),
        })).optional(),
        locale: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const isEn = input.locale === 'en';
        const systemPrompt = isEn
          ? `You are an expert guide in the Human Design system. You have deep knowledge of:
- 5 Types (Manifestor, Generator, Manifesting Generator, Projector, Reflector)
- 9 Centers and their functions
- 64 Gates and their I-Ching hexagrams
- 36 Channels
- 12 Profiles and 6 Lines
- 7 Authority types
- Variables - digestion, environment, perspective, awareness
- Incarnation Crosses
- Transit influences
- Composite and partnership charts
- HD history (Ra Uru Hu, Jovian Archive)
Rules:
1. ALWAYS respond in English
2. Use correct Human Design terminology
3. Be friendly but professional
4. Structure responses clearly with markdown formatting
5. Give practical advice and examples
6. If the user asks about their specific design, ask for their type/profile/authority
7. Keep answers concise but thorough (max 300 words unless the topic is complex)`
          : `Jsi odborný průvodce systémem Human Design. Máš hluboké znalosti o:
- 5 typech (Manifestor, Generátor, Manifestující Generátor, Projektor, Reflektor)
- 9 centrách a jejich funkcích
- 64 bránách a jejich I-Ťing hexagramech
- 36 dráhách (kanálech)
- 12 profilech a 6 linkách
- 7 typech autority
- Proměnných (Variables) - trávení, prostředí, perspektiva, vědomí
- Inkarnačních křížích
- Tranzitních vlivech
- Kompozitních a partnerskch mapách
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

  // --- Transit Calculation ---
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

    // Personalized daily transit: compares current transits with user's natal chart
    personalized: protectedProcedure
      .input(z.object({ chartId: z.number(), locale: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        const isEn = input.locale === 'en';
        const { calculatePlanetaryPositions, dateToJD } = await import("./humandesign/ephemeris");
        const { GATE_WHEEL, PLANET_NAMES } = await import("./humandesign/constants");

        // 1. Load user's natal chart
        const chart = await getChartById(input.chartId, ctx.user.id);
        if (!chart) throw new Error("Chart not found");
        const chartData = chart.chartData as import("../shared/types").HumanDesignChartData;

        // 2. Calculate current transit gates
        const now = new Date();
        const jd = dateToJD(now);
        const positions = calculatePlanetaryPositions(jd);
        const transitGates: Array<{ planet: string; gate: number; line: number }> = [];

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
          transitGates.push({ planet, gate, line });
        }

        // 3. Find activated channels (transit gate + natal gate = defined channel)
        const natalGates = new Set(chartData.activatedGates || []);
        const transitGateNums = new Set(transitGates.map(t => t.gate));
        const CHANNELS = [
          [1,8],[2,14],[3,60],[4,63],[5,15],[6,59],[7,31],[8,1],[9,52],[10,20],
          [11,56],[12,22],[13,33],[14,2],[15,5],[16,48],[17,62],[18,58],[19,49],
          [20,10],[21,45],[22,12],[23,43],[24,61],[25,51],[26,44],[27,50],[28,38],
          [29,46],[30,41],[31,7],[32,54],[33,13],[34,20],[35,36],[36,35],[37,40],
          [38,28],[39,55],[40,37],[41,30],[42,53],[43,23],[44,26],[45,21],[46,29],
          [47,64],[48,16],[49,19],[50,27],[51,25],[52,9],[53,42],[54,32],[55,39],
          [56,11],[57,34],[58,18],[59,6],[60,3],[61,24],[62,17],[63,4],[64,47],
        ];
        const activatedChannels: Array<{ gate1: number; gate2: number; via: string }> = [];
        for (const [g1, g2] of CHANNELS) {
          const transitHasG1 = transitGateNums.has(g1);
          const transitHasG2 = transitGateNums.has(g2);
          const natalHasG1 = natalGates.has(g1);
          const natalHasG2 = natalGates.has(g2);
          if ((transitHasG1 && natalHasG2) || (transitHasG2 && natalHasG1)) {
            activatedChannels.push({
              gate1: g1, gate2: g2,
              via: transitHasG1 ? `Tranzit brana ${g1} + natalální brána ${g2}` : `Tranzit brana ${g2} + natalální brána ${g1}`,
            });
          }
        }

        // 4. Find transit gates that hit natal gates (reinforcement)
        const reinforcedGates = transitGates.filter(t => natalGates.has(t.gate));

        // 5. Build AI prompt for personalized interpretation
        const PLANET_SYMBOLS: Record<string, string> = {
          Sun: "☉", Moon: "☽", Mercury: "☿", Venus: "♀", Mars: "♂",
          Jupiter: "♃", Saturn: "♄", Uranus: "⛢", Neptune: "♆", Pluto: "♇",
          "North Node": "☊", "South Node": "☋",
        };
        const transitSummary = transitGates
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
Natal gates: ${Array.from(natalGates).sort((a,b)=>a-b).join(", ")}

Today's transits (${now.toLocaleDateString("en-US")}):
${transitSummary}

Activated channels by transit: ${channelSummary}
Reinforced natal gates: ${reinforcedSummary}

Create a personalized daily transit reading for this person.`
          : `Typ: ${chartData.type}, Profil: ${chartData.profile}, Autorita: ${chartData.authority}
Natalální brány: ${Array.from(natalGates).sort((a,b)=>a-b).join(", ")}

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
          transitGates,
          activatedChannels,
          reinforcedGates,
          interpretation,
          chartName: chart.name,
          chartType: chartData.type,
          chartProfile: chartData.profile,
        };
      }),
  }),

  // --- Blog ---
  blog: router({
    list: publicProcedure
      .input(z.object({
        category: z.string().optional(),
        locale: z.string().optional(),
      }).optional())
      .query(({ input }) => {
        const isEn = input?.locale === 'en';
        let articles = isEn ? BLOG_ARTICLES_EN : BLOG_ARTICLES;
        if (input?.category) {
          articles = articles.filter(a => a.category === input.category);
        }
        return {
          articles: articles.map(({ content, ...rest }) => rest),
          categories: BLOG_CATEGORIES,
        };
      }),
    getBySlug: publicProcedure
      .input(z.object({ slug: z.string(), locale: z.string().optional() }))
      .query(({ input }) => {
        const isEn = input?.locale === 'en';
        const articleList = isEn ? BLOG_ARTICLES_EN : BLOG_ARTICLES;
        const article = articleList.find(a => a.slug === input.slug);
        return article || null;
      }),
  }),

  // ─── Subscription & Payments ───────────────────────────────────────────────────────
  subscription: router({
    // Get current user's subscription status
    status: protectedProcedure.query(async ({ ctx }) => {
      const user = ctx.user;
      const totalReadings = await countAiReadingsByUser(user.id);
      const premium = isPremiumUser(user);
      const isOwner = !!ENV.ownerOpenId && user.openId === ENV.ownerOpenId;
      return {
        isPremium: premium,
        plan: user.subscriptionPlan,
        status: user.subscriptionStatus,
        currentPeriodEnd: user.subscriptionCurrentPeriodEnd,
        aiReadingCredits: user.aiReadingCredits,
        totalReadings,
        freeReadingsLeft: premium ? null : Math.max(0, FREE_TIER.AI_READINGS_LIMIT - totalReadings),
        canGenerateReading: canGenerateAiReading(user, totalReadings).allowed,
        isOwner,
      };
    }),

    // Create Stripe checkout session
    createCheckout: protectedProcedure
      .input(z.object({
        plan: z.enum(["monthly", "annual", "credits", "gift_monthly", "gift_annual"]),
        locale: z.string().default("cs"),
        origin: z.string(),
        // Gift voucher fields
        recipientEmail: z.string().email().optional(),
        recipientName: z.string().optional(),
        senderName: z.string().optional(),
        personalMessage: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const stripe = getStripe();
        if (!stripe) throw new Error("Stripe not configured");

        const user = ctx.user;
        const isGift = input.plan.startsWith("gift_");
        const isSubscription = input.plan === "monthly" || input.plan === "annual";
        const isCzech = input.locale === "cs";

        // Ensure Stripe customer exists
        let customerId = user.stripeCustomerId;
        if (!customerId) {
          const customer = await stripe.customers.create({
            email: user.email || undefined,
            name: user.name || undefined,
            metadata: { user_id: user.id.toString() },
          });
          customerId = customer.id;
          await updateUserSubscription(user.id, { stripeCustomerId: customerId });
        }

        const priceData = {
          monthly: { czk: 14900, eur: 599, name: "Human Design Premium — Měsíční" },
          annual: { czk: 99000, eur: 3900, name: "Human Design Premium — Roční" },
          credits: { czk: 4900, eur: 199, name: "Human Design AI Credits (5×)" },
          gift_monthly: { czk: 14900, eur: 599, name: "Dárkový poukaz — Premium Měsíc" },
          gift_annual: { czk: 99000, eur: 3900, name: "Dárkový poukaz — Premium Rok" },
        }[input.plan];

        const currency = isCzech ? "czk" : "eur";
        const unitAmount = isCzech ? priceData.czk : priceData.eur;

        const metadata: Record<string, string> = {
          user_id: user.id.toString(),
          customer_email: user.email || "",
          customer_name: user.name || "",
          plan: input.plan,
        };

        if (isGift) {
          if (input.recipientEmail) metadata.recipient_email = input.recipientEmail;
          if (input.recipientName) metadata.recipient_name = input.recipientName;
          if (input.senderName) metadata.sender_name = input.senderName;
          if (input.personalMessage) metadata.personal_message = input.personalMessage.slice(0, 500);
        }

        const successUrl = `${input.origin}/${input.locale}/payment/success?plan=${input.plan}`;
        const cancelUrl = `${input.origin}/${input.locale}/payment/cancel`;

        if (isSubscription) {
          // Recurring subscription
          const session = await stripe.checkout.sessions.create({
            mode: "subscription",
            customer: customerId,
            client_reference_id: user.id.toString(),
            metadata,
            allow_promotion_codes: true,
            line_items: [{
              price_data: {
                currency,
                unit_amount: unitAmount,
                recurring: { interval: input.plan === "monthly" ? "month" : "year" },
                product_data: {
                  name: priceData.name,
                  metadata: { plan: input.plan },
                },
              },
              quantity: 1,
            }],
            subscription_data: { metadata: { plan: input.plan } },
            success_url: successUrl,
            cancel_url: cancelUrl,
          });
          return { url: session.url };
        } else {
          // One-time payment (credits or gift)
          const session = await stripe.checkout.sessions.create({
            mode: "payment",
            customer: customerId,
            client_reference_id: user.id.toString(),
            metadata,
            allow_promotion_codes: true,
            line_items: [{
              price_data: {
                currency,
                unit_amount: unitAmount,
                product_data: { name: priceData.name },
              },
              quantity: 1,
            }],
            success_url: successUrl,
            cancel_url: cancelUrl,
          });
          return { url: session.url };
        }
      }),

    // Cancel subscription
    cancel: protectedProcedure.mutation(async ({ ctx }) => {
      const stripe = getStripe();
      if (!stripe) throw new Error("Stripe not configured");
      const user = ctx.user;
      if (!user.stripeSubscriptionId) throw new Error("No active subscription");
      await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
      return { success: true };
    }),

    // Reactivate canceled subscription
    reactivate: protectedProcedure.mutation(async ({ ctx }) => {
      const stripe = getStripe();
      if (!stripe) throw new Error("Stripe not configured");
      const user = ctx.user;
      if (!user.stripeSubscriptionId) throw new Error("No subscription found");
      await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: false,
      });
      return { success: true };
    }),

    // Manage billing portal
    portalSession: protectedProcedure
      .input(z.object({ origin: z.string(), locale: z.string().default("cs") }))
      .mutation(async ({ ctx, input }) => {
        const stripe = getStripe();
        if (!stripe) throw new Error("Stripe not configured");
        const user = ctx.user;
        if (!user.stripeCustomerId) throw new Error("No Stripe customer found");
        const session = await stripe.billingPortal.sessions.create({
          customer: user.stripeCustomerId,
          return_url: `${input.origin}/${input.locale}/dashboard`,
        });
        return { url: session.url };
      }),
  }),

  // ─── Gift Vouchers ───────────────────────────────────────────────────────────────────────
  giftVoucher: router({
    // Redeem a gift voucher code
    redeem: protectedProcedure
      .input(z.object({ code: z.string().min(1).toUpperCase() }))
      .mutation(async ({ ctx, input }) => {
        const voucher = await getGiftVoucherByCode(input.code.trim().toUpperCase());
        if (!voucher) throw new Error("invalid_code");
        if (voucher.isRedeemed) throw new Error("already_redeemed");
        if (voucher.expiresAt && new Date(voucher.expiresAt) < new Date()) throw new Error("expired");

        const user = ctx.user;
        await redeemGiftVoucher(voucher.code, user.id);

        // Apply the voucher benefit
        if (voucher.plan === "credits") {
          await addAiReadingCredits(user.id, voucher.creditsAmount || 5);
        } else {
          // Grant subscription
          const periodEnd = new Date();
          periodEnd.setMonth(periodEnd.getMonth() + (voucher.plan === "annual" ? 12 : 1));
          await updateUserSubscription(user.id, {
            subscriptionStatus: "active",
            subscriptionPlan: voucher.plan,
            subscriptionCurrentPeriodEnd: periodEnd,
          });
        }

        return { success: true, plan: voucher.plan };
      }),

    // Check voucher validity without redeeming
    check: publicProcedure
      .input(z.object({ code: z.string() }))
      .query(async ({ input }) => {
        const voucher = await getGiftVoucherByCode(input.code.trim().toUpperCase());
        if (!voucher) return { valid: false, reason: "not_found" };
        if (voucher.isRedeemed) return { valid: false, reason: "already_redeemed" };
        if (voucher.expiresAt && new Date(voucher.expiresAt) < new Date()) return { valid: false, reason: "expired" };
        return { valid: true, plan: voucher.plan };
      }),
  }),

  // ─── Referral Program ──────────────────────────────────────────────────────────────────────────────────────
  referral: router({
    // Get or create the current user's referral code + stats
    getInfo: protectedProcedure.query(async ({ ctx }) => {
      let user = await getUserById(ctx.user.id);
      if (!user) throw new Error("User not found");

      // Auto-generate referral code if not set
      if (!user.referralCode) {
        const code = crypto.randomBytes(4).toString("hex").toUpperCase();
        await setUserReferralCode(user.id, code);
        user = { ...user, referralCode: code };
      }

      const allReferrals = await getReferralsByReferrer(user.id);
      const completed = allReferrals.filter(r => r.status === "completed").length;
      const pending = allReferrals.filter(r => r.status === "pending").length;

      return {
        referralCode: user.referralCode!,
        totalInvited: allReferrals.length,
        completedReferrals: completed,
        pendingReferrals: pending,
        creditsEarned: completed,
      };
    }),

    // Called after login when a referral code is found in localStorage
    applyReferral: protectedProcedure
      .input(z.object({ referralCode: z.string().min(1).max(16) }))
      .mutation(async ({ ctx, input }) => {
        const newUser = ctx.user;

        // Check this user hasn't already been referred
        const existingReferral = await getReferralByReferredUser(newUser.id);
        if (existingReferral) return { success: false, reason: "already_referred" };

        // Find the referrer
        const referrer = await getUserByReferralCode(input.referralCode.toUpperCase());
        if (!referrer) return { success: false, reason: "invalid_code" };

        // Can't refer yourself
        if (referrer.id === newUser.id) return { success: false, reason: "self_referral" };

        // Create referral record
        await createReferral({
          referrerId: referrer.id,
          referredUserId: newUser.id,
          referralCode: input.referralCode.toUpperCase(),
          status: "completed",
          referrerCredited: true,
          referredCredited: true,
          completedAt: new Date(),
        });

        // Award 1 credit to referrer
        await addAiReadingCredits(referrer.id, 1);

        // Award 1 credit to new user
        await addAiReadingCredits(newUser.id, 1);

        // Notify owner
        try {
          const { notifyOwner } = await import("./_core/notification");
          await notifyOwner({
            title: "New Referral Completed 🎉",
            content: `${newUser.name || newUser.openId} signed up via referral code ${input.referralCode} from ${referrer.name || referrer.openId}. Both received 1 free reading credit.`,
          });
        } catch {}

        return { success: true, creditsAwarded: 1 };
      }),

     // Validate a referral code (public — used on landing page)
    validateCode: publicProcedure
      .input(z.object({ code: z.string() }))
      .query(async ({ input }) => {
        if (!input.code) return { valid: false };
        const referrer = await getUserByReferralCode(input.code.toUpperCase());
        if (!referrer) return { valid: false };
        return { valid: true, referrerName: referrer.name || "a friend" };
      }),
  }),

  // ─── Gamification ─────────────────────────────────────────────────────────
  gamification: router({
    // Called on every login — updates streak and awards milestone credits
    checkIn: protectedProcedure.mutation(async ({ ctx }) => {
      const result = await processStreakCheckIn(ctx.user.id);
      return result;
    }),

    // Claim daily reward (once per 24h)
    claimDailyReward: protectedProcedure.mutation(async ({ ctx }) => {
      const result = await claimDailyReward(ctx.user.id);
      return result;
    }),

    // Get gamification stats for the current user
    getStats: protectedProcedure.query(async ({ ctx }) => {
      const db = await (await import("./db")).getDb();
      if (!db) throw new Error("Database not available");
      const { eq: eqOp } = await import("drizzle-orm");
      const { users: usersTable, referrals: referralsTable } = await import("../drizzle/schema");
      const user = await db.select().from(usersTable).where(eqOp(usersTable.id, ctx.user.id)).limit(1);
      if (!user[0]) throw new Error("User not found");
      const u = user[0];

      const referralRows = await db.select().from(referralsTable).where(eqOp(referralsTable.referrerId, ctx.user.id));
      const totalReferrals = referralRows.length;

      // Subscription months (rough estimate)
      const subMonths = u.subscriptionStatus === "active" ? 1 : 0;
      const level = calculateUserLevel(u.totalCreditsEarned, totalReferrals, subMonths);

      // Daily reward available?
      const now = new Date();
      const lastClaim = u.lastDailyRewardAt;
      const dailyRewardAvailable = !lastClaim || (now.getTime() - new Date(lastClaim).getTime()) >= 24 * 60 * 60 * 1000;

      return {
        currentStreak: u.currentStreak,
        longestStreak: u.longestStreak,
        level,
        totalCreditsEarned: u.totalCreditsEarned,
        aiReadingCredits: u.aiReadingCredits,
        dailyRewardAvailable,
        lastDailyRewardAt: u.lastDailyRewardAt,
        totalReferrals,
      };
    }),
  }),

  // ─── Affiliate ────────────────────────────────────────────────────────────
  affiliate: router({
    // Activate affiliate program for current user
    activate: protectedProcedure.mutation(async ({ ctx }) => {
      const db = await (await import("./db")).getDb();
      if (!db) throw new Error("Database not available");
      const { eq: eqOp } = await import("drizzle-orm");
      const { users: usersTable } = await import("../drizzle/schema");
      const user = await db.select({ isAffiliate: usersTable.isAffiliate, affiliateCode: usersTable.affiliateCode }).from(usersTable).where(eqOp(usersTable.id, ctx.user.id)).limit(1);
      if (!user[0]) throw new Error("User not found");
      if (user[0].isAffiliate && user[0].affiliateCode) {
        return { success: true, affiliateCode: user[0].affiliateCode, alreadyActive: true };
      }
      // Generate unique affiliate code
      const code = "AF" + Math.random().toString(36).substring(2, 8).toUpperCase();
      await activateAffiliate(ctx.user.id, code);
      return { success: true, affiliateCode: code, alreadyActive: false };
    }),

    // Get affiliate stats
    getStats: protectedProcedure.query(async ({ ctx }) => {
      const db = await (await import("./db")).getDb();
      if (!db) throw new Error("Database not available");
      const { eq: eqOp } = await import("drizzle-orm");
      const { users: usersTable } = await import("../drizzle/schema");
      const user = await db.select({
        isAffiliate: usersTable.isAffiliate,
        affiliateCode: usersTable.affiliateCode,
        affiliateTier: usersTable.affiliateTier,
        affiliateTotalEarned: usersTable.affiliateTotalEarned,
        affiliatePendingPayout: usersTable.affiliatePendingPayout,
      }).from(usersTable).where(eqOp(usersTable.id, ctx.user.id)).limit(1);
      if (!user[0]) throw new Error("User not found");

      const conversions = await getAffiliateConversions(ctx.user.id);
      const payouts = await getAffiliatePayouts(ctx.user.id);

      const activeConversions = conversions.filter(c => c.status !== "cancelled").length;
      // Determine tier
      let tier: "bronze" | "silver" | "gold" = "bronze";
      if (activeConversions >= 21) tier = "gold";
      else if (activeConversions >= 6) tier = "silver";

      const commissionRate = tier === "gold" ? 0.25 : tier === "silver" ? 0.22 : 0.20;

      return {
        isAffiliate: user[0].isAffiliate,
        affiliateCode: user[0].affiliateCode,
        tier,
        commissionRate,
        totalEarned: user[0].affiliateTotalEarned,
        pendingPayout: user[0].affiliatePendingPayout,
        totalConversions: activeConversions,
        conversions: conversions.slice(0, 10),
        payouts: payouts.slice(0, 5),
      };
    }),

    // Request payout
    requestPayout: protectedProcedure
      .input(z.object({
        paymentMethod: z.enum(["bank_transfer", "paypal"]),
        paymentDetails: z.string().min(5).max(200),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await (await import("./db")).getDb();
        if (!db) throw new Error("Database not available");
        const { eq: eqOp } = await import("drizzle-orm");
        const { users: usersTable } = await import("../drizzle/schema");
        const user = await db.select({ affiliatePendingPayout: usersTable.affiliatePendingPayout }).from(usersTable).where(eqOp(usersTable.id, ctx.user.id)).limit(1);
        if (!user[0]) throw new Error("User not found");
        const pending = user[0].affiliatePendingPayout;
        if (pending < 100) throw new Error("Minimum payout is 100 CZK");

        await createAffiliatePayout({
          affiliateUserId: ctx.user.id,
          amount: pending,
          paymentMethod: input.paymentMethod,
          paymentDetails: input.paymentDetails,
          status: "requested",
        });

        // Reset pending payout
        await db.update(usersTable).set({ affiliatePendingPayout: 0 }).where(eqOp(usersTable.id, ctx.user.id));

        try {
          const { notifyOwner } = await import("./_core/notification");
          await notifyOwner({
            title: "Affiliate Payout Requested 💰",
            content: `User ID ${ctx.user.id} requested payout of ${pending} CZK via ${input.paymentMethod}.`,
          });
        } catch {}

        return { success: true, amount: pending };
      }),
  }),
});
export type AppRouter = typeof appRouter;
