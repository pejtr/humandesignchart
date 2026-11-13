import { afterEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "../../workers/pages-api";
import { calculateChart } from "../humandesign/calculator";
import { isCompleteBlueprintChart, isCompleteBlueprintChartJson } from "../../shared/chartSchemas";
import { generateChartPDF } from "../../client/src/lib/pdfExport";
import {
  GATE_DESCRIPTIONS, CHANNEL_DESCRIPTIONS, TYPE_DESCRIPTIONS,
  AUTHORITY_DESCRIPTIONS, PROFILE_DESCRIPTIONS, CENTER_DESCRIPTIONS,
} from "../data/hdContent";

afterEach(() => vi.unstubAllGlobals());

const validChartJson = JSON.stringify(calculateChart({
  name: "Unit test",
  birthDate: "1879-03-14",
  birthTime: "11:30",
  birthPlace: "Ulm, Germany",
  latitude: 48.3985,
  longitude: 9.9912,
  timezone: "Europe/Berlin",
}));
const COOKIE = "__Host-hd_session=" + "a".repeat(43);

function fakeD1(options: { exists?: boolean; writeSuccess?: boolean; incomplete?: boolean; alreadyPaid?: boolean; paidLookupFails?: boolean } = {}) {
  const statements: { sql: string; args: unknown[] }[] = [];
  const db = {
    prepare(sql: string) {
      return {
        bind(...args: unknown[]) {
          statements.push({ sql, args });
          return {
            first: async () => {
              if (sql.includes("FROM hd_oauth_sessions")) {
                return { id: 7, email: "buyer@example.test", name: "Test Buyer", created_at: "2026-01-01 00:00:00" };
              }
              if (sql.includes("FROM hd_orders o") && sql.includes("INNER JOIN hd_chart_snapshots s")) {
                if (options.paidLookupFails) throw new Error("D1_READ_FAILED");
                return options.alreadyPaid ? { id: "previous-paid-blueprint" } : null;
              }
              return options.exists
                ? { id: "snap_owned", chart_data_json: options.incomplete ? '{"type":"Generator"}' : validChartJson }
                : null;
            },
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
  appRouter.createCaller({ env, request: new Request("https://humandesignchart.app/api/trpc", { headers: { cookie: COOKIE } }) } as any);

describe("Cloudflare Blueprint checkout: no real payment may precede a valid chart", () => {
  it("rejects placeholder chart data independently of payment", () => {
    expect(isCompleteBlueprintChartJson(validChartJson)).toBe(true);
    expect(isCompleteBlueprintChartJson('{"type":"Manifesting Generator","profile":"2/4"}')).toBe(false);
    expect(isCompleteBlueprintChartJson("not json")).toBe(false);
    const parsed = JSON.parse(validChartJson);
    parsed.activatedGates = [];
    expect(isCompleteBlueprintChart(parsed)).toBe(false);
    parsed.activatedGates = JSON.parse(validChartJson).activatedGates;
    parsed.strategy = "undefined";
    expect(isCompleteBlueprintChart(parsed)).toBe(false);
  });

  it("guest or incomplete snapshot never calls payment gateway", async () => {
    const payment = vi.fn();
    vi.stubGlobal("fetch", payment);
    const { db } = fakeD1({ exists: true });
    const guest = appRouter.createCaller({ env: { HD_ORDERS: db, PAYGATE_CHECKOUT_API_KEY_HUMAN_DESIGN: "unit_key" },
      request: new Request("https://humandesignchart.app/api/trpc") } as any);
    await expect(guest.subscription.createCheckout(input)).rejects.toThrow("LOGIN_REQUIRED_BEFORE_CHECKOUT");
    const bad = fakeD1({ exists: true, incomplete: true });
    await expect(caller({ HD_ORDERS: bad.db, PAYGATE_CHECKOUT_API_KEY_HUMAN_DESIGN: "unit_key" })
      .subscription.createCheckout(input)).rejects.toThrow("COMPLETE_BIRTH_CHART_REQUIRED");
    expect(payment).not.toHaveBeenCalled();
  });

  it("checkout email must match authenticated account", async () => {
    const { db } = fakeD1({ exists: true });
    await expect(caller({ HD_ORDERS: db, PAYGATE_CHECKOUT_API_KEY_HUMAN_DESIGN: "unit_key" })
      .subscription.createCheckout({ ...input, customerEmail: "other@example.test" }))
      .rejects.toThrow("CHECKOUT_EMAIL_MUST_MATCH_ACCOUNT");
  });

  it("blocks paying again for the same birth chart and directs to recovery", async () => {
    const { db, statements } = fakeD1({ exists: true, alreadyPaid: true });
    const payment = vi.fn();
    vi.stubGlobal("fetch", payment);
    await expect(caller({ HD_ORDERS: db, PAYGATE_CHECKOUT_API_KEY_HUMAN_DESIGN: "unit_key" })
      .subscription.createCheckout(input)).rejects.toThrow("BLUEPRINT_ALREADY_PAID_RECOVER_ACCESS");
    expect(payment).not.toHaveBeenCalled();
    expect(statements.filter(entry => entry.sql.includes("INSERT INTO hd_orders"))).toHaveLength(0);
    const duplicateCheck = statements.find(entry => entry.sql.includes("INNER JOIN hd_chart_snapshots s"));
    expect(duplicateCheck?.args[0]).toBe("buyer@example.test");
    expect(duplicateCheck?.args[1]).toBe(JSON.parse(validChartJson).birthUtc);
  });

  it("fails closed if existing paid order lookup is unavailable", async () => {
    const { db } = fakeD1({ exists: true, paidLookupFails: true });
    const payment = vi.fn();
    vi.stubGlobal("fetch", payment);
    await expect(caller({ HD_ORDERS: db, PAYGATE_CHECKOUT_API_KEY_HUMAN_DESIGN: "unit_key" })
      .subscription.createCheckout(input)).rejects.toThrow("PAID_ACCESS_CHECK_UNAVAILABLE");
    expect(payment).not.toHaveBeenCalled();
  });

  it.each([
    { locale: "cs" as const, origin: "https://humandesignmapa.cz", offerKey: "hd-blueprint-cz", amountMinor: 29000, currency: "CZK" },
    { locale: "en" as const, origin: "https://humandesignchart.app", offerKey: "hd-blueprint-en", amountMinor: 1590, currency: "EUR" },
  ])("routes $locale through the authenticated gateway with its own canonical offer", async (offer) => {
    const { db } = fakeD1({ exists: true });
    const payment = vi.fn(async (_url: string, _options?: RequestInit) => Response.json({
      publicId: "OPT-unit-locale", checkoutUrl: "https://pay.optimateo.com/c/test", ...offer,
    }));
    vi.stubGlobal("fetch", payment);
    await caller({ HD_ORDERS: db, PAYGATE_CHECKOUT_API_KEY_HUMAN_DESIGN: "unit_key" })
      .subscription.createCheckout({ ...input, locale: offer.locale, origin: offer.origin });
    expect(payment.mock.calls[0][0]).toBe("https://pay.optimateo.com/api/paygate/checkout-sessions");
    const options = payment.mock.calls[0][1] as RequestInit;
    expect(options.headers).toMatchObject({ Authorization: "Bearer unit_key" });
    expect(JSON.parse(String(options.body))).toMatchObject({
      tenant: "human-design", offerKey: offer.offerKey,
      returnUrl: `${offer.origin}/${offer.locale}/payment/success?plan=blueprint`,
    });
  });
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
  it("a paid buyer opening the print dialog cannot mark their order delivered", async () => {
    const queries: string[] = [];
    const db = {
      prepare(sql: string) {
        queries.push(sql);
        return {
          bind(..._args: unknown[]) {
            return {
              first: async () => ({
                id: "paid-order",
                payment_status: "PAID",
                download_token_expires_at: null,
              }),
              run: async () => { throw new Error("UNEXPECTED_D1_WRITE"); },
            };
          },
        };
      },
    };
    const result = await caller({ HD_ORDERS: db }).subscription.recordDownload({
      token: "opaque-paid-download-token-123456",
    });
    expect(result).toEqual({
      success: true,
      recorded: false,
      reason: "UNVERIFIED_CLIENT_DOWNLOAD",
    });
    expect(queries).toHaveLength(1);
    expect(queries[0]).toContain("SELECT id, payment_status");
  });
});

it("renews an expired paid access credential without another checkout", async () => {
  const actions: Array<{ sql: string; args: unknown[] }> = [];
  const db = { prepare(sql: string) { return { bind(...args: unknown[]) {
    actions.push({ sql, args });
    return {
      first: async () => ({
        id: "paid-fixture", payment_ref: "fixture-reference",
        customer_email: "buyer@example.test", customer_name: "<img src=x onerror=alert(1)>", offer_key: "hd-blueprint-en",
        download_token: "old-credential", download_token_expires_at: "2025-01-01T00:00:00Z",
        payment_status: "PAID", locale: "en",
      }),
      run: async () => ({ success: true, meta: { changes: 1 } }),
    };
  } }; } };
  const outgoing = vi.fn(async (_url: string, _options?: RequestInit) => new Response(null, { status: 202 }));
  vi.stubGlobal("fetch", outgoing);
  const result = await caller({ HD_ORDERS: db }).subscription.requestAccessRecovery({
    email: "buyer@example.test", locale: "en",
  });
  expect(result.success).toBe(true);
  const renewal = actions.find(row => row.sql.includes("SET download_token = ?"));
  expect(renewal).toBeDefined();
  expect(String(renewal?.args[0])).toMatch(/^tok_[a-f0-9]{32}$/);
  expect(renewal?.args[3]).toBe("old-credential");
  expect(outgoing).toHaveBeenCalledTimes(1);
  const mailBody = JSON.parse(String(outgoing.mock.calls[0][1]?.body)).content[0].value as string;
  expect(mailBody).not.toContain("<img src=x onerror=alert(1)>");
  expect(mailBody).toContain("&lt;img src=x onerror=alert(1)&gt;");
  expect(actions.some(row => row.sql.includes("INSERT INTO hd_orders"))).toBe(false);
});

const allHdDescriptions = {
  gates: GATE_DESCRIPTIONS, channels: CHANNEL_DESCRIPTIONS, types: TYPE_DESCRIPTIONS,
  profiles: PROFILE_DESCRIPTIONS, authorities: AUTHORITY_DESCRIPTIONS, centers: CENTER_DESCRIPTIONS,
};

async function renderPaidPdfForLocale(locale: "cs" | "en") {
  const write = vi.fn();
  const printDocument = { write, close: vi.fn() };
  vi.stubGlobal("window", {
    location: { pathname: `/${locale}/payment/success` },
    open: vi.fn(() => ({ document: printDocument })),
  });
  const ref = {
    current: { querySelector: (selector: string) => selector === "svg"
      ? { outerHTML: '<svg viewBox="0 0 500 600"><circle r="20"/></svg>' }
      : null },
  };
  await generateChartPDF(JSON.parse(validChartJson), "Unit test", allHdDescriptions, ref as any, locale);
  expect(write).toHaveBeenCalledOnce();
  return String(write.mock.calls[0][0]);
}

describe("Paid Blueprint printable content: locale and real SVG", () => {
  it("renders the English report without leaking Czech description paragraphs", async () => {
    const html = await renderPaidPdfForLocale("en");
    expect(html).toContain('<html lang="en">');
    expect(html).toContain("Your Energy Bodygraph");
    expect(html).toContain("Type:");
    expect(html).toContain("Profile:");
    expect(html).toContain("Conscious line");
    expect(html).toContain("Unconscious line");
    expect(html).toContain("Authority:");
    expect(html).toContain("How to explore:");
    expect(html).toContain("Your profile combines conscious and unconscious themes");
    expect(html).toContain("Chart Overview");
    expect(html).toContain("Activated Gates");
    expect(html).toContain("Planetary Activations");
    expect(html).toContain("Your Activated Gates — Interpretations");
    expect(html).toContain("Day 7 · Integration");
    expect(html).toContain("<svg viewBox=");
    expect(html).not.toContain("Váš energetický Bodygraph");
    expect(html).not.toContain("Planetární aktivace");
    expect(html).not.toContain("Vědomé:");
    expect(html).not.toContain("Nevědomé:");
    expect(html).not.toContain("Brána Sebevyjádření");
    expect(html).not.toContain("Vygenerováno:");
    expect(html).not.toContain("undefined");
  });

  it("preserves the Czech report and its real SVG", async () => {
    const html = await renderPaidPdfForLocale("cs");
    expect(html).toContain('<html lang="cs">');
    expect(html).toContain("Váš energetický Bodygraph");
    expect(html).toContain("Aktivované brány");
    expect(html).toContain("Váš osobní integrační plán · 7 dní");
    expect(html).toContain("<svg viewBox=");
    expect(html).not.toContain("undefined");
  });

  it.each(["cs", "en"] as const)("escapes untrusted chart fields before rendering the %s PDF", async locale => {
    const payload = "<img src=x onerror=alert(1)>";
    const chart = JSON.parse(validChartJson);
    chart.profileName = payload;
    chart.strategy = payload;
    chart.authority = payload;
    chart.incarnationCross.name = payload;
    chart.centers[0].name = payload;
    chart.variables.digestion.type = payload;
    expect(isCompleteBlueprintChart(chart)).toBe(true);

    const write = vi.fn();
    vi.stubGlobal("window", {
      location: { pathname: `/${locale}/payment/success` },
      open: vi.fn(() => ({ document: { write, close: vi.fn() } })),
    });
    const graphRef = { current: { querySelector: (selector: string) =>
      selector === "svg" ? { outerHTML: '<svg viewBox="0 0 500 600"><circle r="20"/></svg>' } : null,
    } };
    await generateChartPDF(chart, payload, allHdDescriptions, graphRef as any, locale);
    const html = String(write.mock.calls[0][0]);
    expect(html).not.toContain(payload);
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
    expect(html).toContain('<svg viewBox="0 0 500 600">');
  });

  it("fails closed if the Bodygraph is missing, without opening a print window", async () => {
    const open = vi.fn();
    vi.stubGlobal("window", { location: { pathname: "/en" }, open });
    await expect(generateChartPDF(
      JSON.parse(validChartJson), "Unit test", allHdDescriptions,
      { current: { querySelector: () => null } } as any, "en",
    )).rejects.toThrow("BODYGRAPH_NOT_RENDERED");
    expect(open).not.toHaveBeenCalled();
  });
});
