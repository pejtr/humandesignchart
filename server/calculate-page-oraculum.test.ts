import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("Calculate Page & ORACULUM+ Revamp Contracts", () => {
  it("enforces zero occurrences of legacy ARACULUM branding across client code", () => {
    const filesToCheck = [
      "client/src/components/FloatingChatGuide.tsx",
      "client/src/components/Footer.tsx",
      "client/src/pages/Home.tsx",
      "client/src/pages/ChartCalculator.tsx",
      "client/src/pages/AiGuide.tsx",
      "client/src/pages/Pricing.tsx",
    ];

    for (const file of filesToCheck) {
      const content = source(file);
      expect(content, `File ${file} must not contain legacy ARACULUM branding`).not.toMatch(/ARACULUM/i);
    }
  });

  it("unifies branding to ORACULUM+ across key surfaces", () => {
    const floating = source("client/src/components/FloatingChatGuide.tsx");
    const footer = source("client/src/components/Footer.tsx");
    const home = source("client/src/pages/Home.tsx");
    const calculator = source("client/src/pages/ChartCalculator.tsx");
    const aiGuide = source("client/src/pages/AiGuide.tsx");

    expect(floating).toContain("ORACULUM+");
    expect(footer).toContain("ORACULUM+");
    expect(home).toContain("ORACULUM+");
    expect(calculator).toContain("ORACULUM+");
    expect(aiGuide).toContain("ORACULUM+");
  });

  it("suppresses floating newsletter popup on calculate pages to prevent blocking the form", () => {
    const popup = source("client/src/components/NewsletterPopup.tsx");
    expect(popup).toContain("isCalculatePage");
    expect(popup).toContain('location.includes("/calculate")');
    expect(popup).toContain("if (isAuthenticated || !isVisible || isSuppressedPage) return null;");
  });

  it("provides unknown birth time ergonomics with transparent standard noon default", () => {
    const calculator = source("client/src/pages/ChartCalculator.tsx");
    expect(calculator).toContain("isUnknownTime");
    expect(calculator).toContain("handleUnknownTimeToggle");
    expect(calculator).toContain('setBirthTime("12:00")');
    expect(calculator).toContain("unknownTimeLabel");
    expect(calculator).toContain("unknownTimeHelp");
  });

  it("provides graceful location search with auto-resolution on submit", () => {
    const calculator = source("client/src/pages/ChartCalculator.tsx");
    expect(calculator).toContain("isSearchingPlace");
    expect(calculator).toContain("handlePlaceSearch(true)");
    expect(calculator).toContain("locationResolved");
  });

  it("presents ORACULUM+ as a dedicated secondary engagement section with sample questions", () => {
    const calculator = source("client/src/pages/ChartCalculator.tsx");
    expect(calculator).toContain("ORACULUM+");
    expect(calculator).toContain('isEn ? "Smart AI Human Design Guide" : "Chytrá AI průvodkyně Human Designem"');
    expect(calculator).toContain("handleAskOraculum");
    expect(calculator).toContain("/ai-guide?q=");
  });

  it("positions partner embed as a secondary B2B feature below the main calculator flow", () => {
    const calculator = source("client/src/pages/ChartCalculator.tsx");
    expect(calculator).toContain("showEmbedCode");
    expect(calculator).toContain("handleCopyEmbed");
    expect(calculator).toContain("embed/calculator");
  });

  it("uses natural Ceník / Pricing wording in navigation instead of Honorace", () => {
    const navbar = source("client/src/components/Navbar.tsx");
    expect(navbar).toContain('locale === "cs" ? "Ceník" : "Pricing"');
  });
});
