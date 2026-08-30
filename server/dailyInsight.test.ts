import { describe, expect, it } from "vitest";
import { buildDailyInsight } from "../client/src/lib/dailyInsight";

const transits = [
  { planet: "Sun", gate: 29, theme: "Vytrvalost", themeEn: "Perseverance" },
  { planet: "Moon", gate: 10, theme: "Přirozenost", themeEn: "Naturalness" },
];

describe("buildDailyInsight", () => {
  it("personalizes a matching transit without inventing chart facts", () => {
    expect(buildDailyInsight(transits, { chartData: { type: "Generátor", activatedGates: [10] } }, "cs"))
      .toBe("Dnes se ve vaší mapě zesiluje Brána 10 — Přirozenost.");
  });

  it("uses a type-aware theme when no gate matches", () => {
    expect(buildDailyInsight(transits, { chartData: { type: "Projektor", activatedGates: [] } }, "cs"))
      .toBe("Pro váš typ Projektor: dnešní téma je vytrvalost.");
  });

  it("shows a neutral theme to anonymous visitors", () => {
    expect(buildDailyInsight(transits, undefined, "cs")).toBe("Téma dne: Vytrvalost.");
  });
});
