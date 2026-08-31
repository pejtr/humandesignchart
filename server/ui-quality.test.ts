import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("User-facing copy and visual regression contracts", () => {
  const criticalCopy = [
    "client/src/components/LeadMagnetExitPopup.tsx",
    "client/src/components/Navbar.tsx",
    "client/src/pages/RedditLanding.tsx",
    "client/src/pages/ChartResult.tsx",
    "client/src/pages/BlogArticle.tsx",
    "server/routers/transit.ts",
  ].map(source).join("\n");

  it("blocks known Czech copy regressions and mojibake", () => {
    for (const broken of ["vášho", "příteľ", "Bruslíme Rychle", "natalální", "Tranzit brana", "VžDY", "VĂ", "PĹ", "ÄŤ", "Ĺˇ"]) {
      expect(criticalCopy, `Found broken user-facing text: ${broken}`).not.toContain(broken);
    }
    expect(criticalCopy).toContain("vašeho HD typu");
  });

  it("keeps the Marie chat scrollable and non-collapsing", () => {
    const chat = source("client/src/components/AIChatBox.tsx");
    const floating = source("client/src/components/FloatingChatGuide.tsx");
    expect(chat).toContain("min-h-0 flex-1 overflow-hidden");
    expect(chat).toContain("ResizeObserver");
    expect(floating).toContain('height="auto"');
    expect(floating).toContain("Došlo k chybě. Zkuste to prosím znovu.");
  });

  it("uses real fallback artwork for every related article preview", () => {
    const article = source("client/src/pages/BlogArticle.tsx");
    expect(article).toContain('fallbackSrc="/images/blog-fallback.png"');
    expect(article.match(/\/images\/blog-fallback\.png/g)?.length).toBeGreaterThanOrEqual(4);
  });

  it("replaces the fake speed badge with a calm daily insight", () => {
    const navbar = source("client/src/components/Navbar.tsx");
    expect(navbar).toContain("DailyInsightBadge");
    expect(navbar).not.toContain("SpeedPerformanceBadge");
  });

  it("keeps critical mobile accessibility contracts", () => {
    const navbar = source("client/src/components/Navbar.tsx");
    const html = source("client/index.html");
    expect(navbar).toContain("inert={!mobileOpen}");
    expect(navbar).toContain("Human Design — domů");
    expect(html).not.toContain("maximum-scale");
  });

  it("serves a valid Markdown llms.txt instead of the SPA shell", () => {
    const seoRoutes = source("server/_core/routes/seo.ts");
    const vite = source("server/_core/vite.ts");
    expect(seoRoutes).toContain('app.get("/llms.txt"');
    expect(seoRoutes).toContain('res.type("text/markdown; charset=utf-8")');
    expect(seoRoutes).toContain("# Human Design Mapa");
    expect(vite).toContain('url === "/llms.txt"');
  });

  it("keeps pricing focused on one server-priced Blueprint without fabricated proof", () => {
    const pricing = source("client/src/pages/Pricing.tsx");
    const subscription = source("server/routers/subscription.ts");
    expect(pricing).toContain("subscription.blueprintOffer");
    expect(pricing).toContain("Personal Human Design Blueprint");
    expect(pricing).not.toContain("CustomerReviewsWidget");
    expect(pricing).not.toContain("VipClubBanner");
    expect(pricing).not.toContain("SmartCouponWidget");
    expect(pricing).not.toContain("4.9 / 5.0");
    expect(pricing).not.toContain("48 hodin");
    expect(subscription).toContain("getBlueprintOffer(isCzech ? \"cs\" : \"en\")");
    expect(subscription).toContain("resolveHonorariumSelection");
    expect(subscription).toContain("const unitAmount = honorarium?.minimumAmountMinor ?? priceData[currency]");
  });

  it("uses Honorace as canonical route while preserving legacy pricing and cenik aliases", () => {
    const app = source("client/src/App.tsx");
    const seoRoutes = source("server/_core/routes/seo.ts");
    expect(app).toContain('path="/:locale/honorace"');
    expect(app).toContain('path="/:locale/pricing"');
    expect(app).toContain('path="/:locale/cenik"');
    expect(app).toContain("HonoraceAliasRedirect");
    expect(seoRoutes).toContain('"/honorace"');
  });

  it("changes the calculator hero context with the selected chart recipient", () => {
    const calculator = source("client/src/pages/ChartCalculator.tsx");
    expect(calculator).toContain("CALCULATOR_HERO_VISUALS");
    expect(calculator).toContain("style={{ background: heroVisual.background }}");
    expect(calculator).toContain("aria-pressed={active}");
    expect(calculator).not.toContain("opacity-40 pointer-events-none select-none");
  });
});
