import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { ENV } from "./env";
import { buildGoogleAuthUrl, exchangeGoogleCode } from "./googleAuth";
import { syncUserAsLead, sendLeadOSEvent } from "../leados";

const STATE_MAX_AGE_MS = 10 * 60 * 1000;

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

// ─── Stateless CSRF state ──────────────────────────────────────────────
// The state is a signed token instead of a cookie, so it survives regardless
// of which host (www vs apex) the callback lands on and is immune to SameSite
// cookie quirks. Signature uses the app's JWT secret.
function signState(): string {
  const payload = `${Date.now()}.${randomBytes(8).toString("hex")}`;
  const sig = createHmac("sha256", ENV.cookieSecret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

function verifyState(state: string | undefined): boolean {
  if (!state) return false;
  const idx = state.lastIndexOf(".");
  if (idx <= 0) return false;
  const payload = state.slice(0, idx);
  const sig = state.slice(idx + 1);
  const expected = createHmac("sha256", ENV.cookieSecret).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  const ts = Number(payload.split(".")[0]);
  const age = Date.now() - ts;
  return Number.isFinite(age) && age >= 0 && age <= STATE_MAX_AGE_MS;
}

/**
 * Build the OAuth redirect URI. For the production domain we always return the
 * canonical `www` host (the one registered in the Google OAuth client), so the
 * flow never bounces between apex and www and the token-exchange redirect_uri
 * always matches the authorization request.
 */
function getRedirectUri(req: Request): string {
  const host = (req.get("host") ?? "").toLowerCase();
  if (host === "humandesignmapa.cz" || host === "www.humandesignmapa.cz") {
    return "https://www.humandesignmapa.cz/api/oauth/callback";
  }
  const forwardedProto = (req.headers["x-forwarded-proto"] as string | undefined)
    ?.split(",")[0]
    ?.trim();
  const isLocal = host.startsWith("localhost") || host.startsWith("127.0.0.1");
  const proto = forwardedProto || (isLocal ? "http" : "https");
  return `${proto}://${host}/api/oauth/callback`;
}

export function registerOAuthRoutes(app: Express) {
  // ─── Step 1: start sign-in → redirect to the Google consent screen ────
  app.get("/api/oauth/login", (req: Request, res: Response) => {
    if (!ENV.googleClientId) {
      res
        .status(500)
        .send("Google sign-in is not configured (set GOOGLE_CLIENT_ID).");
      return;
    }

    res.redirect(
      302,
      buildGoogleAuthUrl({
        clientId: ENV.googleClientId,
        redirectUri: getRedirectUri(req),
        state: signState(),
      })
    );
  });

  // ─── Step 2: Google redirects back here with ?code & ?state ───────────
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
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
    if (!verifyState(state)) {
      res.status(400).json({ error: "Invalid OAuth state" });
      return;
    }

    try {
      const profile = await exchangeGoogleCode({
        code,
        clientId: ENV.googleClientId,
        clientSecret: ENV.googleClientSecret,
        redirectUri: getRedirectUri(req),
      });

      const openId = `google:${profile.sub}`;
      const displayName = profile.name || profile.email || "Uživatel";

      const existingUser = await db.getUserByOpenId(openId);
      const isNewUser = !existingUser;

      await db.upsertUser({
        openId,
        name: profile.name ?? null,
        email: profile.email ?? null,
        loginMethod: "google",
        lastSignedIn: new Date().toISOString(),
      });

      // Sync brand-new users to LeadOS CRM (best-effort, non-blocking).
      if (isNewUser && profile.email) {
        const freshUser = await db.getUserByOpenId(openId);
        syncUserAsLead({
          name: displayName,
          email: profile.email,
          source: "humandesignmapa.cz",
        }).catch((err) => console.error("[LeadOS] Sync failed:", err));

        sendLeadOSEvent({
          event: "new_user",
          data: {
            userId: freshUser?.id,
            name: displayName,
            email: profile.email,
            source: "human_design_app",
            tags: ["hdm", "free_user"],
            score: 45,
          },
        });
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
    } catch (error) {
      console.error("[OAuth] Google callback failed", error);
      res.status(500).json({
        error: "Sign-in failed",
        detail: error instanceof Error ? error.message : String(error)
      });
    }
  });
}
