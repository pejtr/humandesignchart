import { afterEach, describe, expect, it, vi } from "vitest";
afterEach(() => vi.unstubAllGlobals());
import { buildConfirmedOrderEvent, buildVerifiedCloudflareOrderEvent, sendVerifiedOpenAIEventWithSecrets, claimCapiOutboxLock, finalizeCapiOutboxLock, executeTransactionalCapiOutbox } from "./openaiConversionsApi";

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
  const verifiedOrder = {
    id: "ord_cloudflare_1234",
    payment_status: "PAID",
    fulfillment_status: "FULFILLED",
    amount_minor: 14900,
    currency: "CZK",
    consent_record_json: JSON.stringify({
      digitalDeliveryConsent: true,
      openAIAdsMarketingConsent: true,
      openAIAdsOppref: "real-click-reference",
    }),
  };
  it("reports only paid fulfilled worker orders with checkout consent", () => {
    const event = buildVerifiedCloudflareOrderEvent(verifiedOrder, 1_792_000_000_000);
    expect(event?.id).toBe(verifiedOrder.id);
    expect(event?.type).toBe("order_created");
    expect(event?.data).toEqual({ type: "contents", amount: 14900, currency: "CZK" });
    expect(event?.oppref).toBe("real-click-reference");
    for (const [payment_status, fulfillment_status] of [["CREATED", "FULFILLED"], ["PAID", "PENDING"]]) {
      expect(buildVerifiedCloudflareOrderEvent({ ...verifiedOrder, payment_status, fulfillment_status })).toBeNull();
    }
    expect(buildVerifiedCloudflareOrderEvent({
      ...verifiedOrder, consent_record_json: JSON.stringify({ openAIAdsMarketingConsent: false }),
    })).toBeNull();
    expect(buildVerifiedCloudflareOrderEvent({ ...verifiedOrder, consent_record_json: "{" })).toBeNull();
  });
  it("drops unsafe click references and any personally identifying information", () => {
    const event = buildVerifiedCloudflareOrderEvent({
      ...verifiedOrder,
      consent_record_json: JSON.stringify({
        openAIAdsMarketingConsent: true, openAIAdsOppref: ["unsafe", "click"].join(String.fromCharCode(10)),
        birthDate: "2000-01-01", customerEmail: "private@example.invalid",
      }),
    });
    expect(event?.oppref).toBeUndefined();
    expect(JSON.stringify(event)).not.toContain("private@example.invalid");
    expect(JSON.stringify(event)).not.toContain("birthDate");
  });
  it("does not send when Cloudflare server secrets are missing", async () => {
    const request = vi.fn();
    vi.stubGlobal("fetch", request);
    const event = buildVerifiedCloudflareOrderEvent(verifiedOrder)!;
    expect(await sendVerifiedOpenAIEventWithSecrets(event, {})).toBe(false);
    expect(request).not.toHaveBeenCalled();
  });
  it("sends a single server-side event using configured secret bindings", async () => {
    const request = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) => new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", request);
    const event = buildVerifiedCloudflareOrderEvent(verifiedOrder)!;
    expect(await sendVerifiedOpenAIEventWithSecrets(event, {
      OPENAI_ADS_PIXEL_ID: "pixel-test", OPENAI_CONVERSIONS_API_KEY: "fake-test-only",
    })).toBe(true);
    const [url, options] = request.mock.calls[0];
    expect(String(url)).toContain("pid=pixel-test");
    expect(JSON.parse(String(options?.body)).events).toEqual([event]);
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

describe("Transactional CAPI outbox with concurrency lock", () => {
  function makeMockD1(initialOrder: any) {
    let currentOrder = initialOrder ? JSON.parse(JSON.stringify(initialOrder)) : null;
    const queries: { sql: string; args: any[] }[] = [];

    const db = {
      prepare(sql: string) {
        return {
          bind(...args: any[]) {
            queries.push({ sql, args });
            return {
              first: async () => currentOrder ? JSON.parse(JSON.stringify(currentOrder)) : null,
              run: async () => {
                if (!currentOrder) return { success: false, meta: { changes: 0 } };

                // Handle claim update
                if (sql.includes("openAIAdsCapiStatus', 'IN_FLIGHT'")) {
                  let consent = JSON.parse(currentOrder.consent_record_json || "{}");
                  if (consent.openAIAdsCapiSentAt) return { success: true, meta: { changes: 0 } };
                  if (consent.openAIAdsCapiStatus === "IN_FLIGHT") {
                    // Check lease
                    return { success: true, meta: { changes: 0 } };
                  }
                  consent.openAIAdsCapiStatus = "IN_FLIGHT";
                  consent.openAIAdsCapiClaimedAt = new Date().toISOString();
                  currentOrder.consent_record_json = JSON.stringify(consent);
                  return { success: true, meta: { changes: 1 } };
                }

                // Handle finalize SENT
                if (sql.includes("openAIAdsCapiStatus', 'SENT'")) {
                  let consent = JSON.parse(currentOrder.consent_record_json || "{}");
                  consent.openAIAdsCapiStatus = "SENT";
                  consent.openAIAdsCapiSentAt = new Date().toISOString();
                  currentOrder.consent_record_json = JSON.stringify(consent);
                  return { success: true, meta: { changes: 1 } };
                }

                // Handle finalize FAILED
                if (sql.includes("openAIAdsCapiStatus', 'FAILED'")) {
                  let consent = JSON.parse(currentOrder.consent_record_json || "{}");
                  consent.openAIAdsCapiStatus = "FAILED";
                  currentOrder.consent_record_json = JSON.stringify(consent);
                  return { success: true, meta: { changes: 1 } };
                }

                return { success: true, meta: { changes: 1 } };
              },
            };
          },
        };
      },
      getCurrentOrder: () => currentOrder,
      getQueries: () => queries,
    };
    return db;
  }

  const baseOrder = {
    id: "ord_outbox_test",
    payment_status: "PAID",
    fulfillment_status: "FULFILLED",
    amount_minor: 29000,
    currency: "CZK",
    consent_record_json: JSON.stringify({
      digitalDeliveryConsent: true,
      openAIAdsMarketingConsent: true,
      openAIAdsOppref: "outbox_click_ref",
    }),
  };

  it("claims lock, dispatches conversion, and finalizes to SENT with receipt", async () => {
    const db = makeMockD1(baseOrder);
    const mockFetch = vi.fn(async () => new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", mockFetch);

    const result = await executeTransactionalCapiOutbox(db, {
      OPENAI_ADS_PIXEL_ID: "pid_123",
      OPENAI_CONVERSIONS_API_KEY: "key_123",
    }, "ref_test_01");

    expect(result).toBe("SENT");
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const orderAfter = db.getCurrentOrder();
    const consentAfter = JSON.parse(orderAfter.consent_record_json);
    expect(consentAfter.openAIAdsCapiStatus).toBe("SENT");
    expect(consentAfter.openAIAdsCapiSentAt).toBeDefined();
  });

  it("blocks concurrent callbacks: exactly one request is sent to OpenAI", async () => {
    const db = makeMockD1(baseOrder);
    const mockFetch = vi.fn(async () => {
      // Simulate network latency so concurrent request arrives while in-flight
      await new Promise(r => setTimeout(r, 20));
      return new Response(null, { status: 200 });
    });
    vi.stubGlobal("fetch", mockFetch);

    const env = { OPENAI_ADS_PIXEL_ID: "pid_123", OPENAI_CONVERSIONS_API_KEY: "key_123" };

    // Fire 2 concurrent callbacks for the same payment reference
    const [res1, res2] = await Promise.all([
      executeTransactionalCapiOutbox(db, env, "ref_test_01"),
      executeTransactionalCapiOutbox(db, env, "ref_test_01"),
    ]);

    // One wins and sends; the other is rejected as IN_FLIGHT
    expect([res1, res2].sort()).toEqual(["IN_FLIGHT", "SENT"]);
    expect(mockFetch).toHaveBeenCalledTimes(1); // EXACTLY ONCE!
  });

  it("skips orders that were already marked SENT (idempotence)", async () => {
    const sentOrder = {
      ...baseOrder,
      consent_record_json: JSON.stringify({
        openAIAdsMarketingConsent: true,
        openAIAdsCapiStatus: "SENT",
        openAIAdsCapiSentAt: "2026-10-22T12:00:00Z",
      }),
    };
    const db = makeMockD1(sentOrder);
    const mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);

    const result = await executeTransactionalCapiOutbox(db, {
      OPENAI_ADS_PIXEL_ID: "pid_123",
      OPENAI_CONVERSIONS_API_KEY: "key_123",
    }, "ref_test_01");

    expect(result).toBe("ALREADY_SENT");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("marks FAILED when CAPI rejects or secrets missing, allowing retry", async () => {
    const db = makeMockD1(baseOrder);
    const mockFetch = vi.fn(async () => new Response(null, { status: 500 }));
    vi.stubGlobal("fetch", mockFetch);

    const result = await executeTransactionalCapiOutbox(db, {
      OPENAI_ADS_PIXEL_ID: "pid_123",
      OPENAI_CONVERSIONS_API_KEY: "key_123",
    }, "ref_test_01");

    expect(result).toBe("FAILED");
    const consentAfter = JSON.parse(db.getCurrentOrder().consent_record_json);
    expect(consentAfter.openAIAdsCapiStatus).toBe("FAILED");
    expect(consentAfter.openAIAdsCapiSentAt).toBeUndefined(); // NOT marked as sent!
  });
  it("strictly rejects sandbox / QA test orders (is_test = 1) from claiming CAPI lock or sending conversions", async () => {
    const testOrder = {
      ...baseOrder,
      is_test: 1,
    };
    const db = makeMockD1(testOrder);
    const mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);

    // Event builder returns null
    expect(buildVerifiedCloudflareOrderEvent(testOrder as any)).toBeNull();

    // Outbox lock returns INELIGIBLE
    const claim = await claimCapiOutboxLock(db, "ref_test_01");
    expect(claim.status).toBe("INELIGIBLE");

    // Full dispatch returns INELIGIBLE and never calls fetch
    const result = await executeTransactionalCapiOutbox(db, {
      OPENAI_ADS_PIXEL_ID: "pid_123",
      OPENAI_CONVERSIONS_API_KEY: "key_123",
    }, "ref_test_01");

    expect(result).toBe("INELIGIBLE");
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
