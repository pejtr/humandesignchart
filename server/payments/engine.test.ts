import { describe, expect, it } from "vitest";
import type { NormalizedPaymentEvent, PaymentPurchaseEvent } from "./contracts";
import { processNormalizedPaymentEvent, type PaymentStore, type PaymentTransaction, type StoredPaymentStatus } from "./engine";

type Row = { id: number; status: StoredPaymentStatus; provider: "stripe" | "comgate"; eventId: string; paymentRef: string };
type State = { rows: Row[]; fulfillments: number; reversals: number; affiliateCommissions: number; nextId: number };

function purchase(eventId = "evt_1", provider: "stripe" | "comgate" = "stripe"): NormalizedPaymentEvent {
  return {
    action: "purchase",
    provider,
    eventId,
    eventType: "checkout.session.completed",
    userId: 7,
    productKey: "credits",
    paymentRef: "pi_1",
    amountMinor: 7700,
    offerAmountMinor: 7700,
    currency: "CZK",
    partnerAddon: false,
    affiliateCode: "AFF",
    rawPayload: {},
  };
}

class MemoryStore implements PaymentStore {
  state: State = { rows: [], fulfillments: 0, reversals: 0, affiliateCommissions: 0, nextId: 1 };
  failNextFulfillment = false;
  private queue: Promise<void> = Promise.resolve();

  async transaction<T>(work: (tx: PaymentTransaction) => Promise<T>): Promise<T> {
    let unlock!: () => void;
    const previous = this.queue;
    this.queue = new Promise<void>((resolve) => { unlock = resolve; });
    await previous;
    const draft: State = structuredClone(this.state);
    const tx: PaymentTransaction = {
      claim: async (event) => {
        let row = draft.rows.find((candidate) => candidate.provider === event.provider && candidate.eventId === event.eventId);
        if (!row) {
          row = { id: draft.nextId++, status: "processing", provider: event.provider, eventId: event.eventId, paymentRef: event.paymentRef };
          draft.rows.push(row);
        }
        return { id: row.id, status: row.status };
      },
      validatePurchase: async () => null,
      fulfillPurchase: async (_paymentEventId: number, event: PaymentPurchaseEvent) => {
        draft.fulfillments += 1;
        if (event.affiliateCode) draft.affiliateCommissions += 1;
        if (this.failNextFulfillment) {
          this.failNextFulfillment = false;
          throw new Error("simulated partial failure");
        }
      },
      findOriginalPurchase: async (provider, paymentRef) => {
        const row = draft.rows.find((candidate) => candidate.provider === provider && candidate.paymentRef === paymentRef && ["fulfilled", "reversed"].includes(candidate.status));
        return row ? { id: row.id, status: row.status } : null;
      },
      reversePurchase: async () => { draft.reversals += 1; },
      markStatus: async (id, status) => {
        const row = draft.rows.find((candidate) => candidate.id === id);
        if (!row) throw new Error("missing row");
        row.status = status;
      },
    };
    try {
      const result = await work(tx);
      this.state = draft;
      return result;
    } finally {
      unlock();
    }
  }
}

describe("payment event replay safety", () => {
  it("fulfills one delivery exactly once", async () => {
    const store = new MemoryStore();
    expect((await processNormalizedPaymentEvent(store, purchase())).outcome).toBe("fulfilled");
    expect(store.state.fulfillments).toBe(1);
    expect(store.state.affiliateCommissions).toBe(1);
  });

  it("fulfills two sequential deliveries exactly once", async () => {
    const store = new MemoryStore();
    await processNormalizedPaymentEvent(store, purchase());
    expect((await processNormalizedPaymentEvent(store, purchase())).outcome).toBe("duplicate");
    expect(store.state.fulfillments).toBe(1);
    expect(store.state.affiliateCommissions).toBe(1);
  });

  it("fulfills ten concurrent deliveries exactly once", async () => {
    const store = new MemoryStore();
    const results = await Promise.all(Array.from({ length: 10 }, () => processNormalizedPaymentEvent(store, purchase())));
    expect(results.filter((result) => result.outcome === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.outcome === "duplicate")).toHaveLength(9);
    expect(store.state.fulfillments).toBe(1);
    expect(store.state.affiliateCommissions).toBe(1);
  });

  it("applies the same replay contract to Comgate", async () => {
    const store = new MemoryStore();
    const event = purchase("trans_1:PAID", "comgate");
    await Promise.all(Array.from({ length: 10 }, () => processNormalizedPaymentEvent(store, event)));
    expect(store.state.fulfillments).toBe(1);
    expect(store.state.affiliateCommissions).toBe(1);
  });

  it("rolls back a partial failure and fulfills once on safe retry", async () => {
    const store = new MemoryStore();
    store.failNextFulfillment = true;
    await expect(processNormalizedPaymentEvent(store, purchase())).rejects.toThrow("simulated partial failure");
    expect(store.state.fulfillments).toBe(0);
    await processNormalizedPaymentEvent(store, purchase());
    expect(store.state.fulfillments).toBe(1);
  });

  it("routes a mismatched server offer to audit without fulfillment", async () => {
    const store = new MemoryStore();
    const bad = { ...purchase(), offerAmountMinor: 1 };
    const result = await processNormalizedPaymentEvent(store, bad);
    expect(result).toMatchObject({ outcome: "audit", code: "OFFER_AMOUNT_MISMATCH" });
    expect(store.state.fulfillments).toBe(0);
  });

  it("compensates a full refund once even when replayed", async () => {
    const store = new MemoryStore();
    await processNormalizedPaymentEvent(store, purchase());
    const reversal: NormalizedPaymentEvent = {
      action: "reversal",
      provider: "stripe",
      eventId: "evt_refund",
      eventType: "charge.refunded",
      paymentRef: "pi_1",
      reason: "refund",
      rawPayload: {},
    };
    expect((await processNormalizedPaymentEvent(store, reversal)).outcome).toBe("reversed");
    expect((await processNormalizedPaymentEvent(store, reversal)).outcome).toBe("duplicate");
    expect(store.state.reversals).toBe(1);
  });
});
