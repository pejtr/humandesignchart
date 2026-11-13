import { describe, expect, it } from "vitest";
import {
  BODYGRAPH_MOTION_STORAGE_KEY,
  DEFAULT_MOTION_PREFERENCES,
  parseMotionPreferences,
  resolveBodygraphMotion,
} from "../client/src/lib/bodygraphMotion";

describe("Bodygraph motion preferences (no chart calculation side effects)", () => {
  it("uses Zen and plays by default unless automatic safety gates pause it", () => {
    expect(BODYGRAPH_MOTION_STORAGE_KEY).toBe("hd.motion.v1");
    expect(DEFAULT_MOTION_PREFERENCES).toEqual({
      mode: "play",
      preset: "zen",
      manual: false,
    });
    expect(resolveBodygraphMotion({ ...DEFAULT_MOTION_PREFERENCES }, {
      reducedMotion: false, inViewport: true, pageVisible: true,
    })).toEqual({ running: true, autoPaused: false, systemPaused: false });
  });

  it("restores valid explicit preferences", () => {
    expect(parseMotionPreferences('{"mode":"pause","preset":"flow","manual":true}')).toEqual({
      mode: "pause", preset: "flow", manual: true,
    });
  });

  it("rejects corrupted, invalid or non-manual storage", () => {
    for (const input of [null, "", "{", "null", "[]", "{}", '{"mode":"play","preset":"warp","manual":true}', '{"mode":"play","preset":"zen","manual":false}']) {
      expect(parseMotionPreferences(input)).toBeNull();
    }
  });

  it("manual pause always wins", () => {
    expect(resolveBodygraphMotion({ mode: "pause", preset: "zen", manual: true }, {
      reducedMotion: false, inViewport: true, pageVisible: true,
    }).running).toBe(false);
  });

  it("reduced motion overrides even saved manual play", () => {
    expect(resolveBodygraphMotion({ mode: "play", preset: "flow", manual: true }, {
      reducedMotion: true, inViewport: true, pageVisible: true,
    })).toEqual({ running: false, autoPaused: false, systemPaused: true });
  });

  it("auto-pauses offscreen and for hidden tabs; resumes when visible", () => {
    const p = { mode: "play", preset: "zen", manual: true } as const;
    expect(resolveBodygraphMotion(p, { reducedMotion: false, inViewport: false, pageVisible: true })).toEqual({
      running: false, autoPaused: true, systemPaused: false,
    });
    expect(resolveBodygraphMotion(p, { reducedMotion: false, inViewport: true, pageVisible: false })).toEqual({
      running: false, autoPaused: true, systemPaused: false,
    });
    expect(resolveBodygraphMotion(p, { reducedMotion: false, inViewport: true, pageVisible: true }).running).toBe(true);
  });
});
