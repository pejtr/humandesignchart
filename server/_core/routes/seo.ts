import { Express } from "express";
import { BLOG_ARTICLES } from "../data/blogArticles";
import { BLOG_ARTICLES_EN } from "../data/blogArticlesEn";
import { ANGEL_NUMBERS } from "../data/angelNumbers";

export function registerSeoRoutes(app: Express) {
  // ─── Sitemap.xml (bilingual with hreflang) ─────────────────────────────
  app.get("/sitemap.xml", (req, res) => {
    const isEnHost = req.hostname.includes("chart.app") || req.hostname.includes("default") || req.hostname.includes("localhost");
    const csBase = "https://www.humandesignmapa.cz";
    const enBase = "https://www.humandesignchart.app";
    const now = new Date().toISOString().split("T")[0];

    const staticPages = [
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
      { loc: "/pricing", priority: "0.6", changefreq: "monthly" },
      { loc: "/human-design-kalkulacka", priority: "0.9", changefreq: "monthly" },
      { loc: "/human-design-test", priority: "0.8", changefreq: "monthly" },
      { loc: "/human-design-typy", priority: "0.8", changefreq: "monthly" },
      { loc: "/andelska-cisla", priority: "0.9", changefreq: "weekly" },
    ];

    const generateUrlNode = (locUrl: string, csAlt: string, enAlt: string, changefreq: string, priority: string, lastmod: string) => {
      const alternates = [
        `    <xhtml:link rel="alternate" hreflang="cs" href="${csAlt}" />`,
        `    <xhtml:link rel="alternate" hreflang="en" href="${enAlt}" />`,
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${enAlt}" />`
      ].join("\n");
      return `  <url>\n    <loc>${locUrl}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n${alternates}\n  </url>`;
    };

    const sitemapNodes: string[] = [];

    staticPages.forEach(p => {
      const csUrl = csBase + (p.loc === "/" ? "/cs/" : "/cs" + p.loc);
      const enUrl = enBase + (p.loc === "/" ? "/en/" : "/en" + p.loc);
      if (isEnHost) sitemapNodes.push(generateUrlNode(enUrl, csUrl, enUrl, p.changefreq, p.priority, now));
      else sitemapNodes.push(generateUrlNode(csUrl, csUrl, enUrl, p.changefreq, p.priority, now));
    });

    const maxLen = Math.max(BLOG_ARTICLES.length, BLOG_ARTICLES_EN.length);
    for (let i = 0; i < maxLen; i++) {
      const csArt = BLOG_ARTICLES[i];
      const enArt = BLOG_ARTICLES_EN[i];
      const csLastMod = csArt?.updatedAt || csArt?.publishedAt || now;
      const enLastMod = enArt?.updatedAt || enArt?.publishedAt || now;
      const lastMod = isEnHost ? enLastMod : csLastMod;
      if (isEnHost && enArt) {
        const csUrl = `${csBase}/cs/blog/${csArt?.slug || ""}`;
        const enUrl = `${enBase}/en/blog/${enArt.slug}`;
        sitemapNodes.push(generateUrlNode(enUrl, csUrl, enUrl, "monthly", "0.8", lastMod));
      } else if (!isEnHost && csArt) {
        const csUrl = `${csBase}/cs/blog/${csArt.slug}`;
        const enUrl = `${enBase}/en/blog/${enArt?.slug || ""}`;
        sitemapNodes.push(generateUrlNode(csUrl, csUrl, enUrl, "monthly", "0.8", lastMod));
      }
    }

    ANGEL_NUMBERS.forEach(article => {
      const csUrl = `${csBase}/cs/andelska-cisla/${article.slug}`;
      const enUrl = `${enBase}/en/andelska-cisla/${article.slug}`;
      const locUrl = isEnHost ? enUrl : csUrl;
      sitemapNodes.push(generateUrlNode(locUrl, csUrl, enUrl, "weekly", "0.7", article.updatedAt || now));
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${sitemapNodes.join("\n")}\n</urlset>`;
    res.set("Content-Type", "application/xml");
    res.send(xml);
  });

  // ─── robots.txt ────────────────────────────────────────────────────────
  app.get("/robots.txt", (req, res) => {
    res.type("text/plain");
    const isEnHost = req.hostname.includes("chart.app") || req.hostname.includes("default");
    const domain = isEnHost ? "https://www.humandesignchart.app" : "https://www.humandesignmapa.cz";
    res.send(
      `User-agent: *\n` +
      `Allow: /\n` +
      `Disallow: /api/\n` +
      `Disallow: /embed/\n` +
      `Disallow: /shared/\n` +
      `Disallow: /admin/\n` +
      `Disallow: /dashboard\n` +
      `Disallow: /payment/\n` +
      `Disallow: /*?*\n` +
      `Disallow: /refer/\n` +
      `Crawl-Delay: 10\n` +
      `\n` +
      `Sitemap: ${domain}/sitemap.xml\n` +
      `\n` +
      `# Search engines: index all public-facing content\n` +
      `User-agent: Googlebot\n` +
      `Allow: /\n` +
      `Disallow: /api/\n` +
      `Disallow: /embed/\n` +
      `Disallow: /shared/\n` +
      `Disallow: /admin/\n` +
      `Disallow: /dashboard\n` +
      `Disallow: /payment/\n` +
      `Disallow: /refer/\n` +
      `Crawl-Delay: 5\n` +
      `\n` +
      `User-agent: Bingbot\n` +
      `Allow: /\n` +
      `Disallow: /api/\n` +
      `Disallow: /embed/\n` +
      `Disallow: /shared/\n` +
      `Disallow: /admin/\n` +
      `Disallow: /dashboard\n` +
      `Disallow: /payment/\n` +
      `Crawl-Delay: 5\n`
    );
  });
}
