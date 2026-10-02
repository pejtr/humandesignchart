/**
 * Revenue funnel regressions: post-login return path, Comgate order
 * reference, server-side Purchase for Comgate, and price consistency.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./_core/comgate", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./_core/comgate")>();
  return { ...actual, checkComgateStatus: vi.fn() };
});
vi.mock("./payments/mysqlStore", () => ({
  processPaymentEvent: vi.fn(),
  recordPaymentAuditEvent: vi.fn(),
}));
vi.mock("./metaConversionsApi", () => ({
  trackConversion: vi.fn().mockResolvedValue(undefined),
}));

import { sanitizeReturnPath } from "@shared/returnPath";
import { CHECKOUT_PRICES_MINOR } from "@shared/checkoutPrices";
import { signState, verifyState } from "./_core/oauth";
import { checkComgateStatus, encodeComgateRefId } from "./_core/comgate";
import { handleComgateWebhook } from "./comgateWebhook";
import { processPaymentEvent } from "./payments/mysqlStore";
import { trackConversion } from "./metaConversionsApi";
import { STRIPE_PRODUCTS } from "./stripeProducts";
import { getBlueprintOffer } from "./payments/publicOfferCatalog";
import { isPurchasePath } from "@/lib/purchasePath";

describe("sanitizeReturnPath", () => {
  it("accepts same-origin paths with query", () => {
    expect(sanitizeReturnPath("/cs/honorace?checkout=1")).toBe("/cs/honorace?checkout=1");
    expect(sanitizeReturnPath("/en/chart/new")).toBe("/en/chart/new");
  });

  it.each([
    "https://evil.example/",
    "//evil.example",
    "/\\evil.example",
    "javascript:alert(1)",
    "cs/honorace",
    "/api/oauth/login/google",
    "/login",
    "/cs/login?returnTo=/x",
    "/x\n",
    "",
    `/${"a".repeat(600)}`,
  ])("rejects %j", (value) => {
    expect(sanitizeReturnPath(value)).toBeNull();
  });
});

describe("OAuth state carries the return path", () => {
  it("round-trips a safe return path inside the signed state", () => {
    const state = signState("google", "/cs/honorace?checkout=1");
    expect(verifyState(state)).toEqual({ valid: true, provider: "google", returnTo: "/cs/honorace?checkout=1" });
  });

  it("keeps working without a return path (pre-existing state format)", () => {
    expect(verifyState(signState("apple"))).toEqual({ valid: true, provider: "apple", returnTo: null });
  });

  it("drops an unsafe return path instead of signing it", () => {
    expect(verifyState(signState("facebook", "https://evil.example")).returnTo).toBeNull();
  });

  it("rejects a state whose return path was swapped", () => {
    const state = signState("google", "/cs/honorace");
    const parts = state.split(".");
    parts[3] = Buffer.from("/en/dashboard").toString("base64url");
    expect(verifyState(parts.join(".")).valid).toBe(false);
  });
});

describe("Comgate order reference", () => {
  it("fits a typical Blueprint order and decodes back", () => {
    const meta = { u: 123456, p: "blueprint", partner: 0, hm: 29000, ht: 0 };
    const refId = encodeComgateRefId(meta);
    expect(refId).not.toBeNull();
    expect(JSON.parse(Buffer.from(refId!, "base64").toString("utf8"))).toEqual(meta);
  });

  it("returns null instead of truncating an oversized reference", () => {
    expect(encodeComgateRefId({ u: 1, p: "gift_annual", recName: "x".repeat(300) })).toBeNull();
  });
});

describe("Comgate webhook sends server-side Purchase", () => {
  const send = vi.fn();
  const res = { status: vi.fn(() => ({ send })) } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkComgateStatus).mockResolvedValue({
      status: "PAID",
      price: "29000",
      curr: "CZK",
      email: "buyer@example.com",
      refId: encodeComgateRefId({ u: 42, p: "blueprint", partner: 0, hm: 29000, ht: 0 })!,
    } as any);
  });

  it("tracks the purchase with the charged value when fulfilled", async () => {
    vi.mocked(processPaymentEvent).mockResolvedValue({ outcome: "fulfilled" } as any);
    await handleComgateWebhook({ body: { transId: "ABC-123" } } as any, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(trackConversion).toHaveBeenCalledWith(expect.objectContaining({
      eventName: "Purchase",
      eventId: "ABC-123",
      userId: 42,
      value: 290,
      currency: "CZK",
      contentIds: ["blueprint"],
    }));
  });

  it("does not track a replayed (already processed) payment", async () => {
    vi.mocked(processPaymentEvent).mockResolvedValue({ outcome: "duplicate" } as any);
    await handleComgateWebhook({ body: { transId: "ABC-123" } } as any, res);
    expect(trackConversion).not.toHaveBeenCalled();
  });
});

describe("Checkout price table matches the offer catalog", () => {
  it("Blueprint price shown on the pricing page equals the charged price", () => {
    expect(CHECKOUT_PRICES_MINOR.blueprint.CZK).toBe(STRIPE_PRODUCTS.BLUEPRINT.pricesCzk);
    expect(CHECKOUT_PRICES_MINOR.blueprint.EUR).toBe(STRIPE_PRODUCTS.BLUEPRINT.pricesEur);
    expect(getBlueprintOffer("cs").amountMinor).toBe(CHECKOUT_PRICES_MINOR.blueprint.CZK);
    expect(getBlueprintOffer("en").amountMinor).toBe(CHECKOUT_PRICES_MINOR.blueprint.EUR);
  });
});

describe("Auto-opening modals stay off the purchase path", () => {
  it.each(["/cs/honorace", "/en/pricing", "/cenik", "/login", "/cs/login", "/en/payment/success", "/cs/payment/cancel"])("treats %s as purchase path", (path) => {
    expect(isPurchasePath(path)).toBe(true);
  });

  it.each(["/cs", "/cs/calculate", "/en/chart/new", "/cs/blog/honorace-tips"])("leaves %s alone", (path) => {
    expect(isPurchasePath(path)).toBe(false);
  });
});
