// Human Design Gate-to-Zodiac mapping
// The 64 gates are mapped around the 360° zodiac wheel
// Starting from Gate 41 at approximately 302° (2° Aquarius)
// Each gate covers 5°37'30" (5.625°) and each line covers 0°56'15" (0.9375°)
// The wheel has a 3.875° offset from 0° Aries (verified against reference charts)

// Gate order around the wheel with CORRECTED degree positions
// Format: [startDegree, gateNumber]
export const GATE_WHEEL: [number, number][] = [
  [3.875, 17], [9.500, 21], [15.125, 51], [20.750, 42],
  [26.375, 3], [32.000, 27], [37.625, 24], [43.250, 2],
  [48.875, 23], [54.500, 8], [60.125, 20], [65.750, 16],
  [71.375, 35], [77.000, 45], [82.625, 12], [88.250, 15],
  [93.875, 52], [99.500, 39], [105.125, 53], [110.750, 62],
  [116.375, 56], [122.000, 31], [127.625, 33], [133.250, 7],
  [138.875, 4], [144.500, 29], [150.125, 59], [155.750, 40],
  [161.375, 64], [167.000, 47], [172.625, 6], [178.250, 46],
  [183.875, 18], [189.500, 48], [195.125, 57], [200.750, 32],
  [206.375, 50], [212.000, 28], [217.625, 44], [223.250, 1],
  [228.875, 43], [234.500, 14], [240.125, 34], [245.750, 9],
  [251.375, 5], [257.000, 26], [262.625, 11], [268.250, 10],
  [273.875, 58], [279.500, 38], [285.125, 54], [290.750, 61],
  [296.375, 60], [302.000, 41], [307.625, 19], [313.250, 13],
  [318.875, 49], [324.500, 30], [330.125, 55], [335.750, 37],
  [341.375, 63], [347.000, 22], [352.625, 36], [358.250, 25],
];

// 36 Channels: [gate1, gate2, centerA, centerB]
export const CHANNELS: [number, number, string, string][] = [
  // Head - Ajna (3)
  [64, 47, "Head", "Ajna"],
  [61, 24, "Head", "Ajna"],
  [63, 4, "Head", "Ajna"],
  // Ajna - Throat (3)
  [17, 62, "Ajna", "Throat"],
  [43, 23, "Ajna", "Throat"],
  [11, 56, "Ajna", "Throat"],
  // Throat - Spleen (1)
  [57, 20, "Spleen", "Throat"],
  // Throat - Sacral (1)
  [34, 20, "Sacral", "Throat"],
  // Throat - G (3)
  [7, 31, "G", "Throat"],
  [1, 8, "G", "Throat"],
  [13, 33, "G", "Throat"],
  // Throat - Heart (1)
  [45, 21, "Throat", "Heart"],
  // Throat - SolarPlexus (2)
  [12, 22, "Throat", "SolarPlexus"],
  [35, 36, "Throat", "SolarPlexus"],
  // G - Throat (via 10-20 Awakening)
  [10, 20, "G", "Throat"],
  // G - Sacral (3)
  [10, 34, "G", "Sacral"],
  [15, 5, "G", "Sacral"],
  [46, 29, "G", "Sacral"],
  [2, 14, "G", "Sacral"],
  // G - Spleen (1)
  [10, 57, "G", "Spleen"],
  // G - Heart (1)
  [25, 51, "G", "Heart"],
  // Spleen - Throat (via 48-16)
  [48, 16, "Spleen", "Throat"],
  // Heart - Spleen (1)
  [26, 44, "Heart", "Spleen"],
  // Heart - SolarPlexus (1)
  [40, 37, "Heart", "SolarPlexus"],
  // Sacral - SolarPlexus (1)
  [59, 6, "Sacral", "SolarPlexus"],
  // Sacral - Spleen (1)
  [27, 50, "Sacral", "Spleen"],
  // Sacral - Root (via 42-53)
  [42, 53, "Sacral", "Root"],
  [3, 60, "Sacral", "Root"],
  [9, 52, "Sacral", "Root"],
  // Spleen - Root (3)
  [54, 32, "Root", "Spleen"],
  [38, 28, "Root", "Spleen"],
  [58, 18, "Root", "Spleen"],
  // Spleen - Sacral (via 34-57)
  [34, 57, "Sacral", "Spleen"],
  // Root - SolarPlexus (3)
  [19, 49, "Root", "SolarPlexus"],
  [39, 55, "Root", "SolarPlexus"],
  [41, 30, "Root", "SolarPlexus"],
];

// Gates belonging to each center
export const CENTER_GATES: Record<string, number[]> = {
  Head: [64, 61, 63],
  Ajna: [47, 24, 4, 17, 43, 11],
  Throat: [62, 23, 56, 16, 20, 31, 33, 45, 12, 35, 8],
  G: [1, 10, 7, 13, 25, 15, 46, 2],
  Heart: [26, 21, 40, 51],
  Sacral: [34, 5, 29, 14, 59, 9, 3, 42, 27],
  SolarPlexus: [22, 36, 37, 6, 49, 55, 30],
  Spleen: [48, 57, 44, 50, 32, 28, 18],
  Root: [54, 38, 58, 53, 60, 52, 19, 39, 41],
};

// Motor centers (for type determination)
export const MOTOR_CENTERS = ["Sacral", "Heart", "SolarPlexus", "Root"];

// Profile names
export const PROFILES: Record<string, string> = {
  "1/3": "Investigator / Martyr",
  "1/4": "Investigator / Opportunist",
  "2/4": "Hermit / Opportunist",
  "2/5": "Hermit / Heretic",
  "3/5": "Martyr / Heretic",
  "3/6": "Martyr / Role Model",
  "4/6": "Opportunist / Role Model",
  "4/1": "Opportunist / Investigator",
  "5/1": "Heretic / Investigator",
  "5/2": "Heretic / Hermit",
  "6/2": "Role Model / Hermit",
  "6/3": "Role Model / Martyr",
};

// Type descriptions
export const TYPES = {
  Manifestor: { strategy: "To Inform", signature: "Peace", notSelf: "Anger", aura: "Closed and Repelling" },
  Generator: { strategy: "To Respond", signature: "Satisfaction", notSelf: "Frustration", aura: "Open and Enveloping" },
  "Manifesting Generator": { strategy: "To Respond, Then Inform", signature: "Satisfaction", notSelf: "Frustration & Anger", aura: "Open and Enveloping" },
  Projector: { strategy: "Wait for the Invitation", signature: "Success", notSelf: "Bitterness", aura: "Focused and Absorbing" },
  Reflector: { strategy: "Wait a Lunar Cycle", signature: "Surprise", notSelf: "Disappointment", aura: "Resistant and Sampling" },
};

// Authority hierarchy
export const AUTHORITIES = [
  "Emotional (Solar Plexus)",
  "Sacral",
  "Splenic",
  "Ego Manifested",
  "Ego Projected",
  "Self-Projected",
  "Mental (Outer Authority)",
  "Lunar (No Inner Authority)",
];

// Circuits
export const CIRCUITS: Record<string, { name: string; theme: string; channels: [number, number][] }> = {
  individual: {
    name: "Individual Circuit",
    theme: "Empowerment & Mutation",
    channels: [[61,24],[43,23],[20,57],[20,34],[1,8],[10,34],[10,57],[25,51],[28,38],[39,55],[41,30],[3,60],[14,2]],
  },
  tribal: {
    name: "Tribal Circuit",
    theme: "Support & Bargain",
    channels: [[45,21],[26,44],[40,37],[59,6],[19,49],[27,50],[54,32],[50,27]],
  },
  collective: {
    name: "Collective Circuit",
    theme: "Sharing & Understanding",
    channels: [[64,47],[63,4],[17,62],[11,56],[16,48],[31,7],[33,13],[12,22],[35,36],[15,5],[46,29],[52,9],[53,42],[58,18]],
  },
};

// Variable components
export const DIGESTION_TYPES = [
  "Consecutive", "Alternating", "Open", "Closed", "Hot", "Cold",
];

export const ENVIRONMENT_TYPES = [
  "Caves", "Markets", "Kitchens", "Mountains", "Valleys", "Shores",
];

export const PERSPECTIVE_TYPES = [
  "Survival", "Possibility", "Power", "Wanting", "Probability", "Personal",
];

export const AWARENESS_TYPES = [
  "Communalist", "Theist", "Separatist", "Materialist", "Leader", "Follower",
];

// Planet names used in HD
export const PLANET_NAMES = [
  "Sun", "Earth", "Moon", "North Node", "South Node",
  "Mercury", "Venus", "Mars", "Jupiter", "Saturn",
  "Uranus", "Neptune", "Pluto",
] as const;

export type PlanetName = typeof PLANET_NAMES[number];
