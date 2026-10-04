/**
 * createCheckout: consent to immediate digital delivery is recorded on the
 * order, and the Comgate path no longer requires Stripe.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const stripeSessionsCreate = vi.fn().mockResolvedValue({ url: "https://checkout.stripe.test/s" });
const fakeStripe = {
  customers: { create: vi.fn().mockResolvedValue({ id: "cus_test" }) },
  checkout: { sessions: { create: stripeSessionsCreate } },
};

vi.mock("./stripeWebhook", () => ({ getStripe: vi.fn() }));
vi.mock("./db", () => ({
  consumeBlueprintPdfCredit: vi.fn(),
  countAiReadingsByUser: vi.fn(),
  hasRecentCreditTransaction: vi.fn(),
  updateUserSubscription: vi.fn(),
}));
vi.mock("./_core/comgate", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./_core/comgate")>();
  return { ...actual, createComgateCheckoutSession: vi.fn().mockResolvedValue({ transId: "T1", redirectUrl: "https://payments.comgate.test/T1" }) };
});

import { getStripe } from "./stripeWebhook";
import { createComgateCheckoutSession } from "./_core/comgate";
import { ENV } from "./_core/env";
import { subscriptionRouter } from "./routers/subscription";

const user = { id: 7, email: "buyer@example.com", name: "Buyer", stripeCustomerId: null } as never;
const caller = subscriptionRouter.createCaller({ user, req: {} as never, res: {} as never });
const originalMerchant = ENV.comgateMerchantId;

describe("createCheckout delivery consent", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => { (ENV as { comgateMerchantId: string }).comgateMerchantId = originalMerchant; });

  it("records consent in Stripe metadata", async () => {
    (ENV as { comgateMerchantId: string }).comgateMerchantId = "";
    vi.mocked(getStripe).mockReturnValue(fakeStripe as never);
    await caller.createCheckout({ plan: "blueprint", locale: "en", origin: "https://example.test", digitalDeliveryConsent: true });
    const params = stripeSessionsCreate.mock.calls[0][0];
    expect(params.metadata.digital_delivery_consent).toBe("true");
    expect(Number.isNaN(Date.parse(params.metadata.digital_delivery_consent_at))).toBe(false);
  });

  it("omits consent metadata when not given", async () => {
    (ENV as { comgateMerchantId: string }).comgateMerchantId = "";
    vi.mocked(getStripe).mockReturnValue(fakeStripe as never);
    await caller.createCheckout({ plan: "blueprint", locale: "en", origin: "https://example.test" });
    expect(stripeSessionsCreate.mock.calls[0][0].metadata.digital_delivery_consent).toBeUndefined();
  });

  it("creates a Comgate checkout without Stripe keys and carries consent in refId", async () => {
    (ENV as { comgateMerchantId: string }).comgateMerchantId = "merchant";
    vi.mocked(getStripe).mockReturnValue(null);
    const result = await caller.createCheckout({ plan: "blueprint", locale: "cs", origin: "https://example.test", digitalDeliveryConsent: true });
    expect(result.url).toBe("https://payments.comgate.test/T1");
    const { refId, price } = vi.mocked(createComgateCheckoutSession).mock.calls[0][0];
    expect(price).toBe(29000);
    expect(JSON.parse(Buffer.from(refId, "base64").toString("utf8"))).toMatchObject({ u: 7, p: "blueprint", dc: 1 });
  });
});
