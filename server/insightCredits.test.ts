import { describe, it, expect } from "vitest";
import { InsightCreditsEngine } from "./insightCredits";

describe("Insight Credits Economy", () => {
  it("should validate spending balance correctly", () => {
    expect(InsightCreditsEngine.canSpend(10, "extra_ai_reading").allowed).toBe(true);
    expect(InsightCreditsEngine.canSpend(1, "relationship_dynamics_export").allowed).toBe(false);
  });

  it("should calculate balance delta safely", () => {
    expect(InsightCreditsEngine.calculateNewBalance(5, -3)).toBe(2);
    expect(InsightCreditsEngine.calculateNewBalance(2, -5)).toBe(0); // non-negative floor
  });
});
