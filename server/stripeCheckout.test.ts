import { describe, expect, it, vi } from "vitest";
import { createManagedCheckoutSession } from "./stripeCheckout";

describe("Stripe managed checkout sessions", () => {
  it.each(["payment", "subscription"] as const)(
    "removes payment_method_types from %s Checkout sessions",
    async mode => {
      const create = vi.fn().mockResolvedValue({
        id: "cs_test_managed",
        url: "https://checkout.stripe.com/test",
      });
      const stripe = { checkout: { sessions: { create } } } as any;

      await createManagedCheckoutSession(stripe, {
        mode,
        success_url: "https://example.com/success",
        cancel_url: "https://example.com/cancel",
        line_items: [{ price: "price_test", quantity: 1 }],
        payment_method_types: ["card"],
      });

      expect(create).toHaveBeenCalledOnce();
      expect(create.mock.calls[0][0]).not.toHaveProperty("payment_method_types");
      expect(create.mock.calls[0][0]).not.toHaveProperty("managed_payments");
      expect(create.mock.calls[0][0]).toMatchObject({ mode });
    },
  );
});
