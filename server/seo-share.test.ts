import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

// ─── Share Feature Tests ─────────────────────────────────────────────────────

describe("share.createLink", () => {
  it("creates a share link with a token", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const mockChartData = {
      type: "Generator",
      profile: "4/6",
      profileName: "Opportunist / Role Model",
      authority: "Sacral Authority",
      strategy: "To Respond",
      signature: "Satisfaction",
      notSelf: "Frustration",
      definition: "Single Definition",
      aura: "Open and Enveloping",
      centers: [],
      channels: [],
      activatedGates: [],
      personalityActivations: [],
      designActivations: [],
      incarnationCross: { name: "Right Angle Cross of Planning", type: "Right Angle Cross", gates: [40, 37, 16, 9] },
    };

    const result = await caller.share.createLink({
      chartData: mockChartData,
      ownerName: "Test User",
    });

    expect(result).toBeDefined();
    expect(result.token).toBeDefined();
    expect(typeof result.token).toBe("string");
    expect(result.token.length).toBe(32); // 16 bytes hex = 32 chars
  });
});

describe("share.getShared", () => {
  it("returns null for non-existent token", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.share.getShared({ token: "nonexistent_token_12345678901234" });

    expect(result).toBeNull();
  });

  it("creates and retrieves a shared chart", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const mockChartData = {
      type: "Projector",
      profile: "1/3",
      profileName: "Investigator / Martyr",
      authority: "Splenic Authority",
      strategy: "Wait for the Invitation",
      signature: "Success",
      notSelf: "Bitterness",
      definition: "Split Definition",
      aura: "Focused and Absorbing",
      centers: [],
      channels: [],
      activatedGates: [],
      personalityActivations: [],
      designActivations: [],
      incarnationCross: { name: "Right Angle Cross of Tension", type: "Right Angle Cross", gates: [39, 38, 51, 57] },
    };

    // Create shared chart
    const createResult = await caller.share.createLink({
      chartData: mockChartData,
      ownerName: "Share Test",
    });

    // Retrieve shared chart
    const getResult = await caller.share.getShared({ token: createResult.token });

    expect(getResult).toBeDefined();
    expect(getResult).not.toBeNull();
    expect(getResult!.ownerName).toBe("Share Test");
    expect(getResult!.chartData).toBeDefined();
    const chartData = getResult!.chartData as any;
    expect(chartData.type).toBe("Projector");
    expect(chartData.profile).toBe("1/3");
  });
});

// ─── Sitemap Tests ───────────────────────────────────────────────────────────

describe("Sitemap and SEO", () => {
  it("sitemap.xml returns valid XML with all expected pages", async () => {
    const response = await fetch("http://localhost:3000/sitemap.xml");
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/xml");

    const xml = await response.text();
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain("<urlset");
    expect(xml).toContain("https://humandesignchart.app/");
    // Bilingual URLs with /cs/ and /en/ prefixes
    expect(xml).toContain("https://humandesignchart.app/cs/calculate");
    expect(xml).toContain("https://humandesignchart.app/en/calculate");
    expect(xml).toContain("https://humandesignchart.app/cs/types/generator");
    expect(xml).toContain("https://humandesignchart.app/en/types/generator");
    expect(xml).toContain("https://humandesignchart.app/cs/types/manifesting-generator");
    expect(xml).toContain("https://humandesignchart.app/en/types/reflector");
    expect(xml).toContain("https://humandesignchart.app/cs/encyclopedia");
    // hreflang alternates
    expect(xml).toContain('xhtml:link rel="alternate" hreflang="cs"');
    expect(xml).toContain('xhtml:link rel="alternate" hreflang="en"');
  });

  it("robots.txt is accessible and contains sitemap reference", async () => {
    const response = await fetch("http://localhost:3000/robots.txt");
    expect(response.status).toBe(200);

    const text = await response.text();
    expect(text).toContain("User-agent: *");
    expect(text).toContain("Allow: /");
    expect(text).toContain("Disallow: /api/");
    expect(text).toContain("Sitemap: https://humandesignchart.app/sitemap.xml");
  });
});
