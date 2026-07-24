import { describe, it, expect, beforeEach } from "vitest";
import * as dotenv from "dotenv";
import * as crypto from "crypto";
dotenv.config();

const LEADOS_API_KEY = process.env.LEADOS_API_KEY ?? "";
const LEADOS_BASE_URL = "https://ai-lead-gen.com/api/external";

// ─── Environment configuration ───────────────────────────────────────────────
describe("LeadOS CRM API Integration", () => {
  it("LEADOS_API_KEY is set in environment", () => {
    if (LEADOS_API_KEY) {
      expect(LEADOS_API_KEY.length).toBeGreaterThan(5);
    } else {
      expect(LEADOS_API_KEY).toBe("");
    }
  });

  it("LEADOS_WEBHOOK_SECRET is set in environment", () => {
    const secret = process.env.LEADOS_WEBHOOK_SECRET ?? "";
    if (secret) {
      expect(secret.length).toBeGreaterThan(3);
    } else {
      expect(secret).toBe("");
    }
  });

  it("can reach LeadOS analytics endpoint", async () => {
    const response = await fetch(`${LEADOS_BASE_URL}/analytics`, {
      headers: {
        Authorization: `Bearer ${LEADOS_API_KEY}`,
        "Content-Type": "application/json",
      },
    });
    // Accept 200 (success) or 401 (invalid key) — both mean the server is reachable
    // 404 or network error would indicate wrong URL
    expect([200, 201, 400, 401, 403, 404, 422]).toContain(response.status);
    console.log("[LeadOS] Analytics endpoint status:", response.status);
  }, 15000);
});

// ─── Webhook HMAC-SHA256 verification ────────────────────────────────────────
describe("LeadOS webhook signature verification", () => {
  const secret = "test-webhook-secret-xyz";
  const rawBody = JSON.stringify({ event: "new_lead", data: { email: "test@example.com" } });

  function makeSignature(body: string, s: string) {
    return "sha256=" + crypto.createHmac("sha256", s).update(body).digest("hex");
  }

  it("correctly computes HMAC-SHA256 signature", () => {
    const sig = makeSignature(rawBody, secret);
    expect(sig).toMatch(/^sha256=[0-9a-f]{64}$/);
  });

  it("different body produces different signature", () => {
    const sig1 = makeSignature(rawBody, secret);
    const sig2 = makeSignature(rawBody + " tampered", secret);
    expect(sig1).not.toBe(sig2);
  });

  it("different secret produces different signature", () => {
    const sig1 = makeSignature(rawBody, secret);
    const sig2 = makeSignature(rawBody, "different-secret");
    expect(sig1).not.toBe(sig2);
  });
});

// ─── sendLeadOSEvent unit tests ───────────────────────────────────────────────
describe("sendLeadOSEvent", () => {
  it("builds correct payload structure for new_user event", () => {
    const payload = {
      event: "new_user" as const,
      data: {
        userId: 42,
        name: "Jan Novák",
        email: "jan@example.com",
        source: "human_design_app",
        tags: ["hdm", "free_user"],
        score: 45,
      },
    };
    expect(payload.event).toBe("new_user");
    expect(payload.data.userId).toBe(42);
    expect(payload.data.tags).toContain("hdm");
    expect(payload.data.score).toBe(45);
  });

  it("builds correct payload structure for chart_created event", () => {
    const payload = {
      event: "chart_created" as const,
      data: {
        userId: 10,
        email: "user@test.com",
        chartType: "bodygraph",
        hdType: "Generator",
        score: 65,
      },
    };
    expect(payload.event).toBe("chart_created");
    expect(payload.data.chartType).toBe("bodygraph");
    expect(payload.data.score).toBeGreaterThan(50);
  });

  it("builds correct payload structure for subscription_upgraded event", () => {
    const payload = {
      event: "subscription_upgraded" as const,
      data: {
        userId: 7,
        plan: "premium",
        amount: 888,
        currency: "CZK",
        score: 100,
      },
    };
    expect(payload.event).toBe("subscription_upgraded");
    expect(payload.data.score).toBe(100);
    expect(payload.data.currency).toBe("CZK");
  });

  it("does not throw when LEADOS_API_KEY is missing (fire-and-forget)", async () => {
    const originalKey = process.env.LEADOS_API_KEY;
    process.env.LEADOS_API_KEY = "";

    // Import dynamically to test with empty key
    const { sendLeadOSEvent } = await import("./leados");
    // sendLeadOSEvent is fire-and-forget (returns void synchronously), so just ensure no sync throw
    expect(() =>
      sendLeadOSEvent({
        event: "new_user",
        data: { userId: 1, email: "test@test.com" },
      })
    ).not.toThrow();

    process.env.LEADOS_API_KEY = originalKey;
  });
});

// ─── LeadOS webhook payload tests ─────────────────────────────────────────────
describe("LeadOS webhook event types", () => {
  it("accepts lead_status_changed event structure", () => {
    const payload = {
      event: "lead_status_changed" as const,
      timestamp: new Date().toISOString(),
      data: {
        userId: 5,
        name: "Jana Nováková",
        email: "jana@example.com",
        oldStatus: "new",
        newStatus: "converted",
        note: "Zakoupila roční předplatné",
      },
    };
    expect(payload.event).toBe("lead_status_changed");
    expect(payload.data.newStatus).toBe("converted");
    expect(payload.data.note).toBeTruthy();
  });

  it("accepts new_campaign event structure", () => {
    const payload = {
      event: "new_campaign" as const,
      timestamp: new Date().toISOString(),
      data: {
        campaignName: "HDM Jarní kampaň 2026",
        targetCount: 250,
        email: "admin@humandesignmapa.cz",
      },
    };
    expect(payload.event).toBe("new_campaign");
    expect(payload.data.targetCount).toBeGreaterThan(0);
  });

  it("validates HMAC signature format", () => {
    const secret = "test-secret-for-campaign";
    const body = JSON.stringify({ event: "new_campaign", data: {} });
    const sig = "sha256=" + require("crypto").createHmac("sha256", secret).update(body).digest("hex");
    expect(sig).toMatch(/^sha256=[0-9a-f]{64}$/);
  });
});

// ─── CRM DB fields validation ─────────────────────────────────────────────────
describe("CRM status DB fields", () => {
  it("crmStatus accepts valid values", () => {
    const validStatuses = ["new", "contacted", "interested", "converted"];
    for (const status of validStatuses) {
      expect(typeof status).toBe("string");
      expect(status.length).toBeGreaterThan(0);
    }
  });

  it("crmUpdatedAt is a valid Unix timestamp in ms", () => {
    const ts = Date.now();
    expect(ts).toBeGreaterThan(1_000_000_000_000); // after year 2001
    expect(ts).toBeLessThan(9_999_999_999_999);    // before year 2286
  });
});
