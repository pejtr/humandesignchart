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
  HD_ORDERS?: D1Database;
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
};

const t = initTRPC.context<{}>().create({
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
  // Authenticated checkout stays blocked until a real payment backend exists.
  subscription: router({
    blueprintOffer: publicProcedure
      .input(z.object({ locale: z.enum(["cs", "en"]) }))
      .query(({ input }) => getBlueprintOffer(input.locale)),
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

    // The Pages runtime deliberately has no customer session provider.
    // Fail explicitly rather than silently returning the SPA HTML fallback.
    // Pages cannot execute the legacy Express OAuth handlers. Return an
    // explicit error instead of serving index.html to sign-in callbacks.
    if (url.pathname.startsWith("/api/oauth/") || url.pathname === "/api/auth/logout") {
      return Response.json({ ok: false, error: "OAUTH_PROVIDER_NOT_CONFIGURED" }, {
        status: 503, headers: { "cache-control": "no-store" },
      });
    }

    if (url.pathname === "/api/auth/me") {
      return Response.json({ user: null, authenticated: false, reason: "CUSTOMER_AUTH_NOT_CONFIGURED" }, { status: 503, headers: { "cache-control": "no-store" } });
    }

    if (url.pathname === "/api/internal/onyxpay/fulfill") {
      if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
      const expected = env.HUMAN_DESIGN_FULFILLMENT_API_KEY;
      const supplied = request.headers.get("authorization") || "";
      // Never accept payments based on a browser redirect or unverified request.
      if (!expected || !supplied.startsWith("Bearer ")) return new Response("Unauthorized", { status: 401 });
      const token = supplied.slice(7);
      const left = new TextEncoder().encode(token);
      const right = new TextEncoder().encode(expected);
      // Compare fixed-length SHA-256 digests without early exit. The previous
      // implementation only checked credentials in a conditional branch.
      const [digestA, digestB] = await Promise.all([
        crypto.subtle.digest("SHA-256", left),
        crypto.subtle.digest("SHA-256", right),
      ]);
      const bytesA = new Uint8Array(digestA);
      const bytesB = new Uint8Array(digestB);
      let difference = left.length ^ right.length;
      for (let i = 0; i < bytesA.length; i++) difference |= bytesA[i] ^ bytesB[i];
      if (difference !== 0) return new Response("Unauthorized", { status: 401 });
      if (!env.HD_ORDERS) return Response.json({ ok: false, error: "DELIVERY_STORE_NOT_CONFIGURED" }, { status: 503 });
      const event: any = await request.json().catch(() => null);
      if (event?.eventType !== "PAYMENT_CAPTURED" || event?.tenant !== "human-design" ||
          !["hd-blueprint-cz", "hd-blueprint-en"].includes(event?.offerKey) ||
          !event?.refId || !event?.eventId || !event?.customerEmail ||
          event?.environment !== "REAL") {
        return Response.json({ ok: false, error: "INVALID_PAYMENT_EVENT" }, { status: 400 });
      }
      // Strictly validate payment contract before persisting any personal data.
      const expectedMoney = event.offerKey === "hd-blueprint-cz"
        ? { currency: "CZK", amount: 29000 }
        : { currency: "EUR", amount: 1590 };
      if (event.currency !== expectedMoney.currency || !Number.isSafeInteger(event.amount) || event.amount < expectedMoney.amount || event.amount > expectedMoney.amount + 1_000_000 ||
          typeof event.customerEmail !== "string" || event.customerEmail.length > 254 ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(event.customerEmail) ||
          typeof event.eventId !== "string" || event.eventId.length > 200 ||
          typeof event.refId !== "string" || event.refId.length > 200) {
        return Response.json({ ok: false, error: "PAYMENT_CONTRACT_MISMATCH" }, { status: 400 });
      }
      try {
        // The unique payment reference prevents repeated callback delivery from
        // creating multiple orders. An event ID cannot be rebound to another ref.
        const previous = await env.HD_ORDERS.prepare(
          "SELECT event_id, payment_ref, offer_key, customer_email, amount_minor, currency, status FROM blueprint_payment_receipts WHERE event_id = ? OR payment_ref = ? LIMIT 1"
        ).bind(event.eventId, event.refId).first<{
          event_id: string; payment_ref: string; offer_key: string; customer_email: string; amount_minor: number; currency: string; status: string;
        }>();
        if (previous && (previous.event_id !== event.eventId || previous.payment_ref !== event.refId ||
          previous.offer_key !== event.offerKey || previous.customer_email !== event.customerEmail ||
          previous.amount_minor !== event.amount || previous.currency !== event.currency)) {
          return Response.json({ ok: false, error: "PAYMENT_RECEIPT_CONFLICT" }, { status: 409 });
        }
        if (!previous) {
          await env.HD_ORDERS.prepare(
            "INSERT INTO blueprint_payment_receipts (event_id,payment_ref,tenant_id,offer_key,customer_email,amount_minor,currency) VALUES (?,?,?,?,?,?,?) ON CONFLICT DO NOTHING"
          ).bind(event.eventId, event.refId, event.tenant, event.offerKey, event.customerEmail, event.amount, event.currency).run();
        }
        // Do not return FULFILLED until actual customer access and 5 AI credits
        // have been granted in the production entitlement store.
        return Response.json({ ok: false, status: "PENDING_DELIVERY", error: "ENTITLEMENT_PROVIDER_NOT_CONFIGURED" }, { status: 503 });
      } catch (error) {
        console.error("[blueprint] receipt persistence failed", error);
        return Response.json({ ok: false, error: "RECEIPT_PERSISTENCE_FAILED" }, { status: 503 });
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
        createContext: () => ({}),
        onError({ path, error }) {
          console.error("[pages-api]", path, error.code, error.message);
        },
      });
    }

    const asset = await env.ASSETS.fetch(request);
    return withServerRenderedSeoMeta(url, asset);
  },
};
