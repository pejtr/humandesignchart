import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { buildSeoHead } from "./_core/seoMeta";
describe("EN sticky + WhatsApp P0", () => {
  it("generates versioned homepage OG tags for both locales", () => {
    expect(buildSeoHead("en","/en")).toContain("og-home-en-share-v2.png");
    expect(buildSeoHead("cs","/cs")).toContain("og-home-cs-share-v2.png");
    expect(buildSeoHead("en","/")).toContain('og:url" content="https://humandesignchart.app/en/"');
    expect(buildSeoHead("en", "/en/calculate")).toContain("og-home-en-share-v2.png");
    expect(buildSeoHead("cs", "/cs/calculate")).toContain("og-home-cs-share-v2.png");

  });
  it("keeps header outside overflow hero and includes mobile menu", () => {
    const code=readFileSync("client/src/pages/PremiumUSHome.tsx","utf8");
    expect(code.indexOf("premium-en-sticky-header")).toBeLessThan(code.indexOf('<section className="relative overflow-hidden bg-[#071426] text-white">'));
    expect(code).toContain('aria-label="Mobile navigation"');
  });
  it("social SVG-to-PNG build script passes JS syntax check", () => {
    const result=spawnSync(process.execPath,["--check","scripts/generate-social-cards.mjs"],{encoding:"utf8",timeout:10000});
    expect(result.status,result.stderr).toBe(0);
    const generator = readFileSync("scripts/generate-social-cards.mjs", "utf8");
    expect(generator).toContain('file: "og-home-en-share-v2.png"');
    expect(generator).toContain('file: "og-home-cs-share-v2.png"');
    expect(generator).toContain("Poznej svůj design.");
    expect(generator).toContain("png.length > 300000");

  });
  it("publishes a syntax-valid isolated Pages screenshot and sticky E2E script", () => {
    const result = spawnSync(process.execPath, ["--check", "scripts/qa/capture-en-share-preview.mjs"], { encoding:"utf8", timeout:10_000 });
    expect(result.status, result.stderr).toBe(0);
    const qa = readFileSync("scripts/qa/capture-en-share-preview.mjs","utf8");
    expect(qa).toContain("humandesignchart-web.pages.dev");
    expect(qa).toContain('data-testid="premium-en-sticky-header"');
    expect(qa).toContain('document.documentElement.scrollWidth');
    expect(qa).toContain("page.screenshot");
    expect(qa).toContain("noindex,nofollow");
    expect(qa).not.toContain("--branch=main");
  });

  it("integrates premium cosmic hero without clobbering working mobile sticky header", () => {
    const page = readFileSync("client/src/pages/PremiumUSHome.tsx", "utf8");
    const css = readFileSync("client/src/pages/PremiumUSHome.css", "utf8");
    expect(page).toContain('import "./PremiumUSHome.css"');
    expect(page).toContain('data-testid="hd-en-cosmic-background"');
    expect(page).toContain('Your Energy Blueprint.');
    expect(page).toContain('Beautifully Revealed.');
    expect(page).not.toContain("Science · Wisdom");
    expect(page.indexOf("premium-en-sticky-header")).toBeLessThan(page.indexOf('data-testid="hd-en-premium-hero"'));
    expect(page).toContain('aria-label="Mobile navigation"');
    expect(css).toContain('@media (prefers-reduced-motion:reduce)');
    expect(css).toContain("pointer-events:none");
    expect(css).not.toContain("position:fixed");
  });

  it("guards direct release against ambiguous rollback and missing ads pixel", () => {
    const ps = readFileSync("scripts/qa/release-p0-en-share.ps1", "utf8");
    expect(ps).toContain("deployments?env=production");
    expect(ps).toContain("Previous production deployment ID");
    expect(ps).toContain("VITE_OPENAI_ADS_PIXEL_ID");
    expect(ps).toContain("Built JS assets do not contain");
    expect(ps).toContain('refs/remotes/origin/$feature');
    expect(ps).toContain("hd-p0-en-share-preview");
    expect(ps).toContain('Must (@($qa.screenshots).Count -ge 10)');
    expect(ps).toContain('Run "node" @("scripts/qa/probe-whatsapp-share.mjs"');
  });

});
