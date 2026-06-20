/**
 * Human Design Chart Calculator
 * Determines type, profile, authority, definition, incarnation cross,
 * variables, gates, channels, and centers from planetary positions.
 */

import { calculatePlanetaryPositions, dateToJD, findDesignDate, jdToCalendar, type PlanetaryPositions } from "./ephemeris";
import {
  GATE_WHEEL, CHANNELS, CENTER_GATES, MOTOR_CENTERS,
  PROFILES, TYPES, PLANET_NAMES, type PlanetName,
} from "./constants";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface GateActivation {
  gate: number;
  line: number;
  color: number;
  tone: number;
  base: number;
  planet: PlanetName;
  type: "personality" | "design";
  longitude: number;
}

export interface ChannelActivation {
  gate1: number;
  gate2: number;
  centerA: string;
  centerB: string;
  activatedBy: {
    gate1Sources: Array<{ planet: PlanetName; type: "personality" | "design" }>;
    gate2Sources: Array<{ planet: PlanetName; type: "personality" | "design" }>;
  };
}

export interface CenterStatus {
  name: string;
  defined: boolean;
  gates: number[];
  activatedGates: number[];
}

export interface HumanDesignChart {
  // Birth data
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  timezone: string;

  // Core chart elements
  type: string;
  profile: string;
  profileName: string;
  strategy: string;
  authority: string;
  signature: string;
  notSelf: string;
  aura: string;
  definition: string;

  // Incarnation Cross
  incarnationCross: {
    name: string;
    type: string; // Right Angle, Juxtaposition, Left Angle
    gates: [number, number, number, number]; // Personality Sun, Earth, Design Sun, Earth
  };

  // Variables
  variables: {
    digestion: { type: string; color: number; tone: number; arrow: string };
    environment: { type: string; color: number; tone: number; arrow: string };
    perspective: { type: string; color: number; tone: number; arrow: string };
    awareness: { type: string; color: number; tone: number; arrow: string };
  };

  // Dream Rave
  dreamRave: {
    type: string;
    activatedGates: number[];
    centers: CenterStatus[];
    channels: ChannelActivation[];
    activeRealms: {
      lightField: number[];
      earthPlane: number[];
      demonRealm: number[];
    };
  };

  // Planetary activations
  personalityActivations: GateActivation[];
  designActivations: GateActivation[];

  // Channels and Centers
  channels: ChannelActivation[];
  centers: CenterStatus[];

  // All activated gates (unique)
  activatedGates: number[];

  // Planetary positions (degrees)
  personalityPositions: PlanetaryPositions;
  designPositions: PlanetaryPositions;

  // Design date
  designDate: string;
}

// ─── Gate Calculation ────────────────────────────────────────────────────────

function longitudeToGate(longitude: number): { gate: number; line: number; color: number; tone: number; base: number } {
  const normLon = ((longitude % 360) + 360) % 360;

  // Find which gate this longitude falls into
  // The wheel starts at 3.875°, so longitudes 0-3.875° wrap to the last gate (Gate 25 at 358.25°)
  let gateIndex = GATE_WHEEL.length - 1; // Default to last gate (25) for wrap-around
  for (let i = GATE_WHEEL.length - 1; i >= 0; i--) {
    if (normLon >= GATE_WHEEL[i][0]) {
      gateIndex = i;
      break;
    }
  }

  const gate = GATE_WHEEL[gateIndex][1];
  const gateStart = GATE_WHEEL[gateIndex][0];
  let offset = normLon - gateStart;
  // Handle wrap-around for Gate 25 (358.25° to 3.875°)
  if (offset < 0) offset += 360;

  // Each gate = 5.625°, each line = 0.9375°
  const lineFloat = offset / 0.9375;
  const line = Math.min(Math.floor(lineFloat) + 1, 6);

  // Color (6 per line) = 0.15625° each
  const lineOffset = offset - (line - 1) * 0.9375;
  const color = Math.min(Math.floor(lineOffset / 0.15625) + 1, 6);

  // Tone (6 per color) = 0.026041667° each
  const colorOffset = lineOffset - (color - 1) * 0.15625;
  const tone = Math.min(Math.floor(colorOffset / 0.026041667) + 1, 6);

  // Base (5 per tone)
  const toneOffset = colorOffset - (tone - 1) * 0.026041667;
  const base = Math.min(Math.floor(toneOffset / 0.005208333) + 1, 5);

  return { gate, line, color, tone, base };
}

// ─── Type Determination ──────────────────────────────────────────────────────

function isMotorConnectedToThroat(definedChannels: ChannelActivation[], definedCenters: Set<string>): boolean {
  // BFS from each motor center to Throat
  for (const motor of MOTOR_CENTERS) {
    if (!definedCenters.has(motor)) continue;

    const visited = new Set<string>();
    const queue = [motor];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === "Throat") return true;
      if (visited.has(current)) continue;
      visited.add(current);

      // Find connected centers through defined channels
      for (const ch of definedChannels) {
        if (ch.centerA === current && definedCenters.has(ch.centerB) && !visited.has(ch.centerB)) {
          queue.push(ch.centerB);
        }
        if (ch.centerB === current && definedCenters.has(ch.centerA) && !visited.has(ch.centerA)) {
          queue.push(ch.centerA);
        }
      }
    }
  }
  return false;
}

function determineType(definedCenters: Set<string>, definedChannels: ChannelActivation[]): string {
  const sacralDefined = definedCenters.has("Sacral");
  const motorToThroat = isMotorConnectedToThroat(definedChannels, definedCenters);

  if (definedCenters.size === 0) return "Reflector";
  if (sacralDefined && motorToThroat) return "Manifesting Generator";
  if (sacralDefined) return "Generator";
  if (motorToThroat) return "Manifestor";
  return "Projector";
}

// ─── Authority Determination ─────────────────────────────────────────────────

function determineAuthority(definedCenters: Set<string>, definedChannels: ChannelActivation[]): string {
  if (definedCenters.has("SolarPlexus")) return "Emotional (Solar Plexus)";
  if (definedCenters.has("Sacral")) return "Sacral";
  if (definedCenters.has("Spleen")) return "Splenic";

  // Ego Manifested: Heart connected to Throat
  if (definedCenters.has("Heart")) {
    const heartToThroat = definedChannels.some(
      ch => (ch.centerA === "Heart" && ch.centerB === "Throat") || (ch.centerA === "Throat" && ch.centerB === "Heart")
    );
    if (heartToThroat) return "Ego Manifested";

    // Ego Projected: Heart connected to G
    const heartToG = definedChannels.some(
      ch => (ch.centerA === "Heart" && ch.centerB === "G") || (ch.centerA === "G" && ch.centerB === "Heart")
    );
    if (heartToG) return "Ego Projected";
  }

  // Self-Projected: G connected to Throat
  if (definedCenters.has("G")) {
    const gToThroat = definedChannels.some(
      ch => (ch.centerA === "G" && ch.centerB === "Throat") || (ch.centerA === "Throat" && ch.centerB === "G")
    );
    if (gToThroat) return "Self-Projected";
  }

  // Mental/Outer Authority
  if (definedCenters.has("Ajna") || definedCenters.has("Head")) {
    return "Mental (Outer Authority)";
  }

  return "Lunar (No Inner Authority)";
}

// ─── Definition Type ─────────────────────────────────────────────────────────

function determineDefinition(definedCenters: Set<string>, definedChannels: ChannelActivation[]): string {
  if (definedCenters.size === 0) return "None";

  // Find connected groups using BFS
  const visited = new Set<string>();
  const groups: string[][] = [];

  for (const center of Array.from(definedCenters)) {
    if (visited.has(center)) continue;

    const group: string[] = [];
    const queue = [center];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);
      group.push(current);

      for (const ch of definedChannels) {
        if (ch.centerA === current && definedCenters.has(ch.centerB) && !visited.has(ch.centerB)) {
          queue.push(ch.centerB);
        }
        if (ch.centerB === current && definedCenters.has(ch.centerA) && !visited.has(ch.centerA)) {
          queue.push(ch.centerA);
        }
      }
    }

    if (group.length > 0) groups.push(group);
  }

  switch (groups.length) {
    case 1: return "Single Definition";
    case 2: return "Split Definition";
    case 3: return "Triple Split Definition";
    case 4: return "Quadruple Split Definition";
    default: return "None";
  }
}

// ─── Incarnation Cross ───────────────────────────────────────────────────────

// Incarnation Cross names differ by angle type for many gate combinations
const CROSS_NAMES: Record<number, { right: string; juxtaposition: string; left: string }> = {
  1: { right: "The Sphinx", juxtaposition: "Self-Expression", left: "Defiance" },
  2: { right: "The Sphinx", juxtaposition: "The Driver", left: "Defiance" },
  3: { right: "Laws", juxtaposition: "Mutation", left: "Wishes" },
  4: { right: "Explanation", juxtaposition: "Formulization", left: "Revolution" },
  5: { right: "Consciousness", juxtaposition: "Habits", left: "Separation" },
  6: { right: "Eden", juxtaposition: "Conflict", left: "The Plane" },
  7: { right: "The Sphinx", juxtaposition: "Interaction", left: "The Masks" },
  8: { right: "Contagion", juxtaposition: "Contribution", left: "Uncertainty" },
  9: { right: "Planning", juxtaposition: "Focus", left: "Identification" },
  10: { right: "The Vessel of Love", juxtaposition: "Behavior", left: "Prevention" },
  11: { right: "Eden", juxtaposition: "Ideas", left: "Education" },
  12: { right: "Eden", juxtaposition: "Articulation", left: "Education" },
  13: { right: "The Sphinx", juxtaposition: "Listening", left: "The Masks" },
  14: { right: "Contagion", juxtaposition: "Empowering", left: "Uncertainty" },
  15: { right: "The Vessel of Love", juxtaposition: "Extremes", left: "Prevention" },
  16: { right: "Planning", juxtaposition: "Experimentation", left: "Identification" },
  17: { right: "Service", juxtaposition: "Opinions", left: "Upheaval" },
  18: { right: "Service", juxtaposition: "Correction", left: "Upheaval" },
  19: { right: "The Four Ways", juxtaposition: "Need", left: "Refinement" },
  20: { right: "The Sleeping Phoenix", juxtaposition: "The Now", left: "Duality" },
  21: { right: "Tension", juxtaposition: "Control", left: "Endeavor" },
  22: { right: "Rulership", juxtaposition: "Grace", left: "Informing" },
  23: { right: "Explanation", juxtaposition: "Assimilation", left: "Dedication" },
  24: { right: "The Four Ways", juxtaposition: "Rationalization", left: "Incarnation" },
  25: { right: "The Vessel of Love", juxtaposition: "Innocence", left: "The Spirit" },
  26: { right: "Rulership", juxtaposition: "The Trickster", left: "Confrontation" },
  27: { right: "The Unexpected", juxtaposition: "Caring", left: "Alignment" },
  28: { right: "The Unexpected", juxtaposition: "Risks", left: "Alignment" },
  29: { right: "Contagion", juxtaposition: "Commitment", left: "Industry" },
  30: { right: "Contagion", juxtaposition: "Fates", left: "Industry" },
  31: { right: "The Unexpected", juxtaposition: "Influence", left: "The Alpha" },
  32: { right: "Maya", juxtaposition: "Conservation", left: "Limitation" },
  33: { right: "The Four Ways", juxtaposition: "Retreat", left: "Refinement" },
  34: { right: "The Sleeping Phoenix", juxtaposition: "Power", left: "Duality" },
  35: { right: "Consciousness", juxtaposition: "Experience", left: "Separation" },
  36: { right: "Eden", juxtaposition: "Crisis", left: "The Plane" },
  37: { right: "Planning", juxtaposition: "Bargains", left: "Migration" },
  38: { right: "Tension", juxtaposition: "Opposition", left: "Individualism" },
  39: { right: "Tension", juxtaposition: "Provocation", left: "Individualism" },
  40: { right: "Planning", juxtaposition: "Denial", left: "Migration" },
  41: { right: "The Unexpected", juxtaposition: "Fantasy", left: "The Alpha" },
  42: { right: "Maya", juxtaposition: "Completion", left: "Limitation" },
  43: { right: "Explanation", juxtaposition: "Insight", left: "Dedication" },
  44: { right: "The Four Ways", juxtaposition: "Alertness", left: "Incarnation" },
  45: { right: "Rulership", juxtaposition: "Possession", left: "Confrontation" },
  46: { right: "The Vessel of Love", juxtaposition: "Serendipity", left: "The Healing" },
  47: { right: "Rulership", juxtaposition: "Oppression", left: "Informing" },
  48: { right: "Tension", juxtaposition: "Depth", left: "Endeavor" },
  49: { right: "Explanation", juxtaposition: "Principles", left: "Revolution" },
  50: { right: "Laws", juxtaposition: "Values", left: "Wishes" },
  51: { right: "Penetration", juxtaposition: "Shock", left: "The Clarion" },
  52: { right: "Service", juxtaposition: "Stillness", left: "Demands" },
  53: { right: "Penetration", juxtaposition: "Beginnings", left: "Cycles" },
  54: { right: "Penetration", juxtaposition: "Ambition", left: "Cycles" },
  55: { right: "The Sleeping Phoenix", juxtaposition: "Moods", left: "The Spirit" },
  56: { right: "Laws", juxtaposition: "Stimulation", left: "Distraction" },
  57: { right: "Penetration", juxtaposition: "Intuition", left: "The Clarion" },
  58: { right: "Service", juxtaposition: "Vitality", left: "Demands" },
  59: { right: "The Sleeping Phoenix", juxtaposition: "Strategy", left: "The Spirit" },
  60: { right: "Laws", juxtaposition: "Limitation", left: "Distraction" },
  61: { right: "Maya", juxtaposition: "Thinking", left: "Obscuration" },
  62: { right: "Maya", juxtaposition: "Detail", left: "Obscuration" },
  63: { right: "Consciousness", juxtaposition: "Doubt", left: "Dominion" },
  64: { right: "Consciousness", juxtaposition: "Confusion", left: "Dominion" },
};

function determineIncarnationCross(
  personalitySunGate: number,
  personalityEarthGate: number,
  designSunGate: number,
  designEarthGate: number,
  profileLine1: number
): { name: string; type: string; gates: [number, number, number, number] } {
  let crossType: string;
  let angleKey: "right" | "juxtaposition" | "left";
  if (profileLine1 <= 3) {
    crossType = "Right Angle Cross";
    angleKey = "right";
  } else if (profileLine1 === 4) {
    crossType = "Juxtaposition Cross";
    angleKey = "juxtaposition";
  } else {
    crossType = "Left Angle Cross";
    angleKey = "left";
  }

  const crossNameData = CROSS_NAMES[personalitySunGate];
  const crossTheme = crossNameData ? crossNameData[angleKey] : getGateKeyword(personalitySunGate);
  const name = `${crossType} of ${crossTheme} (${personalitySunGate}/${personalityEarthGate} | ${designSunGate}/${designEarthGate})`;

  return {
    name,
    type: crossType,
    gates: [personalitySunGate, personalityEarthGate, designSunGate, designEarthGate],
  };
}

// ─── Variables ───────────────────────────────────────────────────────────────

function determineVariables(
  personalityActivations: GateActivation[],
  designActivations: GateActivation[]
) {
  // Variables are determined by the Color and Tone of specific planetary activations
  // Design Sun Color → Digestion, Design Sun Tone → determines left/right
  // Design Earth Color → Environment
  // Personality Sun Color → Perspective
  // Personality Earth Color → Awareness

  const designSun = designActivations.find(a => a.planet === "Sun");
  const designEarth = designActivations.find(a => a.planet === "Earth");
  const personalitySun = personalityActivations.find(a => a.planet === "Sun");
  const personalityEarth = personalityActivations.find(a => a.planet === "Earth");

  const DIGESTION = ["Consecutive", "Alternating", "Open", "Closed", "Hot", "Cold"];
  const ENVIRONMENT = ["Caves", "Markets", "Kitchens", "Mountains", "Valleys", "Shores"];
  const PERSPECTIVE = ["Survival", "Possibility", "Power", "Wanting", "Probability", "Personal"];
  const AWARENESS = ["Communalist", "Theist", "Separatist", "Materialist", "Leader", "Follower"];

  return {
    digestion: {
      type: DIGESTION[(designSun?.color || 1) - 1] || "Consecutive",
      color: designSun?.color || 1,
      tone: designSun?.tone || 1,
      arrow: (designSun?.tone || 1) <= 3 ? "Left" : "Right",
    },
    environment: {
      type: ENVIRONMENT[(designEarth?.color || 1) - 1] || "Caves",
      color: designEarth?.color || 1,
      tone: designEarth?.tone || 1,
      arrow: (designEarth?.tone || 1) <= 3 ? "Left" : "Right",
    },
    perspective: {
      type: PERSPECTIVE[(personalitySun?.color || 1) - 1] || "Survival",
      color: personalitySun?.color || 1,
      tone: personalitySun?.tone || 1,
      arrow: (personalitySun?.tone || 1) <= 3 ? "Left" : "Right",
    },
    awareness: {
      type: AWARENESS[(personalityEarth?.color || 1) - 1] || "Communalist",
      color: personalityEarth?.color || 1,
      tone: personalityEarth?.tone || 1,
      arrow: (personalityEarth?.tone || 1) <= 3 ? "Left" : "Right",
    },
  };
}

// ─── Gate Keywords ───────────────────────────────────────────────────────────

function getGateKeyword(gate: number): string {
  const keywords: Record<number, string> = {
    1: "Self-Expression", 2: "Direction", 3: "Ordering", 4: "Formulization",
    5: "Fixed Patterns", 6: "Friction", 7: "The Role of the Self", 8: "Contribution",
    9: "Focus", 10: "Behavior of the Self", 11: "Ideas", 12: "Caution",
    13: "The Listener", 14: "Power Skills", 15: "Extremes", 16: "Skills",
    17: "Opinions", 18: "Correction", 19: "Wanting", 20: "The Now",
    21: "The Hunter", 22: "Openness", 23: "Assimilation", 24: "Rationalization",
    25: "Innocence", 26: "The Trickster", 27: "Nourishment", 28: "The Game Player",
    29: "Perseverance", 30: "Feelings", 31: "Leading", 32: "Continuity",
    33: "Privacy", 34: "Power", 35: "Change", 36: "Crisis",
    37: "Friendship", 38: "The Fighter", 39: "Provocation", 40: "Aloneness",
    41: "Contraction", 42: "Growth", 43: "Insight", 44: "Alertness",
    45: "The Gatherer", 46: "Determination", 47: "Realization", 48: "Depth",
    49: "Revolution", 50: "Values", 51: "Shock", 52: "Stillness",
    53: "Beginnings", 54: "Ambition", 55: "Spirit", 56: "Stimulation",
    57: "Intuition", 58: "Vitality", 59: "Sexuality", 60: "Limitation",
    61: "Mystery", 62: "Detail", 63: "Doubt", 64: "Confusion",
  };
  return keywords[gate] || `Gate ${gate}`;
}

// ─── Dream Rave ──────────────────────────────────────────────────────────────

const DREAM_RAVE_GATES = [1, 5, 8, 12, 15, 19, 20, 27, 28, 38, 42, 50, 53, 57, 62];
const DREAM_RAVE_REALMS = {
  lightField: [62, 20, 57, 8, 1],
  demonRealm: [19, 53, 42, 38, 28],
  earthPlane: [5, 12, 15, 27, 50]
};

function determineDreamRave(allActivations: GateActivation[]) {
  const drActivatedGates = new Set(
    allActivations.map(a => a.gate).filter(g => DREAM_RAVE_GATES.includes(g))
  );

  const drChannels: ChannelActivation[] = [];
  for (const [g1, g2, cA, cB] of CHANNELS) {
    if (drActivatedGates.has(g1) && drActivatedGates.has(g2)) {
      const g1Sources = allActivations.filter(a => a.gate === g1).map(a => ({ planet: a.planet, type: a.type }));
      const g2Sources = allActivations.filter(a => a.gate === g2).map(a => ({ planet: a.planet, type: a.type }));
      drChannels.push({
        gate1: g1,
        gate2: g2,
        centerA: cA,
        centerB: cB,
        activatedBy: { gate1Sources: g1Sources, gate2Sources: g2Sources },
      });
    }
  }

  const drDefinedCenterSet = new Set<string>();
  for (const ch of drChannels) {
    drDefinedCenterSet.add(ch.centerA);
    drDefinedCenterSet.add(ch.centerB);
  }

  const hasSacral = drDefinedCenterSet.has("Sacral");
  const motorToThroat = isMotorConnectedToThroat(drChannels, drDefinedCenterSet);

  let type = "Reflector";
  if (drDefinedCenterSet.size > 0) {
    if (hasSacral && motorToThroat) type = "Manifesting Generator";
    else if (hasSacral) type = "Generator";
    else if (motorToThroat) type = "Manifestor";
    else type = "Projector";
  }

  const drCenterNames = ["Throat", "G", "Sacral", "Spleen", "Root"];
  const centers: CenterStatus[] = drCenterNames.map(name => ({
    name,
    defined: drDefinedCenterSet.has(name),
    gates: (CENTER_GATES[name as keyof typeof CENTER_GATES] || []).filter(g => DREAM_RAVE_GATES.includes(g)),
    activatedGates: (CENTER_GATES[name as keyof typeof CENTER_GATES] || []).filter(g => drActivatedGates.has(g)),
  }));

  return {
    type,
    activatedGates: Array.from(drActivatedGates).sort((a, b) => a - b),
    centers,
    channels: drChannels,
    activeRealms: {
      lightField: Array.from(drActivatedGates).filter(g => DREAM_RAVE_REALMS.lightField.includes(g)),
      earthPlane: Array.from(drActivatedGates).filter(g => DREAM_RAVE_REALMS.earthPlane.includes(g)),
      demonRealm: Array.from(drActivatedGates).filter(g => DREAM_RAVE_REALMS.demonRealm.includes(g)),
    }
  };
}

// ─── Main Calculator ─────────────────────────────────────────────────────────

export function calculateChart(
  birthDateStr: string,
  birthTimeStr: string,
  birthPlace: string,
  latitude: number,
  longitude: number,
  timezoneOffsetHours: number,
  timezone: string
): HumanDesignChart {
  // Parse birth date and time
  const [year, month, day] = birthDateStr.split("-").map(Number);
  const [hours, minutes] = birthTimeStr.split(":").map(Number);

  // Convert to UTC
  const utcHours = hours - timezoneOffsetHours;
  const birthDate = new Date(Date.UTC(year, month - 1, day, utcHours, minutes));
  const birthJD = dateToJD(birthDate);

  // Calculate Personality (birth) positions
  const personalityPositions = calculatePlanetaryPositions(birthJD);

  // Calculate Design date and positions
  const designJD = findDesignDate(birthJD);
  const designPositions = calculatePlanetaryPositions(designJD);

  // Convert Design JD back to date string
  const designDateObj = jdToCalendar(designJD);
  const designDate = `${Math.floor(designDateObj.year)}-${String(Math.floor(designDateObj.month)).padStart(2, "0")}-${String(Math.floor(designDateObj.day)).padStart(2, "0")}`;

  // Calculate gate activations for all planets
  const personalityActivations: GateActivation[] = [];
  const designActivations: GateActivation[] = [];

  for (const planetName of PLANET_NAMES) {
    const pLon = personalityPositions[planetName];
    const dLon = designPositions[planetName];

    const pGate = longitudeToGate(pLon);
    personalityActivations.push({
      ...pGate,
      planet: planetName,
      type: "personality",
      longitude: pLon,
    });

    const dGate = longitudeToGate(dLon);
    designActivations.push({
      ...dGate,
      planet: planetName,
      type: "design",
      longitude: dLon,
    });
  }

  // Collect all activated gates
  const allActivations = [...personalityActivations, ...designActivations];
  const activatedGateSet = new Set(allActivations.map(a => a.gate));
  const activatedGates = Array.from(activatedGateSet).sort((a, b) => a - b);

  // Determine defined channels
  const definedChannels: ChannelActivation[] = [];
  for (const [g1, g2, cA, cB] of CHANNELS) {
    if (activatedGateSet.has(g1) && activatedGateSet.has(g2)) {
      const g1Sources = allActivations
        .filter(a => a.gate === g1)
        .map(a => ({ planet: a.planet, type: a.type }));
      const g2Sources = allActivations
        .filter(a => a.gate === g2)
        .map(a => ({ planet: a.planet, type: a.type }));

      definedChannels.push({
        gate1: g1,
        gate2: g2,
        centerA: cA,
        centerB: cB,
        activatedBy: { gate1Sources: g1Sources, gate2Sources: g2Sources },
      });
    }
  }

  // Determine defined centers
  const definedCenterSet = new Set<string>();
  for (const ch of definedChannels) {
    definedCenterSet.add(ch.centerA);
    definedCenterSet.add(ch.centerB);
  }

  // Build center status
  const centerNames = ["Head", "Ajna", "Throat", "G", "Heart", "Sacral", "SolarPlexus", "Spleen", "Root"];
  const centers: CenterStatus[] = centerNames.map(name => ({
    name,
    defined: definedCenterSet.has(name),
    gates: CENTER_GATES[name] || [],
    activatedGates: (CENTER_GATES[name] || []).filter(g => activatedGateSet.has(g)),
  }));

  // Determine type
  const type = determineType(definedCenterSet, definedChannels);
  const typeInfo = TYPES[type as keyof typeof TYPES] || TYPES.Projector;

  // Determine authority
  const authority = determineAuthority(definedCenterSet, definedChannels);

  // Determine profile
  const personalitySunLine = personalityActivations.find(a => a.planet === "Sun")!.line;
  const designSunLine = designActivations.find(a => a.planet === "Sun")!.line;
  const profileKey = `${personalitySunLine}/${designSunLine}`;
  const profileName = PROFILES[profileKey] || "Unknown Profile";

  // Determine definition
  const definition = determineDefinition(definedCenterSet, definedChannels);

  // Determine incarnation cross
  const pSunGate = personalityActivations.find(a => a.planet === "Sun")!.gate;
  const pEarthGate = personalityActivations.find(a => a.planet === "Earth")!.gate;
  const dSunGate = designActivations.find(a => a.planet === "Sun")!.gate;
  const dEarthGate = designActivations.find(a => a.planet === "Earth")!.gate;
  const incarnationCross = determineIncarnationCross(pSunGate, pEarthGate, dSunGate, dEarthGate, personalitySunLine);

  // Determine variables
  const variables = determineVariables(personalityActivations, designActivations);

  // Determine Dream Rave
  const dreamRave = determineDreamRave(allActivations);

  return {
    birthDate: birthDateStr,
    birthTime: birthTimeStr,
    birthPlace,
    timezone,
    type,
    profile: profileKey,
    profileName,
    strategy: typeInfo.strategy,
    authority,
    signature: typeInfo.signature,
    notSelf: typeInfo.notSelf,
    aura: typeInfo.aura,
    definition,
    incarnationCross,
    variables,
    dreamRave,
    personalityActivations,
    designActivations,
    channels: definedChannels,
    centers,
    activatedGates,
    personalityPositions,
    designPositions,
    designDate,
  };
}

export { getGateKeyword };
