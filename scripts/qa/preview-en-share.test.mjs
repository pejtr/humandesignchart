import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { previewOrigin, assertIsolatedProject, assertSharePng, probePreview } from "./preview-en-share.mjs";

test("accepts only an isolated project subdomain, never the project production origin", () => {
  assert.equal(previewOrigin("https://abc123.humandesignchart-web.pages.dev/"), "https://abc123.humandesignchart-web.pages.dev");
  for (const url of ["https://humandesignchart.app", "https://humandesignchart-web.pages.dev", "https://main.humandesignchart-web.pages.dev", "https://production.humandesignchart-web.pages.dev", "http://abc.humandesignchart-web.pages.dev", "https://abc.humandesignchart-web.pages.dev/en", "https://abc.humandesignchart-web.pages.dev/?x=1", "https://abc.humandesignchart-web.pages.dev.evil.example", "https://user:pass@abc.humandesignchart-web.pages.dev", "https://nested.abc.humandesignchart-web.pages.dev"]) {
    assert.throws(() => previewOrigin(url));
  }
});

const project = () => ({ name: "humandesignchart-web", production_branch: "main", deployment_configs: { production: {}, preview: { env_vars: {} } } });
test("fails closed on any preview backend binding or secret", () => {
  assert.doesNotThrow(() => assertIsolatedProject(project()));
  for (const key of ["d1_databases", "kv_namespaces", "r2_buckets", "services", "queue_producers", "durable_object_namespaces"]) {
    const p = project(); p.deployment_configs.preview[key] = { BACKEND: { id: "resource" } };
    assert.throws(() => assertIsolatedProject(p), /binding/);
  }
  for (const key of ["GOOGLE_CLIENT_SECRET", "STRIPE_SECRET_KEY", "JWT_SECRET", "DATABASE_URL", "RESEND_API_KEY"]) {
    const p = project(); p.deployment_configs.preview.env_vars[key] = { type: "plain_text", value: "set" };
    assert.throws(() => assertIsolatedProject(p), /environment/);
  }
  const p = project(); p.deployment_configs.preview.env_vars.CUSTOM = { type: "secret_text" };
  assert.throws(() => assertIsolatedProject(p));
  assert.throws(() => assertIsolatedProject({}));
});

function png() {
  const bytes = Buffer.alloc(11000);
  Buffer.from([137,80,78,71,13,10,26,10]).copy(bytes);
  bytes.writeUInt32BE(1200, 16); bytes.writeUInt32BE(630, 20);
  return bytes;
}
test("checks PNG signature, dimensions and the sharing size budget", () => {
  assert.doesNotThrow(() => assertSharePng(png()));
  const invalid = png(); invalid[0] = 0;
  assert.throws(() => assertSharePng(invalid), /signature/);
  const wrongSize = png(); wrongSize.writeUInt32BE(600, 16);
  assert.throws(() => assertSharePng(wrongSize), /1200/);
  assert.throws(() => assertSharePng(Buffer.alloc(600000)), /size/);
});

test("release and unknown CLI flags fail before running build or deployment", () => {
  for (const flag of ["--release", "-Release", "--production", "--branch=main"]) {
    const result = spawnSync(process.execPath, ["scripts/qa/preview-en-share.mjs", flag], { encoding: "utf8", timeout: 5000 });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /preview-only/);
  }
});

test("crawler probe rejects a production URL before any network call", async () => {
  const fetcher = async () => { throw new Error("off-origin response must not be followed"); };
  // A production hostname must be rejected before any network call.
  await assert.rejects(() => probePreview("https://humandesignchart.app", fetcher), /isolated/);
});

function fixture(origin, locale) {
  const image = `${origin}/images/og-home-${locale}-share-v2.png`;
  return `<html><head><meta property="og:title" content="Chart"><meta property="og:description" content="Free chart"><meta property="og:url" content="${origin}/${locale}"><meta property="og:image" content="${image}"><meta property="og:image:secure_url" content="${image}"><meta name="twitter:image" content="${image}"><meta name="robots" content="noindex,nofollow"></head></html>`;
}
test("fetches both localized cards with both crawler UAs", async () => {
  const origin = "https://abc.humandesignchart-web.pages.dev";
  const requests = [];
  const evidence = await probePreview(origin, async (url, options) => {
    requests.push({ url, ua: options.headers["User-Agent"], redirect: options.redirect });
    const image = url.endsWith(".png");
    return new Response(image ? png() : fixture(origin, url.endsWith("/cs") ? "cs" : "en"), { headers: { "content-type": image ? "image/png" : "text/html" } });
  });
  assert.equal(evidence.length, 4);
  assert.deepEqual(evidence.map(x => [x.locale, x.ua]), [["en", "facebookexternalhit/1.1"], ["en", "WhatsApp/2.24"], ["cs", "facebookexternalhit/1.1"], ["cs", "WhatsApp/2.24"]]);
  assert.equal(requests.length, 8);
  assert.ok(requests.every(x => x.redirect === "error"));
});
test("rejects redirects, stale production metadata and invalid remote PNG bytes", async () => {
  const origin = "https://abc.humandesignchart-web.pages.dev";
  await assert.rejects(() => probePreview(origin, async () => new Response(null, { status: 302 })), /status/);
  await assert.rejects(() => probePreview(origin, async () => new Response(fixture("https://humandesignchart.app", "en"), { headers: { "content-type": "text/html" } })), /preview/);
  await assert.rejects(() => probePreview(origin, async url => new Response(url.endsWith(".png") ? Buffer.alloc(11000) : fixture(origin, "en"), { headers: { "content-type": url.endsWith(".png") ? "image/png" : "text/html" } })), /signature/);
});
