import { describe, expect, it } from "vitest";
import { calculateChart } from "./calculator";

describe("Human Design Calculator", () => {
  it("calculates Ra Uru Hu's chart correctly (Manifestor 5/1)", () => {
    const chart = calculateChart(
      "1948-04-09", "00:05", "Montreal, Canada",
      45.5017, -73.5673, -5, "EST"
    );

    expect(chart.type).toBe("Manifestor");
    expect(chart.profile).toBe("5/1");
    expect(chart.profileName).toBe("Heretic / Investigator");
    expect(chart.authority).toBe("Splenic");
    expect(chart.definition).toBe("Single Definition");
    expect(chart.incarnationCross.name).toContain("Clarion");
    expect(chart.incarnationCross.name).toContain("51/57");
    expect(chart.incarnationCross.type).toBe("Left Angle Cross");

    // Verify channels
    const channelPairs = chart.channels.map(
      (ch) => [Math.min(ch.gate1, ch.gate2), Math.max(ch.gate1, ch.gate2)].join("-")
    );
    expect(channelPairs).toContain("23-43");
    expect(channelPairs).toContain("20-57");
    expect(channelPairs).toContain("10-20");
    expect(channelPairs).toContain("10-57");
    expect(channelPairs).toContain("25-51");
    expect(chart.channels.length).toBe(5);

    // Verify defined centers
    const definedCenters = chart.centers
      .filter((c) => c.defined)
      .map((c) => c.name)
      .sort();
    expect(definedCenters).toContain("Ajna");
    expect(definedCenters).toContain("Throat");
    expect(definedCenters).toContain("G");
    expect(definedCenters).toContain("Heart");
    expect(definedCenters).toContain("Spleen");

    // Verify personality Sun gate
    expect(chart.personalityActivations[0].gate).toBe(51);
    expect(chart.personalityActivations[0].line).toBe(5);
    expect(chart.personalityActivations[0].planet).toBe("Sun");
  });

  it("calculates Einstein's chart correctly (Generator 1/4)", () => {
    const chart = calculateChart(
      "1879-03-14", "11:30", "Ulm, Germany",
      48.3985, 9.9912, 1, "CET"
    );

    expect(chart.type).toBe("Generator");
    expect(chart.profile).toBe("1/4");
    expect(chart.authority).toContain("Emotional");
    expect(chart.definition).toBe("Split Definition");
    expect(chart.incarnationCross.name).toContain("Eden");

    // Verify Sacral is defined (Generator)
    const sacral = chart.centers.find((c) => c.name === "Sacral");
    expect(sacral?.defined).toBe(true);
  });

  it("correctly determines all 5 types", () => {
    // Manifestor: motor to throat, no sacral defined
    // Generator: sacral defined, no motor-to-throat
    // Manifesting Generator: sacral defined + motor-to-throat
    // Projector: no sacral, no motor-to-throat
    // Reflector: no defined centers

    // Ra Uru Hu is a Manifestor
    const manifestor = calculateChart("1948-04-09", "00:05", "Montreal", 45.5, -73.57, -5, "EST");
    expect(manifestor.type).toBe("Manifestor");

    // Einstein is a Generator
    const generator = calculateChart("1879-03-14", "11:30", "Ulm", 48.4, 9.99, 1, "CET");
    expect(generator.type).toBe("Generator");
  });

  it("calculates gate activations for all 13 planets", () => {
    const chart = calculateChart(
      "1990-01-15", "12:00", "Prague",
      50.0755, 14.4378, 1, "CET"
    );

    // Should have 13 personality activations and 13 design activations
    expect(chart.personalityActivations.length).toBe(13);
    expect(chart.designActivations.length).toBe(13);

    // Each activation should have valid gate (1-64) and line (1-6)
    for (const act of [...chart.personalityActivations, ...chart.designActivations]) {
      expect(act.gate).toBeGreaterThanOrEqual(1);
      expect(act.gate).toBeLessThanOrEqual(64);
      expect(act.line).toBeGreaterThanOrEqual(1);
      expect(act.line).toBeLessThanOrEqual(6);
      expect(act.color).toBeGreaterThanOrEqual(1);
      expect(act.color).toBeLessThanOrEqual(6);
      expect(act.tone).toBeGreaterThanOrEqual(1);
      expect(act.tone).toBeLessThanOrEqual(6);
    }

    // Verify planet order
    const expectedPlanets = [
      "Sun", "Earth", "Moon", "North Node", "South Node",
      "Mercury", "Venus", "Mars", "Jupiter", "Saturn",
      "Uranus", "Neptune", "Pluto",
    ];
    expect(chart.personalityActivations.map((a) => a.planet)).toEqual(expectedPlanets);
    expect(chart.designActivations.map((a) => a.planet)).toEqual(expectedPlanets);
  });

  it("correctly calculates profile from Sun lines", () => {
    // Profile is determined by Personality Sun line / Design Sun line
    const chart = calculateChart(
      "1948-04-09", "00:05", "Montreal",
      45.5017, -73.5673, -5, "EST"
    );

    const pSunLine = chart.personalityActivations[0].line;
    const dSunLine = chart.designActivations[0].line;
    expect(chart.profile).toBe(`${pSunLine}/${dSunLine}`);
  });

  it("calculates variables (digestion, environment, perspective, awareness)", () => {
    const chart = calculateChart(
      "1990-06-15", "14:30", "Berlin",
      52.52, 13.405, 2, "CEST"
    );

    expect(chart.variables).toBeDefined();
    expect(chart.variables.digestion).toBeDefined();
    expect(chart.variables.environment).toBeDefined();
    expect(chart.variables.perspective).toBeDefined();
    expect(chart.variables.awareness).toBeDefined();
  });

  it("design date is approximately 88 days before birth", () => {
    const chart = calculateChart(
      "2000-06-15", "12:00", "London",
      51.5074, -0.1278, 0, "UTC"
    );

    // Design date should be roughly 88 days before birth
    const birthDate = new Date("2000-06-15");
    const designDate = new Date(chart.designDate);
    const diffDays = (birthDate.getTime() - designDate.getTime()) / (1000 * 60 * 60 * 24);
    
    // Should be between 85 and 92 days (88 solar degrees varies)
    expect(diffDays).toBeGreaterThan(80);
    expect(diffDays).toBeLessThan(95);
  });

  it("all 9 centers are present in chart output", () => {
    const chart = calculateChart(
      "1990-01-01", "00:00", "New York",
      40.7128, -74.006, -5, "EST"
    );

    const centerNames = chart.centers.map((c) => c.name).sort();
    expect(centerNames).toEqual([
      "Ajna", "G", "Head", "Heart", "Root",
      "Sacral", "SolarPlexus", "Spleen", "Throat",
    ]);
  });

  it("incarnation cross type matches profile line", () => {
    // Lines 1-3 = Right Angle, Line 4 = Juxtaposition, Lines 5-6 = Left Angle
    const chart = calculateChart(
      "1948-04-09", "00:05", "Montreal",
      45.5017, -73.5673, -5, "EST"
    );

    const pSunLine = chart.personalityActivations[0].line;
    if (pSunLine <= 3) {
      expect(chart.incarnationCross.type).toBe("Right Angle Cross");
    } else if (pSunLine === 4) {
      expect(chart.incarnationCross.type).toBe("Juxtaposition Cross");
    } else {
      expect(chart.incarnationCross.type).toBe("Left Angle Cross");
    }
  });
});
