import { z } from "zod";
import { ChartResultSchema, type ChartResult } from "../../shared/chartSchemas";
import { getReadingPrompt, getSystemPrompt } from "./prompts";
import {
  AI_PROMPT_VERSION,
  GROUNDED_READING_JSON_SCHEMA,
  GroundingError,
  immutableFacts,
  validateGroundedReading,
} from "./grounding";

export const READING_TYPES = ["overview", "type_strategy", "profile", "authority", "incarnation_cross", "channels", "gates", "variables", "relationships", "career", "moon"] as const;

export const OwnedReadingInputSchema = z.object({
  chartId: z.number().int().positive(),
  readingType: z.enum(READING_TYPES),
  question: z.string().trim().min(1).max(2_000).optional(),
  locale: z.enum(["cs", "en"]).default("cs"),
}).strict();

export type OwnedReadingInput = z.infer<typeof OwnedReadingInputSchema>;

type StoredChart = { id: number; chartData: unknown };
type ModelResult = {
  model: string;
  choices?: Array<{ message?: { content?: unknown } }>;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
};

export interface OwnedReadingDependencies {
  loadOwnedChart(chartId: number, userId: number): Promise<StoredChart | null>;
  invoke(params: { messages: Array<{ role: "system" | "user"; content: string }>; outputSchema: { name: string; strict: boolean; schema: Record<string, unknown> } }): Promise<ModelResult>;
  persist(input: {
    userId: number;
    chartId: number;
    readingType: string;
    content: string;
    model: string;
    promptVersion: string;
    latencyMs: number;
    inputTokens: number | null;
    outputTokens: number | null;
    consumeCredit: boolean;
  }): Promise<number>;
  getMoonContext?(): Promise<unknown>;
}

export class OwnedReadingError extends Error {
  constructor(public readonly code: "CHART_NOT_FOUND" | "INVALID_CANONICAL_CHART" | "AI_GROUNDING_FAILED", message: string) {
    super(message);
    this.name = "OwnedReadingError";
  }
}

function groundedPrompt(chart: ChartResult, readingType: string, isEn: boolean, question?: string, moonContext?: unknown) {
  const promptChart = moonContext ? { ...chart, currentMoon: moonContext } : chart;
  const facts = immutableFacts(chart);
  const narrative = isEn
    ? "Narrative frame: the user is the hero, this chart is their map, and Marie is a calm guide. The guide illuminates choices but never replaces the hero's agency."
    : "Narativní rámec: uživatel je hrdina, tato mapa je jeho mapou cesty a Marie je klidná průvodkyně. Průvodkyně osvětluje volby, ale nikdy nepřebírá hrdinovu svobodnou vůli.";
  return `${getReadingPrompt(promptChart, readingType, isEn)}\n\n${narrative}\n\nIMMUTABLE FACTS — copy this object byte-for-byte into the facts field:\n${JSON.stringify(facts)}\n\nReturn only the required JSON object. Never reinterpret or change Type, Strategy, Authority, Profile, Definition, Centers, Channels or Gates.${question ? `\n\nUser question (interpretive, non-authoritative): ${question}` : ""}`;
}

export async function generateOwnedReading(args: {
  userId: number;
  input: OwnedReadingInput;
  consumeCredit: boolean;
  dependencies: OwnedReadingDependencies;
}) {
  const stored = await args.dependencies.loadOwnedChart(args.input.chartId, args.userId);
  if (!stored) throw new OwnedReadingError("CHART_NOT_FOUND", "Chart not found");

  const parsedChart = ChartResultSchema.safeParse(stored.chartData);
  if (!parsedChart.success) {
    throw new OwnedReadingError("INVALID_CANONICAL_CHART", "Stored chart is not a valid canonical chart");
  }
  const chart = parsedChart.data;
  const moonContext = args.input.readingType === "moon" ? await args.dependencies.getMoonContext?.() : undefined;
  const isEn = args.input.locale === "en";
  const started = performance.now();
  const response = await args.dependencies.invoke({
    messages: [
      { role: "system", content: getSystemPrompt(isEn) },
      { role: "user", content: groundedPrompt(chart, args.input.readingType, isEn, args.input.question, moonContext) },
    ],
    outputSchema: GROUNDED_READING_JSON_SCHEMA,
  });
  const latencyMs = Math.max(0, Math.round(performance.now() - started));
  const raw = response.choices?.[0]?.message?.content;
  if (typeof raw !== "string") throw new OwnedReadingError("AI_GROUNDING_FAILED", "AI output was not textual JSON");

  let content: string;
  try {
    content = validateGroundedReading(raw, chart);
  } catch (error) {
    if (error instanceof GroundingError) {
      throw new OwnedReadingError("AI_GROUNDING_FAILED", `${error.code}: ${error.message}`);
    }
    throw error;
  }

  const id = await args.dependencies.persist({
    userId: args.userId,
    chartId: stored.id,
    readingType: args.input.readingType,
    content,
    model: response.model,
    promptVersion: AI_PROMPT_VERSION,
    latencyMs,
    inputTokens: response.usage?.prompt_tokens ?? null,
    outputTokens: response.usage?.completion_tokens ?? null,
    consumeCredit: args.consumeCredit,
  });
  return { id, content, groundingStatus: "verified" as const };
}
