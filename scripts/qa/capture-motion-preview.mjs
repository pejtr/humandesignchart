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
if (base.protocol !== "https:" || !/^(?:[a-z0-9-]+\.)?humandesignchart-web\.pages\.dev$/.test(base.hostname) ||
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
    const response = await page.goto(target, { waitUntil: "domcontentloaded", timeout: 45000 });
    if (response?.status() !== 200) throw new Error(`${label}: preview returned HTTP ${response?.status()}`);
    const graph = page.locator(".bodygraph-premium-preview");
    await graph.waitFor({ state: "visible" });
    await graph.scrollIntoViewIfNeeded();
    const zen = page.locator('[data-testid="bodygraph-motion-zen"]');
    const flow = page.locator('[data-testid="bodygraph-motion-flow"]');
    const control = page.locator(".hd-motion-control");
    const toggle = page.locator('[data-testid="bodygraph-motion-toggle"]');
    await zen.click();
    if (await zen.getAttribute("aria-pressed") !== "true") throw new Error(`${label}: Zen switch did not activate`);
    const beforeGeometry = await page.locator(".bodygraph-premium-preview .bodygraph-svg path").evaluateAll(
      nodes => nodes.map(node => node.getAttribute("d")).join("|")
    );
    const zenShot = resolve(dir, `bodygraph-${label}-zen.png`);
    await page.screenshot({ path: zenShot, fullPage: true });
    evidence.screenshots.push({ label, state: "zen", file: zenShot });

    await flow.click();
    if (await flow.getAttribute("aria-pressed") !== "true") throw new Error(`${label}: Flow switch did not activate`);
    const flowShot = resolve(dir, `bodygraph-${label}-flow.png`);
    await page.screenshot({ path: flowShot, fullPage: true });
    evidence.screenshots.push({ label, state: "flow", file: flowShot });

    await toggle.click();
    if (await graph.getAttribute("data-motion-state") !== "paused") throw new Error(`${label}: Play/Pause did not stop animation`);
    const pausedShot = resolve(dir, `bodygraph-${label}-paused.png`);
    await page.screenshot({ path: pausedShot, fullPage: true });
    evidence.screenshots.push({ label, state: "paused", file: pausedShot });

    const afterGeometry = await page.locator(".bodygraph-premium-preview .bodygraph-svg path").evaluateAll(
      nodes => nodes.map(node => node.getAttribute("d")).join("|")
    );
    if (beforeGeometry !== afterGeometry) evidence.failures.push(`${label}: Bodygraph geometry changed with motion state`);

    const metrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
      controlRect: document.querySelector(".hd-motion-control")?.getBoundingClientRect().toJSON(),
    }));
    if (metrics.scrollWidth > metrics.viewportWidth + 2) evidence.failures.push(`${label}: horizontal overflow`);
    const controlRect = await control.boundingBox();
    if (!controlRect || controlRect.width < 44 || controlRect.height < 44) evidence.failures.push(`${label}: control too small/invisible`);

    await page.reload({ waitUntil: "domcontentloaded" });
    const restored = page.locator(".bodygraph-premium-preview");
    await restored.waitFor({ state: "visible" });
    if (await restored.getAttribute("data-motion-state") !== "paused" ||
        await page.locator('[data-testid="bodygraph-motion-flow"]').getAttribute("aria-pressed") !== "true") {
      evidence.failures.push(`${label}: saved Pause/FLOW not restored after reload`);
    }
    if (label === "mobile-390") {
      // A reduced-motion check performed while manually paused cannot verify
      // whether the OS setting actually overrides an actively running graph.
      await restored.scrollIntoViewIfNeeded();
      const restoredToggle = page.locator('[data-testid="bodygraph-motion-toggle"]');
      await restoredToggle.click(); // saved Pause -> Play
      await page.waitForFunction(() =>
        document.querySelector(".bodygraph-premium-preview")?.getAttribute("data-motion-state") === "running",
        { timeout: 5000 },
      );
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.waitForFunction(() =>
        document.querySelector(".bodygraph-premium-preview")?.getAttribute("data-motion-state") === "paused",
        { timeout: 5000 },
      );
      if (!(await restoredToggle.isDisabled())) {
        evidence.failures.push("mobile-390: Play is not disabled while reduced-motion is active");
      }
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await page.waitForFunction(() =>
        document.querySelector(".bodygraph-premium-preview")?.getAttribute("data-motion-state") === "running",
        { timeout: 5000 },
      );
    }
    const firstCenter = page.locator(".bodygraph-premium-preview .bodygraph-center").first();
    await firstCenter.focus();
    if (!(await page.locator(".bodygraph-center-tooltip").isVisible())) {
      evidence.failures.push(`${label}: center micro-label does not appear on keyboard focus`);
    }
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
  await page.goto(target, { waitUntil: "domcontentloaded", timeout: 45000 });
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
