import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { createHmac, randomBytes, timingSafeEqual, createSign, createPrivateKey } from "node:crypto";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { ENV } from "./env";
import { buildGoogleAuthUrl, exchangeGoogleCode } from "./googleAuth";
import { buildFacebookAuthUrl, exchangeFacebookCode } from "./facebookAuth";
import { buildAppleAuthUrl, exchangeAppleCode } from "./appleAuth";
import { syncUserAsLead, sendLeadOSEvent } from "../leados";
import { sendMetaCapiEvent } from "../metaCapi";

const STATE_MAX_AGE_MS = 10 * 60 * 1000;

type OAuthProvider = "google" | "facebook" | "apple";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

function getFormBody(req: Request, key: string): string | undefined {
  const value = req.body?.[key];
  return typeof value === "string" ? value : undefined;
}

// ─── Stateless CSRF state ──────────────────────────────────────────────
function signState(provider: OAuthProvider): string {
  const payload = `${Date.now()}.${randomBytes(8).toString("hex")}.${provider}`;
  const sig = createHmac("sha256", ENV.cookieSecret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

function verifyState(state: string | undefined): { valid: boolean; provider: OAuthProvider } {
  if (!state) return { valid: false, provider: "google" };
  const dotIdx = state.lastIndexOf(".");
  if (dotIdx <= 0) return { valid: false, provider: "google" };

  const payload = state.slice(0, dotIdx);
  const sig = state.slice(dotIdx + 1);
  const expected = createHmac("sha256", ENV.cookieSecret).update(payload).digest("base64url");

  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { valid: false, provider: "google" };
  }

  // payload format: timestamp.randomhex.provider
  const parts = payload.split(".");
  const ts = Number(parts[0]);
  const age = Date.now() - ts;
  if (!Number.isFinite(age) || age < 0 || age > STATE_MAX_AGE_MS) {
    return { valid: false, provider: "google" };
  }

  const provider = (parts[2] || "google") as OAuthProvider;
  return { valid: true, provider };
}

function getRedirectUri(req: Request, provider: OAuthProvider): string {
  const host = (req.get("host") ?? "").toLowerCase();

  if (host === "humandesignmapa.cz" || host === "www.humandesignmapa.cz") {
    return `https://www.humandesignmapa.cz/api/oauth/callback/${provider}`;
  }

  const forwardedProto = (req.headers["x-forwarded-proto"] as string | undefined)
    ?.split(",")[0]
    ?.trim();
  const isLocal = host.startsWith("localhost") || host.startsWith("127.0.0.1");
  const proto = forwardedProto || (isLocal ? "http" : "https");
  return `${proto}://${host}/api/oauth/callback/${provider}`;
}

// ─── Apple client secret (JWT-based) ──────────────────────────────────
function generateAppleClientSecret(): string {
  const header = Buffer.from(JSON.stringify({ alg: "ES256", kid: ENV.appleKeyId })).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({
    iss: ENV.appleTeamId,
    iat: now,
    exp: now + 15777000, // 6 months
    aud: "https://appleid.apple.com",
    sub: ENV.appleClientId,
  })).toString("base64url");

  const signingInput = `${header}.${payload}`;
  const privateKey = createPrivateKey(ENV.applePrivateKey.replace(/\\n/g, "\n"));

  const sign = createSign("SHA256");
  sign.update(signingInput);
  const signature = sign.sign(privateKey, "base64url");

  return `${signingInput}.${signature}`;
}

// ─── Shared: upsert user + create session + set cookie ─────────────────
async function handleUserSession(
  req: Request,
  res: Response,
  opts: {
    provider: OAuthProvider;
    providerSub: string;
    name: string | null;
    email: string | null;
    picture?: string | null;
  }
) {
  const openId = `${opts.provider}:${opts.providerSub}`;
  const displayName = opts.name || opts.email || "Uživatel";

  const existingUser = await db.getUserByOpenId(openId);
  const isNewUser = !existingUser;

  await db.upsertUser({
    openId,
    name: opts.name ?? null,
    email: opts.email ?? null,
    loginMethod: opts.provider,
    lastSignedIn: new Date().toISOString().slice(0, 19).replace("T", " "),
  });

  // Sync brand-new users to LeadOS CRM (best-effort, non-blocking).
  if (isNewUser && opts.email) {
    const freshUser = await db.getUserByOpenId(openId);
    syncUserAsLead({
      name: displayName,
      email: opts.email,
      source: "humandesignmapa.cz",
    }).catch((err) => console.error("[LeadOS] Sync failed:", err));

    sendLeadOSEvent({
      event: "new_user",
      data: {
        userId: freshUser?.id,
        name: displayName,
        email: opts.email,
        source: "human_design_app",
        tags: ["hdm", "free_user"],
        score: 45,
      },
    });

    sendMetaCapiEvent({
      eventName: "Lead",
      eventSourceUrl: `https://www.humandesignmapa.cz/api/oauth/callback/${opts.provider}`,
      userData: {
        email: opts.email,
        firstName: opts.name?.split(" ")[0],
        lastName: opts.name?.split(" ").slice(1).join(" "),
        clientIpAddress: (req.headers["x-forwarded-for"] as string)?.split(",")[0] || req.ip,
        clientUserAgent: req.headers["user-agent"],
      },
      customData: {
        content_name: "User Registration",
        content_category: "account",
      },
    }).catch((err) => console.error("[Meta CAPI] Dispatch error:", err));
  }

  const sessionToken = await sdk.createSessionToken(openId, {
    name: displayName,
    expiresInMs: ONE_YEAR_MS,
  });

  const cookieOptions = getSessionCookieOptions(req);
  res.cookie(COOKIE_NAME, sessionToken, {
    ...cookieOptions,
    maxAge: ONE_YEAR_MS,
  });

  res.redirect(302, "/");
}

export function registerOAuthRoutes(app: Express) {
  // ─── Google ──────────────────────────────────────────────────────────
  app.get("/api/oauth/login/google", (req: Request, res: Response) => {
    if (!ENV.googleClientId) {
      res.status(500).send("Google sign-in is not configured (set GOOGLE_CLIENT_ID).");
      return;
    }
    res.redirect(302, buildGoogleAuthUrl({
      clientId: ENV.googleClientId,
      redirectUri: getRedirectUri(req, "google"),
      state: signState("google"),
    }));
  });

  app.get("/api/oauth/callback/google", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!ENV.googleClientId || !ENV.googleClientSecret) {
      res.status(500).json({ error: "Google sign-in is not configured" });
      return;
    }
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    const { valid } = verifyState(state);
    if (!valid) {
      res.status(400).json({ error: "Invalid OAuth state" });
      return;
    }

    try {
      const profile = await exchangeGoogleCode({
        code,
        clientId: ENV.googleClientId,
        clientSecret: ENV.googleClientSecret,
        redirectUri: getRedirectUri(req, "google"),
      });

      await handleUserSession(req, res, {
        provider: "google",
        providerSub: profile.sub,
        name: profile.name,
        email: profile.email,
        picture: profile.picture,
      });
    } catch (error) {
      console.error("[OAuth] Google callback failed", error);
      res.status(500).json({
        error: "Sign-in failed",
        detail: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // ─── Facebook ────────────────────────────────────────────────────────
  app.get("/api/oauth/login/facebook", (req: Request, res: Response) => {
    if (!ENV.facebookClientId) {
      res.status(500).send("Facebook sign-in is not configured (set FACEBOOK_CLIENT_ID).");
      return;
    }
    res.redirect(302, buildFacebookAuthUrl({
      clientId: ENV.facebookClientId,
      redirectUri: getRedirectUri(req, "facebook"),
      state: signState("facebook"),
    }));
  });

  app.get("/api/oauth/callback/facebook", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!ENV.facebookClientId || !ENV.facebookClientSecret) {
      res.status(500).json({ error: "Facebook sign-in is not configured" });
      return;
    }
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    const { valid } = verifyState(state);
    if (!valid) {
      res.status(400).json({ error: "Invalid OAuth state" });
      return;
    }

    try {
      const profile = await exchangeFacebookCode({
        code,
        clientId: ENV.facebookClientId,
        clientSecret: ENV.facebookClientSecret,
        redirectUri: getRedirectUri(req, "facebook"),
      });

      await handleUserSession(req, res, {
        provider: "facebook",
        providerSub: profile.id,
        name: profile.name,
        email: profile.email,
        picture: profile.picture,
      });
    } catch (error) {
      console.error("[OAuth] Facebook callback failed", error);
      res.status(500).json({
        error: "Sign-in failed",
        detail: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // ─── Apple ───────────────────────────────────────────────────────────
  app.get("/api/oauth/login/apple", (req: Request, res: Response) => {
    if (!ENV.appleClientId) {
      res.status(500).send("Apple sign-in is not configured (set APPLE_CLIENT_ID).");
      return;
    }
    res.redirect(302, buildAppleAuthUrl({
      clientId: ENV.appleClientId,
      redirectUri: getRedirectUri(req, "apple"),
      state: signState("apple"),
    }));
  });

  app.post("/api/oauth/callback/apple", async (req: Request, res: Response) => {
    // Apple sends form_post with code, state, and optionally user (JSON string)
    const code = getFormBody(req, "code");
    const state = getFormBody(req, "state");
    const userStr = getFormBody(req, "user");

    if (!ENV.appleClientId) {
      res.status(500).json({ error: "Apple sign-in is not configured" });
      return;
    }
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    const { valid } = verifyState(state);
    if (!valid) {
      res.status(400).json({ error: "Invalid OAuth state" });
      return;
    }

    try {
      // Generate Apple client secret (JWT-based)
      const clientSecret = await generateAppleClientSecret();

      const profile = await exchangeAppleCode({
        code,
        clientId: ENV.appleClientId,
        clientSecret,
        redirectUri: getRedirectUri(req, "apple"),
      });

      // Apple provides user info only on first auth via the POST body
      let name = profile.name;
      if (!name && userStr) {
        try {
          const user = JSON.parse(userStr);
          name = [user.name?.firstName, user.name?.lastName].filter(Boolean).join(" ") || null;
        } catch {}
      }

      await handleUserSession(req, res, {
        provider: "apple",
        providerSub: profile.sub,
        name,
        email: profile.email,
      });
    } catch (error) {
      console.error("[OAuth] Apple callback failed", error);
      res.status(500).json({
        error: "Sign-in failed",
        detail: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // ─── Legacy: /api/oauth/login (defaults to Google) ──────────────────
  app.get("/api/oauth/login", (req: Request, res: Response) => {
    res.redirect(302, "/api/oauth/login/google");
  });
}
