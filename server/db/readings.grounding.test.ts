import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  credit: 1,
  inserted: 0,
  failInsert: false,
}));

const getDb = vi.hoisted(() => vi.fn(async () => ({
  transaction: async (callback: (tx: unknown) => Promise<unknown>) => {
    const snapshot = { ...state };
    const tx = {
      update: () => ({
        set: () => ({
          where: async () => {
            if (state.credit < 1) return [{ affectedRows: 0 }];
            state.credit -= 1;
            return [{ affectedRows: 1 }];
          },
        }),
      }),
      insert: () => ({
        values: async () => {
          if (state.failInsert) throw new Error("insert failed");
          state.inserted += 1;
          return [{ insertId: 71 }];
        },
      }),
    };
    try {
      return await callback(tx);
    } catch (error) {
      Object.assign(state, snapshot);
      throw error;
    }
  },
})));

vi.mock("./index", () => ({ getDb }));

import { persistGroundedAiReading } from "./readings";

const reading = {
  userId: 7,
  chartId: 11,
  readingType: "overview" as const,
  content: "verified interpretation",
  model: "test-model",
  promptVersion: "phase1-p0-grounded-v1",
  latencyMs: 50,
  inputTokens: 100,
  outputTokens: 50,
  groundingStatus: "verified" as const,
  consumeCredit: true,
};

describe("grounded AI reading credit transaction", () => {
  beforeEach(() => {
    state.credit = 1;
    state.inserted = 0;
    state.failInsert = false;
  });

  it("consumes the credit only when persistence succeeds", async () => {
    await expect(persistGroundedAiReading(reading)).resolves.toBe(71);
    expect(state).toMatchObject({ credit: 0, inserted: 1 });
  });

  it("rolls back credit consumption when persistence fails", async () => {
    state.failInsert = true;
    await expect(persistGroundedAiReading(reading)).rejects.toThrow("insert failed");
    expect(state).toMatchObject({ credit: 1, inserted: 0 });
  });
});
