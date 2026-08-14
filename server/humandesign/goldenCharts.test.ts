import { describe, expect, it } from "vitest";
import { ChartResultSchema } from "../../shared/chartSchemas";
import { calculateChart } from "./calculator";
import { goldenCharts } from "./fixtures/goldenCharts.fixture";

describe("golden chart fixtures", () => {
  for (const fixture of goldenCharts) {
    it(`${fixture.id} remains deterministic`, () => {
      const first = ChartResultSchema.parse(calculateChart(fixture.input));
      const second = ChartResultSchema.parse(calculateChart(fixture.input));

      expect(second).toEqual(first);
      expect({
        calculationVersion: first.calculationVersion,
        birthUtc: first.birthUtc,
        utcOffsetSeconds: first.utcOffsetSeconds,
        type: first.type,
        strategy: first.strategy,
        authority: first.authority,
        profile: first.profile,
        definition: first.definition,
        activatedGates: first.activatedGates,
        channels: first.channels.map((channel) => [channel.gate1, channel.gate2]),
      }).toEqual(fixture.expected);
    });
  }
});
