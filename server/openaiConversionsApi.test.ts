import { afterEach, describe, expect, it, vi } from "vitest";
afterEach(() => vi.unstubAllGlobals());
import { buildConfirmedOrderEvent, buildVerifiedCloudflareOrderEvent, sendVerifiedOpenAIEventWithSecrets } from "./openaiConversionsApi";

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
        openAIAdsMarketingConsent: true, openAIAdsOppref: "unsafe\\nclick",
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
    const request = vi.fn(async () => new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", request);
    const event = buildVerifiedCloudflareOrderEvent(verifiedOrder)!;
    expect(await sendVerifiedOpenAIEventWithSecrets(event, {
      OPENAI_ADS_PIXEL_ID: "pixel-test", OPENAI_CONVERSIONS_API_KEY: "fake-test-only",
    })).toBe(true);
    const [url, options] = request.mock.calls[0];
    expect(String(url)).toContain("pid=pixel-test");
    expect(JSON.parse(options.body).events).toEqual([event]);
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
