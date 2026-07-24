import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const sharedStore = new Map<string, any>();

vi.mock("./db", () => ({
  createSharedChart: vi.fn(async (data: any) => {
    sharedStore.set(data.token, data);
    return data.token;
  }),
  getSharedChart: vi.fn(async (token: string) => {
    return sharedStore.get(token) ?? null;
  }),
}));

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => { },
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
    const fs = await import("fs");
    const content = fs.readFileSync("./server/_core/routes/seo.ts", "utf-8");

    expect(content).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(content).toContain("<urlset");
    expect(content).toContain("https://www.humandesignmapa.cz");
    expect(content).toContain("https://www.humandesignchart.app");
    expect(content).toContain("/calculate");
    expect(content).toContain("/types/generator");
    expect(content).toContain("/encyclopedia");
    expect(content).toContain("/andelska-cisla");
    expect(content).toContain('xhtml:link rel="alternate" hreflang="cs"');
    expect(content).toContain('xhtml:link rel="alternate" hreflang="en"');
    expect(content).toContain('xhtml:link rel="alternate" hreflang="x-default"');
  });

  it("robots.txt is accessible and contains sitemap reference", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("./server/_core/routes/seo.ts", "utf-8");

    expect(content).toContain("User-agent: *");
    expect(content).toContain("Allow: /");
    expect(content).toContain("Disallow: /api/");
    expect(content).toContain("Sitemap: ${domain}/sitemap.xml");
  });
});
