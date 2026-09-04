/**
 * HDLAB — Human Design Lab
 * Funnel Measurement & Conversion Engine
 *
 * Events:
 * - result_view
 * - offer_view
 * - checkout_start
 * - payment_success
 * - reading_delivered
 */

export type HdlabFunnelEventName =
  | "result_view"
  | "offer_view"
  | "checkout_start"
  | "payment_success"
  | "reading_delivered";

export interface HdlabFunnelEventPayload {
  eventName: HdlabFunnelEventName;
  userId?: number;
  chartId?: number;
  refId?: string;
  amountMinor?: number;
  metadata?: Record<string, any>;
  timestamp?: string;
}

export class HdlabAnalyticsEngine {
  private static events: HdlabFunnelEventPayload[] = [];

  /** Log a funnel measurement event */
  public static trackEvent(payload: HdlabFunnelEventPayload): HdlabFunnelEventPayload {
    const event: HdlabFunnelEventPayload = {
      ...payload,
      timestamp: payload.timestamp || new Date().toISOString(),
    };

    this.events.push(event);

    console.log(`[HDLAB Analytics] ${event.eventName}`, {
      userId: event.userId,
      chartId: event.chartId,
      refId: event.refId,
      amountMinor: event.amountMinor,
    });

    return event;
  }

  /** Get conversion metrics summary */
  public static getFunnelMetrics() {
    const counts: Record<HdlabFunnelEventName, number> = {
      result_view: 0,
      offer_view: 0,
      checkout_start: 0,
      payment_success: 0,
      reading_delivered: 0,
    };

    for (const e of this.events) {
      if (counts[e.eventName] !== undefined) {
        counts[e.eventName]++;
      }
    }

    const offerToCheckout = counts.offer_view > 0 ? counts.checkout_start / counts.offer_view : 0;
    const checkoutToPaid = counts.checkout_start > 0 ? counts.payment_success / counts.checkout_start : 0;
    const overallConversion = counts.result_view > 0 ? counts.payment_success / counts.result_view : 0;

    return {
      counts,
      conversionRates: {
        offerToCheckout: parseFloat((offerToCheckout * 100).toFixed(2)),
        checkoutToPaid: parseFloat((checkoutToPaid * 100).toFixed(2)),
        overallConversion: parseFloat((overallConversion * 100).toFixed(2)),
      },
      hypothesisH01: {
        description: "Deep Reading offer immediately post-calculation increases revenue per completed map",
        status: counts.payment_success > 0 ? "validated" : "testing",
      },
    };
  }
}
