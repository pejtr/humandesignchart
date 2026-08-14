import { z } from "zod";

export const CALCULATION_VERSION = "2.0.0-iana" as const;

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
    gates: z.tuple([z.number(), z.number(), z.number(), z.number()]),
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
