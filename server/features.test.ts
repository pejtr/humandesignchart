import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { cs } from "../shared/i18n/cs";

// ─── Transit Calculation Tests ─────────────────────────────────────────────

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("transit.current", () => {
  it("returns transit data with 13 planetary positions", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.transit.current();

    expect(result).toBeDefined();
    expect(result.timestamp).toBeDefined();
    expect(result.transitGates).toBeDefined();
    expect(result.transitGates.length).toBe(13);
  });

  it("each transit gate has valid gate (1-64) and line (1-6)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.transit.current();

    for (const tg of result.transitGates) {
      expect(tg.gate).toBeGreaterThanOrEqual(1);
      expect(tg.gate).toBeLessThanOrEqual(64);
      expect(tg.line).toBeGreaterThanOrEqual(1);
      expect(tg.line).toBeLessThanOrEqual(6);
      expect(typeof tg.longitude).toBe("number");
      expect(typeof tg.planet).toBe("string");
    }
  });

  it("includes all expected planets in transit data", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.transit.current();
    const planets = result.transitGates.map(tg => tg.planet);

    const expectedPlanets = [
      "Sun", "Earth", "Moon", "North Node", "South Node",
      "Mercury", "Venus", "Mars", "Jupiter", "Saturn",
      "Uranus", "Neptune", "Pluto",
    ];

    for (const planet of expectedPlanets) {
      expect(planets).toContain(planet);
    }
  });
});

// ─── Czech Translation Tests ────────────────────────────────────────────────

describe("Czech i18n translations", () => {
  it("has all required top-level sections", () => {
    expect(cs.common).toBeDefined();
    expect(cs.nav).toBeDefined();
    expect(cs.home).toBeDefined();
    expect(cs.types).toBeDefined();
    expect(cs.calculator).toBeDefined();
    expect(cs.chart).toBeDefined();
    expect(cs.dashboard).toBeDefined();
    expect(cs.comparison).toBeDefined();
    expect(cs.transits).toBeDefined();
    expect(cs.celebrities).toBeDefined();
    expect(cs.iChing).toBeDefined();
    expect(cs.footer).toBeDefined();
    expect(cs.hd).toBeDefined();
  });

  it("has all 5 HD types translated", () => {
    expect(cs.types.Manifestor).toBe("Manifestor");
    expect(cs.types.Generator).toBe("Generátor");
    expect(cs.types["Manifesting Generator"]).toBe("Manifestující Generátor");
    expect(cs.types.Projector).toBe("Projektor");
    expect(cs.types.Reflector).toBe("Reflektor");
  });

  it("has all 9 center names translated", () => {
    expect(cs.hd.centerNames.Head).toBe("Hlava");
    expect(cs.hd.centerNames.Ajna).toBe("Ajna");
    expect(cs.hd.centerNames.Throat).toBe("Hrdlo");
    expect(cs.hd.centerNames.G).toBe("G Centrum");
    expect(cs.hd.centerNames.Heart).toBe("Srdce");
    expect(cs.hd.centerNames.Sacral).toBe("Sakrální");
    expect(cs.hd.centerNames.SolarPlexus).toBe("Solární Plexus");
    expect(cs.hd.centerNames.Spleen).toBe("Slezina");
    expect(cs.hd.centerNames.Root).toBe("Kořen");
  });

  it("has all 13 planet names translated", () => {
    const planets = cs.hd.planets;
    expect(Object.keys(planets).length).toBe(13);
    expect(planets.Sun).toBe("Slunce");
    expect(planets.Moon).toBe("Měsíc");
    expect(planets.Pluto).toBe("Pluto");
  });

  it("has all strategy translations", () => {
    expect(cs.hd.strategies["To Inform"]).toBe("Informovat");
    expect(cs.hd.strategies["To Respond"]).toBe("Reagovat");
    expect(cs.hd.strategies["Wait for the Invitation"]).toBe("Čekat na Pozvání");
    expect(cs.hd.strategies["Wait a Lunar Cycle"]).toBe("Čekat Lunární Cyklus");
  });

  it("has all definition type translations", () => {
    expect(cs.hd.definitionTypes["Single Definition"]).toBe("Jednoduchá Definice");
    expect(cs.hd.definitionTypes["Split Definition"]).toBe("Rozdělená Definice");
    expect(cs.hd.definitionTypes["No Definition"]).toBe("Bez Definice");
  });

  it("has all signature and not-self translations", () => {
    expect(cs.hd.signatures.Peace).toBe("Mír");
    expect(cs.hd.signatures.Satisfaction).toBe("Spokojenost");
    expect(cs.hd.signatures.Success).toBe("Úspěch");
    expect(cs.hd.signatures.Surprise).toBe("Překvapení");

    expect(cs.hd.notSelfs.Anger).toBe("Hněv");
    expect(cs.hd.notSelfs.Frustration).toBe("Frustrace");
    expect(cs.hd.notSelfs.Bitterness).toBe("Hořkost");
    expect(cs.hd.notSelfs.Disappointment).toBe("Zklamání");
  });

  it("has chart result page translations", () => {
    expect(cs.chart.bodygraph).toBeDefined();
    expect(cs.chart.typeStrategy).toBeDefined();
    expect(cs.chart.aiReading).toBeDefined();
    expect(cs.chart.downloadPdf).toBeDefined();
    expect(cs.chart.activations).toBeDefined();
    expect(cs.chart.channels).toBeDefined();
    expect(cs.chart.centers).toBeDefined();
    expect(cs.chart.variables).toBeDefined();
    expect(cs.chart.gates).toBeDefined();
  });

  it("has AI reading type translations", () => {
    expect(cs.chart.aiTypes.overview).toBeDefined();
    expect(cs.chart.aiTypes.type_strategy).toBeDefined();
    expect(cs.chart.aiTypes.profile).toBeDefined();
    expect(cs.chart.aiTypes.authority).toBeDefined();
    expect(cs.chart.aiTypes.incarnation_cross).toBeDefined();
    expect(cs.chart.aiTypes.channels).toBeDefined();
    expect(cs.chart.aiTypes.gates).toBeDefined();
    expect(cs.chart.aiTypes.variables).toBeDefined();
    expect(cs.chart.aiTypes.relationships).toBeDefined();
    expect(cs.chart.aiTypes.career).toBeDefined();
  });

  it("has navigation translations", () => {
    expect(cs.nav.calculateChart).toBe("Vypočítat Chart");
    expect(cs.nav.transits).toBe("Tranzity");
    expect(cs.nav.celebrities).toBe("Celebrity");
    expect(cs.nav.iChing).toBe("I-Ťing Orákulum");
    expect(cs.nav.compare).toBe("Porovnání");
    expect(cs.nav.dashboard).toBe("Nástěnka");
  });
});

// ─── Chart Calculation via Router Tests ─────────────────────────────────────

describe("chart.calculate via router", () => {
  it("calculates a chart via the public procedure", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.chart.calculate({
      name: "Test User",
      birthDate: "1990-01-15",
      birthTime: "12:00",
      birthPlace: "Prague",
      latitude: 50.0755,
      longitude: 14.4378,
      timezoneOffset: 1,
      timezone: "CET",
    });

    expect(result).toBeDefined();
    expect(result.type).toBeDefined();
    expect(result.profile).toBeDefined();
    expect(result.authority).toBeDefined();
    expect(result.strategy).toBeDefined();
    expect(result.signature).toBeDefined();
    expect(result.notSelf).toBeDefined();
    expect(result.definition).toBeDefined();
    expect(result.incarnationCross).toBeDefined();
    expect(result.personalityActivations.length).toBe(13);
    expect(result.designActivations.length).toBe(13);
    expect(result.centers.length).toBe(9);
  });

  it("validates input - rejects empty name", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.chart.calculate({
        name: "",
        birthDate: "1990-01-15",
        birthTime: "12:00",
        birthPlace: "Prague",
        latitude: 50.0755,
        longitude: 14.4378,
        timezoneOffset: 1,
        timezone: "CET",
      })
    ).rejects.toThrow();
  });
});
