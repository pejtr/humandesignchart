import { z } from "zod";
import type { ChartResult } from "../../shared/chartSchemas";

export const AI_PROMPT_VERSION = "phase1-p0-grounded-v1";

const CenterFactSchema = z.object({ name: z.string(), defined: z.boolean() });
const ImmutableChartFactsSchema = z.object({
  type: z.string(),
  strategy: z.string(),
  authority: z.string(),
  profile: z.string(),
  definition: z.string(),
  centers: z.array(CenterFactSchema),
  channels: z.array(z.string()),
  gates: z.array(z.number().int()),
});

export const GroundedReadingResponseSchema = z.object({
  facts: ImmutableChartFactsSchema,
  interpretationMarkdown: z.string().min(1),
});

export type ImmutableChartFacts = z.infer<typeof ImmutableChartFactsSchema>;

export const GROUNDED_READING_JSON_SCHEMA: { name: string; strict: boolean; schema: Record<string, unknown> } = {
  name: "grounded_human_design_reading",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["facts", "interpretationMarkdown"],
    properties: {
      facts: {
        type: "object",
        additionalProperties: false,
        required: ["type", "strategy", "authority", "profile", "definition", "centers", "channels", "gates"],
        properties: {
          type: { type: "string" },
          strategy: { type: "string" },
          authority: { type: "string" },
          profile: { type: "string" },
          definition: { type: "string" },
          centers: { type: "array", items: { type: "object", additionalProperties: false, required: ["name", "defined"], properties: { name: { type: "string" }, defined: { type: "boolean" } } } },
          channels: { type: "array", items: { type: "string" } },
          gates: { type: "array", items: { type: "integer" } },
        },
      },
      interpretationMarkdown: { type: "string" },
    },
  },
};

export function immutableFacts(chart: ChartResult): ImmutableChartFacts {
  return {
    type: chart.type,
    strategy: chart.strategy,
    authority: chart.authority,
    profile: chart.profile,
    definition: chart.definition,
    centers: chart.centers.map(({ name, defined }) => ({ name, defined })).sort((a, b) => a.name.localeCompare(b.name)),
    channels: chart.channels.map(({ gate1, gate2 }) => `${Math.min(gate1, gate2)}-${Math.max(gate1, gate2)}`).sort(),
    gates: Array.from(new Set(chart.activatedGates)).sort((a, b) => a - b),
  };
}

function normalizeModelJson(raw: string): unknown {
  const trimmed = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  return JSON.parse(trimmed);
}

export class GroundingError extends Error {
  constructor(public readonly code: "MALFORMED_AI_OUTPUT" | "IMMUTABLE_FACT_MISMATCH", message: string) {
    super(message);
    this.name = "GroundingError";
  }
}

export function validateGroundedReading(raw: string, chart: ChartResult) {
  let parsed: z.infer<typeof GroundedReadingResponseSchema>;
  try {
    parsed = GroundedReadingResponseSchema.parse(normalizeModelJson(raw));
  } catch (error) {
    throw new GroundingError("MALFORMED_AI_OUTPUT", error instanceof Error ? error.message : String(error));
  }
  const expected = immutableFacts(chart);
  if (JSON.stringify(parsed.facts) !== JSON.stringify(expected)) {
    throw new GroundingError("IMMUTABLE_FACT_MISMATCH", "The model returned deterministic chart facts that differ from the canonical chart.");
  }
  return parsed.interpretationMarkdown;
}
