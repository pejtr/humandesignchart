import { describe, expect, it } from "vitest";
import { MAX_VOLUNTARY_TOP_UP_MINOR, resolveHonorariumSelection } from "./honorarium";

describe("Honorarium selection", () => {
  it("uses the server-owned Blueprint minimum and accepts a zero top-up", () => {
    expect(resolveHonorariumSelection({ productId: "blueprint", currency: "CZK" })).toMatchObject({
      billingPeriod: "ONE_TIME", minimumAmountMinor: 29000, voluntaryTopUpMinor: 0, totalAmountMinor: 29000,
    });
  });

  it("adds a voluntary top-up without changing the product", () => {
    expect(resolveHonorariumSelection({ productId: "blueprint", currency: "CZK", voluntaryTopUpMinor: 10000 })).toMatchObject({
      productId: "blueprint", minimumAmountMinor: 29000, voluntaryTopUpMinor: 10000, totalAmountMinor: 39000,
    });
  });

  it("rejects negative, excessive and unimplemented recurring top-ups", () => {
    expect(() => resolveHonorariumSelection({ productId: "blueprint", currency: "CZK", voluntaryTopUpMinor: -1 })).toThrow("INVALID_VOLUNTARY_TOP_UP");
    expect(() => resolveHonorariumSelection({ productId: "blueprint", currency: "CZK", voluntaryTopUpMinor: MAX_VOLUNTARY_TOP_UP_MINOR + 1 })).toThrow("INVALID_VOLUNTARY_TOP_UP");
    expect(() => resolveHonorariumSelection({ productId: "monthly", currency: "CZK", voluntaryTopUpMinor: 1 })).toThrow("RECURRING_TOP_UP_HOLD");
  });
});
