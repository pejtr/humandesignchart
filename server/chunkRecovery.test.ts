import { describe, expect, it, vi } from "vitest";
import { isStaleChunkError, recoverStaleChunk } from "../client/src/lib/chunkRecovery";

function createStorage(initialValue: string | null = null) {
  let value = initialValue;
  return {
    getItem: vi.fn(() => value),
    setItem: vi.fn((_key: string, nextValue: string) => {
      value = nextValue;
    }),
  };
}

describe("stale chunk recovery", () => {
  it.each([
    "Failed to fetch dynamically imported module: /assets/Pricing-old.js",
    "ChunkLoadError: Loading chunk Pricing failed",
    "Importing a module script failed",
  ])("recognizes recoverable chunk errors: %s", message => {
    expect(isStaleChunkError(new Error(message))).toBe(true);
  });

  it("does not treat an application exception as a stale chunk", () => {
    expect(isStaleChunkError(new Error("Cannot read properties of undefined"))).toBe(false);
  });

  it("reloads once and records the recovery timestamp", () => {
    const reload = vi.fn();
    const storage = createStorage();

    expect(
      recoverStaleChunk(new Error("Failed to fetch dynamically imported module"), {
        pathname: "/cs/pricing",
        reload,
        storage,
        now: () => 10_000,
      })
    ).toBe(true);
    expect(reload).toHaveBeenCalledOnce();
    expect(storage.setItem).toHaveBeenCalledWith(
      "hd:stale-chunk-reload:/cs/pricing",
      "10000"
    );
  });

  it("prevents repeated reloads for the same route during the cooldown", () => {
    const reload = vi.fn();
    const storage = createStorage("10000");

    expect(
      recoverStaleChunk(new Error("ChunkLoadError: Loading chunk Pricing failed"), {
        pathname: "/cs/pricing",
        reload,
        storage,
        now: () => 20_000,
      })
    ).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });
});
