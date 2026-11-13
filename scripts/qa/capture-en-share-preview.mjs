/**
 * Read-only production-like browser QA for PR #87 on isolated Cloudflare Pages.
 * No login, calculation, checkout, real orders, edits or publish actions.
 * Usage:
 *   HD_EN_PREVIEW_URL=https://<preview>.humandesignchart-web.pages.dev node scripts/qa/capture-en-share-preview.mjs
 *
 * Operator must already have Playwright + Chromium installed in their local QA env.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const raw = process.env.HD_EN_PREVIEW_URL;
if (!raw) throw new Error("Set HD_EN_PREVIEW_URL to the exact approved isolated Pages preview URL.");
const base = new URL(raw);
if (
  base.protocol !== "https:" ||
  !(
    base.hostname === "humandesignchart-web.pages.dev" ||
    base.hostname.endsWith(".humandesignchart-web.pages.dev")
  ) ||
  !["", "/"].includes(base.pathname) ||
  base.search || base.hash || base.port || base.username || base.password
) {
  throw new Error("Refusing to run on production, localhost or an unknown Pages project.");
}

let chromium;
try { ({ chromium } = await import("playwright")); }
catch {
  throw new Error("Playwright not installed in the local QA environment (no production dependency added).");
}

const outputDir = resolve(process.cwd(), "qa-artifacts", "p0-en-sticky-whatsapp");
mkdirSync(outputDir, { recursive: true });
const report = {
  commit: process.env.GIT_SHA || "not-provided",
  origin: base.origin,
  checkedAt: new Date().toISOString(),
  images: [],
  screenshots: [],
  failures: [],
  consoleErrors: [],
  requestFailures: [],
};

const assert = (ok, msg) => { if (!ok) throw new Error(msg); };
const pageURL = new URL("/en", base).toString();
const asset = await fetch(pageURL, {
  headers: { "User-Agent": "facebookexternalhit/1.1", Accept: "text/html" },
  signal: AbortSignal.timeout(25_000),
});
assert(asset.ok, "Preview HTML returned " + asset.status);
const html = await asset.text();
const imageTag = html.match(/<meta property="og:image" content="([^"]+)"\s*\/?>/i);
assert(imageTag, "Server-rendered og:image not found before JavaScript.");
const imageURL = new URL(imageTag[1]);
assert(imageURL.origin === base.origin, "Preview og:image unexpectedly points to production.");
assert(html.includes('name="robots" content="noindex,nofollow"'), "Pages preview must be noindex.");
assert(html.includes('property="og:url" content="' + pageURL + '"'), "Preview og:url unexpectedly points to production.");
const imageResponse = await fetch(imageURL, { signal: AbortSignal.timeout(25_000) });
assert(imageResponse.ok, "Preview OG PNG returned " + imageResponse.status);
assert((imageResponse.headers.get("content-type") || "").startsWith("image/png"), "Preview image is not image/png.");
const bytes = new Uint8Array(await imageResponse.arrayBuffer());
assert(bytes.length >= 10_000 && bytes.length < 600_000, "Preview OG PNG outside 10-600KB target.");
const view = new DataView(bytes.buffer);
assert(view.getUint32(16) === 1200 && view.getUint32(20) === 630, "Preview OG PNG not 1200x630.");
report.images.push({ url: imageURL.href, bytes: bytes.length, dimensions: "1200x630" });

const browser = await chromium.launch({ headless: true });
try {
  for (const viewport of [
    { tag: "m360", width: 360, height: 800 },
    { tag: "m390", width: 390, height: 844 },
    { tag: "tablet768", width: 768, height: 1024 },
    { tag: "desktop1440", width: 1440, height: 900 },
    { tag: "4k3840", width: 3840, height: 2160 },
  ]) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    page.on("pageerror", e => report.consoleErrors.push(viewport.tag + " pageerror " + e.message));
    page.on("console", e => { if (e.type() === "error") report.consoleErrors.push(viewport.tag + " console " + e.text()); });
    page.on("requestfailed", req => report.requestFailures.push(viewport.tag + " " + req.url()));

    try {
      const response = await page.goto(pageURL, { waitUntil: "domcontentloaded", timeout: 45_000 });
      assert(response?.status() === 200, viewport.tag + " page returned " + response?.status());
      const header = page.locator('[data-testid="premium-en-sticky-header"]');
      await header.waitFor({ state: "visible", timeout: 30_000 });
      const brandLink = header.getByRole("link", { name: "Human Design Chart — home" });
      assert(await brandLink.count() === 1, viewport.tag + " logo/home missing");
      const newChart = page.getByRole("link", { name: /Get My Free Chart/i }).first();
      assert((await newChart.getAttribute("href"))?.includes("/calculate"), viewport.tag + " primary CTA malformed");
      if (viewport.width < 1024) {
        const opener = header.locator('summary[aria-label="Open main navigation"]');
        await opener.click();
        assert(await header.getByRole("navigation", { name: "Mobile navigation" }).isVisible(), viewport.tag + " mobile menu hidden");
        assert(await header.getByRole("link", { name: "Pricing" }).count() === 1, viewport.tag + " mobile pricing missing");
        await opener.click();
      } else {
        assert(await header.getByRole("navigation", { name: "Desktop navigation" }).isVisible(), viewport.tag + " desktop nav missing");
      }
      const before = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      assert(before <= 2, viewport.tag + " horizontal overflow before scrolling: " + before);
      await page.screenshot({ path: resolve(outputDir, viewport.tag + "-top.png"), fullPage: true });
      report.screenshots.push(viewport.tag + "-top.png");
      await page.evaluate(() => window.scrollTo({ top: Math.max(900, document.documentElement.scrollHeight * 0.45), behavior: "instant" }));
      await page.waitForTimeout(300);
      const rect = await header.boundingBox();
      assert(rect && Math.abs(rect.y) <= 2, viewport.tag + " sticky header not pinned after scrolling; top = " + rect?.y);
      const after = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      assert(after <= 2, viewport.tag + " horizontal overflow after scrolling: " + after);
      await page.screenshot({ path: resolve(outputDir, viewport.tag + "-scrolled.png") });
      report.screenshots.push(viewport.tag + "-scrolled.png");
    } catch (error) {
      report.failures.push(viewport.tag + ": " + (error instanceof Error ? error.message : String(error)));
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
  writeFileSync(resolve(outputDir, "evidence.json"), JSON.stringify(report, null, 2));
}
const materialConsoleErrors = report.consoleErrors.filter(e => !/favicon|ResizeObserver loop/i.test(e));
if (report.failures.length || materialConsoleErrors.length || report.requestFailures.length) {
  console.error("Preview QA BLOCKED", report);
  process.exitCode = 1;
} else {
  console.log("Preview QA PASS (visual review still needed).", report);
}
