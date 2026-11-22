#!/usr/bin/env node
/**
 * Read-only post-release SEO smoke, against branded production domains.
 * Never changes GSC, Cloudflare, user accounts, paid orders, or DNS.
 */
import { pathToFileURL } from "node:url";

export const TARGETS = [
  { base: "https://humandesignmapa.cz", locale: "cs", canonical: "/cs/", calculator: "/cs/human-design-kalkulacka" },
  { base: "https://humandesignchart.app", locale: "en", canonical: "/en/", calculator: "/en/calculate" },
];
const get = async (url, fetcher) => {
  try {
    const response = await fetcher(url, {
      method: "GET", redirect: "follow", cache: "no-store",
      headers: { accept: "text/html,application/xml,text/plain" },
      signal: AbortSignal.timeout(12000),
    });
    return { status: response.status, type: response.headers.get("content-type") || "",
      robotsHeader: response.headers.get("x-robots-tag") || "",
      text: await response.text() };
  } catch { return { status: 0, type: "", robotsHeader: "", text: "" }; }
};
const add = (checks, name, ok) => checks.push({ check: name, pass: Boolean(ok) });
export async function runSeoLiveSmoke(fetcher = fetch) {
  const checks = [];
  for (const target of TARGETS) {
    const { base, canonical, calculator } = target;
    const homepage = await get(base + canonical, fetcher);
    add(checks, target.locale + ".home.http200", homepage.status === 200 &&
      homepage.type.includes("text/html"));
    add(checks, target.locale + ".home.initialH1", homepage.text.includes("<h1>") &&
      homepage.text.includes('data-initial-seo-content="public"'));
    add(checks, target.locale + ".home.canonical", homepage.text.includes(
      'rel="canonical" href="' + base + canonical + '"'));
    add(checks, target.locale + ".home.indexable", !/noindex/i.test(homepage.robotsHeader));

    const sitemap = await get(base + "/sitemap.xml", fetcher);
    add(checks, target.locale + ".sitemap.http200", sitemap.status === 200 &&
      /xml/i.test(sitemap.type));
    add(checks, target.locale + ".sitemap.canonicalCalculator",
      sitemap.text.includes("<loc>" + base + calculator + "</loc>"));
    add(checks, target.locale + ".sitemap.namespace",
      sitemap.text.includes('xmlns:xhtml="http://www.w3.org/1999/xhtml"'));
    if (target.locale === "en") {
      add(checks, "en.sitemap.noLegacyCalculator",
        !sitemap.text.includes("<loc>" + base + "/en/human-design-kalkulacka</loc>"));
    } else {
      add(checks, "cs.sitemap.noLegacyCalculator",
        !sitemap.text.includes("<loc>" + base + "/cs/calculate</loc>"));
    }

    const robots = await get(base + "/robots.txt", fetcher);
    add(checks, target.locale + ".robots.http200", robots.status === 200);
    add(checks, target.locale + ".robots.sitemap",
      robots.text.includes("Sitemap: " + base + "/sitemap.xml"));
    const missing = await get(base + "/" + target.locale +
      "/blog/nonexistent-article-indexing-probe-20990101", fetcher);
    add(checks, target.locale + ".unknownArticle.real404", missing.status === 404);
    add(checks, target.locale + ".unknownArticle.noindex", /noindex/i.test(missing.robotsHeader));
  }
  return { pass: checks.every(c => c.pass), checks, failed: checks.filter(c => !c.pass).map(c => c.check) };
}
async function main() {
  const report = await runSeoLiveSmoke();
  // No response body or other potentially sensitive data is ever printed.
  for (const row of report.checks) console.log((row.pass ? "PASS " : "FAIL ") + row.check);
  console.log("SEO_RELEASE_SMOKE " + (report.pass ? "PASS" : "FAIL") +
    " " + report.checks.filter(c => c.pass).length + "/" + report.checks.length);
  process.exitCode = report.pass ? 0 : 1;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(() => { console.error("SEO_RELEASE_SMOKE_ERROR"); process.exitCode = 1; });
}
