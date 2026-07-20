const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'server/_core/index.ts');
let content = fs.readFileSync(filePath, 'utf8');

const sitemapStart = content.indexOf('app.get("/sitemap.xml",');
const sitemapEndStr = '  });\n  // ─── SEO: robots.txt';
let sitemapEnd = content.indexOf(sitemapEndStr, sitemapStart);

if (sitemapStart !== -1 && sitemapEnd !== -1) {
    const newBlock = `app.get("/sitemap.xml", (req, res) => {
    const isEnHost = req.hostname.includes("chart.app") || req.hostname.includes("default") || req.hostname.includes("localhost");
    const csBase = "https://www.humandesignmapa.cz";
    const enBase = "https://www.humandesignchart.app";
    const now = new Date().toISOString().split("T")[0];

    const staticPages = [
      { loc: "/", priority: "1.0", changefreq: "weekly" },
      { loc: "/calculate", priority: "0.9", changefreq: "monthly" },
      { loc: "/encyclopedia", priority: "0.8", changefreq: "monthly" },
      { loc: "/ai-guide", priority: "0.7", changefreq: "monthly" },
      { loc: "/transits", priority: "0.7", changefreq: "daily" },
      { loc: "/transit-calendar", priority: "0.6", changefreq: "daily" },
      { loc: "/celebrities", priority: "0.7", changefreq: "monthly" },
      { loc: "/compare", priority: "0.6", changefreq: "monthly" },
      { loc: "/composite", priority: "0.6", changefreq: "monthly" },
      { loc: "/role-compatibility", priority: "0.6", changefreq: "monthly" },
      { loc: "/return-chart", priority: "0.6", changefreq: "monthly" },
      { loc: "/variables", priority: "0.6", changefreq: "monthly" },
      { loc: "/iching", priority: "0.6", changefreq: "monthly" },
      { loc: "/types/generator", priority: "0.8", changefreq: "monthly" },
      { loc: "/types/manifesting-generator", priority: "0.8", changefreq: "monthly" },
      { loc: "/types/projector", priority: "0.8", changefreq: "monthly" },
      { loc: "/types/manifestor", priority: "0.8", changefreq: "monthly" },
      { loc: "/types/reflector", priority: "0.8", changefreq: "monthly" },
      { loc: "/blog", priority: "0.8", changefreq: "weekly" },
      { loc: "/daily-transit", priority: "0.6", changefreq: "daily" },
      { loc: "/incarnation-cross", priority: "0.6", changefreq: "monthly" },
      { loc: "/pricing", priority: "0.7", changefreq: "monthly" },
      { loc: "/human-design-kalkulacka", priority: "0.8", changefreq: "monthly" },
      { loc: "/human-design-test", priority: "0.7", changefreq: "monthly" },
      { loc: "/human-design-typy", priority: "0.7", changefreq: "monthly" },
      { loc: "/andelska-cisla", priority: "0.8", changefreq: "weekly" },
    ];

    const generateUrlNode = (locUrl, csAlt, enAlt, changefreq, priority, lastmod) => {
      const alternates = [
        \`    <xhtml:link rel="alternate" hreflang="cs" href="\${csAlt}" />\`,
        \`    <xhtml:link rel="alternate" hreflang="en" href="\${enAlt}" />\`,
        \`    <xhtml:link rel="alternate" hreflang="x-default" href="\${enAlt}" />\`
      ].join("\\n");
      return \`  <url>\\n    <loc>\${locUrl}</loc>\\n    <lastmod>\${lastmod}</lastmod>\\n    <changefreq>\${changefreq}</changefreq>\\n    <priority>\${priority}</priority>\\n\${alternates}\\n  </url>\`;
    };

    const sitemapNodes = [];

    // 1. Static Pages
    staticPages.forEach(p => {
      const csUrl = csBase + (p.loc === "/" ? "/cs/" : "/cs" + p.loc);
      const enUrl = enBase + (p.loc === "/" ? "/en/" : "/en" + p.loc);
      if (isEnHost) sitemapNodes.push(generateUrlNode(enUrl, csUrl, enUrl, p.changefreq, p.priority, now));
      else sitemapNodes.push(generateUrlNode(csUrl, csUrl, enUrl, p.changefreq, p.priority, now));
    });

    // 2. Blog URLs
    const maxLen = Math.max(BLOG_ARTICLES.length, BLOG_ARTICLES_EN.length);
    for (let i = 0; i < maxLen; i++) {
      const csArt = BLOG_ARTICLES[i];
      const enArt = BLOG_ARTICLES_EN[i];
      const csUrl = csArt ? \`\${csBase}/cs/blog/\${csArt.slug}\` : \`\${csBase}/cs/blog\`;
      const enUrl = enArt ? \`\${enBase}/en/blog/\${enArt.slug}\` : \`\${enBase}/en/blog\`;
      if (isEnHost && enArt) sitemapNodes.push(generateUrlNode(enUrl, csUrl, enUrl, "monthly", "0.7", now));
      else if (!isEnHost && csArt) sitemapNodes.push(generateUrlNode(csUrl, csUrl, enUrl, "monthly", "0.7", now));
    }

    // 3. Angel Numbers
    ANGEL_NUMBERS.forEach(article => {
      const csUrl = \`\${csBase}/cs/andelska-cisla/\${article.slug}\`;
      const enUrl = \`\${enBase}/en/andelska-cisla/\${article.slug}\`;
      const locUrl = isEnHost ? enUrl : csUrl;
      sitemapNodes.push(generateUrlNode(locUrl, csUrl, enUrl, "monthly", "0.6", article.updatedAt || now));
    });

    const xml = \`<?xml version="1.0" encoding="UTF-8"?>\\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\\n\${sitemapNodes.join("\\n")}\\n</urlset>\`;
    res.set("Content-Type", "application/xml");
    res.send(xml);
  });
`;

    content = content.substring(0, sitemapStart) + newBlock + content.substring(sitemapEnd + 4);

    // Fix robots.txt block as well
    content = content.replace(
        'app.get("/robots.txt", (_req, res) => {\n    res.type("text/plain");\n    res.send("User-agent: *\\nAllow: /\\nDisallow: /api/\\nSitemap: https://www.humandesignmapa.cz/sitemap.xml");\n  });',
        'app.get("/robots.txt", (req, res) => {\n    const isEnHost = req.hostname.includes("chart.app") || req.hostname.includes("default");\n    const domain = isEnHost ? "https://www.humandesignchart.app" : "https://www.humandesignmapa.cz";\n    res.type("text/plain");\n    res.send(`User-agent: *\\nAllow: /\\nDisallow: /api/\\nSitemap: ${domain}/sitemap.xml`);\n  });'
    );

    // Re-read because replace with newline logic varies. Let's do regex with \r?\n fallback
    content = content.replace(
        /app\.get\("\/robots\.txt", \(_req, res\) => \{\s+res\.type\("text\/plain"\);\s+res\.send\("User-agent: \*\\nAllow: \/\\nDisallow: \/api\/\\nSitemap: https:\/\/www\.humandesignmapa\.cz\/sitemap\.xml"\);\s+\}\);/,
        `app.get("/robots.txt", (req, res) => {
    const isEnHost = req.hostname.includes("chart.app") || req.hostname.includes("default");
    const domain = isEnHost ? "https://www.humandesignchart.app" : "https://www.humandesignmapa.cz";
    res.type("text/plain");
    res.send(\`User-agent: *\\nAllow: /\\nDisallow: /api/\\nSitemap: \${domain}/sitemap.xml\`);
  });`
    );

    fs.writeFileSync(filePath, content, 'utf8');
    console.log("Success");
} else {
    console.error("Could not find blocks:", sitemapStart, sitemapEnd);
}
