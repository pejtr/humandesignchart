import { afterEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "../../workers/pages-api";

afterEach(() => vi.unstubAllGlobals());

const paid = { status: "PAID", offerKey: "hd-blueprint-en", amountMinor: 1590, currency: "EUR" };
const local = { payment_status: "CREATED", fulfillment_status: "PENDING", offer_key: "hd-blueprint-en", amount_minor: 1590, currency: "EUR", download_token: "unit_token" };

async function verify(
  order: typeof local | null,
  payment: Record<string, unknown>,
  options: { s2sKey?: string | null; writeSuccess?: boolean; writeChanges?: number; statusHttp?: number } = {},
) {
  const writes: string[] = [];
  const db = {
    prepare(sql: string) {
      return {
        bind() {
          return {
            first: async () => order,
            run: async () => {
              writes.push(sql);
              return { success: options.writeSuccess !== false, ...(options.writeChanges === undefined ? {} : { meta: { changes: options.writeChanges } }) };
            },
          };
        },
      };
    },
  };
  const gateway = vi.fn(async (_url: string, _options?: RequestInit) => Response.json(payment, { status: options.statusHttp ?? 200 }));
  vi.stubGlobal("fetch", gateway);
  const api = appRouter.createCaller({
    env: {
      HD_ORDERS: db,
      PAY_BASE_URL: "https://pay.optimateo.com",
      ...(options.s2sKey === null ? {} : { PAYGATE_CHECKOUT_API_KEY_HUMAN_DESIGN: options.s2sKey ?? "unit_s2s_secret" }),
    },
    request: new Request("https://humandesignchart.app/api/trpc"),
  } as any);
  return { response: await api.subscription.verifyPayment({ refId: "qa_ref" }), writes, gateway };
}

describe("subscription.verifyPayment production safety gate", () => {

  it("uses a server-only bearer credential for provider status checks", async () => {
    const { gateway } = await verify(local, paid);
    expect(gateway).toHaveBeenCalledTimes(1);
    expect(gateway.mock.calls[0]?.[0]).toBe("https://pay.optimateo.com/api/payments/qa_ref/status");
    expect(gateway.mock.calls[0]?.[1]?.headers).toMatchObject({
      Authorization: "Bearer unit_s2s_secret",
      "cache-control": "no-store",
    });
  });
  it("never makes anonymous gateway requests without a configured credential", async () => {
    const { gateway, response, writes } = await verify(local, paid, { s2sKey: null });
    expect(gateway).not.toHaveBeenCalled();
    expect(response.verified).toBe(false);
    expect(response.status).toBe("CREATED");
    expect(writes).toHaveLength(0);
  });
  it("trusts an already PAID local callback without an outbound gateway request", async () => {
    const { gateway, response, writes } = await verify({ ...local, payment_status: "PAID" }, {}, { s2sKey: null });
    expect(gateway).not.toHaveBeenCalled();
    expect(response.verified).toBe(true);
    expect(response.status).toBe("PAID");
    expect(writes).toHaveLength(0);
  });
  it("does not mark a captured payment verified until the D1 paid state persists", async () => {
    const { gateway, response, writes } = await verify(local, paid, { writeSuccess: false });
    expect(gateway).toHaveBeenCalledTimes(1);
    expect(writes).toHaveLength(1);
    expect(response.verified).toBe(false);
    expect(response.status).toBe("PAYMENT_CONFIRMATION_PENDING");
  });
  it("treats a no-op D1 write as pending unless a fresh PAID row is confirmed", async () => {
    const { response, writes } = await verify(local, paid, { writeChanges: 0 });
    expect(writes).toHaveLength(1);
    expect(response.verified).toBe(false);
    expect(response.status).toBe("PAYMENT_CONFIRMATION_PENDING");
  });
  it("does not turn a failed gateway status lookup into a paid order", async () => {
    const { response, writes } = await verify(local, paid, { statusHttp: 401 });
    expect(response.verified).toBe(false);
    expect(response.status).toBe("CREATED");
    expect(writes).toHaveLength(0);
  });
  it("does not confirm provider PAID without a matching local D1 order", async () => {
    const { response, writes } = await verify(null, paid);
    expect(response.verified).toBe(false);
    expect(response.status).toBe("NOT_FOUND");
    expect(writes).toHaveLength(0);
  });
  it("does not mark mismatched amount paid in D1", async () => {
    const { response, writes } = await verify(local, { ...paid, amountMinor: 1 });
    expect(response.verified).toBe(false);
    expect(writes).toHaveLength(0);
  });
  it("confirms matching price and offer and persists payment verification", async () => {
    const { response, writes } = await verify(local, paid);
    expect(response.verified).toBe(true);
    expect(response.amountMinor).toBe(1590);
    expect(response.currency).toBe("EUR");
    expect(writes).toHaveLength(1);
  });
});
