import { afterEach, describe, expect, it, vi } from "vitest";
import { exportJWK, generateKeyPair, SignJWT } from "jose";
import worker from "../../workers/pages-api";

afterEach(() => vi.unstubAllGlobals());
const assets = { fetch: vi.fn(() => Promise.resolve(new Response("asset"))) };
const base = "https://humandesignchart.app";

function fakeUsersDb() {
  const users = new Map<string, { id: string; google_sub: string; email: string; name: string; created_at: string }>();
  return {
    users,
    prepare(sql: string) {
      return {
        async first() {
          if (sql.includes("LIMIT 1") && !sql.includes("WHERE")) return null;
          throw new Error("Unexpected first() without bind: " + sql);
        },
        bind(...args: string[]) {
          return {
            async first() {
              if (sql.includes("WHERE google_sub")) return users.get(args[0]) ? { id: users.get(args[0])!.id } : null;
              if (sql.includes("WHERE id")) return [...users.values()].find(u => u.id === args[0]) ?? null;
              return null;
            },
            async run() {
              if (!sql.includes("INSERT INTO hd_auth_users")) throw new Error("Unexpected SQL " + sql);
              const [id, sub, email, name] = args;
              const old = users.get(sub);
              users.set(sub, { id: old?.id ?? id, google_sub: sub, email, name, created_at: old?.created_at ?? "2026-10-29" });
              return { success: true };
            },
          };
        },
      };
    },
  };
}

describe("Cloudflare Pages Google sign-in P0", () => {
  it("keeps Google sign-in disabled when secrets or user schema are missing", async () => {
    const status = await worker.fetch(new Request(base + "/api/auth/status"), { ASSETS: assets });
    expect(await status.json()).toEqual({ google: false });
    const redirect = await worker.fetch(new Request(base + "/api/oauth/login/google"), { ASSETS: assets });
    expect(redirect.status).toBe(303);
    expect(redirect.headers.get("location")).toContain("/en/login?auth=unavailable");
    expect(redirect.headers.get("set-cookie")).not.toContain("hdc_session=");
  });

  it("never redirects from an unapproved origin", async () => {
    const response = await worker.fetch(new Request("https://evil.example/api/oauth/login/google"), { ASSETS: assets });
    expect(response.status).toBe(403);
  });

  it("fails closed if the D1 users schema is unavailable", async () => {
    const missingSchema = { prepare: () => ({ first: async () => { throw new Error("no such table"); } }) };
    const status = await worker.fetch(new Request(base + "/api/auth/status"), {
      ASSETS: assets, GOOGLE_CLIENT_ID: "client", GOOGLE_CLIENT_SECRET: "secret",
      AUTH_SESSION_SECRET: "test-test-test-test-test-test-test-test", HD_ORDERS: missingSchema,
    });
    expect(await status.json()).toEqual({ google: false });
  });

  it("rejects a forged callback state without exchanging a code", async () => {
    const db = fakeUsersDb();
    const fetchToken = vi.fn();
    vi.stubGlobal("fetch", fetchToken);
    const callback = await worker.fetch(new Request(base + "/api/oauth/callback/google?code=123&state=forged"), {
      ASSETS: assets, GOOGLE_CLIENT_ID: "client", GOOGLE_CLIENT_SECRET: "secret",
      AUTH_SESSION_SECRET: "test-test-test-test-test-test-test-test", HD_ORDERS: db,
    });
    expect(callback.status).toBe(303);
    expect(callback.headers.get("location")).toContain("invalid_state");
    expect(fetchToken).not.toHaveBeenCalled();
  });

  it("verifies Google's signed ID token, persists the account and exposes a session through auth.me", async () => {
    const { publicKey, privateKey } = await generateKeyPair("RS256");
    const jwk = { ...(await exportJWK(publicKey)), alg: "RS256", kid: "qa-google-key", use: "sig" };
    const db = fakeUsersDb();
    const env = {
      ASSETS: assets, HD_ORDERS: db,
      GOOGLE_CLIENT_ID: "qa-client.apps.googleusercontent.com", GOOGLE_CLIENT_SECRET: "qa-secret",
      AUTH_SESSION_SECRET: "test-test-test-test-test-test-test-test",
    };
    const ready = await worker.fetch(new Request(base + "/api/auth/status"), env);
    expect(await ready.json()).toEqual({ google: true });

    const login = await worker.fetch(new Request(base + "/api/oauth/login/google"), env);
    expect(login.status).toBe(302);
    const authorizationUrl = new URL(login.headers.get("location")!);
    expect(authorizationUrl.origin).toBe("https://accounts.google.com");
    expect(authorizationUrl.searchParams.get("code_challenge_method")).toBe("S256");
    const state = authorizationUrl.searchParams.get("state")!;
    const nonce = authorizationUrl.searchParams.get("nonce")!;
    const csrfCookie = login.headers.get("set-cookie")!.split(";")[0];
    const idToken = await new SignJWT({
      name: "QA User", email: "qa@example.test", email_verified: true, nonce,
    }).setProtectedHeader({ alg: "RS256", kid: "qa-google-key" })
      .setSubject("google-user-001").setIssuer("https://accounts.google.com")
      .setAudience(env.GOOGLE_CLIENT_ID).setIssuedAt().setExpirationTime("5m").sign(privateKey);

    vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request) => {
      const target = String(input instanceof Request ? input.url : input);
      if (target === "https://oauth2.googleapis.com/token") return Response.json({ id_token: idToken });
      if (target === "https://www.googleapis.com/oauth2/v3/certs") return Response.json({ keys: [jwk] });
      throw new Error("Unexpected fetch " + target);
    }));
    const callback = await worker.fetch(new Request(
      base + "/api/oauth/callback/google?code=qa-code&state=" + encodeURIComponent(state),
      { headers: { cookie: csrfCookie } }
    ), env);
    expect(callback.status).toBe(303);
    expect(callback.headers.get("location")).toBe(base + "/en/dashboard");
    expect(db.users.get("google-user-001")?.email).toBe("qa@example.test");
    const allCookies = callback.headers.get("set-cookie") || "";
    const match = allCookies.match(/__Host-hdc_session=[^;]+/);
    expect(match).not.toBeNull();

    const me = await worker.fetch(new Request(base + "/api/trpc/auth.me", {
      headers: { cookie: match![0] },
    }), env);
    expect(me.status).toBe(200);
    const payload = await me.json() as any;
    expect(payload.result.data.json).toMatchObject({
      name: "QA User", email: "qa@example.test", role: "user",
    });
    const anon = await worker.fetch(new Request(base + "/api/trpc/auth.me"), env);
    expect((await anon.json() as any).result.data.json).toBeNull();
  });
});
