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
    const header = code.indexOf('data-testid="premium-en-sticky-header"');
    const hero = code.indexOf('data-testid="hd-en-premium-hero"');
    expect(header).toBeGreaterThanOrEqual(0);
    expect(hero).toBeGreaterThanOrEqual(0);
    expect(header).toBeLessThan(hero);
    const headerEnd = code.indexOf("</header>", header);
    expect(headerEnd).toBeGreaterThan(header);
    expect(headerEnd).toBeLessThan(hero);
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
  it("refuses production browser QA before loading a browser", () => {
    const result = spawnSync(process.execPath, ["--check", "scripts/qa/capture-en-share-preview.mjs"], { encoding:"utf8", timeout:10_000 });
    expect(result.status, result.stderr).toBe(0);
    const rejected = spawnSync(process.execPath, ["scripts/qa/capture-en-share-preview.mjs"], {
      encoding: "utf8", timeout: 10_000,
      env: { ...process.env, HD_EN_PREVIEW_URL: "https://humandesignchart.app/", GIT_SHA: "6f34d0665b56ab1ff4b953a2c155d27e3e382587" },
    });
    expect(rejected.status).toBe(1);
    expect(rejected.stderr).toContain("isolated");
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

  it("enforces preview isolation, crawler contracts and rejects release flags", () => {
    const result = spawnSync(process.execPath, ["--test", "scripts/qa/preview-en-share.test.mjs"], {
      encoding: "utf8", timeout: 10_000,
    });
    expect(result.status, result.stdout + result.stderr).toBe(0);
  });

});
