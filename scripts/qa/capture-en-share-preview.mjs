/** Read-only preview QA. No login, birth data, checkout or message sending.
 * probePreview checks bilingual SSR, noindex,nofollow and both crawler UAs.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { previewOrigin, probePreview } from "./preview-en-share.mjs";

const assert = (ok, msg) => { if (!ok) throw new Error(msg); };
export async function captureNavigation(browser, origin, outputDir, report) {
  const base = new URL(origin);
  const pageURL = new URL("/en", base).href;
  for (const viewport of [
    { tag: "m360", width: 360, height: 800 },
    { tag: "m390", width: 390, height: 844 },
    { tag: "tablet768", width: 768, height: 1024 },
    { tag: "desktop1440", width: 1440, height: 900 },
    { tag: "4k3840", width: 3840, height: 2160 },
  ]) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, reducedMotion: "reduce" });
    await context.route("**/*", route => {
      if (["GET", "HEAD"].includes(route.request().method())) return route.continue();
      report.blockedWrites.push({ url: route.request().url(), method: route.request().method() });
      return route.abort("blockedbyclient");
    });
    const page = await context.newPage();
    page.on("pageerror", e => report.consoleErrors.push(viewport.tag + " pageerror " + e.message));
    page.on("console", e => { if (e.type() === "error") report.consoleErrors.push(viewport.tag + " console " + e.text()); });
    page.on("requestfailed", req => report.requestFailures.push(viewport.tag + " " + req.url()));
    const screenshot = async (suffix, fullPage = false) => {
      const name = viewport.tag + "-" + suffix + ".png";
      await page.screenshot({ path: resolve(outputDir, name), fullPage });
      report.screenshots.push(name);
    };
    try {
      const response = await page.goto(pageURL, { waitUntil: "domcontentloaded", timeout: 45000 });
      assert(response?.status() === 200, viewport.tag + " page returned " + response?.status());
      const header = page.locator('[data-testid="premium-en-sticky-header"]');
      await header.waitFor({ state: "visible", timeout: 30000 });
      const brandLink = header.getByRole("link", { name: "Human Design Chart — home" });
      assert(await brandLink.count() === 1, viewport.tag + " logo/home missing");
      const home = new URL(await brandLink.getAttribute("href"), base);
      assert(home.origin === base.origin && /^\/en\/?$/.test(home.pathname), "Logo leaves preview or locale");
      const cta = page.locator('a:visible').filter({ hasText: /^Get My Free Chart/ }).first();
      assert(await cta.count() === 1, viewport.tag + " visible free chart CTA missing");
      const ctaURL = new URL(await cta.getAttribute("href"), base);
      assert(ctaURL.origin === base.origin && ctaURL.pathname === "/en/calculate", viewport.tag + " CTA leaves preview or calculator route");
      if (viewport.width < 1024) {
        const opener = header.locator('summary[aria-label="Open main navigation"]');
        await opener.focus(); await opener.press("Enter");
        const menu = header.getByRole("navigation", { name: "Mobile navigation" });
        assert(await menu.isVisible(), viewport.tag + " keyboard cannot open mobile menu");
        const links = menu.getByRole("link");
        assert(await links.count() === 5, viewport.tag + " mobile navigation links missing");
        for (const link of await links.all()) assert(new URL(await link.getAttribute("href"), base).origin === base.origin, "Mobile link leaves preview");
        await page.keyboard.press("Tab");
        assert(await menu.evaluate(el => el.contains(document.activeElement)), viewport.tag + " menu links not keyboard-focusable");
        const menuOverflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
        assert(menuOverflow <= 2, viewport.tag + " overflow with menu open: " + menuOverflow);
        await screenshot("menu-open");
        await opener.focus(); await opener.press("Enter");
        assert(!(await menu.isVisible()), viewport.tag + " keyboard cannot close mobile menu");
      } else {
        assert(await header.getByRole("navigation", { name: "Desktop navigation" }).isVisible(), viewport.tag + " desktop nav missing");
      }
      assert(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 2, viewport.tag + " horizontal overflow before scrolling");
      await screenshot("top", true);
      const scroll = await page.evaluate(() => {
        const hero = document.querySelector('[data-testid="hd-en-premium-hero"]');
        const target = Math.max(900, (hero?.getBoundingClientRect().bottom || 0) + window.scrollY + 100);
        window.scrollTo({ top: target, behavior: "instant" });
        return { y: window.scrollY, heroBottom: hero?.getBoundingClientRect().bottom };
      });
      assert(scroll.y > 100 && scroll.heroBottom <= 0, viewport.tag + " did not scroll past the hero");
      const rect = await header.boundingBox();
      assert(rect && Math.abs(rect.y) <= 2, viewport.tag + " sticky header not pinned: " + rect?.y);
      assert(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 2, viewport.tag + " horizontal overflow after scrolling");
      await screenshot("scrolled");
      await cta.click();
      await page.waitForURL(url => url.origin === base.origin && url.pathname === "/en/calculate", { timeout: 15000 });
      report.navigation.push({ viewport: viewport.tag, scrollY: scroll.y, stickyTop: rect.y, cta: page.url(), keyboardMenu: viewport.width < 1024 ? "PASS" : "not-applicable" });
    } catch (error) {
      report.failures.push(viewport.tag + ": " + (error instanceof Error ? error.message : String(error)));
    } finally { await context.close(); }
  }
}

async function main() {
  const origin = previewOrigin(process.env.HD_EN_PREVIEW_URL || "");
  assert(/^[a-f\d]{40}$/i.test(process.env.GIT_SHA || ""), "Set GIT_SHA to the exact verified source commit.");
  const outputDir = resolve("qa-artifacts/p0-en-sticky-whatsapp"); mkdirSync(outputDir, { recursive: true });
  const report = { commit: process.env.GIT_SHA, origin, checkedAt: new Date().toISOString(), environment: "isolated-cloudflare-preview", images: [], screenshots: [], navigation: [], failures: [], consoleErrors: [], requestFailures: [], blockedWrites: [], whatsapp: "NOT_VERIFIED" };
  let browser;
  try {
    report.images = await probePreview(origin);
    const { chromium } = await import("playwright");
    browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}) });
    await captureNavigation(browser, origin, outputDir, report);
  } catch (error) { report.failures.push(error instanceof Error ? error.message : String(error)); }
  finally {
    if (browser) await browser.close();
    writeFileSync(resolve(outputDir, "evidence.json"), JSON.stringify(report, null, 2));
  }
  if (report.failures.length || report.consoleErrors.length || report.requestFailures.length || report.blockedWrites.length) {
    console.error("Preview QA BLOCKED", report); process.exitCode = 1;
  } else { console.log("Preview automated QA PASS; visual review and real WhatsApp rendering remain required.", report); }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
