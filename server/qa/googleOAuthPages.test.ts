import { describe, expect, it, vi } from "vitest";
import {
  googleAvailable, googleLogin, handleGoogleAuth, getSessionUser,
  safeReturnPath,
} from "../../workers/googleOAuth";

const EN = "https://humandesignchart.app";
const CS = "https://www.humandesignmapa.cz";
const mockDb = {
  prepare() { return { first: async () => null }; },
};
const env = { GOOGLE_CLIENT_ID: "test-client-id", GOOGLE_CLIENT_SECRET: "not-a-real-secret", DB: mockDb };

describe("Cloudflare-native Google OAuth release guard", () => {
  it("refuses activation without real Google credentials and a migrated D1", async () => {
    expect(await googleAvailable({})).toBe(false);
    expect(await googleAvailable({DB: mockDb})).toBe(false);
    expect(await googleAvailable(env)).toBe(true);
  });

  it("never renders a Google login route for an unconfigured domain", async () => {
    const res = await handleGoogleAuth(new Request(CS + "/api/oauth/login/google"), {});
    expect(res?.status).toBe(503);
    expect(res?.headers.get("cache-control")).toContain("no-store");
  });

  it("accepts only the four specified production hostnames", async () => {
    const response = await handleGoogleAuth(new Request("https://attacker.example/api/auth/config"), env);
    expect(response?.status).toBe(404);
  });

  it("returns no authenticated user with missing or malformed cookies", async () => {
    expect(await getSessionUser(new Request(CS + "/"), env)).toBeNull();
    expect(await getSessionUser(new Request(CS + "/", {headers:{"cookie":"__Host-hd_session=bad"}}), env)).toBeNull();
  });

  it("rejects external returnTo destinations and API paths", () => {
    for (const value of ["https://attacker.example","//attacker.example","/api/secret", "/\\attacker.example"])
      expect(safeReturnPath(value,"cs")).toBe("/cs/dashboard");
    expect(safeReturnPath("/en/dashboard?tab=charts","en")).toBe("/en/dashboard?tab=charts");
  });

  it("uses PKCE S256, nonce, state, exact callback and HttpOnly SameSite cookie", async () => {
    const response = await googleLogin(new Request(EN + "/api/oauth/login/google"), env, new URL(EN));
    expect(response.status).toBe(302);
    const url = new URL(response.headers.get("location")!);
    expect(url.origin).toBe("https://accounts.google.com");
    expect(url.searchParams.get("redirect_uri")).toBe(EN + "/api/oauth/callback/google");
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("nonce")?.length).toBeGreaterThan(20);
    expect(url.searchParams.get("state")?.length).toBeGreaterThan(20);
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(response.headers.get("set-cookie")).toContain("SameSite=Lax");
  });

  it("rejects callback without the matching same-host state cookie before token exchange", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    try {
      const response = await handleGoogleAuth(
        new Request(CS + "/api/oauth/callback/google?state=forged&code=forged"), env);
      expect(response?.status).toBe(303);
      expect(response?.headers.get("location")).toBe("/cs/login?auth=failed");
      expect(fetchMock).not.toHaveBeenCalled();
    } finally { vi.unstubAllGlobals(); }
  });

  it("refuses cross-origin logout and missing sessions", async () => {
    const response = await handleGoogleAuth(new Request(CS + "/api/oauth/logout", {
      method: "POST", headers: { origin: "https://attacker.example" },
    }), env);
    expect(response?.status).toBe(403);
  });
});
