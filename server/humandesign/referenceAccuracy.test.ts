[Reading 116 lines from start (total: 116 lines, 0 remaining)]

import { describe, expect, it } from "vitest";
import { calculateChart } from "./calculator";

type ExpectedActivation = Record<string, string>;

function activationMap(activations: Array<{ planet: string; gate: number; line: number }>): ExpectedActivation {
  return Object.fromEntries(activations.map((a) => [a.planet, `${a.gate}.${a.line}`]));
}

describe("Human Design golden reference accuracy", () => {
  it("matches Albert Einstein's published 26 activations exactly", () => {
    // Public cross-checks:
    // https://totalhumandesign.com/design/albert-einstein
    // https://live-your-humandesign.com/de/promis/albert-einstein.html
    const chart = calculateChart({
      name: "Albert Einstein",
      birthDate: "1879-03-14",
      birthTime: "11:30",
      birthPlace: "Ulm, Germany",
      latitude: 48.3985,
      longitude: 9.9912,
      timezone: "Europe/Berlin",
    });

    expect(chart.type).toBe("Generator");
    expect(chart.profile).toBe("1/4");
    expect(chart.authority).toBe("Emotional (Solar Plexus)");
    expect(chart.definition).toBe("Split Definition");
    expect(chart.incarnationCross.gates).toEqual([36, 6, 11, 12]);

    expect(activationMap(chart.personalityActivations)).toEqual({
      Sun: "36.1",
      Earth: "6.1",
      Moon: "5.4",
      "North Node": "41.1",
      "South Node": "31.1",
      Mercury: "25.6",
      Venus: "51.2",
      Mars: "60.1",
      Jupiter: "30.4",
      Saturn: "17.1",
      Uranus: "59.2",
      Neptune: "24.1",
      Pluto: "8.1",
    });

    expect(activationMap(chart.designActivations)).toEqual({
      Sun: "11.4",
      Earth: "12.4",
      Moon: "46.3",
      "North Node": "41.3",
      "South Node": "31.3",
      Mercury: "38.3",
      Venus: "10.1",
      Mars: "14.1",
      Jupiter: "41.6",
      Saturn: "36.5",
      Uranus: "59.5",
      Neptune: "27.6",
      Pluto: "8.1",
    });
  });

  it("matches Ra Uru Hu's published 26 activations exactly", () => {
    // Public cross-checks:
    // https://www.humandesignsystem.com/archive/charts/HuRaUru.pdf
    // Published 00:05 and 00:14 variants have the same surface gate/line chart.
    const chart = calculateChart({
      name: "Ra Uru Hu",
      birthDate: "1948-04-09",
      birthTime: "00:05",
      birthPlace: "Montreal, Canada",
      latitude: 45.5017,
      longitude: -73.5673,
      timezone: "America/Toronto",
    });

    expect(chart.type).toBe("Manifestor");
    expect(chart.profile).toBe("5/1");
    expect(chart.authority).toBe("Splenic");
    expect(chart.definition).toBe("Single Definition");
    expect(chart.incarnationCross.gates).toEqual([51, 57, 61, 62]);

    expect(activationMap(chart.personalityActivations)).toEqual({
      Sun: "51.5",
      Earth: "57.5",
      Moon: "51.1",
      "North Node": "2.1",
      "South Node": "1.1",
      Mercury: "25.3",
      Venus: "20.6",
      Mars: "7.6",
      Jupiter: "10.1",
      Saturn: "7.3",
      Uranus: "12.1",
      Neptune: "48.3",
      Pluto: "33.6",
    });

    expect(activationMap(chart.designActivations)).toEqual({
      Sun: "61.1",
      Earth: "62.1",
      Moon: "41.3",
      "North Node": "23.3",
      "South Node": "43.3",
      Mercury: "60.1",
      Venus: "49.5",
      Mars: "40.2",
      Jupiter: "26.1",
      Saturn: "4.3",
      Uranus: "12.1",
      Neptune: "48.4",
      Pluto: "7.2",
    });
  });
});

[executed on device: Mac (fb8fe304-209f-41a2-b745-4ff5da12937c)]