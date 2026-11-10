/** Pure, SSR-safe Bodygraph motion decisions; unrelated to chart calculation. */
export type MotionMode = "play" | "pause";
export type MotionPreset = "zen" | "flow";
export type MotionPreferences = {
  mode: MotionMode;
  preset: MotionPreset;
  manual: boolean;
};

export const BODYGRAPH_MOTION_STORAGE_KEY = "hd.motion.v1";

export const DEFAULT_MOTION_PREFERENCES: Readonly<MotionPreferences> = {
  mode: "play",
  preset: "zen",
  manual: false,
};

/** Rejects corrupt, obsolete or non-manual preferences rather than trusting storage. */
export function parseMotionPreferences(raw: string | null): MotionPreferences | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return null;
    const prefs = value as Partial<MotionPreferences>;
    if (
      prefs.manual === true &&
      (prefs.mode === "play" || prefs.mode === "pause") &&
      (prefs.preset === "zen" || prefs.preset === "flow")
    ) {
      return { mode: prefs.mode, preset: prefs.preset, manual: true };
    }
  } catch { /* Invalid storage cannot break chart rendering. */ }
  return null;
}

export function resolveBodygraphMotion(
  preferences: MotionPreferences,
  state: { reducedMotion: boolean; inViewport: boolean; pageVisible: boolean },
): { running: boolean; autoPaused: boolean; systemPaused: boolean } {
  const autoPaused = !state.inViewport || !state.pageVisible;
  // OS reduced-motion is an accessibility safety gate, even after manual Play.
  const systemPaused = state.reducedMotion;
  return {
    running: preferences.mode === "play" && !systemPaused && !autoPaused,
    autoPaused,
    systemPaused,
  };
}
