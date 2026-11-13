import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildSeoHead } from "./_core/seoMeta";

describe("P0 premium EN header and WhatsApp share contract", () => {
  it("keeps navigation sticky outside the overflow-clipped hero", () => {
    const page = readFileSync(resolve("client/src/pages/PremiumUSHome.tsx"), "utf8");
    const opening = page.indexOf('<header data-testid="hd-en-premium-header" className="sticky top-0');
    const closing = page.indexOf("</header>", opening);
    const hero = page.indexOf('<section data-testid="hd-en-premium-hero" className="relative overflow-hidden bg-[#071426] text-white">');
    expect(opening).toBeGreaterThan(0);
    expect(closing).toBeGreaterThan(opening);
    expect(closing).toBeLessThan(hero);
    expect(page).toContain("Get My Free Chart");
    expect(page).toContain('data-testid="hd-en-mobile-navigation"');
    expect(page).toContain('aria-label="Mobile navigation"');
    expect(page).toContain('aria-label="Get My Free Chart"');
    expect(page).toContain('min-[420px]:hidden');
    const css = readFileSync(resolve("client/src/pages/PremiumUSHome.css"), "utf8");
    expect(css).toContain("@media (prefers-reduced-motion:reduce)");
  });

  it("renders correct absolute OG URLs for both languages before JS", () => {
    const en = buildSeoHead("en", "/en");
    const cs = buildSeoHead("cs", "/cs");
    expect(en).toContain('property="og:image" content="https://humandesignchart.app/images/og-homepage-en.png"');
    expect(cs).toContain('property="og:image" content="https://humandesignmapa.cz/images/og-homepage-cs.png"');
    for (const html of [en, cs]) {
      expect(html).toContain('property="og:image:width" content="1200"');
      expect(html).toContain('property="og:image:height" content="630"');
      expect(html).toContain('name="twitter:card" content="summary_large_image"');
    }
  });

  it("builds 1200x630 locale PNGs under a conservative 300KB budget", () => {
    const pkg = JSON.parse(readFileSync(resolve("package.json"), "utf8"));
    const generator = readFileSync(resolve("scripts/generate-social-cards.mjs"), "utf8");
    expect(pkg.scripts["build:cloudflare"]).toContain("node scripts/generate-social-cards.mjs");
    expect(generator).toContain("new Resvg(");
    expect(generator).toContain("og-homepage-en.png");
    expect(generator).toContain("og-homepage-cs.png");
    expect(generator).toContain("png.length > 300000");
  });
  it("fails closed on unsafe Cloudflare preview bindings and missing rollback IDs", () => {
    const script = readFileSync(resolve("scripts/qa/deploy-en-share-preview.ps1"), "utf8");
    expect(script).toContain("hd-en-share-preview");
    expect(script).toContain("production deployment ID");
    expect(script).toContain("env=production");
    expect(script).toContain("env=preview");
    expect(script).toContain("deployment_trigger.metadata.commit_hash -eq $sha");
    expect(script).toContain("qa-artifacts/en-sticky-social");
    expect(script).toContain("NO-GO: Preview shares live");
    expect(script).not.toContain("--branch=main");
    const browser = readFileSync(resolve("scripts/qa/capture-en-share-preview.mjs"), "utf8");
    expect(browser).toContain("small360");
    expect(browser).toContain("wide3840");
    expect(browser).toContain("WhatsApp/2.24.0");
    expect(browser).toContain("hd-en-mobile-navigation");
    expect(browser).toContain("image/png");
  });

});
