import { z } from "zod";

export const CALCULATION_VERSION = "2.1.0-reference-verified" as const;

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^\d{2}:\d{2}(?::\d{2})?$/;

export const LocalTimeDisambiguationSchema = z.enum(["earlier", "later"]);

const ChartCalculationBaseSchema = z.object({
  name: z.string().trim().min(1).max(200),
  birthDate: z.string().regex(datePattern, "birthDate must use YYYY-MM-DD"),
  birthTime: z.string().regex(timePattern, "birthTime must use HH:mm or HH:mm:ss"),
  birthPlace: z.string().trim().min(1).max(500),
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
  disambiguation: LocalTimeDisambiguationSchema.optional(),
});

export const ChartCalculationRequestSchema = ChartCalculationBaseSchema;

export const ChartCalculationInputSchema = ChartCalculationBaseSchema.extend({
  timezone: z.string().trim().min(1).max(100),
});

const PlanetSourceSchema = z.object({
  planet: z.string(),
  type: z.enum(["personality", "design"]),
});

const GateActivationSchema = z.object({
  gate: z.number().int().min(1).max(64),
  line: z.number().int().min(1).max(6),
  color: z.number().int().min(1).max(6),
  tone: z.number().int().min(1).max(6),
  base: z.number().int().min(1).max(5),
  planet: z.string(),
  type: z.enum(["personality", "design"]),
  longitude: z.number().finite(),
});

const ChannelActivationSchema = z.object({
  gate1: z.number().int().min(1).max(64),
  gate2: z.number().int().min(1).max(64),
  centerA: z.string(),
  centerB: z.string(),
  activatedBy: z.object({
    gate1Sources: z.array(PlanetSourceSchema),
    gate2Sources: z.array(PlanetSourceSchema),
  }),
});

const CenterStatusSchema = z.object({
  name: z.string(),
  defined: z.boolean(),
  gates: z.array(z.number().int().min(1).max(64)),
  activatedGates: z.array(z.number().int().min(1).max(64)),
});

const VariableSchema = z.object({
  type: z.string(),
  color: z.number().int(),
  tone: z.number().int(),
  arrow: z.string(),
});

export const ChartResultSchema = z.object({
  calculationVersion: z.literal(CALCULATION_VERSION),
  birthDate: z.string().regex(datePattern),
  birthTime: z.string().regex(timePattern),
  birthPlace: z.string(),
  timezone: z.string(),
  birthUtc: z.string().datetime({ offset: true }),
  utcOffsetMinutes: z.number().finite(),
  utcOffsetSeconds: z.number().int(),
  type: z.string(),
  profile: z.string(),
  profileName: z.string(),
  strategy: z.string(),
  authority: z.string(),
  signature: z.string(),
  notSelf: z.string(),
  aura: z.string(),
  definition: z.string(),
  incarnationCross: z.object({
    name: z.string(),
    type: z.string(),
    // Zod's tuple inference in the deployed TypeScript version widens to an
    // optional-length tuple. Preserve the exact 4-number domain contract.
    gates: z.custom<[number, number, number, number]>(value =>
      Array.isArray(value) && value.length === 4 && value.every(gate =>
        typeof gate === "number" && Number.isInteger(gate) && gate >= 1 && gate <= 64
      )
    ),
  }),
  variables: z.object({
    digestion: VariableSchema,
    environment: VariableSchema,
    perspective: VariableSchema,
    awareness: VariableSchema,
  }),
  dreamRave: z.object({
    type: z.string(),
    activatedGates: z.array(z.number()),
    centers: z.array(CenterStatusSchema),
    channels: z.array(ChannelActivationSchema),
    activeRealms: z.object({
      lightField: z.array(z.number()),
      earthPlane: z.array(z.number()),
      demonRealm: z.array(z.number()),
    }),
  }),
  personalityActivations: z.array(GateActivationSchema),
  designActivations: z.array(GateActivationSchema),
  channels: z.array(ChannelActivationSchema),
  centers: z.array(CenterStatusSchema),
  activatedGates: z.array(z.number().int().min(1).max(64)),
  personalityPositions: z.record(z.string(), z.number().finite()),
  designPositions: z.record(z.string(), z.number().finite()),
  designDate: z.string().regex(datePattern),
});

export type ChartCalculationInput = z.infer<typeof ChartCalculationInputSchema>;
export type ChartCalculationRequest = z.infer<typeof ChartCalculationRequestSchema>;
export type ChartResult = z.infer<typeof ChartResultSchema>;
export type LocalTimeDisambiguation = z.infer<typeof LocalTimeDisambiguationSchema>;

// Never accept a partial/localStorage placeholder as a paid personal Blueprint.
// A Reflector can legitimately have zero defined channels, so channels are NOT required.
const blueprintRequiredLabels = (chart: ChartResult) => [
  chart.birthPlace, chart.timezone, chart.type, chart.profile,
  chart.profileName, chart.strategy, chart.authority, chart.signature,
  chart.notSelf, chart.definition, chart.incarnationCross.name,
];

export function isCompleteBlueprintChart(value: unknown): value is ChartResult {
  const parsed = ChartResultSchema.safeParse(value);
  if (!parsed.success) return false;
  const chart = parsed.data;
  const birthDay = new Date(chart.birthDate + "T00:00:00.000Z");
  if (!Number.isFinite(birthDay.getTime()) || birthDay.toISOString().slice(0, 10) !== chart.birthDate) return false;
  const [hours, minutes, seconds = "00"] = chart.birthTime.split(":");
  if (+hours > 23 || +minutes > 59 || +seconds > 59) return false;
  if (blueprintRequiredLabels(chart).some(label =>
    !label.trim() || /^(?:undefined|null|unknown|nan)$/i.test(label.trim())
  )) return false;
  if (chart.centers.length !== 9 || new Set(chart.centers.map(center => center.name)).size !== 9) return false;
  if (chart.personalityActivations.length < 10 || chart.designActivations.length < 10) return false;
  if (chart.activatedGates.length < 4) return false;
  if (chart.incarnationCross.gates.some(gate => !Number.isInteger(gate) || gate < 1 || gate > 64)) return false;
  return true;
}

export function isCompleteBlueprintChartJson(raw: string | null | undefined): boolean {
  if (!raw) return false;
  try {
    return isCompleteBlueprintChart(JSON.parse(raw));
  } catch {
    return false;
  }
}
