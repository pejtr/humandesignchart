import { afterEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "../../workers/pages-api";

afterEach(() => vi.unstubAllGlobals());

const paid = { status: "PAID", offerKey: "hd-blueprint-en", amountMinor: 1590, currency: "EUR" };
const local = { payment_status: "CREATED", fulfillment_status: "PENDING", offer_key: "hd-blueprint-en", amount_minor: 1590, currency: "EUR", download_token: "unit_token" };

async function verify(order: typeof local | null, payment: Record<string, unknown>) {
  const writes: string[] = [];
  const db = {
    prepare(sql: string) {
      return {
        bind() {
          return {
            first: async () => order,
            run: async () => { writes.push(sql); return { success: true }; },
          };
        },
      };
    },
  };
  vi.stubGlobal("fetch", vi.fn(async () => Response.json(payment)));
  const api = appRouter.createCaller({
    env: { HD_ORDERS: db, PAY_BASE_URL: "https://pay.optimateo.com" },
    request: new Request("https://humandesignchart.app/api/trpc"),
  } as any);
  return { response: await api.subscription.verifyPayment({ refId: "qa_ref" }), writes };
}

describe("subscription.verifyPayment production safety gate", () => {
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
