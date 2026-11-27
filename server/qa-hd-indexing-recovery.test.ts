import { describe, expect, it } from "vitest";
import worker from "../workers/pages-api";
import { withServerRenderedSeoMeta } from "../workers/social-meta";
import { initialPublicHtml } from "../workers/seo-static-content";
import { buildSeoHead } from "./_core/seoMeta";
import { BLOG_ARTICLES } from "./data/blogArticles";
import { BLOG_ARTICLES_EN } from "./data/blogArticlesEn";
import { canonicalPublicUrl } from "../client/src/hooks/useSEO";

const shell = '<!doctype html><html lang="cs"><head><!--SEO_META--></head><body><div id="root"></div></body></html>';
const assets = { fetch: async () => new Response(shell, {
  headers: { "content-type": "text/html", "etag": "previous", "content-length": "100" },
}) };
const host = "https://humandesignchart.app";
const env = { ASSETS: assets } as any;

describe("P0 human-design EN / CZ indexing repair", () => {
  it("returns a crawlable visible H1 and real links for both official homepages", async () => {
    for (const [url, locale] of [
      ["https://humandesignchart.app/en/", "en"],
      ["https://humandesignmapa.cz/cs/", "cs"],
    ]) {
      const response = await withServerRenderedSeoMeta(new URL(url), await assets.fetch());
      const html = await response.text();
      expect(html).toContain('data-initial-seo-content="public"');
      expect(html).toContain('<h1>');
      expect(html).toContain('<nav');
      expect(html).toContain('href="/' + locale + '/blog"');
      expect(html).not.toContain("<!--SEO_META-->");
      expect(response.headers.get("content-language")).toBe(locale);
      expect(response.headers.get("etag")).toBeNull();
    }
  });

  it("initial HTML contains actual English article copy, not just a blank app shell", async () => {
    const art = BLOG_ARTICLES_EN.find(a => a.slug === "what-is-human-design") || BLOG_ARTICLES_EN[0];
    const url = new URL(host + "/en/blog/" + art.slug);
    const page = await withServerRenderedSeoMeta(url, await assets.fetch());
    const html = await page.text();
    expect(html).toContain("<h1>" + art.title.slice(0, 14));
    expect(html).toContain(art.excerpt.slice(0, 30));
    expect(html).toContain("data-initial-seo-content");
    expect(html.indexOf("data-initial-seo-content")).toBeGreaterThan(html.indexOf("<body>"));
  });

  it("does not leak any crawled fallback into login, account, payment, or unknown pages", async () => {
    for (const path of ["/en/login", "/en/account", "/en/payment/success",
      "/en/dashboard", "/en/portal", "/api/oauth/callback/google",
      "/en/blog/this-is-not-published", "/en/unknown"]) {
      expect(initialPublicHtml(new URL(host + path))).toBeNull();
    }
    const result = await withServerRenderedSeoMeta(new URL(host + "/en/login"), await assets.fetch());
    expect(result.headers.get("x-robots-tag")).toContain("noindex");
  });

  it("normalizes www, locale homepages, and calculator aliases to one canonical each", () => {
    expect(canonicalPublicUrl("https://www.humandesignchart.app/en/human-design-kalkulacka?utm=bad"))
      .toBe("https://humandesignchart.app/en/calculate");
    expect(canonicalPublicUrl("https://www.humandesignmapa.cz/cs/calculate"))
      .toBe("https://humandesignmapa.cz/cs/human-design-kalkulacka");
    expect(canonicalPublicUrl("https://humandesignchart.app/"))
      .toBe("https://humandesignchart.app/en/");
    expect(canonicalPublicUrl("https://www.humandesignmapa.cz/cs"))
      .toBe("https://humandesignmapa.cz/cs/");
  });

  it("server canonical for both calculator aliases equals the JS canonical", () => {
    for (const [locale, path, expected] of [
      ["cs", "/cs/calculate", "https://humandesignmapa.cz/cs/human-design-kalkulacka"],
      ["cs", "/cs/human-design-kalkulacka", "https://humandesignmapa.cz/cs/human-design-kalkulacka"],
      ["en", "/en/calculate", "https://humandesignchart.app/en/calculate"],
      ["en", "/en/human-design-kalkulacka", "https://humandesignchart.app/en/calculate"],
    ]) {
      expect(buildSeoHead(locale, path)).toContain('rel="canonical" href="' + expected + '"');
    }
  });

  it("does not invent a Czech translation for an English-only blog article", () => {
    const unpaired = BLOG_ARTICLES_EN.find(a => !BLOG_ARTICLES.some(b => b.slug === a.slug));
    expect(unpaired).toBeDefined();
    const head = buildSeoHead("en", "/en/blog/" + unpaired!.slug);
    expect(head).toContain('rel="canonical" href="https://humandesignchart.app/en/blog/' + unpaired!.slug);
    expect(head).not.toContain('hreflang="cs"');
  });

  it("sitemap lists only canonical English calculator, no Czech-only angel catalog", async () => {
    const response = await worker.fetch(new Request(host + "/sitemap.xml"), env);
    const xml = await response.text();
    expect(response.status).toBe(200);
    expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
    expect(xml).toContain("<loc>https://humandesignchart.app/en/calculate</loc>");
    expect(xml).not.toContain("<loc>https://humandesignchart.app/en/human-design-kalkulacka</loc>");
    expect(xml).not.toContain("<loc>https://humandesignchart.app/en/andelska-cisla</loc>");
    expect(xml).toContain('hreflang="cs" href="https://humandesignmapa.cz/cs/human-design-kalkulacka"');
  });

  it("sitemap lists only canonical Czech calculator and does not invent English angel alternates", async () => {
    const response = await worker.fetch(new Request("https://humandesignmapa.cz/sitemap.xml"), env);
    const xml = await response.text();
    expect(response.status).toBe(200);
    expect(xml).toContain("<loc>https://humandesignmapa.cz/cs/human-design-kalkulacka</loc>");
    expect(xml).not.toContain("<loc>https://humandesignmapa.cz/cs/calculate</loc>");
    expect(xml).toContain("<loc>https://humandesignmapa.cz/cs/andelska-cisla</loc>");
    expect(xml).not.toContain('hreflang="en" href="https://humandesignchart.app/en/andelska-cisla"');
  });

  it("fake editorial URL is a real HTTP 404 with noindex, but published article returns 200", async () => {
    const unknown = await worker.fetch(new Request(host + "/en/blog/unknown-2026"), env);
    expect(unknown.status).toBe(404);
    expect(unknown.headers.get("x-robots-tag")).toContain("noindex");
    const known = await worker.fetch(new Request(host + "/en/blog/" + BLOG_ARTICLES_EN[0].slug), env);
    expect(known.status).toBe(200);
    expect(await known.text()).toContain("data-initial-seo-content");
  });

  it("Czech-only angel content on English host does not enter Google index", async () => {
    const result = await worker.fetch(new Request(host + "/en/andelska-cisla"), env);
    expect(result.headers.get("x-robots-tag")).toContain("noindex");
  });
});

describe("permanent public alias consolidation", () => {
  it.each([
    ["https://humandesignchart.app/en/human-design-kalkulacka?funnel=free&utm_source=chatgpt&oppref=test", "/en/calculate?funnel=free&utm_source=chatgpt&oppref=test"],
    ["https://humandesignmapa.cz/cs/calculate?ref=partner&mode=partner", "/cs/human-design-kalkulacka?ref=partner&mode=partner"],
    ["https://humandesignchart.app/calculate", "/en/calculate"],
    ["https://humandesignmapa.cz/cs/cenik?next=blueprint", "/cs/honorace?next=blueprint"],
    ["https://humandesignchart.app/en/pricing", "/en/honorace"],
    ["https://humandesignchart.app/en/calculate/", "/en/calculate"],
  ])("returns a single 301 for %s", async (url, target) => {
    const response = await worker.fetch(new Request(url), env);
    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe(target);
    expect((await worker.fetch(new Request(new URL(target, url)), env)).status).toBe(200);
  });

  it("preserves canonical acquisition URLs and leaves preview and private routes untouched", async () => {
    for (const url of [
      host + "/en/calculate?funnel=free&utm_source=chatgpt",
      host + "/en/payment/success?refId=test",
      host + "/en/login",
      "https://hd-revenue-preview.humandesignchart-web.pages.dev/en/human-design-kalkulacka",
      host + "/cs/calculate",
    ]) {
      const result = await worker.fetch(new Request(url), env);
      expect(result.status).not.toBe(301);
    }
    const post = await worker.fetch(new Request(host + "/en/pricing", { method: "POST" }), env);
    expect(post.status).not.toBe(301);
  });

  it("aligns canonical pricing and trailing-slash calculator metadata", () => {
    for (const [locale, url, expected] of [
      ["en", host + "/en/pricing", host + "/en/honorace"],
      ["en", host + "/en/cenik/", host + "/en/honorace"],
      ["en", host + "/en/human-design-kalkulacka/", host + "/en/calculate"],
      ["cs", "https://humandesignmapa.cz/cs/calculate/", "https://humandesignmapa.cz/cs/human-design-kalkulacka"],
    ]) {
      const html = buildSeoHead(locale, new URL(url).pathname);
      expect(html).toContain('rel="canonical" href="' + expected + '"');
      expect(canonicalPublicUrl(url)).toBe(expected);
      if (expected.endsWith("/honorace")) expect(html).toContain('hreflang="en" href="https://humandesignchart.app/en/honorace"');
    }
  });
});
