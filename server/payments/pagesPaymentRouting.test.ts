import { afterEach, describe, expect, it, vi } from "vitest";
import worker from "../../workers/pages-api";

afterEach(() => vi.unstubAllGlobals());
const assets = { fetch: vi.fn(() => Promise.resolve(new Response("asset"))) };
const request = (path: string) => new Request(`https://humandesignchart.app${path}`);

describe("Pages payment routing diagnostics", () => {
  it("separates liveness from missing payment configuration without exposing credentials", async () => {
    const response = await worker.fetch(request("/api/health"), { ASSETS: assets });
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toMatchObject({
      ok: true, runtime: "cloudflare-pages", payments: {
        provider: "onyxpay", configured: false, verified: false,
        callbackPath: "/api/internal/onyxpay/fulfill",
      },
    });
  });
  it("reports configuration only, never claims an end-to-end payment was verified", async () => {
    const response = await worker.fetch(request("/api/health"), {
      ASSETS: assets, HD_ORDERS: {}, PAYGATE_CHECKOUT_API_KEY_HUMAN_DESIGN: "checkout-secret",
      HUMAN_DESIGN_FULFILLMENT_API_KEY: "callback-secret", BREVO_API_KEY: "email-secret",
    });
    const body = await response.json();
    expect(body.payments).toMatchObject({ configured: true, verified: false });
    expect(JSON.stringify(body)).not.toMatch(/checkout-secret|callback-secret|email-secret/);
  });
});

describe("Pages fulfillment boundary", () => {
  const event = { eventType: "PAYMENT_CAPTURED", tenant: "human-design", offerKey: "hd-blueprint-en",
    refId: "OPT-unit", eventId: "event-unit", customerEmail: "buyer@example.test", amount: 1590, currency: "EUR" };
  const order = { chart_snapshot_id: "snap-unit", customer_email: event.customerEmail,
    offer_key: event.offerKey, amount_minor: event.amount, currency: event.currency,
    payment_status: "PAID", fulfillment_status: "FULFILLED", download_token: "existing-token" };
  const callback = () => new Request("https://humandesignchart.app/api/internal/onyxpay/fulfill", {
    method: "POST", headers: { authorization: "Bearer unit-key" }, body: JSON.stringify(event),
  });
  it("acknowledges repeated fulfillment with the original access token and no second email", async () => {
    const sqlStatements: string[] = [];
    const db = { prepare: (sql: string) => {
      sqlStatements.push(sql);
      return { bind: () => ({
        first: async () => sql.includes("hd_chart_snapshots") ? { id: "snap-unit" } : order,
        run: async () => ({ success: true, meta: { changes: 0 } }),
      }) };
    } };
    const fetch = vi.fn(async () => Response.json({ status: "PAID", amountMinor: 1590, currency: "EUR" }));
    vi.stubGlobal("fetch", fetch);
    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await worker.fetch(callback(), { ASSETS: assets, HD_ORDERS: db,
        HUMAN_DESIGN_FULFILLMENT_API_KEY: "unit-key" });
      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({ status: "ALREADY_FULFILLED", publicToken: "existing-token" });
    }
    expect(fetch).toHaveBeenCalledTimes(2); // Only authoritative gateway lookups.
    expect(sqlStatements.some(sql => sql.includes("SET event_id"))).toBe(false);
  });
  it.each([
    { row: null, status: 503, error: "CHART_SNAPSHOT_REQUIRED" },
    { row: { ...order, amount_minor: 1 }, status: 422, error: "ORDER_DATA_MISMATCH" },
    { row: { ...order, offer_key: "hd-blueprint-cz" }, status: 422, error: "ORDER_DATA_MISMATCH" },
  ])("rejects invalid persisted orders: $error", async ({ row, status, error }) => {
    const run = vi.fn();
    const db = { prepare: (sql: string) => ({ bind: () => ({
      first: async () => sql.includes("hd_chart_snapshots") ? { id: "snap-unit" } : row, run,
    }) }) };
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ status: "PAID", amountMinor: 1590, currency: "EUR" })));
    const response = await worker.fetch(callback(), { ASSETS: assets, HD_ORDERS: db,
      HUMAN_DESIGN_FULFILLMENT_API_KEY: "unit-key" });
    expect(response.status).toBe(status);
    expect(await response.json()).toMatchObject({ error });
    expect(run).not.toHaveBeenCalled();
  });
  it("rejects an unauthenticated callback before reading a payment or database", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const response = await worker.fetch(new Request("https://humandesignmapa.cz/api/internal/onyxpay/fulfill", {
      method: "POST", body: "{}",
    }), { ASSETS: assets, HUMAN_DESIGN_FULFILLMENT_API_KEY: "unit-key" });
    expect(response.status).toBe(401);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("does not accept Stripe events as gateway callbacks", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const response = await worker.fetch(new Request("https://humandesignchart.app/api/internal/onyxpay/fulfill", {
      method: "POST", headers: { authorization: "Bearer unit-key" },
      body: JSON.stringify({ type: "checkout.session.completed", id: "evt_unit" }),
    }), { ASSETS: assets, HUMAN_DESIGN_FULFILLMENT_API_KEY: "unit-key" });
    expect(response.status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });
});
