import { describe, it, expect } from "vitest";
import { HdlabAnalyticsEngine } from "./hdlabAnalytics";

describe("HDLAB — Human Design Lab (Funnel & Measurement Engine)", () => {
  it("tracks P0 funnel conversion events correctly", () => {
    HdlabAnalyticsEngine.trackEvent({
      eventName: "result_view",
      userId: 1,
      chartId: 101,
    });

    HdlabAnalyticsEngine.trackEvent({
      eventName: "offer_view",
      userId: 1,
      chartId: 101,
    });

    HdlabAnalyticsEngine.trackEvent({
      eventName: "checkout_start",
      userId: 1,
      chartId: 101,
      refId: "hdlab_1_12345",
      amountMinor: 39000,
    });

    HdlabAnalyticsEngine.trackEvent({
      eventName: "payment_success",
      userId: 1,
      chartId: 101,
      amountMinor: 39000,
    });

    const metrics = HdlabAnalyticsEngine.getFunnelMetrics();

    expect(metrics.counts.result_view).toBeGreaterThanOrEqual(1);
    expect(metrics.counts.offer_view).toBeGreaterThanOrEqual(1);
    expect(metrics.counts.checkout_start).toBeGreaterThanOrEqual(1);
    expect(metrics.counts.payment_success).toBeGreaterThanOrEqual(1);
    expect(metrics.hypothesisH01.status).toBe("validated");
  });
});
