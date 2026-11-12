/**
 * Visual release QA for PR #88. Requires an actually deployed isolated Pages
 * preview and Playwright installed in operator QA environment.
 * Usage: HD_EN_SHARE_PREVIEW_URL=https://hd-en-share-preview.humandesignchart-web.pages.dev node scripts/qa/capture-en-share-preview.mjs
 * Never visits customer auth or checkout. No production writes.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const raw = process.env.HD_EN_SHARE_PREVIEW_URL;
if (!raw) throw new Error("Set HD_EN_SHARE_PREVIEW_URL to an isolated Pages origin");
const base = new URL(raw);
if (base.protocol !== "https:" ||
  !/^[a-z0-9-]+\.humandesignchart-web\.pages\.dev$/.test(base.hostname) ||
  base.pathname !== "/" || base.search || base.hash) {
  throw new Error("Refusing any non-preview or non-project URL");
}
let chromium;
try { ({ chromium } = await import("playwright")); }
catch { throw new Error("Playwright must be installed in the operator QA environment"); }

const out = resolve(process.cwd(), "qa-artifacts", "en-sticky-social");
mkdirSync(out, { recursive: true });
const results = { origin: base.origin, when: new Date().toISOString(), viewports: [], social: [], errors: [] };
const browser = await chromium.launch({ headless: true });
try {
  for (const v of [
    { name: "small360", width: 360, height: 780 },
    { name: "mobile390", width: 390, height: 844 },
    { name: "tablet768", width: 768, height: 1024 },
    { name: "desktop1440", width: 1440, height: 900 },
    { name: "wide3840", width: 3840, height: 2160 },
  ]) {
    const context = await browser.newContext({ viewport: { width: v.width, height: v.height } });
    const page = await context.newPage();
    page.on("pageerror", e => results.errors.push(v.name + ": " + e.message));
    const response = await page.goto(new URL("/en", base).toString(), {
      waitUntil: "domcontentloaded", timeout: 45000,
    });
    if (response?.status() !== 200) throw new Error(v.name + ": EN homepage HTTP " + response?.status());
    const header = page.getByTestId("hd-en-premium-header");
    await header.waitFor({ state: "visible" });
    const hero = page.getByTestId("hd-en-premium-hero");
    // Scroll well beyond the hero: header must stay pinned to the top of the screen.
    await page.evaluate(() => window.scrollTo(0, Math.max(1100, window.innerHeight * 1.7)));
    await page.waitForTimeout(350);
    const top = await header.evaluate(el => el.getBoundingClientRect().top);
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    const cta = page.getByRole("link", { name: /Get My Free Chart/i }).first();
    if (Math.abs(top) > 3) results.errors.push(v.name + ": header not pinned (" + top + "px)");
    if (overflow > 2) results.errors.push(v.name + ": horizontal overflow " + overflow + "px");
    if (!(await cta.count())) results.errors.push(v.name + ": free-chart CTA absent");
    else if (!(await cta.getAttribute("href"))?.endsWith("/calculate")) {
      results.errors.push(v.name + ": CTA does not lead to calculator");
    }
    if ((await hero.count()) === 0) results.errors.push(v.name + ": premium hero missing");

    if (v.width < 1024) {
      const menu = page.getByTestId("hd-en-mobile-navigation");
      await menu.locator("summary").click();
      const pricing = menu.getByRole("link", { name: "Pricing" });
      if (!(await pricing.isVisible()) || !(await pricing.getAttribute("href"))?.endsWith("/honorace")) {
        results.errors.push(v.name + ": mobile navigation not usable");
      }
      await page.screenshot({ path: resolve(out, "en-" + v.name + "-menu.png"), fullPage: true });
      await menu.locator("summary").click();
    }

    await page.screenshot({ path: resolve(out, "en-" + v.name + ".png"), fullPage: true });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const motion = await page.locator(".hd-us-cosmos .hd-us-nebula").first().evaluate(
      el => getComputedStyle(el).animationName
    );
    if (motion !== "none") results.errors.push(v.name + ": reduced-motion still animated (" + motion + ")");
    results.viewports.push({ ...v, headerTopAfterScroll: top, horizontalOverflow: overflow, reducedMotionName: motion });
    await context.close();
  }

  // Preview must expose crawler-ready server-side tags in the first HTML response;
  // SPA-injected tags alone do not help the WhatsApp crawler.
  for (const lang of ["en", "cs"]) {
    const url = new URL("/" + lang, base).toString();
    const response = await fetch(url, {
      headers: { "User-Agent": "WhatsApp/2.24.0", Accept: "text/html" },
      signal: AbortSignal.timeout(20000),
    });
    const html = await response.text();
    const tags = html.match(/<meta\\s+[^>]*>/gi) || [];
    const value = name => {
      const tag = tags.find(t => t.includes('property="' + name + '"'));
      return tag?.match(/\\bcontent=["']([^"']+)["']/i)?.[1] || "";
    };
    const image = value("og:image");
    const title = value("og:title");
    const expectedHost = lang === "en" ? "humandesignchart.app" : "humandesignmapa.cz";
    const expectedPath = "/images/og-homepage-" + lang + ".png";
    if (!response.ok || !response.headers.get("content-type")?.includes("text/html") ||
        !title || !image ||
        new URL(image).hostname !== expectedHost ||
        new URL(image).pathname !== expectedPath ||
        html.includes("<!--SEO_META-->")) {
      results.errors.push(lang + ": crawler SSR OG tags invalid on isolated preview");
    }
    results.social.push({ lang, route: url, htmlStatus: response.status, title, image });
  }

  // Confirm the actual preview origin contains built image bytes even before public
  // domain association. Do not assume OG URLs pointing to production are deployed.
  for (const lang of ["en", "cs"]) {
    const url = new URL("/images/og-homepage-" + lang + ".png", base).toString();
    const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
    const bytes = Buffer.from(await res.arrayBuffer());
    const png = bytes.length >= 24 && bytes.subarray(0, 8).equals(
      Buffer.from([137,80,78,71,13,10,26,10])
    );
    const dimensions = png ? [bytes.readUInt32BE(16), bytes.readUInt32BE(20)] : [];
    if (!res.ok || !png || dimensions[0] !== 1200 || dimensions[1] !== 630 ||
      bytes.length > 300000 || !res.headers.get("content-type")?.includes("image/png")) {
      results.errors.push(lang + ": social PNG failed preview GET validation");
    }
    results.social.push({ lang, url, status: res.status, bytes: bytes.length, dimensions });
  }
} catch (error) {
  results.errors.push(error instanceof Error ? error.message : String(error));
} finally {
  await browser.close();
  writeFileSync(resolve(out, "evidence.json"), JSON.stringify(results, null, 2));
}
if (results.errors.length) {
  console.error("NO-GO preview release:", results.errors);
  process.exitCode = 1;
} else {
  console.log("Preview QA static/browser PASS. Human visual review and production OG fetch remain mandatory.");
}
