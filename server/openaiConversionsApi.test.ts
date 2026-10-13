import { describe, expect, it } from "vitest";
import { buildConfirmedOrderEvent } from "./openaiConversionsApi";

describe("OpenAI Ads confirmed purchase reporting", () => {
  const order = { id: "cs_test_verified_001", amountMinor: 1590, currency: "EUR" as const, consent: true };
  it("reports actual charged amount in minor units, not a landing-page estimate", () => {
    expect(buildConfirmedOrderEvent(order, 1_791_000_000_000)).toEqual({
      id: "cs_test_verified_001",
      type: "order_created",
      timestamp_ms: 1_791_000_000_000,
      action_source: "web",
      source_url: "https://humandesignchart.app/en/payment/success",
      data: { type: "contents", amount: 1590, currency: "EUR" },
    });
  });
  it("does not report without captured marketing consent", () => {
    expect(buildConfirmedOrderEvent({ ...order, consent: false })).toBeNull();
  });
  it("does not report invalid revenue", () => {
    expect(buildConfirmedOrderEvent({ ...order, amountMinor: 0 })).toBeNull();
    expect(buildConfirmedOrderEvent({ ...order, amountMinor: NaN })).toBeNull();
  });
  it("reports CZK without currency conversion", () => {
    const event = buildConfirmedOrderEvent({ ...order, amountMinor: 29000, currency: "CZK" });
    expect(event?.data).toEqual({ type: "contents", amount: 29000, currency: "CZK" });
    expect(event?.source_url).toBe("https://humandesignmapa.cz/cs/payment/success");
  });
  it("forwards only allowed matching reference and never personal data", () => {
    const event = buildConfirmedOrderEvent({ ...order, oppref: "click_ref_example" });
    expect(event?.oppref).toBe("click_ref_example");
    expect(JSON.stringify(event)).not.toContain("email");
    expect(JSON.stringify(event)).not.toContain("birth");
    const rejected = buildConfirmedOrderEvent({ ...order, oppref: "bad\nref" });
    expect(rejected?.oppref).toBeUndefined();
  });
});
