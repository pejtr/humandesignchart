import { describe, expect, it } from "vitest";
import { getBlueprintFulfillmentBlocker as gate } from "./blueprintFulfillmentGate";

const order = {
  chart_snapshot_id: "snap-valid",
  customer_email: "buyer@example.test",
  offer_key: "hd-blueprint-en",
  amount_minor: 1590,
  currency: "EUR",
  payment_status: "CREATED",
};
const capture = {
  offerKey: "hd-blueprint-en",
  amount: 1590,
  currency: "EUR",
  customerEmail: "buyer@example.test",
};
describe("Blueprint payment fulfillment: do not claim delivery without a chart", () => {
  it("accepts a matching persisted order and verified snapshot", () => {
    expect(gate(order, capture, true)).toBeNull();
    expect(gate({...order, payment_status: "PAID"}, capture, true)).toBeNull();
  });
  it("rejects unknown orders and missing/orphaned snapshots", () => {
    expect(gate(null, capture, false)).toBe("CHART_SNAPSHOT_REQUIRED");
    expect(gate({...order, chart_snapshot_id: null}, capture, false)).toBe("CHART_SNAPSHOT_REQUIRED");
    expect(gate(order, capture, false)).toBe("CHART_SNAPSHOT_REQUIRED");
  });
  it("rejects mismatch on offer, amount, currency or customer", () => {
    expect(gate(order, {...capture, offerKey:"hd-blueprint-cz"}, true)).toBe("ORDER_DATA_MISMATCH");
    expect(gate(order, {...capture, amount: 29000}, true)).toBe("ORDER_DATA_MISMATCH");
    expect(gate(order, {...capture, currency:"CZK"}, true)).toBe("ORDER_DATA_MISMATCH");
    expect(gate(order, {...capture, customerEmail:"other@example.test"}, true)).toBe("ORDER_DATA_MISMATCH");
    expect(gate(order, {...capture, customerEmail:"Buyer@Example.Test"}, true)).toBeNull();
  });
  it("rejects cancelled orders", () => {
    expect(gate({...order, payment_status: "CANCELLED"}, capture, true)).toBe("ORDER_NOT_READY");
  });
});
