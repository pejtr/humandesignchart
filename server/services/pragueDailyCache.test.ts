import { describe, expect, it, vi } from "vitest";
import {
  getPragueDay,
  getPragueDayStart,
  millisecondsUntilNextPragueMidnight,
  PragueDailyKeyedCache,
} from "./pragueDailyCache";

describe("Prague daily cache", () => {
  it("uses the Prague calendar day around UTC midnight", () => {
    expect(getPragueDay(new Date("2026-08-30T21:59:59.999Z"))).toBe("2026-08-30");
    expect(getPragueDay(new Date("2026-08-30T22:00:00.000Z"))).toBe("2026-08-31");
  });

  it("resolves the correct local day start across daylight-saving time", () => {
    expect(getPragueDayStart(new Date("2026-01-15T12:00:00Z")).toISOString()).toBe("2026-01-14T23:00:00.000Z");
    expect(getPragueDayStart(new Date("2026-08-30T12:00:00Z")).toISOString()).toBe("2026-08-29T22:00:00.000Z");
  });

  it("calculates the next Prague midnight without a fixed 24-hour assumption", () => {
    expect(millisecondsUntilNextPragueMidnight(new Date("2026-03-28T23:00:00Z"))).toBe(82_800_000);
    expect(millisecondsUntilNextPragueMidnight(new Date("2026-10-24T22:00:00Z"))).toBe(90_000_000);
  });

  it("deduplicates concurrent work and refreshes after Prague midnight", async () => {
    const cache = new PragueDailyKeyedCache<number>();
    const factory = vi.fn(async () => 42);
    const beforeMidnight = new Date("2026-08-30T21:59:00Z");

    const [first, second] = await Promise.all([
      cache.get("transit", factory, beforeMidnight),
      cache.get("transit", factory, beforeMidnight),
    ]);

    expect(first).toBe(42);
    expect(second).toBe(42);
    expect(factory).toHaveBeenCalledTimes(1);

    await cache.get("transit", factory, new Date("2026-08-30T22:00:01Z"));
    expect(factory).toHaveBeenCalledTimes(2);
  });

  it("evicts rejected work so the same day can retry", async () => {
    const cache = new PragueDailyKeyedCache<number>();
    const factory = vi.fn()
      .mockRejectedValueOnce(new Error("temporary"))
      .mockResolvedValueOnce(7);
    const now = new Date("2026-08-30T12:00:00Z");

    await expect(cache.get("transit", factory, now)).rejects.toThrow("temporary");
    await expect(cache.get("transit", factory, now)).resolves.toBe(7);
    expect(factory).toHaveBeenCalledTimes(2);
  });
});
