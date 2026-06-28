import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import { randomBytes } from "node:crypto";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { ENV } from "./env";
import { buildGoogleAuthUrl, exchangeGoogleCode } from "./googleAuth";
import { syncUserAsLead, sendLeadOSEvent } from "../leados";

const STATE_COOKIE = "oauth_state";
const STATE_TTL_MS = 10 * 60 * 1000;

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

/** Build the OAuth redirect URI from the incoming request (honours the proxy). */
function getRedirectUri(req: Request): string {
  const forwardedProto = (
    req.headers["x-forwarded-proto"] as string | undefined
  )
    ?.split(",")[0]
    ?.trim();
  const host = req.get("host") ?? "";
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

    const state = randomBytes(16).toString("hex");
    const cookieOptions = getSessionCookieOptions(req);
    res.cookie(STATE_COOKIE, state, { ...cookieOptions, maxAge: STATE_TTL_MS });

    res.redirect(
      302,
      buildGoogleAuthUrl({
        clientId: ENV.googleClientId,
        redirectUri: getRedirectUri(req),
        state,
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

    // CSRF: the returned state must match the value set before the redirect.
    const cookies = parseCookieHeader(req.headers.cookie ?? "");
    if (!cookies[STATE_COOKIE] || cookies[STATE_COOKIE] !== state) {
      res.status(400).json({ error: "Invalid OAuth state" });
      return;
    }
    res.clearCookie(STATE_COOKIE, getSessionCookieOptions(req)); // one-time use

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
      res.status(500).json({ error: "Sign-in failed" });
    }
  });
}
