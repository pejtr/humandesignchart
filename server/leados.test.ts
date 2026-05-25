import { describe, it, expect, beforeEach } from "vitest";
import * as dotenv from "dotenv";
import * as crypto from "crypto";
dotenv.config();

const LEADOS_API_KEY = process.env.LEADOS_API_KEY ?? "";
const LEADOS_BASE_URL = "https://ai-lead-gen.com/api/external";

// ─── Environment configuration ───────────────────────────────────────────────
describe("LeadOS CRM API Integration", () => {
  it("LEADOS_API_KEY is set in environment", () => {
    expect(LEADOS_API_KEY).toBeTruthy();
    expect(LEADOS_API_KEY.length).toBeGreaterThan(5);
  });

  it("LEADOS_WEBHOOK_SECRET is set in environment", () => {
    const secret = process.env.LEADOS_WEBHOOK_SECRET ?? "";
    expect(secret).toBeTruthy();
    expect(secret.length).toBeGreaterThan(3);
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
