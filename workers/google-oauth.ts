import { createRemoteJWKSet, jwtVerify, SignJWT } from "jose";

/**
 * Cloudflare Pages Google sign-in, independent of the legacy Express runtime.
 * Only the two production domains are eligible; all credentials stay server-side.
 */
export type AuthEnv = {
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  AUTH_SESSION_SECRET?: string;
  JWT_SECRET?: string;
  HD_ORDERS?: any;
  DB?: any;
};

const COOKIE_SESSION = "__Host-hdc_session";
const COOKIE_OAUTH = "__Host-hdc_oauth";
const MAX_OAUTH_AGE = 600;
const SESSION_AGE = 30 * 24 * 60 * 60;
const ISSUER = "humandesignchart-pages";
const AUDIENCE = "humandesignchart-user";
const JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));
const HOSTS = new Set([
  "humandesignchart.app", "www.humandesignchart.app",
  "humandesignmapa.cz", "www.humandesignmapa.cz",
]);

const encoder = new TextEncoder();
const clean = (value?: string) => typeof value === "string" ? value.trim() : "";
function sessionKey(env: AuthEnv): Uint8Array | null {
  const key = clean(env.AUTH_SESSION_SECRET) || clean(env.JWT_SECRET);
  return key.length >= 32 ? encoder.encode(key) : null;
}
const dbOf = (env: AuthEnv) => env.HD_ORDERS || env.DB;
const cookieHeader = (name: string, value: string, age: number) =>
  `${name}=${value}; Path=/; Max-Age=${age}; HttpOnly; Secure; SameSite=Lax`;
export const clearSessionCookie = () => cookieHeader(COOKIE_SESSION, "", 0);
const clearOAuthCookie = () => cookieHeader(COOKIE_OAUTH, "", 0);

function cookieValue(req: Request, name: string): string | null {
  const cookies = req.headers.get("cookie")?.split(";") ?? [];
  for (const part of cookies) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return rest.join("=");
  }
  return null;
}
function randomToken(bytes = 32): string {
  const array = crypto.getRandomValues(new Uint8Array(bytes));
  return Array.from(array, b => b.toString(16).padStart(2, "0")).join("");
}
function encodeCookie(value: unknown): string {
  const bytes = encoder.encode(JSON.stringify(value));
  let binary = "";
  bytes.forEach(b => { binary += String.fromCharCode(b); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function decodeCookie(value: string): any | null {
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const bytes = Uint8Array.from(atob(normalized), c => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch { return null; }
}
function originAllowed(url: URL): boolean {
  return url.protocol === "https:" && HOSTS.has(url.hostname) && !url.port;
}
const language = (url: URL) => url.hostname.includes("humandesignchart.app") ? "en" : "cs";
function signInError(url: URL, code: string): Response {
  const redirect = new URL(`/${language(url)}/login`, url.origin);
  redirect.searchParams.set("auth", code);
  const headers = new Headers({
    location: redirect.toString(),
    "cache-control": "no-store",
    "referrer-policy": "no-referrer",
  });
  headers.append("set-cookie", clearOAuthCookie());
  return new Response(null, { status: 303, headers });
}
async function authReady(env: AuthEnv): Promise<boolean> {
  if (!clean(env.GOOGLE_CLIENT_ID) || !clean(env.GOOGLE_CLIENT_SECRET) || !sessionKey(env) || !dbOf(env)) return false;
  try {
    // A configured binding is insufficient: schema is a required release gate.
    await dbOf(env).prepare("SELECT id FROM hd_auth_users LIMIT 1").first();
    return true;
  } catch { return false; }
}
export async function authStatus(request: Request, env: AuthEnv): Promise<Response> {
  const url = new URL(request.url);
  return Response.json({ google: originAllowed(url) && await authReady(env) }, {
    headers: { "cache-control": "no-store", "content-type": "application/json" },
  });
}
export async function googleOAuthRoute(request: Request, env: AuthEnv): Promise<Response> {
  const url = new URL(request.url);
  if (!originAllowed(url)) return Response.json({ error: "INVALID_OAUTH_ORIGIN" }, { status: 403 });
  if (request.method !== "GET") return new Response("Method not allowed", { status: 405, headers: { Allow: "GET" } });

  const isLogin = url.pathname === "/api/oauth/login/google" || url.pathname === "/api/oauth/login";
  if (!isLogin && url.pathname !== "/api/oauth/callback/google")
    return Response.json({ error: "NOT_FOUND" }, { status: 404 });

  if (!(await authReady(env))) return signInError(url, "unavailable");

  const redirectUri = `${url.origin}/api/oauth/callback/google`;
  if (isLogin) {
    const state = randomToken();
    const nonce = randomToken();
    const verifier = randomToken(48);
    const challengeBytes = new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(verifier)));
    let digest = "";
    challengeBytes.forEach(b => { digest += String.fromCharCode(b); });
    const challenge = btoa(digest).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
    const login = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    for (const [key, value] of Object.entries({
      response_type: "code",
      client_id: clean(env.GOOGLE_CLIENT_ID),
      redirect_uri: redirectUri,
      scope: "openid email profile",
      state, nonce,
      code_challenge: challenge,
      code_challenge_method: "S256",
      prompt: "select_account",
    })) login.searchParams.set(key, value);
    const headers = new Headers({
      location: login.toString(),
      "cache-control": "no-store",
      "referrer-policy": "no-referrer",
    });
    headers.append("set-cookie", cookieHeader(COOKIE_OAUTH, encodeCookie({
      state, nonce, verifier, issuedAt: Date.now(),
    }), MAX_OAUTH_AGE));
    return new Response(null, { status: 302, headers });
  }

  const saved = decodeCookie(cookieValue(request, COOKIE_OAUTH) ?? "");
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  if (url.searchParams.has("error")) return signInError(url, "cancelled");
  if (!saved || typeof saved.state !== "string" || saved.state.length < 32 ||
      state !== saved.state || typeof saved.issuedAt !== "number" ||
      Date.now() < saved.issuedAt || Date.now() - saved.issuedAt > MAX_OAUTH_AGE * 1000 ||
      typeof saved.nonce !== "string" || typeof saved.verifier !== "string" || !code)
    return signInError(url, "invalid_state");

  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code, client_id: clean(env.GOOGLE_CLIENT_ID),
        client_secret: clean(env.GOOGLE_CLIENT_SECRET),
        redirect_uri: redirectUri, grant_type: "authorization_code",
        code_verifier: saved.verifier,
      }),
    });
    if (!response.ok) throw new Error("OAUTH_TOKEN_EXCHANGE_FAILED");
    const token = await response.json() as { id_token?: string };
    if (typeof token.id_token !== "string") throw new Error("MISSING_ID_TOKEN");
    const { payload } = await jwtVerify(token.id_token, JWKS, {
      algorithms: ["RS256"],
      audience: clean(env.GOOGLE_CLIENT_ID),
      issuer: ["https://accounts.google.com", "accounts.google.com"],
      clockTolerance: 30,
    });
    if (payload.nonce !== saved.nonce || !payload.sub || typeof payload.sub !== "string" ||
        typeof payload.email !== "string" || payload.email_verified !== true)
      throw new Error("UNVERIFIED_GOOGLE_IDENTITY");

    const id = crypto.randomUUID();
    const name = typeof payload.name === "string" ? payload.name.slice(0, 120) : "";
    await dbOf(env).prepare(
      `INSERT INTO hd_auth_users (id, google_sub, email, name, created_at, last_signed_in)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT(google_sub) DO UPDATE SET
         email = excluded.email, name = excluded.name, last_signed_in = CURRENT_TIMESTAMP`
    ).bind(id, payload.sub, payload.email.slice(0, 254), name).run();

    const user = await dbOf(env).prepare("SELECT id FROM hd_auth_users WHERE google_sub = ?")
      .bind(payload.sub).first() as { id?: string } | null;
    if (!user?.id) throw new Error("ACCOUNT_PERSISTENCE_FAILED");

    const session = await new SignJWT({ sub: user.id })
      .setProtectedHeader({ alg: "HS256" }).setIssuer(ISSUER).setAudience(AUDIENCE)
      .setIssuedAt().setExpirationTime(`${SESSION_AGE}s`).sign(sessionKey(env)!);
    const headers = new Headers({
      location: new URL(`/${language(url)}/dashboard`, url.origin).toString(),
      "cache-control": "no-store",
      "referrer-policy": "no-referrer",
    });
    headers.append("set-cookie", clearOAuthCookie());
    headers.append("set-cookie", cookieHeader(COOKIE_SESSION, session, SESSION_AGE));
    return new Response(null, { status: 303, headers });
  } catch (error) {
    console.error("[Pages Google OAuth]", error instanceof Error ? error.message : "UNKNOWN_ERROR");
    return signInError(url, "failed");
  }
}
export async function getAuthenticatedUser(request: Request, env: AuthEnv) {
  const key = sessionKey(env);
  const db = dbOf(env);
  if (!key || !db) return null;
  const session = cookieValue(request, COOKIE_SESSION);
  if (!session) return null;
  try {
    const { payload } = await jwtVerify(session, key, {
      issuer: ISSUER, audience: AUDIENCE, algorithms: ["HS256"],
    });
    if (typeof payload.sub !== "string") return null;
    const row = await db.prepare(
      "SELECT id, email, name, created_at FROM hd_auth_users WHERE id = ? LIMIT 1"
    ).bind(payload.sub).first() as any;
    if (!row) return null;
    return {
      id: row.id,
      name: row.name || row.email,
      email: row.email,
      role: "user" as const,
      subscriptionPlan: "free",
      subscriptionStatus: "none",
      aiReadingCredits: 0,
      createdAt: row.created_at,
    };
  } catch {
    return null;
  }
}
