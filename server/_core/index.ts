import * as dotenv from "dotenv";
dotenv.config();
import express from "express";
import { BLOG_ARTICLES } from "../data/blogArticles";
import { BLOG_ARTICLES_EN } from "../data/blogArticlesEn";
import { GATE_DESCRIPTIONS } from "../data/hdContent";
import { getSystemPrompt, getReadingPrompt } from "../ai/prompts";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { registerStripeWebhook } from "../stripeWebhook";
import { registerLeadOSWebhook } from "../leadosWebhook";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // ─── SEO: Canonical host = www (the configured Railway domain) ───────
  // The bare apex (humandesignmapa.cz) currently has no DNS of its own, so
  // www MUST serve directly. We only redirect the apex → www (fires only if
  // the apex is ever pointed at Railway); www is never redirected away.
  app.use((req, res, next) => {
    if (req.hostname === "humandesignmapa.cz") {
      return res.redirect(301, `https://www.humandesignmapa.cz${req.originalUrl}`);
    }
    if (req.hostname === "humandesignchart.app") {
      return res.redirect(301, `https://www.humandesignchart.app${req.originalUrl}`);
    }
    next();
  });
  // ⚠️ Stripe webhook MUST be registered BEFORE express.json() to allow raw body for signature verification
  registerStripeWebhook(app);
  // ⚠️ LeadOS webhook also needs raw body for HMAC-SHA256 signature verification
  registerLeadOSWebhook(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // Storage proxy for optimized images
  registerStorageProxy(app);
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

  // ─── SEO: Sitemap.xml (bilingual with hreflang) ─────────────────────
  app.get("/sitemap.xml", (_req, res) => {
    const csBase = "https://humandesignmapa.cz";
    const enBase = "https://humandesignchart.app";
    const now = new Date().toISOString().split("T")[0];

    const staticPages = [
      { loc: "/", priority: "1.0", changefreq: "weekly" },
      { loc: "/calculate", priority: "0.9", changefreq: "monthly" },
      { loc: "/encyclopedia", priority: "0.8", changefreq: "monthly" },
      { loc: "/ai-guide", priority: "0.7", changefreq: "monthly" },
      { loc: "/transits", priority: "0.7", changefreq: "daily" },
      { loc: "/transit-calendar", priority: "0.6", changefreq: "daily" },
      { loc: "/celebrities", priority: "0.7", changefreq: "monthly" },
      { loc: "/comparison", priority: "0.6", changefreq: "monthly" },
      { loc: "/composite", priority: "0.6", changefreq: "monthly" },
      { loc: "/role-compatibility", priority: "0.6", changefreq: "monthly" },
      { loc: "/return-chart", priority: "0.6", changefreq: "monthly" },
      { loc: "/variables", priority: "0.6", changefreq: "monthly" },
      { loc: "/iching", priority: "0.6", changefreq: "monthly" },
      { loc: "/types/generator", priority: "0.8", changefreq: "monthly" },
      { loc: "/types/manifesting-generator", priority: "0.8", changefreq: "monthly" },
      { loc: "/types/projector", priority: "0.8", changefreq: "monthly" },
      { loc: "/types/manifestor", priority: "0.8", changefreq: "monthly" },
      { loc: "/types/reflector", priority: "0.8", changefreq: "monthly" },
      { loc: "/blog", priority: "0.8", changefreq: "weekly" },
      { loc: "/daily-transit", priority: "0.6", changefreq: "daily" },
      { loc: "/incarnation-cross", priority: "0.6", changefreq: "monthly" },
    ];

    const locales = ["cs", "en"];
    const standardUrls = staticPages.flatMap(p => locales.map(lang => {
      const baseUrl = lang === "en" ? enBase : csBase;

      const csUrl = csBase + (p.loc === "/" ? "/cs/" : "/cs" + p.loc);
      const enUrl = enBase + (p.loc === "/" ? "/en/" : "/en" + p.loc);

      const loc = lang === "en" ? enUrl : csUrl;
      const alternates = [
        `    <xhtml:link rel="alternate" hreflang="cs" href="${csUrl}" />`,
        `    <xhtml:link rel="alternate" hreflang="en" href="${enUrl}" />`,
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${enUrl}" />`
      ].join("\n");

      return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n${alternates}\n  </url>`;
    }));

    const csBlogUrls = BLOG_ARTICLES.map((a, i) => {
      const isPerfectMatch = BLOG_ARTICLES.length === BLOG_ARTICLES_EN.length;
      const csUrl = `${csBase}/cs/blog/${a.slug}`;
      const alternates = isPerfectMatch && BLOG_ARTICLES_EN[i] ? [
        `    <xhtml:link rel="alternate" hreflang="cs" href="${csUrl}" />`,
        `    <xhtml:link rel="alternate" hreflang="en" href="${enBase}/en/blog/${BLOG_ARTICLES_EN[i].slug}" />`,
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${enBase}/en/blog/${BLOG_ARTICLES_EN[i].slug}" />`
      ].join("\n") : `    <xhtml:link rel="alternate" hreflang="cs" href="${csUrl}" />`;

      return `  <url>\n    <loc>${csUrl}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n${alternates}\n  </url>`;
    });

    const enBlogUrls = BLOG_ARTICLES_EN.map((a, i) => {
      const isPerfectMatch = BLOG_ARTICLES.length === BLOG_ARTICLES_EN.length;
      const enUrl = `${enBase}/en/blog/${a.slug}`;
      const alternates = isPerfectMatch && BLOG_ARTICLES[i] ? [
        `    <xhtml:link rel="alternate" hreflang="cs" href="${csBase}/cs/blog/${BLOG_ARTICLES[i].slug}" />`,
        `    <xhtml:link rel="alternate" hreflang="en" href="${enUrl}" />`,
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${enUrl}" />`
      ].join("\n") : [
        `    <xhtml:link rel="alternate" hreflang="en" href="${enUrl}" />`,
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${enUrl}" />`
      ].join("\n");

      return `  <url>\n    <loc>${enUrl}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n${alternates}\n  </url>`;
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${[...standardUrls, ...csBlogUrls, ...enBlogUrls].join("\n")}\n</urlset>`;
    res.set("Content-Type", "application/xml");
    res.send(xml);
  });
  // ─── SEO: robots.txt ────────────────────────────────────────────────
  app.get("/robots.txt", (_req, res) => {
    res.type("text/plain");
    res.send("User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: https://humandesignmapa.cz/sitemap.xml");
  });

  // ─── OG Image Generator ────────────────────────────────────────────────
  app.get("/api/og/shared/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const { getSharedChart } = await import("../db");
      const shared = await getSharedChart(token);
      if (!shared) {
        res.status(404).send("Not found");
        return;
      }
      const { generateOGImage } = await import("../ogGenerator");
      const pngBuffer = await generateOGImage(shared.chartData as any, shared.ownerName);

      res.set("Content-Type", "image/png");
      res.set("Cache-Control", "public, max-age=86400, s-maxage=86400"); // cache 1 day
      res.send(pngBuffer);
    } catch (err) {
      console.error("[OG Generator] Error:", err);
      res.status(500).send("Internal Server Error");
    }
  });

  // ─── AI Streaming SSE Endpoint ────────────────────────────────────────
  app.get("/api/ai/stream", async (req, res) => {
    const { chartData, readingType, chartId, locale } = req.query as Record<string, string>;
    const isEn = locale === 'en';
    const sessionCookie = req.cookies?.session || req.headers.cookie?.split("session=")[1]?.split(";")[0];

    // Validate session using sdk
    let userId: number | null = null;
    try {
      const { sdk } = await import("./sdk");
      const user = await sdk.authenticateRequest(req as any);
      if (user) userId = user.id;
    } catch { /* no-op */ }

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // ─── Freemium limit check ─────────────────────────────────────────────
    try {
      const { getUserById, countAiReadingsByUserToday } = await import("../db");
      const { canGenerateAiReading } = await import("../stripeProducts");
      const user = await getUserById(userId);
      if (user) {
        const totalReadings = await countAiReadingsByUserToday(userId);
        const check = canGenerateAiReading(user, totalReadings);
        if (!check.allowed) {
          res.status(402).json({ error: "free_limit_reached", reason: check.reason });
          return;
        }
      }
    } catch (e) {
      console.warn("[AI Stream] Freemium check failed:", e);
    }

    if (!chartData || !readingType) {
      res.status(400).json({ error: "Missing chartData or readingType" });
      return;
    }

    let chart: Record<string, unknown>;
    try {
      chart = JSON.parse(decodeURIComponent(chartData));
    } catch {
      res.status(400).json({ error: "Invalid chartData JSON" });
      return;
    }

    const systemPrompt = getSystemPrompt(isEn);
    const userPrompt = getReadingPrompt(chart, readingType, isEn);

    const { ENV } = await import("./env");
    const apiUrl = `${ENV.llmBaseUrl.replace(/\/$/, "")}/chat/completions`;

    // SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    let fullContent = "";

    try {
      const llmRes = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${ENV.llmApiKey}`,
        },
        body: JSON.stringify({
          model: ENV.llmModel,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          stream: true,
          max_tokens: 4096,
        }),
      });

      if (!llmRes.ok || !llmRes.body) {
        res.write(`data: ${JSON.stringify({ error: "LLM error" })}\n\n`);
        res.end();
        return;
      }

      const reader = llmRes.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            const token = parsed.choices?.[0]?.delta?.content;
            if (token) {
              fullContent += token;
              res.write(`data: ${JSON.stringify({ token })}\n\n`);
            }
          } catch { /* skip malformed */ }
        }
      }

      // Save the completed reading to DB
      if (fullContent && chartId) {
        try {
          const { createAiReading } = await import("../db");
          await createAiReading({
            userId: userId!,
            chartId: parseInt(chartId),
            readingType,
            content: fullContent,
          });
        } catch (e) {
          console.warn("[AI Stream] Failed to save reading:", e);
        }
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    } catch (err) {
      res.write(`data: ${JSON.stringify({ error: String(err) })}\n\n`);
    } finally {
      res.end();
    }
  });

  // ─── AI Reading Rating Endpoint ─────────────────────────────────────────
  app.post("/api/ai/rating", express.json(), async (req, res) => {
    const { readingId, rating } = req.body as { readingId: number; rating: "up" | "down" };
    if (!readingId || !rating) {
      res.status(400).json({ error: "Missing readingId or rating" });
      return;
    }
    try {
      const { getDb } = await import("../db");
      const { aiReadings } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const db = await getDb();
      if (db) {
        await db.update(aiReadings).set({ rating }).where(eq(aiReadings.id, readingId));
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // ─── Real-time Notifications SSE Endpoint ──────────────────────────────────
  app.get("/api/notifications/stream", async (req, res) => {
    // Authenticate user
    let userId: number | null = null;
    try {
      const { sdk } = await import("./sdk");
      const user = await sdk.authenticateRequest(req as any);
      if (user) userId = user.id;
    } catch { /* no-op */ }

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    // Register this connection
    const { addConnection, removeConnection } = await import("../notificationBroadcast");
    addConnection(userId, res);

    // Send initial ping so client knows connection is alive
    res.write(`: connected\n\n`);

    // Heartbeat every 30s to keep connection alive through proxies
    const heartbeat = setInterval(() => {
      try { res.write(": heartbeat\n\n"); } catch { clearInterval(heartbeat); }
    }, 30_000);

    // Cleanup on disconnect
    req.on("close", () => {
      clearInterval(heartbeat);
      removeConnection(userId!, res);
    });
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const isProduction = process.env.NODE_ENV === "production" || process.env.RAILWAY_ENVIRONMENT;

  // In production (like Railway/Heroku), DO NOT use port finding logic as it tricks the container router
  const port = isProduction ? preferredPort : await findAvailablePort(preferredPort);

  if (!isProduction && port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${port}/`);
  });
}

startServer().catch(console.error);

// ─── Social Media Publisher Cron Job (every 5 minutes) ───────────────────────
async function runSocialPublisher() {
  try {
    const { publishScheduledPosts } = await import("../routers/social");
    await publishScheduledPosts();
  } catch (err) {
    console.error("[SocialPublisher] Error:", err);
  }
}

// Start publisher 15s after server init to avoid startup race conditions
setTimeout(() => {
  runSocialPublisher();
  setInterval(runSocialPublisher, 5 * 60 * 1000); // every 5 minutes
}, 15_000);
