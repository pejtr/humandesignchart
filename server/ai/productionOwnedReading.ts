import { getChartById, persistGroundedAiReading } from "../db";
import { invokeLLM } from "../_core/llm";
import { getMoonReadingContext } from "../routers/transit";
import type { OwnedReadingDependencies } from "./ownedReading";

export function productionOwnedReadingDependencies(): OwnedReadingDependencies {
  return {
    loadOwnedChart: getChartById,
    invoke: ({ messages, outputSchema }) => invokeLLM({ messages, outputSchema }),
    persist: (input) => persistGroundedAiReading({
      userId: input.userId,
      chartId: input.chartId,
      readingType: input.readingType,
      content: input.content,
      model: input.model,
      promptVersion: input.promptVersion,
      latencyMs: input.latencyMs,
      inputTokens: input.inputTokens,
      outputTokens: input.outputTokens,
      estimatedCostMicros: null,
      groundingStatus: "verified",
      consumeCredit: input.consumeCredit,
    }),
    getMoonContext: getMoonReadingContext,
  };
}
