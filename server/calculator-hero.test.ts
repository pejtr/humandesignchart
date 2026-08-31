import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("calculator recipient hero", () => {
  it("provides a distinct accessible visual context for every recipient option", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/pages/ChartCalculator.tsx"), "utf8");
    for (const option of ["self", "friend", "family", "client", "other", "celebrity"]) {
      expect(source).toContain(`${option}: { eyebrowCs:`);
    }
    expect(source).toContain("style={{ background: heroVisual.background }}");
    expect(source).toContain("aria-pressed={active}");
    expect(source).not.toContain("disabled={!isAuthenticated}");
  });
});
