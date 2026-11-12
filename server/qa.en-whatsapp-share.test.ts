import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { buildSeoHead } from "./_core/seoMeta";
describe("EN sticky + WhatsApp P0", () => {
  it("generates versioned homepage OG tags for both locales", () => {
    expect(buildSeoHead("en","/en")).toContain("og-home-en-share-v2.png");
    expect(buildSeoHead("cs","/cs")).toContain("og-home-cs-share-v2.png");
    expect(buildSeoHead("en","/")).toContain('og:url" content="https://humandesignchart.app/en/"');
  });
  it("keeps header outside overflow hero and includes mobile menu", () => {
    const code=readFileSync("client/src/pages/PremiumUSHome.tsx","utf8");
    expect(code.indexOf("premium-en-sticky-header")).toBeLessThan(code.indexOf('<section className="relative overflow-hidden bg-[#071426] text-white">'));
    expect(code).toContain('aria-label="Mobile navigation"');
  });
  it("social SVG-to-PNG build script passes JS syntax check", () => {
    const result=spawnSync(process.execPath,["--check","scripts/generate-social-cards.mjs"],{encoding:"utf8",timeout:10000});
    expect(result.status,result.stderr).toBe(0);
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

});
