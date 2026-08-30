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
});
