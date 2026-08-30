import { describe, expect, it } from "vitest";
import { buildDailyTransitEmail, shouldReceiveDailyTransit } from "./dailyTransit";

const baseUser = {
  subscriptionStatus: "active",
  subscriptionPlan: "monthly",
  subscriptionCurrentPeriodEnd: "2099-01-01T00:00:00.000Z",
  aiReadingCredits: 0,
  notificationPreferences: { dailyTransit: true },
};

describe("Premium daily transit delivery", () => {
  it("includes only active Premium users who opted in", () => {
    expect(shouldReceiveDailyTransit(baseUser)).toBe(true);
    expect(shouldReceiveDailyTransit({ ...baseUser, subscriptionStatus: "none", subscriptionPlan: "none" })).toBe(false);
    expect(shouldReceiveDailyTransit({ ...baseUser, notificationPreferences: { dailyTransit: false } })).toBe(false);
  });

  it("renders a structured email and escapes generated content", () => {
    const html = buildDailyTransitEmail({
      dateLabel: "30. srpna 2026",
      insight: "<script>alert('x')</script> Dnes zpomalte.",
      type: "Generátor",
      profile: "6/2",
      sunGate: "Brána 29.5",
      earthGate: "Brána 30.5",
    });

    expect(html).toContain("Vaše denní Human Design energie");
    expect(html).toContain("Generátor · profil 6/2");
    expect(html).toContain("Slunce Brána 29.5 · Země Brána 30.5");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});
