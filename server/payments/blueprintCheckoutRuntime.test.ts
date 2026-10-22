import { afterEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "../../workers/pages-api";

afterEach(() => vi.unstubAllGlobals());

function fakeD1(options: { exists?: boolean; writeSuccess?: boolean } = {}) {
  const statements: { sql: string; args: unknown[] }[] = [];
  const db = {
    prepare(sql: string) {
      return {
        bind(...args: unknown[]) {
          statements.push({ sql, args });
          return {
            first: async () => options.exists ? { id: "snap_owned" } : null,
            run: async () => ({ success: options.writeSuccess !== false }),
          };
        },
      };
    },
  };
  return { db, statements };
}

const input = {
  plan: "blueprint" as const,
  locale: "en" as const,
  origin: "https://humandesignchart.app",
  customerEmail: "buyer@example.test",
  digitalDeliveryConsent: true,
  chartSnapshotId: "snap_owned",
};
const caller = (env: Record<string, unknown>) =>
  appRouter.createCaller({ env, request: new Request("https://humandesignchart.app/api/trpc") } as any);

describe("Cloudflare Blueprint checkout: no real payment may precede a valid chart", () => {
  it("saveChartSnapshot never returns a phantom id when D1 is missing", async () => {
    await expect(caller({}).subscription.saveChartSnapshot({
      email: "buyer@example.test", locale: "en", chartDataJson: '{"chart":1}',
    })).rejects.toThrow("CHART_STORAGE_UNAVAILABLE");
  });
  it("saveChartSnapshot refuses failed D1 persistence", async () => {
    const { db } = fakeD1({ writeSuccess: false });
    await expect(caller({ HD_ORDERS: db }).subscription.saveChartSnapshot({
      email: "buyer@example.test", locale: "en", chartDataJson: '{"chart":1}',
    })).rejects.toThrow("CHART_SNAPSHOT_PERSISTENCE_FAILED");
  });
  it("unknown snapshot prevents payment provider call", async () => {
    const { db } = fakeD1({ exists: false });
    const payment = vi.fn();
    vi.stubGlobal("fetch", payment);
    await expect(caller({ HD_ORDERS: db, PAYGATE_CHECKOUT_API_KEY_HUMAN_DESIGN: "unit_key" })
      .subscription.createCheckout(input)).rejects.toThrow("CHART_SNAPSHOT_REQUIRED");
    expect(payment).not.toHaveBeenCalled();
  });
  it("mismatched gateway amount prevents checkout response and order creation", async () => {
    const { db, statements } = fakeD1({ exists: true });
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({
      publicId: "OPT-unit-01", checkoutUrl: "https://pay.optimateo.com/c/test",
      offerKey: "hd-blueprint-en", amountMinor: 1, currency: "EUR",
    })));
    await expect(caller({ HD_ORDERS: db, PAYGATE_CHECKOUT_API_KEY_HUMAN_DESIGN: "unit_key" })
      .subscription.createCheckout(input)).rejects.toThrow("CHECKOUT_TEMPORARILY_UNAVAILABLE");
    expect(statements.some(entry => entry.sql.includes("INSERT INTO hd_orders"))).toBe(false);
  });
  it("matching verified snapshot and gateway quote create exactly one pending order", async () => {
    const { db, statements } = fakeD1({ exists: true });
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({
      publicId: "OPT-unit-02", checkoutUrl: "https://pay.optimateo.com/c/test",
      offerKey: "hd-blueprint-en", amountMinor: 1590, currency: "EUR",
    })));
    const result = await caller({ HD_ORDERS: db, PAYGATE_CHECKOUT_API_KEY_HUMAN_DESIGN: "unit_key" })
      .subscription.createCheckout(input);
    expect(result.refId).toBe("OPT-unit-02");
    expect(result.url).toBe("https://pay.optimateo.com/c/test");
    expect(statements.filter(entry => entry.sql.includes("INSERT INTO hd_orders"))).toHaveLength(1);
  });

  it("captures consent and click reference only when marketing was accepted", async () => {
    const { db, statements } = fakeD1({ exists: true });
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({
      publicId: "OPT-unit-03", checkoutUrl: "https://pay.optimateo.com/c/test",
      offerKey: "hd-blueprint-en", amountMinor: 1590, currency: "EUR",
    })));
    await caller({ HD_ORDERS: db, PAYGATE_CHECKOUT_API_KEY_HUMAN_DESIGN: "unit_key" })
      .subscription.createCheckout({ ...input, openAIAdsMarketingConsent: true, openAIAdsOppref: "verified-click-ref" });
    const inserted = statements.find(entry => entry.sql.includes("INSERT INTO hd_orders"));
    const consent = JSON.parse(String(inserted?.args.at(-1)));
    expect(consent.openAIAdsMarketingConsent).toBe(true);
    expect(consent.openAIAdsOppref).toBe("verified-click-ref");
  });

  it("does not store an OpenAI click reference if consent is missing", async () => {
    const { db, statements } = fakeD1({ exists: true });
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({
      publicId: "OPT-unit-04", checkoutUrl: "https://pay.optimateo.com/c/test",
      offerKey: "hd-blueprint-en", amountMinor: 1590, currency: "EUR",
    })));
    await caller({ HD_ORDERS: db, PAYGATE_CHECKOUT_API_KEY_HUMAN_DESIGN: "unit_key" })
      .subscription.createCheckout({ ...input, openAIAdsMarketingConsent: false, openAIAdsOppref: "should-not-be-saved" });
    const inserted = statements.find(entry => entry.sql.includes("INSERT INTO hd_orders"));
    const consent = JSON.parse(String(inserted?.args.at(-1)));
    expect(consent.openAIAdsMarketingConsent).toBe(false);
    expect(consent.openAIAdsOppref).toBeNull();
  });
});
