import { describe, expect, it } from "vitest";
import { resolveFeatureAccess, resolveFeatureMatrix } from "./access";

describe("feature access matrix", () => {
  it("shows the capability without granting private premium content to anonymous visitors", () => {
    expect(resolveFeatureAccess({ authenticated: false }, "BASIC_CHART").status).toBe("AVAILABLE");
    const locked = resolveFeatureAccess({ authenticated: false }, "CENTERS_DETAIL");
    expect(locked.status).toBe("LOCKED");
    expect(locked.requiredProduct).toBe("MARIE_PLUS");
  });

  it("distinguishes free credits, Blueprint PDF credits and active membership", () => {
    expect(resolveFeatureAccess({ authenticated: true, aiReadingCredits: 1 }, "AI_INTERPRETATION").status).toBe("AVAILABLE");
    expect(resolveFeatureAccess({ authenticated: true, blueprintPdfCredits: 1 }, "BLUEPRINT_PDF").status).toBe("AVAILABLE");
    expect(resolveFeatureAccess({ authenticated: true, subscriptionStatus: "active", subscriptionPlan: "monthly" }, "DAILY_TRANSITS").status).toBe("AVAILABLE");
  });

  it("preserves legacy lifetime access and never infers chart ownership from a client chart id", () => {
    expect(resolveFeatureAccess({ authenticated: true, subscriptionPlan: "lifetime" }, "RELATIONSHIP_DYNAMICS").status).toBe("GRANDFATHERED");
    expect(resolveFeatureMatrix({ authenticated: true }).every(access => access.scope === "ACCOUNT")).toBe(true);
  });
});
