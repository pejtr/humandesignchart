import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const page = readFileSync(resolve("client/src/pages/ChartCalculator.tsx"),"utf8");
const css = readFileSync(resolve("client/src/pages/ChartCalculatorAmbient.css"),"utf8");

describe("Human Design calculator premium background — strictly visual", () => {
  it("uses a continuous backdrop instead of a hard-coded 34rem hero strip", () => {
    expect(page).toContain('className="hd-calculator-backdrop"');
    expect(page).toContain("hd-calculator-category-wash");
    expect(page).toContain("style={{ background: heroVisual.background }}");
    expect(page).not.toContain('top-16 h-[34rem]');
    expect(css).toContain("hd-calculator-horizon");
    expect(css).toContain("linear-gradient(180deg, #fbfaff");
  });

  it("preserves the complete birth data flow and calculation controls", () => {
    expect(page).toContain('form onSubmit={handleSubmit}');
    expect(page).toContain("triggerCalculation(");
    expect(page).toContain('htmlFor="birthDate"');
    expect(page).toContain('htmlFor="birthTime"');
    expect(page).toContain('htmlFor="name"');
    expect(page).toContain("locationResolved");
    expect(page).toContain("calculateMutation.isPending");
  });

  it("isolates decor from inputs and supports accessible reduced-motion", () => {
    expect(css).toContain(".hd-calculator-page");
    expect(css).toContain("pointer-events: none");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain(".dark .hd-calculator-page");
    expect(css).toContain("@media (max-width: 640px)");
    expect(css).not.toContain("position: fixed");
    expect(page).toContain('aria-hidden="true"');
    expect(page).toContain('hd-calculator-cta');
  });
});
