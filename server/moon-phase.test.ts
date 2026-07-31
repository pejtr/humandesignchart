import { describe, expect, it } from "vitest";
import { calculateMoonPhase } from "./routers/transit";

describe("calculateMoonPhase", () => {
  it("identifies a new moon when Sun and Moon share a longitude", () => {
    expect(calculateMoonPhase({ Sun: 42, Moon: 42 })).toMatchObject({
      name: "new_moon",
      illumination: 0,
      waxing: true,
    });
  });

  it("identifies a full moon around 180 degrees", () => {
    expect(calculateMoonPhase({ Sun: 10, Moon: 190 })).toMatchObject({
      name: "full_moon",
      illumination: 100,
      waxing: false,
    });
  });

  it("normalizes longitudes across the zero-degree boundary", () => {
    const phase = calculateMoonPhase({ Sun: 350, Moon: 80 });
    expect(phase.name).toBe("first_quarter");
    expect(phase.angle).toBe(90);
    expect(phase.illumination).toBe(50);
  });
});
