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
import { BLOG_ARTICLES } from "../server/data/blogArticles";
import { BLOG_ARTICLES_EN } from "../server/data/blogArticlesEn";
import { ANGEL_NUMBERS } from "../server/data/angelNumbers";

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

const appRouter = router({
  chart: chartRouter,
  publicStats: publicStatsRouter,
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
  const csBase = "https://www.humandesignmapa.cz";
  const enBase = "https://www.humandesignchart.app";
  const now = new Date().toISOString().slice(0, 10);
  const nodes: string[] = [];

  const node = (loc: string, csAlt: string, enAlt: string, changefreq: string, priority: string, lastmod: string) => `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
    <xhtml:link rel="alternate" hreflang="cs" href="${csAlt}" />
    <xhtml:link rel="alternate" hreflang="en" href="${enAlt}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${enAlt}" />
  </url>`;

  for (const page of sitemapStaticPages) {
    const csUrl = csBase + (page.loc === "/" ? "/cs/" : "/cs" + page.loc);
    const enUrl = enBase + (page.loc === "/" ? "/en/" : "/en" + page.loc);
    nodes.push(node(isEnHost ? enUrl : csUrl, csUrl, enUrl, page.changefreq, page.priority, now));
  }

  const maxLen = Math.max(BLOG_ARTICLES.length, BLOG_ARTICLES_EN.length);
  for (let i = 0; i < maxLen; i++) {
    const csArt = BLOG_ARTICLES[i];
    const enArt = BLOG_ARTICLES_EN[i];
    if (isEnHost && !enArt) continue;
    if (!isEnHost && !csArt) continue;
    const csUrl = csArt ? `${csBase}/cs/blog/${csArt.slug}` : `${csBase}/cs/blog`;
    const enUrl = enArt ? `${enBase}/en/blog/${enArt.slug}` : `${enBase}/en/blog`;
    const article = isEnHost ? enArt : csArt;
    const lastmod = article?.updatedAt || article?.publishedAt || now;
    nodes.push(node(isEnHost ? enUrl : csUrl, csUrl, enUrl, "monthly", "0.8", lastmod));
  }

  for (const article of ANGEL_NUMBERS) {
    const csUrl = `${csBase}/cs/andelska-cisla/${article.slug}`;
    const enUrl = `${enBase}/en/andelska-cisla/${article.slug}`;
    nodes.push(node(isEnHost ? enUrl : csUrl, csUrl, enUrl, "weekly", "0.7", article.updatedAt || now));
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${nodes.join("\n")}
</urlset>`;
}

function makeRobots(requestUrl: URL) {
  const isEnHost = requestUrl.hostname.includes("humandesignchart.app");
  const domain = isEnHost ? "https://www.humandesignchart.app" : "https://www.humandesignmapa.cz";
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
    const isEnHost = url.hostname === "humandesignchart.app" || url.hostname === "www.humandesignchart.app";
    const contentType = asset.headers.get("content-type") || "";
    if (!isEnHost || !contentType.includes("text/html")) return asset;

    // One Pages project serves both brands. Keep the Czech static template for
    // the CZ host, but prevent the EN host from publishing Czech host-level
    // language, RSS and canonical-domain signals. Route-specific metadata is
    // handled by the application.
    const html = await asset.text();
    const normalized = html
      .replace('<html lang="cs">', '<html lang="en">')
      .replace(
        /<link rel="alternate" type="application\/rss\+xml"[^>]*>/,
        '<link rel="alternate" type="application/rss+xml" title="Human Design Blog" href="https://www.humandesignchart.app/rss.xml" />',
      )
      .replaceAll("https://www.humandesignmapa.cz", "https://www.humandesignchart.app");

    const headers = new Headers(asset.headers);
    headers.delete("content-length");
    headers.set("content-language", "en");
    return new Response(normalized, { status: asset.status, statusText: asset.statusText, headers });
  },
};
