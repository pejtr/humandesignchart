import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { syncUserAsLead, sendLeadOSEvent } from "../leados";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  // DEV-MODE: Mock Login endpoint if OAuth vars are missing.
  app.get("/api/oauth/mock", async (req: Request, res: Response) => {
    try {
      if (process.env.NODE_ENV === "production" && process.env.VITE_APP_ID) {
        return res.status(403).json({ error: "Mock auth disabled in production." });
      }

      const mockOpenId = "dev-mock-local-user-id";
      const name = "Dev User";
      const email = "dev@example.local";

      const existingUser = await db.getUserByOpenId(mockOpenId);
      if (!existingUser) {
        await db.upsertUser({
          openId: mockOpenId,
          name: name,
          email: email,
          loginMethod: "mock",
          lastSignedIn: new Date().toISOString(),
        });
      } else {
        await db.upsertUser({
          openId: mockOpenId,
          name: name,
          email: email,
          loginMethod: "mock",
          lastSignedIn: new Date().toISOString(),
        });
      }

      const sessionToken = await sdk.createSessionToken(mockOpenId, {
        name: name,
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (err) {
      console.error("[OAuth] Mock Auth Error:", err);
      res.status(500).json({ error: "Internal server error during mock authentication" });
    }
  });

  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      // Check if this is a new user (before upsert)
      const existingUser = await db.getUserByOpenId(userInfo.openId);
      const isNewUser = !existingUser;

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date().toISOString(),
      });

      // Sync new user to LeadOS CRM (non-blocking, best-effort)
      if (isNewUser && userInfo.email) {
        const freshUser = await db.getUserByOpenId(userInfo.openId);
        syncUserAsLead({
          name: userInfo.name || "",
          email: userInfo.email,
          source: "humandesignmapa.cz",
        }).catch((err) => console.error("[LeadOS] Sync failed:", err));

        // Fire structured event for lead scoring
        sendLeadOSEvent({
          event: "new_user",
          data: {
            userId: freshUser?.id,
            name: userInfo.name || "",
            email: userInfo.email,
            source: "human_design_app",
            tags: ["hdm", "free_user"],
            score: 45,
          },
        });
      }

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
