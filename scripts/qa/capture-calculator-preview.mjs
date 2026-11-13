/**
 * Read-only visual QA for PR #86. Requires installed Playwright + Chromium.
 * Set HD_CALCULATOR_PREVIEW_URL to the ACTUAL Wrangler Pages preview origin.
 * No form submissions, charges, authentication, or customer data writes.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const base = new URL(process.env.HD_CALCULATOR_PREVIEW_URL || "");
if (base.protocol !== "https:" ||
  !/^[a-z0-9-]+\.humandesignchart-web\.pages\.dev$/.test(base.hostname) ||
  base.pathname !== "/" || base.search || base.hash) {
  throw new Error("Use a real https://<id>.humandesignchart-web.pages.dev/ preview origin only.");
}
const { chromium } = await import("playwright");
const browser = await chromium.launch({ headless: true });
const folder = resolve("qa-artifacts", "calculator-preview");
mkdirSync(folder, { recursive: true });
const report = { url: base.origin, timestamp: new Date().toISOString(), screenshots: [], errors: [] };
try {
  for (const locale of ["cs", "en"]) {
    for (const size of [
      { name: "mobile", width: 390, height: 844 },
      { name: "desktop", width: 1440, height: 900 },
      { name: "4k", width: 3840, height: 2160 },
    ]) {
      for (const theme of ["light", "dark"]) {
        const label = locale + "-" + size.name + "-" + theme;
        const context = await browser.newContext({
          viewport: { width: size.width, height: size.height },
          reducedMotion: "reduce",
        });
        const page = await context.newPage();
        page.on("pageerror", error => report.errors.push(label + " pageerror: " + error.message));
        const response = await page.goto(new URL("/" + locale + "/calculate", base).toString(), {
          waitUntil: "domcontentloaded", timeout: 45000,
        });
        if (response?.status() !== 200) throw new Error(label + ": HTTP " + response?.status());
        if (theme === "dark") await page.evaluate(() => document.documentElement.classList.add("dark"));
        await page.locator(".hd-calculator-page").waitFor({ state: "visible" });
        await page.locator(".hd-calculator-card").waitFor({ state: "visible" });
        for (const id of ["name", "birthDate", "birthTime", "birthPlace"]) {
          if (!(await page.locator("#" + id).isVisible())) report.errors.push(label + ": missing #" + id);
        }
        // No personal data or paid flow interaction.
        const metrics = await page.evaluate(() => ({
          width: document.documentElement.scrollWidth,
          viewport: window.innerWidth,
          animation: getComputedStyle(document.querySelector(".hd-calculator-aurora-violet")).animationName,
        }));
        if (metrics.width > metrics.viewport + 2) report.errors.push(label + ": horizontal overflow");
        if (metrics.animation !== "none") report.errors.push(label + ": reduced motion is not respected");
        const file = resolve(folder, label + ".png");
        await page.screenshot({ path: file, fullPage: true });
        report.screenshots.push(file);
        await context.close();
      }
    }
  }
} catch (error) {
  report.errors.push(error instanceof Error ? error.message : String(error));
} finally {
  await browser.close();
  writeFileSync(resolve(folder, "evidence.json"), JSON.stringify(report, null, 2));
}
if (report.errors.length) {
  console.error(report.errors);
  process.exitCode = 1;
} else {
  console.log("Visual smoke done; human screenshot review still required.", report.screenshots.length);
}
