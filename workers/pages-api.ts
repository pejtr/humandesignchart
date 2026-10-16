import { initTRPC, TRPCError } from "@trpc/server";
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
import { withServerRenderedSeoMeta } from "./social-meta";
import { getBlueprintOffer } from "../server/payments/publicOfferCatalog";

type Env = {
  HUMAN_DESIGN_FULFILLMENT_API_KEY?: string;
  PAYGATE_CHECKOUT_API_KEY_HUMAN_DESIGN?: string;
  PAY_BASE_URL?: string;
  HD_ORDERS?: D1Database;
  DB?: D1Database;
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
};

type Context = { env: Env; request: Request };

const t = initTRPC.context<Context>().create({
  transformer: superjson,
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

const appRouter = router({
  auth: router({
    me: publicProcedure.query(() => null),
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
          chartDataJson: z.string().min(2),
          metaJson: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }: { input: any; ctx: Context }) => {
        const d1 = ctx.env?.HD_ORDERS || ctx.env?.DB;
        const snapshotId = `snap_${crypto.randomUUID()}`;
        if (d1) {
          try {
            await d1
              .prepare(
                `INSERT INTO hd_chart_snapshots (id, email, locale, chart_data_json, created_at)
                 VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`
              )
              .bind(snapshotId, input.email, input.locale, input.chartDataJson)
              .run();
          } catch (err) {
            console.error("[saveChartSnapshot] D1 error:", err);
          }
        }
        return { snapshotId };
      }),

    createCheckout: publicProcedure
      .input(
        z.object({
          plan: z.string().default("blueprint"),
          locale: z.enum(["cs", "en"]).default("cs"),
          origin: z.string().url(),
          customerEmail: z.string().email(),
          customerName: z.string().optional(),
          digitalDeliveryConsent: z.boolean(),
          chartSnapshotId: z.string().optional(),
          chartDataJson: z.string().optional(),
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
        const s2sKey = ctx.env?.PAYGATE_CHECKOUT_API_KEY_HUMAN_DESIGN;
        if (!s2sKey) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "PAYGATE_CHECKOUT_API_KEY_NOT_CONFIGURED",
          });
        }

        const d1 = ctx.env?.HD_ORDERS || ctx.env?.DB;
        let snapshotId = input.chartSnapshotId;

        if (!snapshotId && input.chartDataJson && d1) {
          snapshotId = `snap_${crypto.randomUUID()}`;
          try {
            await d1
              .prepare(
                `INSERT INTO hd_chart_snapshots (id, email, locale, chart_data_json, created_at)
                 VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`
              )
              .bind(snapshotId, input.customerEmail, input.locale, input.chartDataJson)
              .run();
          } catch (err) {
            console.warn("[createCheckout] Could not save chart snapshot:", err);
          }
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

        if (d1 && refId) {
          try {
            const orderId = `ord_${crypto.randomUUID()}`;
            await d1
              .prepare(
                `INSERT INTO hd_orders (
                  id, payment_ref, customer_email, customer_name, offer_key,
                  amount_minor, currency, locale, chart_snapshot_id,
                  payment_status, fulfillment_status, delivery_status,
                  consent_record_json, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'CREATED', 'PENDING', 'PENDING', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                ON CONFLICT(payment_ref) DO NOTHING`
              )
              .bind(
                orderId,
                refId,
                input.customerEmail,
                input.customerName || null,
                offerKey,
                data.amountMinor || (isCzech ? 29000 : 1590),
                data.currency || (isCzech ? "CZK" : "EUR"),
                input.locale,
                snapshotId || null,
                JSON.stringify({
                  digitalDeliveryConsent: true,
                  consentedAt: new Date().toISOString(),
                  redditClickId: input.redditClickId || null,
                })
              )
              .run();
          } catch (dbErr) {
            console.warn("[createCheckout] Could not insert hd_orders:", dbErr);
          }
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
        };
      }),

    verifyPayment: publicProcedure
      .input(
        z.object({
          refId: z.string().min(1),
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
        let chartData: any = null;
        if (d1) {
          try {
            localOrder = await d1
              .prepare(
                `SELECT o.*, s.chart_data_json
                 FROM hd_orders o
                 LEFT JOIN hd_chart_snapshots s ON o.chart_snapshot_id = s.id
                 WHERE o.payment_ref = ? LIMIT 1`
              )
              .bind(input.refId)
              .first();

            if (localOrder?.chart_data_json) {
              try {
                chartData = JSON.parse(localOrder.chart_data_json);
              } catch {}
            }
          } catch (err) {
            console.warn("[verifyPayment] local order lookup error:", err);
          }
        }

        const isPaid =
          payData?.status === "PAID" ||
          payData?.status === "FULFILLED" ||
          localOrder?.payment_status === "PAID" ||
          localOrder?.fulfillment_status === "FULFILLED";

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

        return {
          verified: isPaid,
          status: payData?.status || localOrder?.payment_status || "NOT_FOUND",
          refId: input.refId,
          amountMinor: payData?.amountMinor || localOrder?.amount_minor || 0,
          currency: payData?.currency || localOrder?.currency || "CZK",
          paidAt: payData?.paidAt || localOrder?.delivered_at || null,
          offerKey: payData?.offerKey || localOrder?.offer_key || null,
          downloadToken: localOrder?.download_token || null,
          customerName: localOrder?.customer_name || null,
          chartData: chartData || null,
        };
      }),

    getOrder: publicProcedure
      .input(
        z.object({
          refId: z.string().optional(),
          downloadToken: z.string().optional(),
        })
      )
      .query(async ({ input, ctx }: { input: { refId?: string; downloadToken?: string }; ctx: Context }) => {
        if (!input.refId && !input.downloadToken) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "refId or downloadToken is required" });
        }
        const d1 = ctx.env?.HD_ORDERS || ctx.env?.DB;
        if (!d1) return null;

        let order: any = null;
        if (input.refId) {
          order = await d1
            .prepare(
              `SELECT o.*, s.chart_data_json
               FROM hd_orders o
               LEFT JOIN hd_chart_snapshots s ON o.chart_snapshot_id = s.id
               WHERE o.payment_ref = ? LIMIT 1`
            )
            .bind(input.refId)
            .first();
        } else if (input.downloadToken) {
          order = await d1
            .prepare(
              `SELECT o.*, s.chart_data_json
               FROM hd_orders o
               LEFT JOIN hd_chart_snapshots s ON o.chart_snapshot_id = s.id
               WHERE o.download_token = ? LIMIT 1`
            )
            .bind(input.downloadToken)
            .first();
        }

        if (!order) return null;

        let chartData: any = null;
        if (order.chart_data_json) {
          try {
            chartData = JSON.parse(order.chart_data_json);
          } catch {}
        }

        return {
          refId: order.payment_ref,
          customerEmail: order.customer_email,
          customerName: order.customer_name,
          offerKey: order.offer_key,
          paymentStatus: order.payment_status,
          fulfillmentStatus: order.fulfillment_status,
          deliveryStatus: order.delivery_status,
          deliveredAt: order.delivered_at,
          downloadToken: order.download_token,
          chartData,
        };
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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

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
        !event?.refId ||
        !event?.eventId ||
        !event?.customerEmail
      ) {
        return Response.json({ ok: false, error: "INVALID_PAYMENT_EVENT" }, { status: 400 });
      }

      const d1 = env.HD_ORDERS || env.DB;
      if (!d1) {
        console.error("[onyxpay-fulfill] D1 database not bound");
        return Response.json({ ok: false, error: "D1_DATABASE_UNAVAILABLE" }, { status: 500 });
      }

      const isEn = event.offerKey === "hd-blueprint-en";
      const domain = isEn ? "https://humandesignchart.app" : "https://humandesignmapa.cz";
      const locale = isEn ? "en" : "cs";

      try {
        const existing: any = await d1
          .prepare(
            `SELECT id, payment_status, fulfillment_status, download_token FROM hd_orders WHERE payment_ref = ? LIMIT 1`
          )
          .bind(event.refId)
          .first();

        let downloadToken = existing?.download_token;
        if (!downloadToken) {
          downloadToken = `tok_${crypto.randomUUID().replace(/-/g, "")}`;
        }

        if (existing?.fulfillment_status === "FULFILLED") {
          return Response.json({
            ok: true,
            status: "ALREADY_FULFILLED",
            refId: event.refId,
            publicToken: downloadToken,
            reportAccessUrl: `${domain}/${locale}/payment/success?plan=blueprint&refId=${encodeURIComponent(event.refId)}&token=${downloadToken}`,
            fulfilledAt: new Date().toISOString(),
          });
        }

        const orderId = existing?.id || `ord_${crypto.randomUUID()}`;
        const tokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        await d1
          .prepare(
            `INSERT INTO hd_orders (
              id, payment_ref, event_id, customer_email, customer_name, offer_key,
              amount_minor, currency, locale,
              payment_status, fulfillment_status, delivery_status, delivered_at,
              download_token, download_token_expires_at, created_at, updated_at
            ) VALUES (
              ?, ?, ?, ?, ?, ?,
              ?, ?, ?,
              'PAID', 'FULFILLED', 'DELIVERED', CURRENT_TIMESTAMP,
              ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            )
            ON CONFLICT(payment_ref) DO UPDATE SET
              event_id = excluded.event_id,
              payment_status = 'PAID',
              fulfillment_status = 'FULFILLED',
              delivery_status = 'DELIVERED',
              delivered_at = CURRENT_TIMESTAMP,
              download_token = COALESCE(hd_orders.download_token, excluded.download_token),
              download_token_expires_at = COALESCE(hd_orders.download_token_expires_at, excluded.download_token_expires_at),
              updated_at = CURRENT_TIMESTAMP`
          )
          .bind(
            orderId,
            event.refId,
            event.eventId,
            event.customerEmail,
            event.customerName || null,
            event.offerKey,
            event.amount,
            event.currency,
            locale,
            downloadToken,
            tokenExpiresAt
          )
          .run();

        return Response.json({
          ok: true,
          status: "FULFILLED",
          refId: event.refId,
          publicToken: downloadToken,
          reportAccessUrl: `${domain}/${locale}/payment/success?plan=blueprint&refId=${encodeURIComponent(event.refId)}&token=${downloadToken}`,
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

    if (url.pathname.startsWith("/api/trpc")) {
      return fetchRequestHandler({
        endpoint: "/api/trpc",
        req: request,
        router: appRouter,
        createContext: () => ({ env, request }),
        onError({ path, error }) {
          console.error("[pages-api]", path, error.code, error.message);
        },
      });
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
    return withServerRenderedSeoMeta(url, asset);
  },
};
