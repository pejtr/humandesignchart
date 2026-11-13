import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { calculateChart } from "../humandesign/calculator";
import { isCompleteBlueprintChartJson } from "../../shared/chartSchemas";
import { getBlueprintFulfillmentBlocker } from "./blueprintFulfillmentGate";

const completeSnapshot = JSON.stringify(calculateChart({
  name: "Webhook integration fixture",
  birthDate: "1986-04-22",
  birthTime: "05:55",
  birthPlace: "Pardubice, Czech Republic",
  latitude: 50.0343,
  longitude: 15.7812,
  timezone: "Europe/Prague",
}));
const event = {
  offerKey: "hd-blueprint-cz", amount: 29000,
  currency: "CZK", customerEmail: "buyer@example.test",
};
const createdOrder = {
  chart_snapshot_id: "snap_valid_id", customer_email: "buyer@example.test",
  offer_key: "hd-blueprint-cz", amount_minor: 29000,
  currency: "CZK", payment_status: "CREATED",
};

describe("Webhook must not fulfill incomplete paid Bodygraph", () => {
  it("accepts a real complete chart, rejects placeholder or corrupt JSON", () => {
    expect(isCompleteBlueprintChartJson(completeSnapshot)).toBe(true);
    expect(isCompleteBlueprintChartJson('{"type":"Generator"}')).toBe(false);
    expect(isCompleteBlueprintChartJson("not json")).toBe(false);
    expect(isCompleteBlueprintChartJson("")).toBe(false);
  });

  it("blocks fulfillment unless the original paid chart is complete", () => {
    const valid = isCompleteBlueprintChartJson(completeSnapshot);
    const invalid = isCompleteBlueprintChartJson('{"type":"Generator"}');
    expect(getBlueprintFulfillmentBlocker(createdOrder, event, valid)).toBeNull();
    expect(getBlueprintFulfillmentBlocker(createdOrder, event, invalid)).toBe("CHART_SNAPSHOT_REQUIRED");
  });

  it("wires the semantic validation into the actual Cloudflare callback, not row existence", () => {
    const source = readFileSync("workers/pages-api.ts", "utf8");
    expect(source).toContain("SELECT chart_data_json FROM hd_chart_snapshots WHERE id = ? AND LOWER(email) = LOWER(?) LIMIT 1");
    expect(source).toContain("const hasCompleteChart = isCompleteBlueprintChartJson(snapshot?.chart_data_json)");
    expect(source).toContain("getBlueprintFulfillmentBlocker(existing, event, hasCompleteChart)");
    expect(source).not.toContain("getBlueprintFulfillmentBlocker(existing, event, Boolean(snapshot))");
  });
});
