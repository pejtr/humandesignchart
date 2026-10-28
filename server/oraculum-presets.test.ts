import { describe, expect, it } from "vitest";
import { localizeOraculumPresetQuestion as localize } from "../client/src/lib/oraculumPresetQuestions";

describe("localized ORACULUM preset questions", () => {
  it("translates a Czech preset carried to the English page", () => {
    expect(localize("Co znamená Sakrál?", "en")).toBe("What is Sacral?");
    expect(localize("Jaký je můj typ?", "en")).toBe("What is my type?");
    expect(localize("Jak fungují tranzity?", "en")).toBe("How do transits work?");
  });
  it("translates the matching English preset back to Czech", () => {
    expect(localize("What is Sacral?", "cs")).toBe("Co znamená Sakrál?");
  });
  it("never translates user-entered text or other locales", () => {
    expect(localize("Co cítím dnes?", "en")).toBe("Co cítím dnes?");
    expect(localize("Co znamená Sakrál?", "de")).toBe("Co znamená Sakrál?");
  });
});
