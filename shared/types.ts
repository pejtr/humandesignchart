/**
 * Unified type exports
 * Import shared types from this single entry point.
 */

export type * from "../drizzle/schema";
export * from "./_core/errors";

// Human Design chart types
export interface ChartInput {
  name: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  latitude: number;
  longitude: number;
  timezoneOffset: number;
  timezone: string;
  category?: "self" | "family" | "friend" | "client" | "celebrity" | "other";
}

export interface GateActivationData {
  gate: number;
  line: number;
  color: number;
  tone: number;
  base: number;
  planet: string;
  type: "personality" | "design";
  longitude: number;
}

export interface ChannelActivationData {
  gate1: number;
  gate2: number;
  centerA: string;
  centerB: string;
  activatedBy: {
    gate1Sources: Array<{ planet: string; type: "personality" | "design" }>;
    gate2Sources: Array<{ planet: string; type: "personality" | "design" }>;
  };
}

export interface CenterStatusData {
  name: string;
  defined: boolean;
  gates: number[];
  activatedGates: number[];
}

export interface VariableData {
  type: string;
  color: number;
  tone: number;
  arrow: string;
}

export interface IncarnationCrossData {
  name: string;
  type: string;
  gates: [number, number, number, number];
}

export interface HumanDesignChartData {
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  timezone: string;
  type: string;
  profile: string;
  profileName: string;
  strategy: string;
  authority: string;
  signature: string;
  notSelf: string;
  aura: string;
  definition: string;
  incarnationCross: IncarnationCrossData;
  variables: {
    digestion: VariableData;
    environment: VariableData;
    perspective: VariableData;
    awareness: VariableData;
  };
  personalityActivations: GateActivationData[];
  designActivations: GateActivationData[];
  channels: ChannelActivationData[];
  centers: CenterStatusData[];
  activatedGates: number[];
  personalityPositions: Record<string, number>;
  designPositions: Record<string, number>;
  designDate: string;
}
