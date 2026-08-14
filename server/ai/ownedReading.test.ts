import { describe, expect, it, vi } from "vitest";
import { calculateChart } from "../humandesign/calculator";
import { goldenCharts } from "../humandesign/fixtures/goldenCharts.fixture";
import { ChartResultSchema } from "../../shared/chartSchemas";
import { immutableFacts } from "./grounding";
import { generateOwnedReading, OwnedReadingError, OwnedReadingInputSchema, type OwnedReadingDependencies } from "./ownedReading";

const chart = ChartResultSchema.parse(calculateChart(goldenCharts[0].input));

function dependencies(overrides: Partial<OwnedReadingDependencies> = {}): OwnedReadingDependencies {
  return {
    loadOwnedChart: vi.fn().mockResolvedValue({ id: 11, chartData: chart }),
    invoke: vi.fn().mockResolvedValue({
      model: "test-model",
      choices: [{ message: { content: JSON.stringify({ facts: immutableFacts(chart), interpretationMarkdown: "## Vaše cesta\nMapa osvětluje další krok." }) } }],
      usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
    }),
    persist: vi.fn().mockResolvedValue(91),
    ...overrides,
  };
}

function contradictoryDependencies(
  mutate: (facts: ReturnType<typeof immutableFacts>) => ReturnType<typeof immutableFacts>,
) {
  const persist = vi.fn();
  const facts = mutate(structuredClone(immutableFacts(chart)));
  return {
    persist,
    dependencies: dependencies({
      invoke: vi.fn().mockResolvedValue({
        model: "test-model",
        choices: [{ message: { content: JSON.stringify({ facts, interpretationMarkdown: "text" }) } }],
      }),
      persist,
    }),
  };
}

describe("owned grounded AI readings", () => {
  it("rejects client-supplied deterministic chart data", () => {
    const result = OwnedReadingInputSchema.safeParse({ chartId: 11, readingType: "overview", locale: "cs", chartData: { type: "Projector" } });
    expect(result.success).toBe(false);
  });

  it.each(["type", "profile", "authority"])("rejects a client-supplied %s override", field => {
    const result = OwnedReadingInputSchema.safeParse({ chartId: 11, readingType: "overview", locale: "cs", [field]: "attacker value" });
    expect(result.success).toBe(false);
  });

  it("returns the same not-found contract for missing and non-owned chart ids", async () => {
    for (const chartId of [404, 12]) {
      const deps = dependencies({ loadOwnedChart: vi.fn().mockResolvedValue(null) });
      const result = generateOwnedReading({ userId: 7, input: { chartId, readingType: "overview", locale: "cs" }, consumeCredit: false, dependencies: deps });
      await expect(result).rejects.toMatchObject({ code: "CHART_NOT_FOUND", message: "Chart not found" });
    }
  });

  it("rejects tampered or legacy stored chart data before invoking the model", async () => {
    const invoke = vi.fn();
    const deps = dependencies({ loadOwnedChart: vi.fn().mockResolvedValue({ id: 11, chartData: { ...chart, type: "Projector", calculationVersion: "tampered" } }), invoke });
    await expect(generateOwnedReading({ userId: 7, input: { chartId: 11, readingType: "overview", locale: "cs" }, consumeCredit: false, dependencies: deps }))
      .rejects.toMatchObject({ code: "INVALID_CANONICAL_CHART" });
    expect(invoke).not.toHaveBeenCalled();
  });

  it("does not persist or consume credit when the model contradicts immutable facts", async () => {
    const { persist, dependencies: deps } = contradictoryDependencies(facts => ({ ...facts, type: "Projector" }));
    const result = generateOwnedReading({ userId: 7, input: { chartId: 11, readingType: "overview", locale: "cs" }, consumeCredit: true, dependencies: deps });
    await expect(result).rejects.toBeInstanceOf(OwnedReadingError);
    await expect(result).rejects.toMatchObject({ code: "AI_GROUNDING_FAILED" });
    expect(persist).not.toHaveBeenCalled();
  });

  it.each([
    ["gate", (facts: ReturnType<typeof immutableFacts>) => ({ ...facts, gates: [...facts.gates, 64].sort((a, b) => a - b) })],
    ["channel", (facts: ReturnType<typeof immutableFacts>) => ({ ...facts, channels: [...facts.channels, "1-8"].sort() })],
    ["center", (facts: ReturnType<typeof immutableFacts>) => ({ ...facts, centers: facts.centers.map((center, index) => index === 0 ? { ...center, defined: !center.defined } : center) })],
  ] as const)("rejects a hallucinated %s and neither returns nor persists it", async (_kind, mutate) => {
    const { persist, dependencies: deps } = contradictoryDependencies(mutate);
    await expect(generateOwnedReading({
      userId: 7,
      input: { chartId: 11, readingType: "overview", locale: "cs" },
      consumeCredit: true,
      dependencies: deps,
    })).rejects.toMatchObject({ code: "AI_GROUNDING_FAILED" });
    expect(persist).not.toHaveBeenCalled();
  });

  it.each([
    ["provider timeout", vi.fn().mockRejectedValue(new Error("provider timeout"))],
    ["invalid structured output", vi.fn().mockResolvedValue({ model: "test-model", choices: [{ message: { content: "not-json" } }] })],
  ])("does not persist or consume credit after %s", async (_kind, invoke) => {
    const persist = vi.fn();
    await expect(generateOwnedReading({
      userId: 7,
      input: { chartId: 11, readingType: "overview", locale: "cs" },
      consumeCredit: true,
      dependencies: dependencies({ invoke, persist }),
    })).rejects.toBeDefined();
    expect(persist).not.toHaveBeenCalled();
  });

  it("does not deliver a reading when persistence fails", async () => {
    const persist = vi.fn().mockRejectedValue(new Error("database insert failed"));
    await expect(generateOwnedReading({
      userId: 7,
      input: { chartId: 11, readingType: "overview", locale: "cs" },
      consumeCredit: true,
      dependencies: dependencies({ persist }),
    })).rejects.toThrow("database insert failed");
  });

  it("persists verified content and telemetry only after grounding passes", async () => {
    const persist = vi.fn().mockResolvedValue(91);
    const deps = dependencies({ persist });
    const result = await generateOwnedReading({ userId: 7, input: { chartId: 11, readingType: "overview", locale: "cs" }, consumeCredit: true, dependencies: deps });
    expect(result).toMatchObject({ id: 91, groundingStatus: "verified" });
    expect(persist).toHaveBeenCalledWith(expect.objectContaining({ chartId: 11, consumeCredit: true, model: "test-model", promptVersion: "phase1-p0-grounded-v1", inputTokens: 100, outputTokens: 50 }));
    expect(deps.loadOwnedChart).toHaveBeenCalledWith(11, 7);
    const invokedPrompt = vi.mocked(deps.invoke).mock.calls[0][0].messages.find(message => message.role === "user")?.content;
    expect(invokedPrompt).toContain(JSON.stringify(immutableFacts(chart)));
  });
});
