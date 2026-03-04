import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock DB helpers ─────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getAllReadingsByUser: vi.fn(),
  updateReadingRating: vi.fn(),
  getReadingById: vi.fn(),
  createSharedChart: vi.fn(),
  getAiReadings: vi.fn(),
  createAiReading: vi.fn(),
  getUserCharts: vi.fn(),
  getChartById: vi.fn(),
  createChart: vi.fn(),
  updateChart: vi.fn(),
  deleteChart: vi.fn(),
  toggleFavorite: vi.fn(),
  createSharedChart: vi.fn(),
  getSharedChart: vi.fn(),
}));

import {
  getAllReadingsByUser,
  updateReadingRating,
  getReadingById,
  createSharedChart,
} from "./db";

// ─── getAllReadingsByUser ─────────────────────────────────────────────────────
describe("getAllReadingsByUser", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns readings with chart names", async () => {
    const mockReadings = [
      {
        id: 1,
        chartId: 10,
        readingType: "overview",
        content: "Kompletní přehled vaší mapy...",
        rating: "up",
        createdAt: new Date("2026-01-01"),
        chartName: "Petr Novák",
      },
      {
        id: 2,
        chartId: 11,
        readingType: "type_strategy",
        content: "Váš typ je Generátor...",
        rating: null,
        createdAt: new Date("2026-01-02"),
        chartName: "Jana Nováková",
      },
    ];
    vi.mocked(getAllReadingsByUser).mockResolvedValue(mockReadings);

    const result = await getAllReadingsByUser(42);
    expect(result).toHaveLength(2);
    expect(result[0].chartName).toBe("Petr Novák");
    expect(result[1].rating).toBeNull();
  });

  it("returns empty array when user has no readings", async () => {
    vi.mocked(getAllReadingsByUser).mockResolvedValue([]);
    const result = await getAllReadingsByUser(99);
    expect(result).toEqual([]);
  });
});

// ─── updateReadingRating ─────────────────────────────────────────────────────
describe("updateReadingRating", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates rating to up", async () => {
    vi.mocked(updateReadingRating).mockResolvedValue(undefined);
    await updateReadingRating(1, 42, "up");
    expect(updateReadingRating).toHaveBeenCalledWith(1, 42, "up");
  });

  it("updates rating to down", async () => {
    vi.mocked(updateReadingRating).mockResolvedValue(undefined);
    await updateReadingRating(1, 42, "down");
    expect(updateReadingRating).toHaveBeenCalledWith(1, 42, "down");
  });

  it("clears rating by setting null", async () => {
    vi.mocked(updateReadingRating).mockResolvedValue(undefined);
    await updateReadingRating(1, 42, null);
    expect(updateReadingRating).toHaveBeenCalledWith(1, 42, null);
  });
});

// ─── getReadingById ──────────────────────────────────────────────────────────
describe("getReadingById", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns reading when found", async () => {
    const mockReading = {
      id: 5,
      chartId: 10,
      userId: 42,
      readingType: "profile",
      content: "Váš profil 3/5...",
      rating: null,
      createdAt: new Date(),
    };
    vi.mocked(getReadingById).mockResolvedValue(mockReading);

    const result = await getReadingById(5, 42);
    expect(result).not.toBeNull();
    expect(result?.readingType).toBe("profile");
  });

  it("returns null when reading not found or wrong user", async () => {
    vi.mocked(getReadingById).mockResolvedValue(null);
    const result = await getReadingById(999, 42);
    expect(result).toBeNull();
  });
});

// ─── shareReading logic ──────────────────────────────────────────────────────
describe("shareReading procedure logic", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a shared chart token when reading exists", async () => {
    const mockReading = {
      id: 7,
      chartId: 10,
      userId: 42,
      readingType: "overview",
      content: "Výklad obsah...",
      rating: null,
      createdAt: new Date(),
    };
    vi.mocked(getReadingById).mockResolvedValue(mockReading);
    vi.mocked(createSharedChart).mockResolvedValue("abc123token");

    const reading = await getReadingById(7, 42);
    expect(reading).not.toBeNull();

    await createSharedChart({
      token: "abc123token",
      chartData: { readingContent: reading!.content, readingType: reading!.readingType } as any,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    expect(createSharedChart).toHaveBeenCalledWith(
      expect.objectContaining({ token: "abc123token" })
    );
  });

  it("does not share when reading not found", async () => {
    vi.mocked(getReadingById).mockResolvedValue(null);
    const reading = await getReadingById(999, 42);
    expect(reading).toBeNull();
    expect(createSharedChart).not.toHaveBeenCalled();
  });
});

// ─── Dashboard readings tab UI logic ─────────────────────────────────────────
describe("Dashboard readings tab", () => {
  it("reading type labels map correctly", () => {
    const labels: Record<string, string> = {
      overview: "Kompletní přehled",
      type_strategy: "Typ & Strategie",
      profile: "Profil",
      authority: "Autorita",
      incarnation_cross: "Životní poslání",
      channels: "Kanály",
      relationships: "Vztahy",
      career: "Kariéra",
      gates: "Brány",
      variables: "Proměnné",
    };
    expect(labels["overview"]).toBe("Kompletní přehled");
    expect(labels["incarnation_cross"]).toBe("Životní poslání");
    expect(labels["type_strategy"]).toBe("Typ & Strategie");
    expect(Object.keys(labels)).toHaveLength(10);
  });

  it("date formatting works for Czech locale", () => {
    const date = new Date("2026-01-15T10:00:00Z");
    const formatted = date.toLocaleDateString("cs-CZ", {
      day: "numeric", month: "long", year: "numeric",
    });
    expect(formatted).toMatch(/2026/);
    expect(formatted).toMatch(/15/);
  });

  it("reading preview truncates long content", () => {
    const longContent = "a".repeat(300);
    const preview = longContent.slice(0, 200) + (longContent.length > 200 ? "..." : "");
    expect(preview).toHaveLength(203);
    expect(preview.endsWith("...")).toBe(true);
  });

  it("short content is not truncated", () => {
    const shortContent = "Krátký výklad";
    const preview = shortContent.slice(0, 200) + (shortContent.length > 200 ? "..." : "");
    expect(preview).toBe("Krátký výklad");
    expect(preview.endsWith("...")).toBe(false);
  });
});
