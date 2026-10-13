import { describe, expect, it } from "vitest";
import { getBlueprintOffer, PROPOSED_MARIE_TIERS } from "./publicOfferCatalog";
import { getOfferAmountMinor } from "./offers";

describe("public Blueprint offer catalog", () => {
  it("uses the payment catalog for the visible Blueprint and partner add-on prices", () => {
    const offer = getBlueprintOffer("cs");
    expect(offer.amountMinor).toBe(getOfferAmountMinor("blueprint", "CZK"));
    expect(offer.amountMinor + offer.partnerAddon.amountMinor).toBe(getOfferAmountMinor("blueprint", "CZK", true));
    expect(offer.name).toBe("Osobní Human Design Blueprint");
    expect(offer.delivery).toBe("Přístup po potvrzení platby");
  });

  it("keeps English checkout amounts and currency aligned with the canonical payment catalog", () => {
    const offer = getBlueprintOffer("en");
    expect(offer.currency).toBe("EUR");
    expect(offer.amountMinor).toBe(getOfferAmountMinor("blueprint", "EUR"));
    expect(offer.amountMinor + offer.partnerAddon.amountMinor).toBe(getOfferAmountMinor("blueprint", "EUR", true));
    expect(offer.delivery).toBe("Access after payment confirmation");
  });

  it("keeps proposed Marie tiers out of checkout until price IDs are configured", () => {
    expect(PROPOSED_MARIE_TIERS.map(tier => tier.key)).toEqual(["pulse", "plus", "circle"]);
    expect(PROPOSED_MARIE_TIERS.every(tier => tier.monthlyCzk > 0 && tier.annualCzk > tier.monthlyCzk)).toBe(true);
  });
});
