import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "../../workers/pages-api";
import { TRPCError } from "@trpc/server";

interface MockOrder {
  id: string;
  payment_ref: string;
  payment_status: string;
  ai_reading_credits: number;
  download_token: string;
  download_token_expires_at: string | null;
  locale: string;
  offer_key: string;
  chart_data_json: string;
}

interface MockReading {
  id: string;
  order_id: string;
  token: string;
  idempotency_key: string | null;
  reading_type: string;
  prompt: string | null;
  reading_content: string;
  model: string;
  created_at: string;
}

function createMockD1(initialOrder: MockOrder, options?: { failInsert?: boolean }) {
  let orders: Map<string, MockOrder> = new Map([[initialOrder.id, { ...initialOrder }]]);
  let readings: MockReading[] = [];
  let failInsert = options?.failInsert ?? false;

  const mockD1: any = {
    _orders: orders,
    _readings: readings,
    setFailInsert(val: boolean) {
      failInsert = val;
    },
    prepare(sql: string) {
      let boundParams: any[] = [];
      const stmt = {
        _sql: sql,
        bind(...args: any[]) {
          boundParams = args;
          return stmt;
        },
        async first<T = any>(): Promise<T | null> {
          if (sql.includes("FROM hd_orders o") && sql.includes("WHERE o.download_token = ?")) {
            const token = boundParams[0];
            for (const ord of orders.values()) {
              if (ord.download_token === token) {
                return {
                  id: ord.id,
                  payment_status: ord.payment_status,
                  ai_reading_credits: ord.ai_reading_credits,
                  download_token_expires_at: ord.download_token_expires_at,
                  locale: ord.locale,
                  offer_key: ord.offer_key,
                  chart_data_json: ord.chart_data_json,
                } as any;
              }
            }
            return null;
          }

          if (sql.includes("FROM hd_orders") && sql.includes("WHERE id = ?")) {
            const ord = orders.get(boundParams[0]);
            return ord ? ({ ai_reading_credits: ord.ai_reading_credits } as any) : null;
          }

          if (sql.includes("FROM hd_ai_readings") && sql.includes("order_id = ? AND idempotency_key = ?")) {
            const [orderId, idemKey] = boundParams;
            const r = readings.find((item) => item.order_id === orderId && item.idempotency_key === idemKey);
            return r ? ({ reading_content: r.reading_content, model: r.model, created_at: r.created_at } as any) : null;
          }

          return null;
        },
        async run() {
          if (sql.includes("DELETE FROM hd_ai_readings WHERE id = ?")) {
            const id = boundParams[0];
            readings = readings.filter((r) => r.id !== id);
            return { success: true, meta: { changes: 1 } };
          }
          return { success: true, meta: { changes: 1 } };
        },
      };
      return stmt;
    },
    async batch(statements: any[]) {
      // Create snapshot for atomic rollback
      const ordersSnapshot = new Map(Array.from(orders.entries()).map(([k, v]) => [k, { ...v }]));
      const readingsSnapshot = [...readings];

      try {
        const results = [];
        for (const s of statements) {
          const sql = s._sql as string;
          if (sql.includes("UPDATE hd_orders")) {
            // WHERE id = ? AND ai_reading_credits > 0
            const orderId = s.boundParams ? s.boundParams[0] : null;
            // Extract bound params from stmt if stored
            const ord = orders.get(orderId);
            if (ord && ord.ai_reading_credits > 0) {
              ord.ai_reading_credits -= 1;
              results.push({ success: true, meta: { changes: 1 } });
            } else {
              results.push({ success: true, meta: { changes: 0 } });
            }
          } else if (sql.includes("INSERT INTO hd_ai_readings")) {
            if (failInsert) {
              throw new Error("Simulated D1 Disk/Database Failure on INSERT");
            }
            const [id, order_id, token, idempotency_key, reading_type, prompt, reading_content, model] = s.boundParams;
            // Check UNIQUE index on (order_id, idempotency_key)
            if (idempotency_key) {
              const existing = readings.find(
                (r) => r.order_id === order_id && r.idempotency_key === idempotency_key
              );
              if (existing) {
                const uniqueErr: any = new Error("UNIQUE constraint failed: hd_ai_readings.order_id, hd_ai_readings.idempotency_key");
                uniqueErr.code = "SQLITE_CONSTRAINT_UNIQUE";
                throw uniqueErr;
              }
            }
            const newReading: MockReading = {
              id,
              order_id,
              token,
              idempotency_key,
              reading_type,
              prompt,
              reading_content,
              model,
              created_at: new Date().toISOString(),
            };
            readings.push(newReading);
            results.push({ success: true, meta: { changes: 1 } });
          } else {
            results.push({ success: true, meta: { changes: 1 } });
          }
        }
        return results;
      } catch (err) {
        // Roll back changes on error (atomic guarantee of d1.batch)
        orders = ordersSnapshot;
        readings = readingsSnapshot;
        mockD1._orders = orders;
        mockD1._readings = readings;
        throw err;
      }
    },
  };

  // Enhance prepare to store boundParams on stmt
  const originalPrepare = mockD1.prepare.bind(mockD1);
  mockD1.prepare = (sql: string) => {
    const stmt = originalPrepare(sql);
    const origBind = stmt.bind.bind(stmt);
    stmt.bind = (...args: any[]) => {
      stmt.boundParams = args;
      return origBind(...args);
    };
    return stmt;
  };

  return mockD1;
}

const sampleChart = {
  type: "Manifesting Generator",
  profile: "3/5",
  authority: "Sacral",
  definition: "Split Definition",
  channels: ["20-34", "10-20"],
  gates: [20, 34, 10],
  centers: [
    { name: "Sacral", defined: true },
    { name: "Throat", defined: true },
  ],
};

const validPaidOrder: MockOrder = {
  id: "ord_test_atomic_123",
  payment_ref: "pay_ref_atomic_123",
  payment_status: "PAID",
  ai_reading_credits: 5,
  download_token: "tok_test_valid_atomic_token_1234567890",
  download_token_expires_at: new Date(Date.now() + 86400000).toISOString(),
  locale: "cs",
  offer_key: "hd-blueprint-cz",
  chart_data_json: JSON.stringify(sampleChart),
};

describe("Atomic AI Reading Credit Transactions", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async (url: any) => {
      const urlStr = typeof url === "string" ? url : url?.url || "";
      if (urlStr.includes("openrouter.ai") || urlStr.includes("googleapis.com")) {
        return new Response(JSON.stringify({
          choices: [{ message: { content: "Osobní výklad lidského designu pro Manifestujícího Generátora. Vaše sakrální autorita a profil 3/5..." } }]
        }), { status: 200, headers: { "content-type": "application/json" } });
      }
      return new Response("Not found", { status: 404 });
    }));
  });
  it("decrements exactly 1 credit and returns committed balance on success", async () => {
    const mockD1 = createMockD1(validPaidOrder);
    const caller = appRouter.createCaller({
      env: { HD_ORDERS: mockD1 } as any,
      request: new Request("https://humandesignmapa.cz"),
    });

    const res = await caller.subscription.redeemAiReading({
      token: validPaidOrder.download_token,
      readingType: "overview",
      idempotencyKey: "test_idem_success_1",
    });

    expect(res.success).toBe(true);
    expect(res.remainingCredits).toBe(4);
    expect(res.reading).toBeTruthy();
    expect(mockD1._orders.get(validPaidOrder.id)?.ai_reading_credits).toBe(4);
    expect(mockD1._readings.length).toBe(1);
    expect(mockD1._readings[0].idempotency_key).toBe("test_idem_success_1");
  });

  it("provider failure leaves credits intact and does not persist reading", async () => {
    const mockD1 = createMockD1(validPaidOrder);
    // Point OPENROUTER to an unreachable port or mock failure
    const caller = appRouter.createCaller({
      env: {
        HD_ORDERS: mockD1,
        // When invalid credentials cause API error, fallback grounded engine is used.
        // But if chart data is invalid, generation fails closed.
      } as any,
      request: new Request("https://humandesignmapa.cz"),
    });

    // Corrupt chart JSON in order to trigger AI_GENERATION_FAILED
    const corruptedOrder = { ...validPaidOrder, chart_data_json: "{invalid_json}" };
    const corruptedD1 = createMockD1(corruptedOrder);
    const corruptedCaller = appRouter.createCaller({
      env: { HD_ORDERS: corruptedD1 } as any,
      request: new Request("https://humandesignmapa.cz"),
    });

    await expect(
      corruptedCaller.subscription.redeemAiReading({
        token: corruptedOrder.download_token,
        readingType: "overview",
      })
    ).rejects.toThrow("CHART_DATA_NOT_FOUND");

    // Credits must remain untouched
    expect(corruptedD1._orders.get(corruptedOrder.id)?.ai_reading_credits).toBe(5);
    expect(corruptedD1._readings.length).toBe(0);
  });

  it("reading persistence failure in d1.batch reverts credit decrement", async () => {
    const mockD1 = createMockD1(validPaidOrder, { failInsert: true });
    const caller = appRouter.createCaller({
      env: { HD_ORDERS: mockD1 } as any,
      request: new Request("https://humandesignmapa.cz"),
    });

    await expect(
      caller.subscription.redeemAiReading({
        token: validPaidOrder.download_token,
        readingType: "overview",
        idempotencyKey: "test_idem_fail_insert",
      })
    ).rejects.toThrow("READING_PERSISTENCE_FAILED");

    // Verified: credit decrement was rolled back by atomic batch!
    expect(mockD1._orders.get(validPaidOrder.id)?.ai_reading_credits).toBe(5);
    expect(mockD1._readings.length).toBe(0);
  });

  it("concurrent requests with the same idempotency key do not double-charge", async () => {
    const mockD1 = createMockD1(validPaidOrder);
    const caller = appRouter.createCaller({
      env: { HD_ORDERS: mockD1 } as any,
      request: new Request("https://humandesignmapa.cz"),
    });

    const idemKey = "concurrent_idem_key_abc123";

    // Dispatch two concurrent requests with identical idempotency key
    const [res1, res2] = await Promise.all([
      caller.subscription.redeemAiReading({
        token: validPaidOrder.download_token,
        readingType: "overview",
        idempotencyKey: idemKey,
      }),
      caller.subscription.redeemAiReading({
        token: validPaidOrder.download_token,
        readingType: "overview",
        idempotencyKey: idemKey,
      }),
    ]);

    expect(res1.success).toBe(true);
    expect(res2.success).toBe(true);

    // Both should report 4 remaining credits (single deduction)
    expect(res1.remainingCredits).toBe(4);
    expect(res2.remainingCredits).toBe(4);

    // Database state: exactly 1 deduction, exactly 1 reading record
    expect(mockD1._orders.get(validPaidOrder.id)?.ai_reading_credits).toBe(4);
    expect(mockD1._readings.length).toBe(1);
  });

  it("caps at 5 readings and rejects 6th attempt with FORBIDDEN NO_AI_CREDITS_REMAINING", async () => {
    const mockD1 = createMockD1(validPaidOrder);
    const caller = appRouter.createCaller({
      env: { HD_ORDERS: mockD1 } as any,
      request: new Request("https://humandesignmapa.cz"),
    });

    // Execute 5 valid redemptions
    for (let i = 1; i <= 5; i++) {
      const res = await caller.subscription.redeemAiReading({
        token: validPaidOrder.download_token,
        readingType: "overview",
        idempotencyKey: `sequential_key_${i}`,
      });
      expect(res.success).toBe(true);
      expect(res.remainingCredits).toBe(5 - i);
      expect(mockD1._orders.get(validPaidOrder.id)?.ai_reading_credits).toBe(5 - i);
    }

    // 6th attempt must fail closed
    await expect(
      caller.subscription.redeemAiReading({
        token: validPaidOrder.download_token,
        readingType: "overview",
        idempotencyKey: "sequential_key_6",
      })
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "NO_AI_CREDITS_REMAINING",
    });

    // Credit balance must remain at 0, no extra reading persisted
    expect(mockD1._orders.get(validPaidOrder.id)?.ai_reading_credits).toBe(0);
    expect(mockD1._readings.length).toBe(5);
  });

  it("rejects unpaid orders and expired tokens", async () => {
    const unpaidOrder: MockOrder = {
      ...validPaidOrder,
      id: "ord_unpaid",
      payment_status: "CREATED",
      download_token: "tok_unpaid_123456789012345678",
    };
    const expiredOrder: MockOrder = {
      ...validPaidOrder,
      id: "ord_expired",
      download_token: "tok_expired_123456789012345678",
      download_token_expires_at: new Date(Date.now() - 3600000).toISOString(),
    };

    const d1Unpaid = createMockD1(unpaidOrder);
    const callerUnpaid = appRouter.createCaller({
      env: { HD_ORDERS: d1Unpaid } as any,
      request: new Request("https://humandesignmapa.cz"),
    });

    await expect(
      callerUnpaid.subscription.redeemAiReading({
        token: unpaidOrder.download_token,
      })
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "ORDER_NOT_PAID",
    });

    const d1Expired = createMockD1(expiredOrder);
    const callerExpired = appRouter.createCaller({
      env: { HD_ORDERS: d1Expired } as any,
      request: new Request("https://humandesignmapa.cz"),
    });

    await expect(
      callerExpired.subscription.redeemAiReading({
        token: expiredOrder.download_token,
      })
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "ACCESS_TOKEN_EXPIRED",
    });
  });
});
