import { afterEach, describe, expect, it, vi } from "vitest";
import {
  googleAvailable, googleReadinessCode, handleGoogleAuth,
} from "../../workers/googleOAuth";

const credentials = {
  GOOGLE_CLIENT_ID: "test-client-id",
  GOOGLE_CLIENT_SECRET: "only-a-test-secret",
};
const database = (failOn?: "users" | "sessions") => ({
  prepare(query: string) {
    return {
      async first() {
        if (failOn === "users" && query.includes("hd_oauth_users")) throw new Error("SQL and personal data must not leave D1");
        if (failOn === "sessions" && query.includes("hd_oauth_sessions")) throw new Error("SQL and personal data must not leave D1");
        return null; // empty tables are valid: no customers yet
      },
    };
  },
});
afterEach(() => vi.restoreAllMocks());

describe("Human Design Cloudflare Google readiness incident diagnostics", () => {
  it("identifies a missing production D1 binding", async () => {
    expect(await googleReadinessCode(credentials)).toBe("D1_BINDING_MISSING");
    expect(await googleAvailable(credentials)).toBe(false);
  });
  it("identifies missing Google secrets separately", async () => {
    expect(await googleReadinessCode({ DB: database() })).toBe("GOOGLE_CLIENT_ID_MISSING");
    expect(await googleReadinessCode({
      DB: database(), GOOGLE_CLIENT_ID: credentials.GOOGLE_CLIENT_ID,
    })).toBe("GOOGLE_CLIENT_SECRET_MISSING");
  });
  it("checks OAuth users and sessions on the bound D1 independently", async () => {
    expect(await googleReadinessCode({ ...credentials, DB: database("users") })).toBe("D1_OAUTH_USERS_UNAVAILABLE");
    expect(await googleReadinessCode({ ...credentials, DB: database("sessions") })).toBe("D1_OAUTH_SESSIONS_UNAVAILABLE");
  });
  it("accepts existing migrated but still empty OAuth tables", async () => {
    const env = { ...credentials, HD_ORDERS: database() };
    expect(await googleReadinessCode(env)).toBe("READY");
    expect(await googleAvailable(env)).toBe(true);
  });
  it("logs only a stable blocker code on explicit owner diagnostic, not secrets or SQL errors", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const url = "https://humandesignmapa.cz/api/auth/config?diagnostic=1";
    const res = await handleGoogleAuth(new Request(url), {
      ...credentials, DB: database("sessions"),
    });
    expect(res?.status).toBe(200);
    expect(await res?.json()).toEqual({ google: false });
    expect(warn).toHaveBeenCalledOnce();
    expect(warn).toHaveBeenCalledWith("[hd-google-oauth] readiness:", "D1_OAUTH_SESSIONS_UNAVAILABLE");
    expect(JSON.stringify(warn.mock.calls)).not.toContain(credentials.GOOGLE_CLIENT_SECRET);
    expect(JSON.stringify(warn.mock.calls)).not.toContain("SQL and personal");
  });
  it("does not log when the optional diagnostic query is absent", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const res = await handleGoogleAuth(new Request("https://humandesignchart.app/api/auth/config"), {
      ...credentials, DB: database("users"),
    });
    expect(await res?.json()).toEqual({ google: false });
    expect(warn).not.toHaveBeenCalled();
  });
});
