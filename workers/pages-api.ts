import { initTRPC, TRPCError } from "@trpc/server";
import { authStatus, clearSessionCookie, getAuthenticatedUser, googleOAuthRoute } from "./google-oauth";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import superjson from "superjson";
import { z } from "zod";
import { calculateChart } from "../server/humandesign";
import {
  ChartCalculationInputSchema,
  ChartCalculationRequestSchema,
  ChartResultSchema,
} from "../shared/chartSchemas";
import {
  lookupIanaTimezone,
  TimezoneResolutionError,
} from "../server/humandesign/timezone";
import { BLOG_ARTICLES, BLOG_CATEGORIES } from "../server/data/blogArticles";
import {
  GATE_DESCRIPTIONS, CHANNEL_DESCRIPTIONS, TYPE_DESCRIPTIONS,
  AUTHORITY_DESCRIPTIONS, PROFILE_DESCRIPTIONS, CENTER_DESCRIPTIONS,
} from "../server/data/hdContent";
import { BLOG_ARTICLES_EN } from "../server/data/blogArticlesEn";
import { ANGEL_NUMBERS } from "../server/data/angelNumbers";
import { publicSeoUrlFromRequest, withServerRenderedSeoMeta } from "./social-meta";
import { getBlueprintOffer } from "../server/payments/publicOfferCatalog";
import { isVerifiedBlueprintPayment } from "../server/payments/blueprintPaymentVerification";
import { getBlueprintFulfillmentBlocker } from "../server/payments/blueprintFulfillmentGate";
import { buildVerifiedCloudflareOrderEvent, sendVerifiedOpenAIEventWithSecrets, executeTransactionalCapiOutbox } from "../server/openaiConversionsApi";
import { getReadingPrompt, getSystemPrompt } from "../server/ai/prompts";
type D1Database = any;

type Env = {
  HUMAN_DESIGN_FULFILLMENT_API_KEY?: string;
  PAYGATE_CHECKOUT_API_KEY_HUMAN_DESIGN?: string;
  PAY_BASE_URL?: string;
  OPENAI_ADS_PIXEL_ID?: string;
  OPENAI_CONVERSIONS_API_KEY?: string;
  BREVO_API_KEY?: string;
  BREVO_SENDER_EMAIL?: string;
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
  OPENROUTER_API_KEY?: string;
  GEMINI_API_KEY?: string;
  LLM_MODEL?: string;
  HD_ORDERS?: D1Database;
  DB?: D1Database;
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
};

type Context = { env: Env; request: Request };

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  // Cloudflare Pages must never expose server stack traces to checkout clients.
  isDev: false,
});

const publicProcedure = t.procedure;
const router = t.router;

const chartRouter = router({
  calculate: publicProcedure
    .input(ChartCalculationRequestSchema)
    .mutation(({ input }) => {
      try {
        const canonicalInput = ChartCalculationInputSchema.parse({
          ...input,
          timezone: lookupIanaTimezone(input.latitude, input.longitude),
        });
        return ChartResultSchema.parse(calculateChart(canonicalInput));
      } catch (error) {
        if (error instanceof TimezoneResolutionError) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message,
            cause: { timezoneCode: error.code },
          });
        }
        throw error;
      }
    }),

  resolveTimezone: publicProcedure
    .input(
      z.object({
        latitude: z.number().finite().min(-90).max(90),
        longitude: z.number().finite().min(-180).max(180),
      }),
    )
    .query(({ input }) => ({
      timezone: lookupIanaTimezone(input.latitude, input.longitude),
    })),
});

const publicStatsRouter = router({
  chartCount: publicProcedure.query(() => ({ count: 0 })),
});

const blogRouter = router({
  list: publicProcedure
    .input(z.object({
      category: z.string().optional(),
      locale: z.string().optional(),
    }).optional())
    .query(({ input }) => {
      const entries = (input?.locale === "en" ? BLOG_ARTICLES_EN : BLOG_ARTICLES)
        .filter((article) => !input?.category || article.category === input.category);
      return {
        articles: entries.map(({ content, ...summary }) => summary),
        categories: BLOG_CATEGORIES,
      };
    }),
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string(), locale: z.string().optional() }))
    .query(({ input }) =>
      (input.locale === "en" ? BLOG_ARTICLES_EN : BLOG_ARTICLES)
        .find((article) => article.slug === input.slug) ?? null
    ),
});

// Legacy Express exposes content.blogList/content.blogPost. Keep the
// existing blog.list/blog.getBySlug aliases but restore exact frontend API.
const contentRouter = router({
  getHdContent: publicProcedure.query(() => ({
    gates: GATE_DESCRIPTIONS,
    channels: CHANNEL_DESCRIPTIONS,
    types: TYPE_DESCRIPTIONS,
    authorities: AUTHORITY_DESCRIPTIONS,
    profiles: PROFILE_DESCRIPTIONS,
    centers: CENTER_DESCRIPTIONS,
  })),
  blogList: publicProcedure
    .input(z.object({ category: z.string().optional(), locale: z.string().optional() }).optional())
    .query(({ input }) => {
      const entries = (input?.locale === "en" ? BLOG_ARTICLES_EN : BLOG_ARTICLES)
        .filter((article) => !input?.category || article.category === input.category);
      return { articles: entries.map(({ content, ...summary }) => summary), categories: BLOG_CATEGORIES };
    }),
  blogPost: publicProcedure
    .input(z.object({ slug: z.string(), locale: z.string().optional() }))
    .query(({ input }) =>
      (input.locale === "en" ? BLOG_ARTICLES_EN : BLOG_ARTICLES)
        .find((article) => article.slug === input.slug) ?? null
    ),
});

async function sendTransactionalEmail(params: {
  toEmail: string;
  customerName?: string;
  locale: string;
  refId: string;
  token: string;
  accessUrl: string;
  isRecovery?: boolean;
  env: Env;
}): Promise<{ ok: boolean; provider: string; messageId?: string; error?: string }> {
  const isEn = params.locale === "en";
  const title = params.isRecovery
    ? (isEn ? "Your Blueprint Access Link & Secure Token" : "Váš přístupový odkaz a bezpečnostní kód k Blueprintu")
    : (isEn ? "Your Personal Human Design Blueprint is Ready" : "Váš osobní Human Design Blueprint je připraven");

  const greeting = params.customerName
    ? (isEn ? `Dear ${params.customerName},` : `Dobrý den ${params.customerName},`)
    : (isEn ? "Dear Customer," : "Dobrý den,");

  const message = params.isRecovery
    ? (isEn
        ? "Here is your requested access token and recovery link for your purchased Blueprint."
        : "Zde je váš vyžádaný bezpečnostní přístupový kód a odkaz k vašemu zakoupenému Blueprintu.")
    : (isEn
        ? "Thank you for your purchase. Your personalized Human Design Blueprint with 7-day integration workbook and 5 AI reading credits is now unlocked and ready for you."
        : "Děkujeme za vaši objednávku. Váš osobní Human Design Blueprint se 7denním integračním plánem a 5 AI výklady je odemčen a připraven ke stažení.");

  const ctaText = isEn ? "Open & Download Blueprint (PDF)" : "Otevřít a stáhnout Blueprint (PDF)";
  const codeHeading = isEn ? "Your Secure Access Token:" : "Váš bezpečnostní přístupový kód:";
  const note = isEn
    ? "Tip: You can reopen and download your Blueprint on any device by clicking the button above or entering your access token."
    : "Tip: Blueprint můžete kdykoliv znovu otevřít a stáhnout na jakémkoliv zařízení kliknutím na tlačítko výše nebo zadáním tohoto přístupového kódu.";

  const htmlContent = `<!doctype html>
<html lang="${params.locale}">
  <body style="margin:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;color:#0f172a;padding:24px 12px;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
      <div style="background:linear-gradient(135deg,#059669,#047857);padding:32px 24px;text-align:center;color:#ffffff;">
        <h1 style="margin:0;font-size:24px;font-weight:700;">${title}</h1>
        <p style="margin:8px 0 0;font-size:14px;opacity:0.9;">${isEn ? "Human Design Blueprint" : "Osobní Human Design Blueprint"}</p>
      </div>
      <div style="padding:32px 24px;line-height:1.6;">
        <p style="margin:0 0 16px;font-size:16px;font-weight:600;">${greeting}</p>
        <p style="margin:0 0 24px;color:#334155;font-size:15px;">${message}</p>
        <div style="text-align:center;margin:32px 0;">
          <a href="${params.accessUrl}" style="background:#059669;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:700;font-size:16px;display:inline-block;box-shadow:0 4px 6px rgba(5,150,105,0.2);">${ctaText}</a>
        </div>
        <div style="background:#f1f5f9;border:1px solid #cbd5e1;border-radius:8px;padding:16px;margin:24px 0;text-align:center;">
          <div style="font-size:12px;text-transform:uppercase;color:#64748b;font-weight:700;letter-spacing:1px;margin-bottom:8px;">${codeHeading}</div>
          <code style="font-size:16px;font-weight:700;color:#0f172a;letter-spacing:1px;background:#ffffff;padding:6px 12px;border-radius:6px;border:1px solid #e2e8f0;display:inline-block;">${params.token}</code>
        </div>
        <p style="margin:24px 0 0;color:#64748b;font-size:13px;line-height:1.5;">${note}</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0;" />
        <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">
          ${isEn ? "Human Design" : "Human Design Mapa"} · <a href="${isEn ? "https://humandesignchart.app" : "https://humandesignmapa.cz"}" style="color:#059669;text-decoration:none;">${isEn ? "humandesignchart.app" : "humandesignmapa.cz"}</a>
        </p>
      </div>
    </div>
  </body>
</html>`;

  let lastError = "";

  // Provider 1: Brevo API (verified sender on active account)
  const brevoKey = params.env.BREVO_API_KEY;
  const brevoSenderEmail = params.env.BREVO_SENDER_EMAIL || "noreply@optihub.cz";
  const brevoSenderName = isEn ? "Human Design Blueprint" : "Human Design Mapa";

  if (brevoKey) {
    try {
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": brevoKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          sender: {
            name: brevoSenderName,
            email: brevoSenderEmail,
          },
          to: [{ email: params.toEmail, name: params.customerName || params.toEmail }],
          subject: title,
          htmlContent,
          tags: ["hd-blueprint-delivery", isEn ? "locale-en" : "locale-cs"],
        }),
      });

      const data: any = await res.json().catch(() => null);
      if (res.ok && data?.messageId) {
        return { ok: true, provider: "brevo", messageId: data.messageId };
      } else {
        lastError = `Brevo HTTP ${res.status}: ${data?.message || JSON.stringify(data)}`;
        console.error("[sendTransactionalEmail] Brevo error:", lastError);
      }
    } catch (e: any) {
      lastError = `Brevo exception: ${e.message}`;
      console.error("[sendTransactionalEmail] Brevo exception:", lastError);
    }
  }

  // Provider 2: Resend API (if configured)
  if (params.env.RESEND_API_KEY) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${params.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: params.env.RESEND_FROM_EMAIL || "Human Design <noreply@optihub.cz>",
          to: [params.toEmail],
          subject: title,
          html: htmlContent,
        }),
      });
      const data: any = await res.json().catch(() => null);
      if (res.ok && data?.id) {
        return { ok: true, provider: "resend", messageId: data.id };
      } else {
        lastError = `Resend HTTP ${res.status}: ${data?.message || JSON.stringify(data)}`;
      }
    } catch (e: any) {
      lastError = `Resend exception: ${e.message}`;
    }
  }

  // Provider 3: MailChannels direct worker egress
  try {
    const res = await fetch("https://api.mailchannels.net/tx/v1/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: params.toEmail, name: params.customerName || params.toEmail }] }],
        from: {
          email: "noreply@optihub.cz",
          name: isEn ? "Human Design Blueprint" : "Human Design Mapa",
        },
        subject: title,
        content: [{ type: "text/html", value: htmlContent }],
      }),
    });
    if (res.ok) {
      return { ok: true, provider: "mailchannels", messageId: `mc_${Date.now()}` };
    } else {
      const mcText = await res.text().catch(() => "");
      lastError = `Mailchannels HTTP ${res.status}: ${mcText}`;
    }
  } catch (e: any) {
    lastError = `Mailchannels exception: ${e.message}`;
  }

  // Fail closed! Never return ok: true when all providers fail!
  return { ok: false, provider: "none", error: lastError || "ALL_EMAIL_PROVIDERS_FAILED" };
}

function formatGroundedFallbackReading(chart: any, readingType: string, prompt?: string, isEn?: boolean): string {
  const type = chart.type || (isEn ? "Generator" : "Generátor");
  const profile = chart.profile || "1/3";
  const authority = chart.authority || (isEn ? "Sacral" : "Sakrální");
  const strategy = chart.strategy || (isEn ? "To Respond" : "Reagovat");
  const cross = chart.incarnationCross?.name || (isEn ? "Right Angle Cross of the Sphinx" : "Kříž Sfingy");

  const definedCenters = (chart.centers || []).filter((c: any) => c.defined).map((c: any) => c.name).join(", ");
  const openCenters = (chart.centers || []).filter((c: any) => !c.defined).map((c: any) => c.name).join(", ");

  if (isEn) {
    return `### Personalized Human Design Reading

**Core Mechanics:**
- **Energy Type:** ${type} — Your primary operational frequency and energetic signature.
- **Decision Authority:** ${authority} — Your reliable compass for decision-making. Never rely on mental pressure for critical choices; align with your ${authority} clarity.
- **Strategy:** ${strategy} — How your aura engages friction-free with life.
- **Profile:** ${profile} — Your archetypal role and life navigation style.
- **Incarnation Cross:** ${cross} — The overarching theme and purpose of your life journey.

**Energetic Architecture:**
- **Defined Centers (Consistent Energy):** ${definedCenters || "Integrated channels"}. These are your dependable strengths where you broadcast your authentic self to the world.
- **Open Centers (Wisdom & Sensitivity):** ${openCenters || "Open perception"}. These are your areas of deep empathy and receptivity. Beware of conditioned pressure here.

${prompt ? `**Response to Your Focus ("${prompt}"):**\nBased on your ${type} aura and ${authority} authority, the key is to allow clarity to arise before committing your life energy. Trust your inner response rather than mental pressure.` : "Focus on observing your natural response over the next 7 days. Living your design starts with trusting your body's wisdom."}`;
  }

  return `### Osobní výklad Human Design mapy

**Základní mechanika:**
- **Typ energie:** ${type} — Váš přirozený způsob vyzařování a fungování ve světě.
- **Autorita rozhodování:** ${authority} — Váš vnitřní spolehlivý kompas. Nikdy nenechávejte klíčová rozhodnutí na tlaku mysli; řiďte se svým tělesným vedením skrze ${authority} autoritu.
- **Strategie:** ${strategy} — Způsob, jakým se bez odporu propojujete s příležitostmi a životem.
- **Profil:** ${profile} — Vaše archetypální role a styl procházení životními zkušenostmi.
- **Inkarnační kříž:** ${cross} — Hlubší poslání a životní téma vaší cesty.

**Energetická architektura:**
- **Definovaná centra (stálá síla):** ${definedCenters || "Propojené dráhy"}. Zde máte spolehlivou vlastní energii, kterou působíte na své okolí.
- **Otevřená centra (moudrost a vnímavost):** ${openCenters || "Otevřené vnímání"}. Zde jste citliví k energiím druhých a získáváte moudrost, ale je třeba hlídat podmiňování zvenčí.

${prompt ? `**Odpověď k vaší otázce („${prompt}“):**\nVzhledem k vašemu typu (${type}) a autoritě (${authority}) je klíčem netlačit na mentální odpovědi. Dejte svému tělu čas zareagovat a teprve poté uvolněte svou energii k realizaci.` : "Zaměřte se na pozorování své přirozené reakce během následujících 7 dní. Žití svého designu začíná důvěrou ve vlastní tělesnou moudrost."}`;
}

async function generateHumanDesignAiReading(params: {
  chart: any;
  readingType?: string;
  prompt?: string;
  locale?: string;
  env: Env;
}): Promise<{ content: string; model: string }> {
  const isEn = params.locale === "en";
  const readingType = params.readingType || (params.prompt ? "custom" : "overview");
  const systemPrompt = getSystemPrompt(isEn);

  let userPrompt = "";
  if (params.prompt) {
    const baseOverview = getReadingPrompt(params.chart, "overview", isEn);
    userPrompt = `${baseOverview}\n\nUser Question/Focus:\n${params.prompt}\n\nProvide a deeply personalized, clear, and actionable interpretation based strictly on this chart.`;
  } else {
    userPrompt = getReadingPrompt(params.chart, readingType, isEn);
  }

  // 1. OpenRouter Provider
  const openRouterKey = params.env.OPENROUTER_API_KEY || (typeof process !== "undefined" ? process.env?.OPENROUTER_API_KEY : undefined);
  if (openRouterKey) {
    try {
      const model = params.env.LLM_MODEL || "google/gemini-2.5-flash";
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openRouterKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": isEn ? "https://humandesignchart.app" : "https://humandesignmapa.cz",
          "X-Title": isEn ? "Human Design Blueprint" : "Human Design Mapa",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          max_tokens: 1500,
          temperature: 0.7,
        }),
      });

      if (res.ok) {
        const data: any = await res.json();
        const text = data?.choices?.[0]?.message?.content;
        if (text && typeof text === "string" && text.trim().length > 50) {
          return { content: text.trim(), model };
        }
      } else {
        console.warn("[ai-reading] OpenRouter non-ok response:", res.status);
      }
    } catch (e: any) {
      console.warn("[ai-reading] OpenRouter fetch exception:", e.message);
    }
  }

  // 2. Direct Gemini Provider
  const geminiKey = params.env.GEMINI_API_KEY || (typeof process !== "undefined" ? process.env?.GEMINI_API_KEY : undefined);
  if (geminiKey) {
    try {
      const model = "gemini-2.5-flash";
      const res = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${geminiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          max_tokens: 1500,
          temperature: 0.7,
        }),
      });

      if (res.ok) {
        const data: any = await res.json();
        const text = data?.choices?.[0]?.message?.content;
        if (text && typeof text === "string" && text.trim().length > 50) {
          return { content: text.trim(), model };
        }
      }
    } catch (e: any) {
      console.warn("[ai-reading] Gemini fetch exception:", e.message);
    }
  }

  // 3. Fallback Grounded Engine
  const grounded = formatGroundedFallbackReading(params.chart, readingType, params.prompt, isEn);
  return { content: grounded, model: "canonical-hd-grounded-v1" };
}

export const appRouter = router({
  auth: router({
    me: publicProcedure.query(({ ctx }) => getAuthenticatedUser(ctx.request, ctx.env)),
    logout: publicProcedure.mutation(() => ({ success: true as const })),
  }),
  chart: chartRouter,
  publicStats: publicStatsRouter,
  blog: blogRouter,
  content: contentRouter,
  // Safe read-only catalog: the public pricing page needs this exact procedure.
  subscription: router({
    blueprintOffer: publicProcedure
      .input(z.object({ locale: z.enum(["cs", "en"]) }))
      .query(({ input }) => getBlueprintOffer(input.locale)),

    status: publicProcedure.query(async () => {
      return {
        isPremium: false,
        plan: "none",
        status: "none",
        currentPeriodEnd: null,
        aiReadingCredits: 0,
        blueprintPdfCredits: 0,
        totalReadings: 0,
        freeReadingsLeft: 1,
        canGenerateReading: true,
        isOwner: false,
      };
    }),

    saveChartSnapshot: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          locale: z.enum(["cs", "en"]).default("cs"),
          chartDataJson: z.string().min(2).max(300_000),
          metaJson: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }: { input: any; ctx: Context }) => {
        const d1 = ctx.env?.HD_ORDERS || ctx.env?.DB;
        if (!d1) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "CHART_STORAGE_UNAVAILABLE" });
        const snapshotId = `snap_${crypto.randomUUID()}`;
        try {
          const result = await d1
            .prepare(
              `INSERT INTO hd_chart_snapshots (id, email, locale, chart_data_json, created_at)
               VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`
            )
            .bind(snapshotId, input.email, input.locale, input.chartDataJson)
            .run();
          if (!result.success) throw new Error("SNAPSHOT_INSERT_FAILED");
        } catch (err) {
          console.error("[saveChartSnapshot] Chart persistence failed");
          throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "CHART_SNAPSHOT_PERSISTENCE_FAILED" });
        }
        return { snapshotId };
      }),

    createCheckout: publicProcedure
      .input(
        z.object({
          plan: z.literal("blueprint").default("blueprint"),
          locale: z.enum(["cs", "en"]).default("cs"),
          origin: z.string().url(),
          customerEmail: z.string().email().max(100),
          customerName: z.string().max(100).optional(),
          digitalDeliveryConsent: z.boolean(),
          chartSnapshotId: z.string().optional(),
          chartDataJson: z.string().min(2).max(300_000).optional(),
          redditClickId: z.string().optional(),
          openAIAdsMarketingConsent: z.boolean().optional(),
          openAIAdsOppref: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }: { input: any; ctx: Context }) => {
        if (!input.digitalDeliveryConsent) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              input.locale === "cs"
                ? "Pro okamžité doručení digitálního obsahu je nutný souhlas se zánikem práva na odstoupení od smlouvy."
                : "Consent to immediate digital delivery and waiver of withdrawal right is required.",
          });
        }

        // Validate origin against allowed domain patterns
        try {
          const originUrl = new URL(input.origin).origin;
          const allowedPatterns = [
            /^https:\/\/humandesignmapa\.cz$/,
            /^https:\/\/www\.humandesignmapa\.cz$/,
            /^https:\/\/humandesignchart\.app$/,
            /^https:\/\/www\.humandesignchart\.app$/,
            /^https:\/\/[a-z0-9-]+\.humandesignchart-web\.pages\.dev$/,
            /^https:\/\/humandesignchart-web\.pages\.dev$/,
            /^http:\/\/localhost(:\d+)?$/,
            /^http:\/\/127\.0.0\.1(:\d+)?$/,
          ];
          if (!allowedPatterns.some((p) => p.test(originUrl))) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "INVALID_ORIGIN_REDIRECT" });
          }
        } catch (urlErr) {
          if (urlErr instanceof TRPCError) throw urlErr;
          throw new TRPCError({ code: "BAD_REQUEST", message: "MALFORMED_ORIGIN_URL" });
        }

        const s2sKey = ctx.env?.PAYGATE_CHECKOUT_API_KEY_HUMAN_DESIGN;
        if (!s2sKey) {
          console.error("[createCheckout] Missing production paygate checkout credential");
          throw new TRPCError({
            code: "SERVICE_UNAVAILABLE",
            message: "CHECKOUT_TEMPORARILY_UNAVAILABLE",
          });
        }

        const d1 = ctx.env?.HD_ORDERS || ctx.env?.DB;
        if (!d1) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "DATABASE_UNAVAILABLE",
          });
        }

        let snapshotId = input.chartSnapshotId;

        if (input.plan === "blueprint" && !snapshotId && !input.chartDataJson) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "CHART_SNAPSHOT_REQUIRED",
          });
        }

        if (!snapshotId && input.chartDataJson) {
          snapshotId = `snap_${crypto.randomUUID()}`;
          try {
            const snapRes = await d1
              .prepare(
                `INSERT INTO hd_chart_snapshots (id, email, locale, chart_data_json, created_at)
                 VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`
              )
              .bind(snapshotId, input.customerEmail, input.locale, input.chartDataJson)
              .run();
            if (!snapRes.success) {
              throw new Error(snapRes.error || "SNAPSHOT_INSERT_FAILED");
            }
          } catch (err: any) {
            console.error("[createCheckout] Critical: could not save chart snapshot:", err);
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "CHART_SNAPSHOT_PERSISTENCE_FAILED",
            });
          }
        }

        // A caller-supplied snapshot id is not proof that the personalized
        // report exists or belongs to this customer. Fail before requesting payment.
        const savedChart = snapshotId
          ? await d1
              .prepare("SELECT id FROM hd_chart_snapshots WHERE id = ? AND LOWER(email) = LOWER(?) AND locale = ? LIMIT 1")
              .bind(snapshotId, input.customerEmail.trim(), input.locale)
              .first()
              .catch(() => null)
          : null;
        if (!savedChart) {
          throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "CHART_SNAPSHOT_REQUIRED" });
        }

        const isCzech = input.locale === "cs";
        const offerKey = isCzech ? "hd-blueprint-cz" : "hd-blueprint-en";
        const payBase = (ctx.env?.PAY_BASE_URL || "https://pay.optimateo.com").replace(/\/$/, "");

        const payload = {
          tenant: "human-design",
          tenantId: "human-design",
          offerKey,
          customerEmail: input.customerEmail,
          customerName: input.customerName || undefined,
          returnUrl: `${input.origin}/${input.locale}/payment/success?plan=blueprint`,
          cancelUrl: `${input.origin}/${input.locale}/pricing?status=cancelled`,
          context: {
            source: "humandesignchart",
            locale: input.locale,
            redditClickId: input.redditClickId,
            chartSnapshotId: snapshotId || undefined,
          },
        };

        const res = await fetch(`${payBase}/api/paygate/checkout-sessions`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${s2sKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const err: any = await res.json().catch(() => ({}));
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: err?.error || "PAYMENT_SESSION_CREATION_FAILED",
          });
        }

        const data: any = await res.json();
        const refId = data.publicId || data.orderId;
        const offer = getBlueprintOffer(input.locale);
        let checkoutUrlValid = false;
        try {
          const checkoutUrl = new URL(data.checkoutUrl);
          checkoutUrlValid = checkoutUrl.protocol === "https:" && checkoutUrl.origin === new URL(payBase).origin;
        } catch { /* malformed gateway URL */ }
        if (
          typeof refId !== "string" || !refId ||
          data.offerKey && data.offerKey !== offerKey ||
          Number(data.amountMinor) !== offer.amountMinor ||
          data.currency !== offer.currency ||
          !checkoutUrlValid
        ) {
          console.error("[createCheckout] Gateway session does not match canonical Blueprint offer");
          throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "CHECKOUT_TEMPORARILY_UNAVAILABLE" });
        }

        const initialToken = `tok_${crypto.randomUUID().replace(/-/g, "")}`;
        const orderId = `ord_${crypto.randomUUID()}`;
        try {
          const insertRes = await d1
            .prepare(
              `INSERT INTO hd_orders (
                id, payment_ref, customer_email, customer_name, offer_key,
                amount_minor, currency, locale, chart_snapshot_id,
                payment_status, fulfillment_status, delivery_status,
                ai_reading_credits, download_token, consent_record_json, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'CREATED', 'PENDING', 'PENDING', 5, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
              ON CONFLICT(payment_ref) DO UPDATE SET updated_at = CURRENT_TIMESTAMP`
            )
            .bind(
              orderId,
              refId,
              input.customerEmail,
              input.customerName || null,
              offerKey,
              offer.amountMinor,
              offer.currency,
              input.locale,
              snapshotId || null,
              initialToken,
              JSON.stringify({
                digitalDeliveryConsent: true,
                consentedAt: new Date().toISOString(),
                redditClickId: input.redditClickId || null,
                // The paid gateway callback executes later, in another request.
                // Preserve checkout-time marketing choice but never raw birth data.
                openAIAdsMarketingConsent: input.openAIAdsMarketingConsent === true,
                openAIAdsOppref: input.openAIAdsMarketingConsent === true
                  && typeof input.openAIAdsOppref === "string"
                  && input.openAIAdsOppref.length <= 255
                  && !Array.from(input.openAIAdsOppref).some((char: string) => char.charCodeAt(0) < 32)
                    ? input.openAIAdsOppref : null,
              })
            )
            .run();

          if (!insertRes.success) {
            throw new Error(insertRes.error || "ORDER_INSERT_FAILED");
          }
        } catch (dbErr: any) {
          console.error("[createCheckout] Critical: failed to persist durable hd_orders:", dbErr);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "ORDER_PERSISTENCE_FAILED",
          });
        }

        return {
          url: data.checkoutUrl,
          checkoutUrl: data.checkoutUrl,
          sessionId: data.sessionId,
          refId,
          publicId: data.publicId,
          amountMinor: data.amountMinor,
          currency: data.currency,
          chartSnapshotId: snapshotId,
          token: initialToken,
        };
      }),

    verifyPayment: publicProcedure
      .input(
        z.object({
          refId: z.string().min(1).max(100),
        })
      )
      .query(async ({ input, ctx }: { input: { refId: string }; ctx: Context }) => {
        const payBase = (ctx.env?.PAY_BASE_URL || "https://pay.optimateo.com").replace(/\/$/, "");
        const d1 = ctx.env?.HD_ORDERS || ctx.env?.DB;

        let payData: any = null;
        try {
          const res = await fetch(
            `${payBase}/api/payments/${encodeURIComponent(input.refId)}/status`,
            { headers: { "cache-control": "no-store" } }
          );
          if (res.ok) {
            payData = await res.json();
          }
        } catch (err) {
          console.warn("[verifyPayment] ONYX PAY status fetch error:", err);
        }

        let localOrder: any = null;
        if (d1) {
          try {
            localOrder = await d1
              .prepare(
                `SELECT payment_status, fulfillment_status, delivery_status, amount_minor, currency, offer_key, download_token
                 FROM hd_orders
                 WHERE payment_ref = ? LIMIT 1`
              )
              .bind(input.refId)
              .first();
          } catch (err) {
            console.warn("[verifyPayment] local order lookup error:", err);
          }
        }

        // Do not confirm a purchase without an existing, canonical D1 order.
        // A gateway PAID flag is only trusted when amount, currency and offer match.
        const isPaid = isVerifiedBlueprintPayment(localOrder, payData);

        if (isPaid && localOrder && localOrder.payment_status !== "PAID" && d1) {
          try {
            await d1
              .prepare(
                `UPDATE hd_orders
                 SET payment_status = 'PAID', updated_at = CURRENT_TIMESTAMP
                 WHERE payment_ref = ?`
              )
              .bind(input.refId)
              .run();
          } catch (err) {
            console.warn("[verifyPayment] failed to update payment_status:", err);
          }
        }

        // Return authoritative status without leaking PII, chart data, or download tokens
        return {
          verified: isPaid,
          status: isPaid ? "PAID" : (localOrder?.payment_status || "NOT_FOUND"),
          refId: input.refId,
          amountMinor: localOrder?.amount_minor ?? 0,
          currency: localOrder?.currency || "CZK",
          paidAt: isPaid ? (payData?.paidAt || null) : null,
          offerKey: localOrder?.offer_key || null,
          hasToken: Boolean(localOrder?.download_token),
        };
      }),

    getOrder: publicProcedure
      .input(
        z.object({
          token: z.string().min(16).max(128),
          refId: z.string().max(100).optional(),
        })
      )
      .query(async ({ input, ctx }: { input: { token: string; refId?: string }; ctx: Context }) => {
        const d1 = ctx.env?.HD_ORDERS || ctx.env?.DB;
        if (!d1) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DATABASE_UNAVAILABLE" });

        const order: any = await d1
          .prepare(
            `SELECT o.id, o.payment_ref, o.offer_key, o.payment_status, o.fulfillment_status,
                    o.delivery_status, o.delivered_at, o.download_token_expires_at,
                    o.customer_name, o.ai_reading_credits, o.email_delivery_status, o.email_delivered_at,
                    o.email_sent_at,
                    s.chart_data_json
             FROM hd_orders o
             LEFT JOIN hd_chart_snapshots s ON o.chart_snapshot_id = s.id
             WHERE o.download_token = ? LIMIT 1`
          )
          .bind(input.token)
          .first();

        if (!order) {
          throw new TRPCError({ code: "NOT_FOUND", message: "INVALID_ACCESS_TOKEN" });
        }

        // If a refId was supplied, ensure correlation
        if (input.refId && order.payment_ref !== input.refId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "TOKEN_MISMATCH" });
        }

        // Enforce token expiration
        if (order.download_token_expires_at) {
          const expiresAt = new Date(order.download_token_expires_at).getTime();
          if (Date.now() > expiresAt) {
            throw new TRPCError({ code: "FORBIDDEN", message: "ACCESS_TOKEN_EXPIRED" });
          }
        }

        // Enforce payment status
        if (order.payment_status !== "PAID") {
          throw new TRPCError({ code: "FORBIDDEN", message: "ORDER_NOT_PAID" });
        }

        let chartData: any = null;
        if (order.chart_data_json) {
          try {
            chartData = JSON.parse(order.chart_data_json);
          } catch {}
        }

        return {
          refId: order.payment_ref,
          offerKey: order.offer_key,
          paymentStatus: order.payment_status,
          fulfillmentStatus: order.fulfillment_status,
          deliveryStatus: order.delivery_status,
          deliveredAt: order.delivered_at,
          aiReadingCredits: order.ai_reading_credits !== null && order.ai_reading_credits !== undefined ? Number(order.ai_reading_credits) : 5,
          emailDeliveryStatus: order.email_delivery_status || "PENDING",
          emailDeliveredAt: order.email_delivered_at || null,
          emailSentAt: order.email_sent_at || null,
          customerName: order.customer_name || null,
          chartData,
        };
      }),

    redeemAiReading: publicProcedure
      .input(
        z.object({
          token: z.string().min(16).max(128),
          prompt: z.string().max(1000).optional(),
          readingType: z.string().optional(),
          idempotencyKey: z.string().max(128).optional(),
        })
      )
      .mutation(async ({ input, ctx }: { input: { token: string; prompt?: string; readingType?: string; idempotencyKey?: string }; ctx: Context }) => {
        const d1 = ctx.env?.HD_ORDERS || ctx.env?.DB;
        if (!d1) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DATABASE_UNAVAILABLE" });

        const order: any = await d1
          .prepare(
            `SELECT o.id, o.payment_status, o.ai_reading_credits, o.download_token_expires_at,
                    o.locale, o.offer_key, s.chart_data_json
             FROM hd_orders o
             LEFT JOIN hd_chart_snapshots s ON o.chart_snapshot_id = s.id
             WHERE o.download_token = ? LIMIT 1`
          )
          .bind(input.token)
          .first();

        if (!order) {
          throw new TRPCError({ code: "NOT_FOUND", message: "INVALID_ACCESS_TOKEN" });
        }

        if (order.download_token_expires_at && Date.now() > new Date(order.download_token_expires_at).getTime()) {
          throw new TRPCError({ code: "FORBIDDEN", message: "ACCESS_TOKEN_EXPIRED" });
        }

        if (order.payment_status !== "PAID") {
          throw new TRPCError({ code: "FORBIDDEN", message: "ORDER_NOT_PAID" });
        }

        const idemKey = input.idempotencyKey?.trim() || null;
        if (idemKey) {
          const cached: any = await d1
            .prepare(
              `SELECT reading_content, model, created_at
               FROM hd_ai_readings
               WHERE order_id = ? AND idempotency_key = ? LIMIT 1`
            )
            .bind(order.id, idemKey)
            .first();

          if (cached) {
            const committed: any = await d1
              .prepare(`SELECT ai_reading_credits FROM hd_orders WHERE id = ?`)
              .bind(order.id)
              .first();
            return {
              success: true,
              remainingCredits: Number(committed?.ai_reading_credits ?? order.ai_reading_credits ?? 0),
              reading: cached.reading_content,
              model: cached.model,
              cached: true,
            };
          }
        }

        const currentCredits = Number(order.ai_reading_credits ?? 0);
        if (currentCredits <= 0) {
          throw new TRPCError({ code: "FORBIDDEN", message: "NO_AI_CREDITS_REMAINING" });
        }

        let chartData: any = null;
        if (order.chart_data_json) {
          try {
            chartData = JSON.parse(order.chart_data_json);
          } catch (e) {
            console.warn("[redeemAiReading] chart_data_json parse error:", e);
          }
        }
        if (!chartData) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "CHART_DATA_NOT_FOUND" });
        }

        const isEn = order.locale === "en" || order.offer_key === "hd-blueprint-en";
        let aiResult: { content: string; model: string };
        try {
          aiResult = await generateHumanDesignAiReading({
            chart: chartData,
            readingType: input.readingType,
            prompt: input.prompt,
            locale: isEn ? "en" : "cs",
            env: ctx.env,
          });
        } catch (genErr: any) {
          console.error("[redeemAiReading] AI generation error:", genErr);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "AI_GENERATION_FAILED",
          });
        }

        const readingId = `air_${crypto.randomUUID()}`;
        const updateStmt = d1
          .prepare(
            `UPDATE hd_orders
             SET ai_reading_credits = ai_reading_credits - 1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = ? AND ai_reading_credits > 0`
          )
          .bind(order.id);

        const insertStmt = d1
          .prepare(
            `INSERT INTO hd_ai_readings (
              id, order_id, token, idempotency_key, reading_type, prompt, reading_content, model, created_at
            )
            SELECT ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP
            WHERE changes() > 0`
          )
          .bind(
            readingId,
            order.id,
            input.token,
            idemKey,
            input.readingType || (input.prompt ? "custom" : "overview"),
            input.prompt || null,
            aiResult.content,
            aiResult.model
          );

        let batchResults: any;
        try {
          batchResults = await d1.batch([updateStmt, insertStmt]);
        } catch (dbErr: any) {
          // If a concurrent request with the same idempotency key committed first,
          // idx_hd_ai_readings_idem unique constraint rolls back the transaction.
          if (idemKey) {
            const cached: any = await d1
              .prepare(
                `SELECT reading_content, model
                 FROM hd_ai_readings
                 WHERE order_id = ? AND idempotency_key = ? LIMIT 1`
              )
              .bind(order.id, idemKey)
              .first();
            if (cached) {
              const committed: any = await d1
                .prepare(`SELECT ai_reading_credits FROM hd_orders WHERE id = ?`)
                .bind(order.id)
                .first();
              return {
                success: true,
                remainingCredits: Number(committed?.ai_reading_credits ?? 0),
                reading: cached.reading_content,
                model: cached.model,
                cached: true,
              };
            }
          }
          console.error("[redeemAiReading] Atomic credit transaction failed:", dbErr);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "READING_PERSISTENCE_FAILED",
          });
        }

        const updateRes = batchResults?.[0];
        if (!updateRes?.success || (updateRes.meta && updateRes.meta.changes === 0)) {
          // When credit deduction affects zero rows, no reading record was inserted
          // (guaranteed by WHERE changes() > 0 in the batch without compensating DELETE).
          throw new TRPCError({ code: "FORBIDDEN", message: "NO_AI_CREDITS_REMAINING" });
        }

        // Return actual remaining credit count from committed database state
        const committedOrder: any = await d1
          .prepare(`SELECT ai_reading_credits FROM hd_orders WHERE id = ?`)
          .bind(order.id)
          .first();

        const remainingCredits = Number(committedOrder?.ai_reading_credits ?? 0);

        return {
          success: true,
          remainingCredits,
          reading: aiResult.content,
          model: aiResult.model,
        };
      }),

    checkEmailDelivery: publicProcedure
      .input(
        z.object({
          token: z.string().min(16).max(128),
        })
      )
      .query(async ({ input, ctx }: { input: { token: string }; ctx: Context }) => {
        const d1 = ctx.env?.HD_ORDERS || ctx.env?.DB;
        if (!d1) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DATABASE_UNAVAILABLE" });

        const order: any = await d1
          .prepare(
            `SELECT id, email_delivery_status, email_delivered_at, email_provider_message_id, email_sent_at, email_last_error
             FROM hd_orders WHERE download_token = ? LIMIT 1`
          )
          .bind(input.token)
          .first();

        if (!order) {
          throw new TRPCError({ code: "NOT_FOUND", message: "INVALID_ACCESS_TOKEN" });
        }

        if (order.email_delivery_status === "SENT" && order.email_provider_message_id) {
          const brevoKey = ctx.env?.BREVO_API_KEY;
          if (brevoKey) {
            try {
              const res = await fetch(
                `https://api.brevo.com/v3/smtp/statistics/events?messageId=${encodeURIComponent(order.email_provider_message_id)}&limit=10`,
                {
                  headers: { "api-key": brevoKey, Accept: "application/json" },
                }
              );
              if (res.ok) {
                const data: any = await res.json();
                const events = data?.events || [];
                const deliveredEvent = events.find((ev: any) => ev.event === "delivered");
                if (deliveredEvent) {
                  const deliveredAt = deliveredEvent.date || new Date().toISOString();
                  await d1
                    .prepare(
                      `UPDATE hd_orders
                       SET email_delivery_status = 'DELIVERED', email_delivered_at = ?, updated_at = CURRENT_TIMESTAMP
                       WHERE id = ?`
                    )
                    .bind(deliveredAt, order.id)
                    .run();
                  return {
                    status: "DELIVERED",
                    deliveredAt,
                    messageId: order.email_provider_message_id,
                  };
                }
              }
            } catch (checkErr) {
              console.warn("[checkEmailDelivery] Brevo check error:", checkErr);
            }
          }
        }

        return {
          status: order.email_delivery_status || "PENDING",
          deliveredAt: order.email_delivered_at || null,
          sentAt: order.email_sent_at || null,
          messageId: order.email_provider_message_id || null,
          lastError: order.email_last_error || null,
        };
      }),

    retryEmailDelivery: publicProcedure
      .input(
        z.object({
          token: z.string().min(16).max(128),
        })
      )
      .mutation(async ({ input, ctx }: { input: { token: string }; ctx: Context }) => {
        const d1 = ctx.env?.HD_ORDERS || ctx.env?.DB;
        if (!d1) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DATABASE_UNAVAILABLE" });

        const order: any = await d1
          .prepare(
            `SELECT id, payment_ref, customer_email, customer_name, offer_key, download_token, payment_status, locale, email_retry_count
             FROM hd_orders WHERE download_token = ? LIMIT 1`
          )
          .bind(input.token)
          .first();

        if (!order) {
          throw new TRPCError({ code: "NOT_FOUND", message: "INVALID_ACCESS_TOKEN" });
        }

        if (order.payment_status !== "PAID") {
          throw new TRPCError({ code: "FORBIDDEN", message: "ORDER_NOT_PAID" });
        }

        if (Number(order.email_retry_count ?? 0) >= 5) {
          throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "MAX_EMAIL_RETRIES_EXCEEDED" });
        }

        const isEn = order.locale === "en" || order.offer_key === "hd-blueprint-en";
        const domain = isEn ? "https://humandesignchart.app" : "https://humandesignmapa.cz";
        const loc = isEn ? "en" : "cs";
        const accessUrl = `${domain}/${loc}/payment/success?plan=blueprint&refId=${encodeURIComponent(order.payment_ref)}&token=${order.download_token}`;

        const emailRes = await sendTransactionalEmail({
          env: ctx.env,
          toEmail: order.customer_email,
          customerName: order.customer_name,
          accessUrl,
          token: order.download_token,
          refId: order.payment_ref,
          locale: loc,
        });

        if (emailRes.ok) {
          await d1
            .prepare(
              `UPDATE hd_orders
               SET email_delivery_status = 'SENT',
                   email_provider_message_id = ?,
                   email_sent_at = CURRENT_TIMESTAMP,
                   email_retry_count = COALESCE(email_retry_count, 0) + 1,
                   updated_at = CURRENT_TIMESTAMP
               WHERE id = ?`
            )
            .bind(emailRes.messageId || null, order.id)
            .run();
          return { success: true, status: "SENT", messageId: emailRes.messageId };
        } else {
          await d1
            .prepare(
              `UPDATE hd_orders
               SET email_delivery_status = 'FAILED',
                   email_last_error = ?,
                   email_retry_count = COALESCE(email_retry_count, 0) + 1,
                   updated_at = CURRENT_TIMESTAMP
               WHERE id = ?`
            )
            .bind(emailRes.error || "EMAIL_SEND_FAILED", order.id)
            .run();
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: emailRes.error || "EMAIL_SEND_FAILED" });
        }
      }),

    requestAccessRecovery: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          refId: z.string().optional(),
          locale: z.string().optional().default("cs"),
        })
      )
      .mutation(async ({ input, ctx }: { input: { email: string; refId?: string; locale?: string }; ctx: Context }) => {
        const d1 = ctx.env?.HD_ORDERS || ctx.env?.DB;
        if (!d1) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DATABASE_UNAVAILABLE" });

        const searchEmail = input.email.trim();
        let query = `SELECT id, payment_ref, customer_email, customer_name, offer_key, download_token, payment_status, locale
                     FROM hd_orders
                     WHERE LOWER(customer_email) = LOWER(?) AND payment_status = 'PAID'`;
        const params: any[] = [searchEmail];

        if (input.refId) {
          query += ` AND payment_ref = ?`;
          params.push(input.refId.trim());
        }
        query += ` ORDER BY created_at DESC LIMIT 1`;

        const order: any = await d1.prepare(query).bind(...params).first();

        if (order && order.download_token) {
          const isEn = order.locale === "en" || input.locale === "en" || order.offer_key === "hd-blueprint-en";
          const domain = isEn ? "https://humandesignchart.app" : "https://humandesignmapa.cz";
          const loc = isEn ? "en" : "cs";
          const accessUrl = `${domain}/${loc}/payment/success?plan=blueprint&refId=${encodeURIComponent(order.payment_ref)}&token=${order.download_token}`;

          try {
            const emailRes = await sendTransactionalEmail({
              env: ctx.env,
              toEmail: order.customer_email,
              customerName: order.customer_name,
              accessUrl,
              token: order.download_token,
              refId: order.payment_ref,
              locale: loc,
              isRecovery: true,
            });

            if (emailRes.ok) {
              await d1
                .prepare(
                  `UPDATE hd_orders
                   SET email_delivery_status = 'SENT',
                       email_provider_message_id = ?,
                       email_sent_at = CURRENT_TIMESTAMP,
                       updated_at = CURRENT_TIMESTAMP
                   WHERE id = ?`
                )
                .bind(emailRes.messageId || null, order.id)
                .run();
            } else {
              await d1
                .prepare(
                  `UPDATE hd_orders
                   SET email_delivery_status = 'FAILED',
                       email_last_error = ?,
                       email_retry_count = COALESCE(email_retry_count, 0) + 1,
                       updated_at = CURRENT_TIMESTAMP
                   WHERE id = ?`
                )
                .bind(emailRes.error || "EMAIL_SEND_FAILED", order.id)
                .run();
            }
          } catch (e: any) {
            console.warn("[requestAccessRecovery] email failed:", e?.message);
            await d1
              .prepare(
                `UPDATE hd_orders
                 SET email_delivery_status = 'FAILED',
                     email_last_error = ?,
                     email_retry_count = COALESCE(email_retry_count, 0) + 1,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?`
              )
              .bind(e?.message || "EMAIL_EXCEPTION", order.id)
              .run();
          }
        }

        return {
          success: true,
          message: "If a paid order matching that email was found, a recovery link has been sent.",
        };
      }),

    recordDownload: publicProcedure
      .input(
        z.object({
          token: z.string().min(16).max(128),
        })
      )
      .mutation(async ({ input, ctx }: { input: { token: string }; ctx: Context }) => {
        const d1 = ctx.env?.HD_ORDERS || ctx.env?.DB;
        if (!d1) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DATABASE_UNAVAILABLE" });

        const order: any = await d1
          .prepare(
            `SELECT id, payment_status, download_token_expires_at FROM hd_orders WHERE download_token = ? LIMIT 1`
          )
          .bind(input.token)
          .first();

        if (!order) {
          throw new TRPCError({ code: "NOT_FOUND", message: "INVALID_ACCESS_TOKEN" });
        }

        if (order.download_token_expires_at && Date.now() > new Date(order.download_token_expires_at).getTime()) {
          throw new TRPCError({ code: "FORBIDDEN", message: "ACCESS_TOKEN_EXPIRED" });
        }

        if (order.payment_status !== "PAID") {
          throw new TRPCError({ code: "FORBIDDEN", message: "ORDER_NOT_PAID" });
        }

        await d1
          .prepare(
            `UPDATE hd_orders
             SET delivery_status = 'DOWNLOADED',
                 download_count = COALESCE(download_count, 0) + 1,
                 last_downloaded_at = CURRENT_TIMESTAMP,
                 delivered_at = COALESCE(delivered_at, CURRENT_TIMESTAMP),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`
          )
          .bind(order.id)
          .run();

        return { success: true };
      }),
  }),
});

const sitemapStaticPages = [
  { loc: "/", priority: "1.0", changefreq: "weekly" },
  { loc: "/calculate", priority: "1.0", changefreq: "monthly" },
  { loc: "/encyclopedia", priority: "0.8", changefreq: "weekly" },
  { loc: "/ai-guide", priority: "0.8", changefreq: "monthly" },
  { loc: "/transits", priority: "0.7", changefreq: "daily" },
  { loc: "/transit-calendar", priority: "0.6", changefreq: "daily" },
  { loc: "/celebrities", priority: "0.8", changefreq: "monthly" },
  { loc: "/compare", priority: "0.7", changefreq: "monthly" },
  { loc: "/composite", priority: "0.7", changefreq: "monthly" },
  { loc: "/role-compatibility", priority: "0.7", changefreq: "monthly" },
  { loc: "/return-chart", priority: "0.6", changefreq: "monthly" },
  { loc: "/variables", priority: "0.7", changefreq: "monthly" },
  { loc: "/iching", priority: "0.7", changefreq: "monthly" },
  { loc: "/incarnation-cross", priority: "0.7", changefreq: "monthly" },
  { loc: "/daily-transit", priority: "0.6", changefreq: "daily" },
  { loc: "/types/generator", priority: "0.9", changefreq: "monthly" },
  { loc: "/types/manifesting-generator", priority: "0.9", changefreq: "monthly" },
  { loc: "/types/projector", priority: "0.9", changefreq: "monthly" },
  { loc: "/types/manifestor", priority: "0.9", changefreq: "monthly" },
  { loc: "/types/reflector", priority: "0.9", changefreq: "monthly" },
  { loc: "/blog", priority: "0.9", changefreq: "weekly" },
  { loc: "/honorace", priority: "0.6", changefreq: "monthly" },
  { loc: "/human-design-kalkulacka", priority: "0.9", changefreq: "monthly" },
  { loc: "/human-design-test", priority: "0.8", changefreq: "monthly" },
  { loc: "/human-design-typy", priority: "0.8", changefreq: "monthly" },
  { loc: "/andelska-cisla", priority: "0.9", changefreq: "weekly" },
];

function makeSitemap(requestUrl: URL) {
  const isEnHost = requestUrl.hostname.includes("humandesignchart.app");
  const base = isEnHost ? "https://humandesignchart.app" : "https://humandesignmapa.cz";
  const locale = isEnHost ? "en" : "cs";
  const now = new Date().toISOString().slice(0, 10);
  const nodes: string[] = [];

  const node = (loc: string, changefreq: string, priority: string, lastmod?: string) => `  <url>
    <loc>${loc}</loc>
    ${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;

  for (const page of sitemapStaticPages) {
    const url = base + (page.loc === "/" ? `/${locale}/` : `/${locale}${page.loc}`);
    nodes.push(node(url, page.changefreq, page.priority));
  }

  const articles = isEnHost ? BLOG_ARTICLES_EN : BLOG_ARTICLES;
  for (const article of articles) {
    const url = `${base}/${locale}/blog/${article.slug}`;
    nodes.push(node(url, "monthly", "0.8", article.updatedAt || article.publishedAt || now));
  }

  if (!isEnHost) {
    for (const article of ANGEL_NUMBERS) {
      const url = `${base}/cs/andelska-cisla/${article.slug}`;
      nodes.push(node(url, "weekly", "0.7", article.updatedAt || now));
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${nodes.join("\n")}
</urlset>`;
}

function makeRobots(requestUrl: URL) {
  const isEnHost = requestUrl.hostname.includes("humandesignchart.app");
  const domain = isEnHost ? "https://humandesignchart.app" : "https://humandesignmapa.cz";
  return `User-agent: *
Allow: /
Disallow: /api/
Disallow: /embed/
Disallow: /shared/
Disallow: /admin/
Disallow: /dashboard
Disallow: /payment/
Disallow: /refer/
Sitemap: ${domain}/sitemap.xml
`;
}

/**
 * Only ONYX PAY's independently verified, locally fulfilled order is eligible.
 * Persist a receipt after CAPI acknowledges the event; replay uses the same
 * order ID for de-duplication. Failure never revokes a paid customer's access.
 */
async function reportVerifiedBlueprintPurchase(d1: D1Database, env: Env, paymentRef: string): Promise<void> {
  const result = await executeTransactionalCapiOutbox(d1, env, paymentRef);
  if (result === "FAILED") {
    console.warn("[OpenAI CAPI Outbox] Confirmed order remains unreported; verify server secrets and retry callback");
  }
}

export default {
  async fetch(request: Request, env: Env, execution?: { waitUntil(promise: Promise<unknown>): void }): Promise<Response> {
    const url = new URL(request.url);

    // Google OAuth and account lookup run directly inside the Pages Worker.
    if (url.pathname === "/api/auth/status") {
      if (request.method !== "GET") return new Response("Method not allowed", { status: 405 });
      return authStatus(request, env);
    }
    if (url.pathname === "/api/oauth/login" || url.pathname === "/api/oauth/login/google" ||
        url.pathname === "/api/oauth/callback/google") {
      return googleOAuthRoute(request, env);
    }

    // This deployment runs as Cloudflare Pages, not the legacy Express server.
    // Do not send customers to non-existent OAuth routes or pretend that a
    // successful Google redirect would create an authenticated Pages session.
    // These routes are intentionally closed until native OAuth, durable user
    // persistence and auth.me/session verification are deployed together.
    if (/^\/api\/oauth\/(?:login(?:\/(?:google|facebook|apple))?|callback\/(?:google|facebook|apple))$/.test(url.pathname)) {
      const locale = url.hostname.includes("humandesignchart.app") ? "en" : "cs";
      const headers = {
        "cache-control": "no-store",
        "referrer-policy": "no-referrer",
      };
      const isBrowserNavigation =
        request.headers.get("sec-fetch-mode") === "navigate" ||
        request.headers.get("accept")?.includes("text/html");
      if (isBrowserNavigation) {
        const destination = new URL(`/${locale}/login?auth=unavailable`, url.origin);
        return new Response(null, {
          status: 303,
          headers: { ...headers, location: destination.toString() },
        });
      }
      return Response.json(
        { error: "OAUTH_UNAVAILABLE_ON_PAGES", loginPage: `/${locale}/login` },
        { status: 503, headers },
      );
    }

    if (url.pathname === "/api/health") {
      if (request.method !== "GET" && request.method !== "HEAD") {
        return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
      }
      // Binding presence is configuration evidence only. Do not query customer
      // data or claim that Stripe, gateway callbacks or email delivery were tested.
      const integrations = {
        checkout: Boolean(env.PAYGATE_CHECKOUT_API_KEY_HUMAN_DESIGN?.trim()),
        fulfillment: Boolean(env.HUMAN_DESIGN_FULFILLMENT_API_KEY?.trim()),
        orders: Boolean(env.HD_ORDERS || env.DB),
        email: Boolean(env.BREVO_API_KEY?.trim() || env.RESEND_API_KEY?.trim()),
      };
      const body = {
        ok: true,
        runtime: "cloudflare-pages",
        payments: {
          provider: "onyxpay",
          configured: Object.values(integrations).every(Boolean),
          verified: false,
          callbackPath: "/api/internal/onyxpay/fulfill",
          integrations,
        },
      };
      return new Response(request.method === "HEAD" ? null : JSON.stringify(body), {
        headers: { "content-type": "application/json", "cache-control": "no-store" },
      });
    }

    if (url.pathname === "/api/internal/onyxpay/fulfill") {
      if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
      const expected = env.HUMAN_DESIGN_FULFILLMENT_API_KEY;
      if (!expected) {
        console.error("[onyxpay-fulfill] HUMAN_DESIGN_FULFILLMENT_API_KEY not configured");
        return new Response("Service misconfigured", { status: 500 });
      }

      const supplied = request.headers.get("authorization") || "";
      if (!supplied.startsWith("Bearer ")) return new Response("Unauthorized", { status: 401 });
      const token = supplied.slice(7);
      const left = new TextEncoder().encode(token);
      const right = new TextEncoder().encode(expected);
      const [digestA, digestB] = await Promise.all([
        crypto.subtle.digest("SHA-256", left),
        crypto.subtle.digest("SHA-256", right),
      ]);
      const bytesA = new Uint8Array(digestA);
      const bytesB = new Uint8Array(digestB);
      let difference = left.length ^ right.length;
      for (let i = 0; i < bytesA.length; i++) difference |= bytesA[i] ^ bytesB[i];
      if (difference !== 0) return new Response("Unauthorized", { status: 401 });

      const event: any = await request.json().catch(() => null);
      if (
        event?.eventType !== "PAYMENT_CAPTURED" ||
        event?.tenant !== "human-design" ||
        !["hd-blueprint-cz", "hd-blueprint-en"].includes(event?.offerKey) ||
        typeof event?.refId !== "string" ||
        typeof event?.eventId !== "string" ||
        typeof event?.customerEmail !== "string" ||
        !Number.isInteger(Number(event?.amount)) ||
        Number(event?.amount) <= 0 ||
        !["CZK", "EUR"].includes(event?.currency)
      ) {
        return Response.json({ ok: false, error: "INVALID_PAYMENT_EVENT" }, { status: 400 });
      }

      // Authoritative independent verification against ONYX PAY
      const payBase = (env.PAY_BASE_URL || "https://pay.optimateo.com").replace(/\/$/, "");
      const s2sKey = env.PAYGATE_CHECKOUT_API_KEY_HUMAN_DESIGN;
      let payData: any = null;
      try {
        const payRes = await fetch(`${payBase}/api/payments/${encodeURIComponent(event.refId)}/status`, {
          headers: {
            "cache-control": "no-store",
            ...(s2sKey ? { Authorization: `Bearer ${s2sKey}` } : {}),
          },
        });
        if (!payRes.ok) {
          console.error(`[onyxpay-fulfill] Gateway lookup failed with HTTP ${payRes.status} for ${event.refId}`);
          return Response.json({ ok: false, error: "PAYMENT_NOT_FOUND_ON_GATEWAY" }, { status: 422 });
        }
        payData = await payRes.json();
      } catch (fetchErr: any) {
        console.error("[onyxpay-fulfill] Gateway communication error:", fetchErr);
        return Response.json({ ok: false, error: "GATEWAY_VERIFICATION_FAILED" }, { status: 502 });
      }

      const isActuallyPaid = payData?.status === "PAID" || payData?.status === "FULFILLED";
      if (!isActuallyPaid) {
        console.error(`[onyxpay-fulfill] Gateway reports uncaptured status ${payData?.status} for ${event.refId}`);
        return Response.json(
          { ok: false, error: "PAYMENT_NOT_CAPTURED_ON_GATEWAY", gatewayStatus: payData?.status },
          { status: 422 }
        );
      }

      if (payData.amountMinor !== undefined && Number(payData.amountMinor) !== Number(event.amount)) {
        console.error(`[onyxpay-fulfill] Amount mismatch: event=${event.amount}, gateway=${payData.amountMinor}`);
        return Response.json({ ok: false, error: "PAYMENT_AMOUNT_MISMATCH" }, { status: 422 });
      }

      if (payData.currency && payData.currency.toUpperCase() !== event.currency.toUpperCase()) {
        console.error(`[onyxpay-fulfill] Currency mismatch: event=${event.currency}, gateway=${payData.currency}`);
        return Response.json({ ok: false, error: "PAYMENT_CURRENCY_MISMATCH" }, { status: 422 });
      }

      const d1 = env.HD_ORDERS || env.DB;
      if (!d1) {
        console.error("[onyxpay-fulfill] D1 database not bound");
        return Response.json({ ok: false, error: "D1_DATABASE_UNAVAILABLE" }, { status: 500 });
      }

      const isEn = event.offerKey === "hd-blueprint-en";
      const domain = isEn ? "https://humandesignchart.app" : "https://humandesignmapa.cz";
      const locale = isEn ? "en" : "cs";
      const reportConversion = async () => {
        const job = reportVerifiedBlueprintPurchase(d1, env, event.refId).catch(() => {
          console.warn("[OpenAI CAPI] Event could not be reported; paid fulfillment is unaffected");
        });
        if (execution?.waitUntil) execution.waitUntil(job);
        else await job;
      };

      try {
        const existing: any = await d1
          .prepare(
            `SELECT id, payment_status, fulfillment_status, delivery_status, download_token,
                    chart_snapshot_id, customer_email, offer_key, amount_minor, currency
             FROM hd_orders WHERE payment_ref = ? LIMIT 1`
          )
          .bind(event.refId)
          .first();

        // Reject a paid event when the original order or personalized chart is
        // unavailable. Never create an empty paid order or issue an unusable PDF.
        const snapshot = existing?.chart_snapshot_id
          ? await d1
              .prepare("SELECT id FROM hd_chart_snapshots WHERE id = ? AND LOWER(email) = LOWER(?) LIMIT 1")
              .bind(existing.chart_snapshot_id, existing.customer_email)
              .first()
          : null;
        const blocked = getBlueprintFulfillmentBlocker(existing, event, Boolean(snapshot));
        if (blocked) {
          console.error("[onyxpay-fulfill] Cannot fulfill blueprint without valid order and chart:", blocked);
          return Response.json(
            { ok: false, error: blocked, retryable: blocked === "CHART_SNAPSHOT_REQUIRED" },
            { status: blocked === "CHART_SNAPSHOT_REQUIRED" ? 503 : 422 }
          );
        }

        const downloadToken = existing.download_token || `tok_${crypto.randomUUID().replace(/-/g, "")}`;

        if (existing.fulfillment_status === "FULFILLED") {
          await reportConversion();
          return Response.json({
            ok: true,
            status: "ALREADY_FULFILLED",
            refId: event.refId,
            publicToken: downloadToken,
            reportAccessUrl: `${domain}/${locale}/payment/success?plan=blueprint&refId=${encodeURIComponent(event.refId)}&token=${downloadToken}`,
            fulfilledAt: new Date().toISOString(),
          });
        }

        const tokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        // UPDATE only: the chart-bearing order must be created before checkout.
        // An INSERT here could claim a paid Blueprint was delivered without a chart.
        const updateRes = await d1
          .prepare(
            `UPDATE hd_orders
             SET event_id = ?, payment_status = 'PAID', fulfillment_status = 'FULFILLED',
                 delivery_status = CASE WHEN delivery_status = 'DOWNLOADED' THEN 'DOWNLOADED' ELSE 'READY' END,
                 ai_reading_credits = COALESCE(ai_reading_credits, 5),
                 download_token = COALESCE(download_token, ?),
                 download_token_expires_at = COALESCE(download_token_expires_at, ?),
                 updated_at = CURRENT_TIMESTAMP
             WHERE payment_ref = ? AND fulfillment_status != 'FULFILLED'`
          )
          .bind(event.eventId, downloadToken, tokenExpiresAt, event.refId)
          .run();

        if (!updateRes.success) throw new Error("FULFILLMENT_UPDATE_FAILED");
        if (updateRes.meta?.changes === 0) {
          // Another authenticated callback committed first. Read the canonical
          // persisted token and acknowledge idempotently without a second email.
          const committed: any = await d1
            .prepare("SELECT fulfillment_status, download_token FROM hd_orders WHERE payment_ref = ?")
            .bind(event.refId)
            .first();
          if (committed?.fulfillment_status !== "FULFILLED" || !committed.download_token) {
            return Response.json({ ok: false, error: "FULFILLMENT_CONFLICT" }, { status: 503 });
          }
          await reportConversion();
          return Response.json({
            ok: true,
            status: "ALREADY_FULFILLED",
            refId: event.refId,
            publicToken: committed.download_token,
            reportAccessUrl: `${domain}/${locale}/payment/success?plan=blueprint&refId=${encodeURIComponent(event.refId)}&token=${committed.download_token}`,
          });
        }

        const accessUrl = `${domain}/${locale}/payment/success?plan=blueprint&refId=${encodeURIComponent(event.refId)}&token=${downloadToken}`;

        let emailDeliveryStatus = "PENDING";
        try {
          const emailRes = await sendTransactionalEmail({
            env,
            toEmail: event.customerEmail,
            customerName: event.customerName,
            accessUrl,
            token: downloadToken,
            refId: event.refId,
            locale,
          });
          if (emailRes.ok) {
            emailDeliveryStatus = "SENT";
            await d1
              .prepare(
                `UPDATE hd_orders
                 SET email_delivery_status = 'SENT',
                     email_provider_message_id = ?,
                     email_sent_at = CURRENT_TIMESTAMP,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE payment_ref = ?`
              )
              .bind(emailRes.messageId || null, event.refId)
              .run();
          } else {
            emailDeliveryStatus = "FAILED";
            await d1
              .prepare(
                `UPDATE hd_orders
                 SET email_delivery_status = 'FAILED',
                     email_last_error = ?,
                     email_retry_count = COALESCE(email_retry_count, 0) + 1,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE payment_ref = ?`
              )
              .bind(emailRes.error || "EMAIL_SEND_FAILED", event.refId)
              .run();
          }
        } catch (mailErr: any) {
          emailDeliveryStatus = "FAILED";
          console.warn("[onyxpay-fulfill] Email dispatch error:", mailErr?.message);
          await d1
            .prepare(
              `UPDATE hd_orders
               SET email_delivery_status = 'FAILED',
                   email_last_error = ?,
                   email_retry_count = COALESCE(email_retry_count, 0) + 1,
                   updated_at = CURRENT_TIMESTAMP
               WHERE payment_ref = ?`
            )
            .bind(mailErr?.message || "EMAIL_EXCEPTION", event.refId)
            .run();
        }

        await reportConversion();
        return Response.json({
          ok: true,
          status: "FULFILLED",
          refId: event.refId,
          publicToken: downloadToken,
          reportAccessUrl: accessUrl,
          emailDeliveryStatus,
          fulfilledAt: new Date().toISOString(),
        });
      } catch (dbErr: any) {
        console.error("[onyxpay-fulfill] HD_ORDERS persistence error:", dbErr);
        return Response.json({ ok: false, error: "DB_PERSISTENCE_FAILED", message: dbErr?.message }, { status: 500 });
      }
    }

    if (url.pathname === "/sitemap.xml") {
      return new Response(makeSitemap(url), {
        headers: {
          "content-type": "application/xml; charset=utf-8",
          "cache-control": "public, max-age=3600",
        },
      });
    }

    if (url.pathname === "/robots.txt") {
      return new Response(makeRobots(url), {
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "cache-control": "public, max-age=3600",
        },
      });
    }

    // Public Human Design calculation endpoint for GPT/MCP clients.
    // This must be handled by the Cloudflare Pages worker: the legacy Express
    // route is not deployed on this hosting target.
    if (url.pathname === "/api/gpt/calculate") {
      if (request.method !== "POST") {
        return Response.json({ error: "METHOD_NOT_ALLOWED" }, { status: 405, headers: { Allow: "POST" } });
      }
      let payload: unknown;
      try { payload = await request.json(); }
      catch { return Response.json({ error: "INVALID_JSON" }, { status: 400 }); }
      const parsed = z.object({
        birthDate: z.string(), birthTime: z.string(),
        latitude: z.number().finite().min(-90).max(90),
        longitude: z.number().finite().min(-180).max(180),
      }).safeParse(payload);
      if (!parsed.success) return Response.json({ error: "INVALID_INPUT" }, { status: 400 });
      try {
        const { birthDate, birthTime, latitude, longitude } = parsed.data;
        const canonical = ChartCalculationInputSchema.parse({
          name: "API request", birthDate, birthTime, birthPlace: "API request",
          latitude, longitude, timezone: lookupIanaTimezone(latitude, longitude),
        });
        const chart = ChartResultSchema.parse(calculateChart(canonical));
        return Response.json({ success: true, type: chart.type, strategy: chart.strategy,
          authority: chart.authority, profile: chart.profile,
          credits: "Data provided by humandesignchart.app",
          sponsorLink: "https://humandesignchart.app" },
          { headers: { "cache-control": "no-store" } });
      } catch (error) {
        if (error instanceof z.ZodError || error instanceof TimezoneResolutionError)
          return Response.json({ error: "INVALID_BIRTH_DATA" }, { status: 400 });
        console.error("[gpt-calculate]", error);
        return Response.json({ error: "CALCULATION_FAILED" }, { status: 500 });
      }
    }

    if (url.pathname.startsWith("/api/trpc")) {
      const isLogout = url.pathname === "/api/trpc/auth.logout" && request.method === "POST";
      const origin = request.headers.get("origin");
      if (isLogout && origin && origin !== url.origin)
        return Response.json({ error: "INVALID_ORIGIN" }, { status: 403 });
      const response = await fetchRequestHandler({
        endpoint: "/api/trpc",
        req: request,
        router: appRouter,
        createContext: () => ({ env, request }),
        onError({ path, error }) {
          console.error("[pages-api]", path, error.code, error.message);
        },
      });
      if (!isLogout || !response.ok) return response;
      const headers = new Headers(response.headers);
      headers.append("set-cookie", clearSessionCookie());
      headers.set("cache-control", "no-store");
      return new Response(response.body, { status: response.status, headers });
    }

    // API requests must never silently return the SPA HTML shell. Unknown
    // authentication/payment routes are unavailable, not successful pages.
    if (url.pathname.startsWith("/api/")) {
      return Response.json(
        { error: "API_ROUTE_NOT_AVAILABLE" },
        { status: 404, headers: { "cache-control": "no-store" } },
      );
    }

    const asset = await env.ASSETS.fetch(request);
    return withServerRenderedSeoMeta(publicSeoUrlFromRequest(request), asset);
  },
};
