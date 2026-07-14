import { beforeEach, describe, expect, it, vi } from "vitest";

const databaseMock = vi.hoisted(() => {
  const capture = { values: undefined as Record<string, unknown> | undefined };
  const onDuplicateKeyUpdate = vi.fn().mockResolvedValue(undefined);
  const values = vi.fn((insertValues: Record<string, unknown>) => {
    capture.values = insertValues;
    return { onDuplicateKeyUpdate };
  });
  const insert = vi.fn(() => ({ values }));

  return {
    capture,
    insert,
    getDb: vi.fn(async () => ({ insert })),
  };
});

vi.mock("./db/index", () => ({ getDb: databaseMock.getDb }));

import { upsertUser } from "./db/users";

describe("upsertUser", () => {
  beforeEach(() => {
    databaseMock.capture.values = undefined;
    vi.clearAllMocks();
  });

  it("supplies defaults required by the production users table", async () => {
    await upsertUser({ openId: "google:test-user" });

    expect(databaseMock.capture.values).toMatchObject({
      openId: "google:test-user",
      isAffiliate: 0,
      affiliateTotalEarned: 0,
      affiliatePendingPayout: 0,
    });
  });
});
