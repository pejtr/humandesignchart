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
import { BLOG_ARTICLES_EN } from "../server/data/blogArticlesEn";
import { ANGEL_NUMBERS } from "../server/data/angelNumbers";
import { withServerRenderedSeoMeta } from "./social-meta";

type Env = {
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

const appRouter = router({
  chart: chartRouter,
  publicStats: publicStatsRouter,
  blog: blogRouter,
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
