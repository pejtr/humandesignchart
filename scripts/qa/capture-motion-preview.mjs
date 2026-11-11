/**
 * Motion-preview QA capture (manual after a real Cloudflare Pages preview deploy).
 * Uses the operator's existing Playwright package; no production dependency.
 * NO credentials, checkout, OAuth, customer data, or remote writes.
 *
 * HD_MOTION_PREVIEW_URL=https://<approved>.pages.dev node scripts/qa/capture-motion-preview.mjs
 */
import { mkdirSync, copyFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const input = process.env.HD_MOTION_PREVIEW_URL;
if (!input) throw new Error("Set HD_MOTION_PREVIEW_URL to an isolated Cloudflare preview origin");
const base = new URL(input);
if (base.protocol !== "https:" || !base.hostname.endsWith(".pages.dev") ||
    base.pathname !== "/" || base.search || base.hash) {
  throw new Error("Refusing non-preview URL. Use https://<preview>.pages.dev/ only.");
}
const target = new URL("/cs/motion-preview?motionqa=1", base).toString();
const dir = resolve(process.cwd(), "qa-artifacts", "motion-preview");
mkdirSync(dir, { recursive: true });

let chromium;
try { ({ chromium } = await import("playwright")); }
catch { throw new Error("Playwright is required in the operator QA environment. Install it there; no production dependency was added."); }

const browser = await chromium.launch({ headless: true });
const evidence = { url: target, checkedAt: new Date().toISOString(), screenshots: [], consoleErrors: [], video: null, failures: [] };
try {
  for (const { label, width, height } of [
    { label: "mobile-390", width: 390, height: 844 },
    { label: "desktop-1440", width: 1440, height: 900 },
    { label: "4k-3840", width: 3840, height: 2160 },
  ]) {
    const context = await browser.newContext({ viewport: { width, height }, reducedMotion: "no-preference" });
    const page = await context.newPage();
    page.on("pageerror", error => evidence.consoleErrors.push(`${label}: ${error.message}`));
    page.on("console", msg => { if (msg.type() === "error") evidence.consoleErrors.push(`${label}: ${msg.text()}`); });
    const response = await page.goto(target, { waitUntil: "networkidle", timeout: 45000 });
    if (response?.status() !== 200) throw new Error(`${label}: preview returned HTTP ${response?.status()}`);
    const graph = page.locator(".bodygraph-premium-preview");
    await graph.waitFor({ state: "visible" });
    await graph.scrollIntoViewIfNeeded();
    const zen = page.locator('[data-testid="bodygraph-motion-zen"]');
    const flow = page.locator('[data-testid="bodygraph-motion-flow"]');
    await zen.click();
    if (await zen.getAttribute("aria-pressed") !== "true") throw new Error(`${label}: Zen switch did not activate`);
    await flow.click();
    if (await flow.getAttribute("aria-pressed") !== "true") throw new Error(`${label}: Flow switch did not activate`);
    const metrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
      controlRect: document.querySelector(".hd-motion-control")?.getBoundingClientRect().toJSON(),
    }));
    if (metrics.scrollWidth > metrics.viewportWidth + 2) evidence.failures.push(`${label}: horizontal overflow`);
    const shot = resolve(dir, `bodygraph-${label}.png`);
    await page.screenshot({ path: shot, fullPage: true });
    evidence.screenshots.push({ label, file: shot, ...metrics });
    await context.close();
  }

  // Real recording, with actual interactive mode changes. Browser video is silent.
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir, size: { width: 1440, height: 900 } },
    reducedMotion: "no-preference",
  });
  const page = await context.newPage();
  page.on("pageerror", error => evidence.consoleErrors.push(`video: ${error.message}`));
  await page.goto(target, { waitUntil: "networkidle", timeout: 45000 });
  await page.locator(".bodygraph-premium-preview").scrollIntoViewIfNeeded();
  await page.locator('[data-testid="bodygraph-motion-zen"]').click();
  await page.waitForTimeout(7400);
  await page.locator('[data-testid="bodygraph-motion-flow"]').click();
  await page.waitForTimeout(7400);
  const video = page.video();
  await context.close();
  if (video) {
    const original = await video.path();
    const destination = resolve(dir, "zen-flow-real-browser-15s.webm");
    copyFileSync(original, destination);
    evidence.video = destination;
  }
} catch (error) {
  evidence.failures.push(error instanceof Error ? error.message : String(error));
} finally {
  await browser.close();
  writeFileSync(resolve(dir, "evidence.json"), JSON.stringify(evidence, null, 2));
}
if (evidence.failures.length || evidence.consoleErrors.length) {
  console.error("Motion preview QA not clean:", evidence.failures, evidence.consoleErrors);
  process.exitCode = 1;
} else {
  console.log("QA capture complete; files require human visual review.", evidence.screenshots, evidence.video);
}
