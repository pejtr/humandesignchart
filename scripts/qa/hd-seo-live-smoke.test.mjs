import { test } from "node:test";
import assert from "node:assert/strict";
import { runSeoLiveSmoke } from "./hd-seo-live-smoke.mjs";

function fakeFetch({ missing404 = true, hasH1 = true, badSitemap = false } = {}) {
  return async raw => {
    const url = new URL(raw);
    const en = url.hostname === "humandesignchart.app";
    const base = url.origin;
    const locale = en ? "en" : "cs";
    const home = "/" + locale + "/";
    const calc = en ? "/en/calculate" : "/cs/human-design-kalkulacka";
    if (url.pathname === home) {
      const body = '<!doctype html><html><head><link rel="canonical" href="' + base + home +
        '"></head><body><main data-initial-seo-content="public">' +
        (hasH1 ? "<h1>Chart</h1>" : "<p>No heading</p>") + "</main></body></html>";
      return new Response(body, { status: 200, headers: { "content-type": "text/html" } });
    }
    if (url.pathname === "/sitemap.xml") {
      const xml = '<?xml version="1.0"?><urlset xmlns:xhtml="http://www.w3.org/1999/xhtml">' +
        "<loc>" + base + (badSitemap ? "/wrong" : calc) + "</loc></urlset>";
      return new Response(xml, { status: 200, headers: { "content-type": "application/xml" } });
    }
    if (url.pathname === "/robots.txt") {
      return new Response("User-agent: *\nAllow: /\nSitemap: " + base + "/sitemap.xml", {
        status: 200, headers: { "content-type": "text/plain" },
      });
    }
    if (url.pathname.includes("/blog/nonexistent")) {
      return new Response("Missing", {
        status: missing404 ? 404 : 200,
        headers: { "content-type": "text/html", "x-robots-tag": missing404 ? "noindex, nofollow" : "" },
      });
    }
    throw new Error("Unexpected URL " + raw);
  };
}
test("SEO release smoke validates all public brand routes with no write operations", async () => {
  const report = await runSeoLiveSmoke(fakeFetch());
  assert.equal(report.pass, true, report.failed.join(","));
  assert.equal(report.checks.length, 24);
  assert.deepEqual(report.failed, []);
});
test("fail closed when a published page has only empty SPA HTML", async () => {
  const report = await runSeoLiveSmoke(fakeFetch({ hasH1: false }));
  assert.equal(report.pass, false);
  assert.ok(report.failed.includes("en.home.initialH1"));
  assert.ok(report.failed.includes("cs.home.initialH1"));
});
test("fail closed on soft 404 after a broken or old Cloudflare deploy", async () => {
  const report = await runSeoLiveSmoke(fakeFetch({ missing404: false }));
  assert.equal(report.pass, false);
  assert.ok(report.failed.includes("en.unknownArticle.real404"));
});
test("fail closed when Cloudflare serves stale or malformed sitemap", async () => {
  const report = await runSeoLiveSmoke(fakeFetch({ badSitemap: true }));
  assert.equal(report.pass, false);
  assert.ok(report.failed.includes("en.sitemap.canonicalCalculator"));
});
