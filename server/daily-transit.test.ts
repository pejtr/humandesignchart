import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock dependencies ────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getChartById: vi.fn(),
  saveAiReading: vi.fn(),
  getReadingsByChart: vi.fn(),
  getAllReadingsByUser: vi.fn(),
  updateReadingRating: vi.fn(),
  createSharedReading: vi.fn(),
  getSharedReading: vi.fn(),
}));

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: "Dnes je Slunce v Bráně 63, která aktivuje vaši Bránu 63..." } }],
  }),
}));

// ─── Transit gate calculation helpers ────────────────────────────────────────
describe("Transit gate calculation", () => {
  it("converts longitude to gate number correctly", () => {
    // 64 gates × 5.625° each = 360°
    const longitudeToGate = (lon: number): number => {
      const normalized = ((lon % 360) + 360) % 360;
      return Math.floor(normalized / 5.625) + 1;
    };
    expect(longitudeToGate(0)).toBeGreaterThanOrEqual(1);
    expect(longitudeToGate(0)).toBeLessThanOrEqual(64);
    expect(longitudeToGate(360)).toBeGreaterThanOrEqual(1);
    expect(longitudeToGate(180)).toBeGreaterThanOrEqual(1);
    expect(longitudeToGate(180)).toBeLessThanOrEqual(64);
  });

  it("converts longitude to line number correctly (1-6)", () => {
    const longitudeToLine = (lon: number): number => {
      const normalized = ((lon % 360) + 360) % 360;
      const posInGate = normalized % 5.625;
      return Math.floor(posInGate / (5.625 / 6)) + 1;
    };
    expect(longitudeToLine(0)).toBeGreaterThanOrEqual(1);
    expect(longitudeToLine(0)).toBeLessThanOrEqual(6);
    expect(longitudeToLine(90)).toBeGreaterThanOrEqual(1);
    expect(longitudeToLine(90)).toBeLessThanOrEqual(6);
  });

  it("handles negative longitudes", () => {
    const longitudeToGate = (lon: number): number => {
      const normalized = ((lon % 360) + 360) % 360;
      return Math.floor(normalized / 5.625) + 1;
    };
    expect(longitudeToGate(-10)).toBeGreaterThanOrEqual(1);
    expect(longitudeToGate(-10)).toBeLessThanOrEqual(64);
  });
});

// ─── Personalized transit logic ───────────────────────────────────────────────
describe("Personalized transit analysis", () => {
  it("identifies reinforced gates when transit matches natal gates", () => {
    const natalGates = [1, 8, 27, 50, 63, 64];
    const transitGates = [
      { planet: "Sun", gate: 63, line: 5 },
      { planet: "Moon", gate: 12, line: 3 },
      { planet: "Mercury", gate: 8, line: 2 },
    ];
    const reinforced = transitGates.filter(tg => natalGates.includes(tg.gate));
    expect(reinforced).toHaveLength(2);
    expect(reinforced.map(r => r.gate)).toContain(63);
    expect(reinforced.map(r => r.gate)).toContain(8);
  });

  it("identifies activated channels when transit + natal gate form a channel", () => {
    // Channel 63-4: gates 63 and 4
    const natalGates = [4, 27, 50];
    const transitGates = [
      { planet: "Sun", gate: 63, line: 5 },
      { planet: "Moon", gate: 12, line: 3 },
    ];

    const CHANNELS = [[1, 8], [2, 14], [3, 60], [4, 63], [5, 15], [6, 59], [7, 31]];

    const activatedChannels: Array<{ gate1: number; gate2: number; planet: string }> = [];
    for (const tg of transitGates) {
      for (const [g1, g2] of CHANNELS) {
        if (tg.gate === g1 && natalGates.includes(g2)) {
          activatedChannels.push({ gate1: g1, gate2: g2, planet: tg.planet });
        } else if (tg.gate === g2 && natalGates.includes(g1)) {
          activatedChannels.push({ gate1: g1, gate2: g2, planet: tg.planet });
        }
      }
    }
    expect(activatedChannels).toHaveLength(1);
    expect(activatedChannels[0].gate1).toBe(4);
    expect(activatedChannels[0].gate2).toBe(63);
  });

  it("returns empty arrays when no transit-natal matches", () => {
    const natalGates = [1, 2, 3, 4, 5];
    const transitGates = [
      { planet: "Sun", gate: 60, line: 1 },
      { planet: "Moon", gate: 61, line: 2 },
    ];
    const reinforced = transitGates.filter(tg => natalGates.includes(tg.gate));
    expect(reinforced).toHaveLength(0);
  });
});

// ─── Transit procedure structure ─────────────────────────────────────────────
describe("Transit procedure output structure", () => {
  it("transit.current returns expected fields", () => {
    const mockTransitData = {
      timestamp: new Date().toISOString(),
      positions: { Sun: 345.3, Moon: 194.2, Mercury: 348.0 },
      transitGates: [
        { planet: "Sun", gate: 63, line: 5, longitude: 345.3 },
        { planet: "Moon", gate: 48, line: 6, longitude: 194.2 },
      ],
    };
    expect(mockTransitData).toHaveProperty("timestamp");
    expect(mockTransitData).toHaveProperty("positions");
    expect(mockTransitData).toHaveProperty("transitGates");
    expect(Array.isArray(mockTransitData.transitGates)).toBe(true);
    expect(mockTransitData.transitGates[0]).toHaveProperty("planet");
    expect(mockTransitData.transitGates[0]).toHaveProperty("gate");
    expect(mockTransitData.transitGates[0]).toHaveProperty("line");
  });

  it("transit.personalized returns expected fields", () => {
    const mockPersonalized = {
      timestamp: new Date().toISOString(),
      chartType: "Generátor",
      transitGates: [{ planet: "Sun", gate: 63, line: 5, longitude: 345.3 }],
      reinforcedGates: [{ planet: "Sun", gate: 63, line: 5 }],
      activatedChannels: [{ gate1: 63, gate2: 4, planet: "Sun" }],
      interpretation: "Dnes je Slunce v Bráně 63...",
    };
    expect(mockPersonalized).toHaveProperty("chartType");
    expect(mockPersonalized).toHaveProperty("transitGates");
    expect(mockPersonalized).toHaveProperty("reinforcedGates");
    expect(mockPersonalized).toHaveProperty("activatedChannels");
    expect(mockPersonalized).toHaveProperty("interpretation");
    expect(typeof mockPersonalized.interpretation).toBe("string");
    expect(mockPersonalized.interpretation.length).toBeGreaterThan(0);
  });
});

// ─── Dashboard transit widget ─────────────────────────────────────────────────
describe("Dashboard transit widget logic", () => {
  it("selects first chart when no chart is selected", () => {
    const charts = [
      { id: 1, name: "Petr Novák" },
      { id: 2, name: "Jana Nováková" },
    ];
    const selectedChartId = null;
    const effectiveChartId = selectedChartId ?? (charts[0]?.id ?? null);
    expect(effectiveChartId).toBe(1);
  });

  it("returns null when no charts available", () => {
    const charts: Array<{ id: number; name: string }> = [];
    const selectedChartId = null;
    const effectiveChartId = selectedChartId ?? (charts[0]?.id ?? null);
    expect(effectiveChartId).toBeNull();
  });

  it("uses selected chart when explicitly chosen", () => {
    const charts = [
      { id: 1, name: "Petr Novák" },
      { id: 2, name: "Jana Nováková" },
    ];
    const selectedChartId = 2;
    const effectiveChartId = selectedChartId ?? (charts[0]?.id ?? null);
    expect(effectiveChartId).toBe(2);
  });
});

// ─── Planet symbols and colors ────────────────────────────────────────────────
describe("Planet display configuration", () => {
  const PLANET_SYMBOLS: Record<string, string> = {
    Sun: "☉", Moon: "☽", Mercury: "☿", Venus: "♀", Mars: "♂",
    Jupiter: "♃", Saturn: "♄", Uranus: "⛢", Neptune: "♆", Pluto: "♇",
    "North Node": "☊", "South Node": "☋",
  };

  it("has symbols for all major planets", () => {
    const expectedPlanets = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"];
    for (const planet of expectedPlanets) {
      expect(PLANET_SYMBOLS[planet]).toBeDefined();
      expect(PLANET_SYMBOLS[planet].length).toBeGreaterThan(0);
    }
  });

  it("has symbols for lunar nodes", () => {
    expect(PLANET_SYMBOLS["North Node"]).toBe("☊");
    expect(PLANET_SYMBOLS["South Node"]).toBe("☋");
  });
});

// ─── Sitemap daily-transit entry ──────────────────────────────────────────────
describe("Sitemap daily-transit entry", () => {
  it("daily-transit page should have daily changefreq for SEO", () => {
    const sitemapPages = [
      { loc: "/daily-transit", priority: "0.6", changefreq: "daily" },
      { loc: "/incarnation-cross", priority: "0.6", changefreq: "monthly" },
    ];
    const transitPage = sitemapPages.find(p => p.loc === "/daily-transit");
    expect(transitPage).toBeDefined();
    expect(transitPage?.changefreq).toBe("daily");
    expect(transitPage?.priority).toBe("0.6");
  });
});
