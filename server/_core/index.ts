import * as dotenv from "dotenv";
dotenv.config();
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { registerStripeWebhook } from "../stripeWebhook";
import { registerLeadOSWebhook } from "../leadosWebhook";
import { handleComgateWebhook } from "../comgateWebhook";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { registerSeoRoutes } from "./routes/seo";
import { registerAiRoutes } from "./routes/ai";
import { registerAiStreamRoute } from "./routes/aiStream";
import { registerNotificationRoutes } from "./routes/notifications";
import { registerOgRoutes } from "./routes/og";
import { registerGptRoutes } from "./routes/gpt";

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

  app.set("trust proxy", true);

  // Baseline security headers
  app.disable("x-powered-by");
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    next();
  });

  // Canonical host redirects — normalize to https + www for both domains
  app.use((req, res, next) => {
    const host = req.hostname;
    const isMapa = host === "humandesignmapa.cz" || host === "www.humandesignmapa.cz";
    const isChart = host === "humandesignchart.app" || host === "www.humandesignchart.app";
    if (!isMapa && !isChart) return next();
    const canonicalHost = isMapa ? "www.humandesignmapa.cz" : "www.humandesignchart.app";
    const proto = (req.headers["x-forwarded-proto"] as string) || (req.secure ? "https" : "http");
    const isHttps = proto === "https" || req.secure;
    if (!isHttps || host !== canonicalHost) {
      return res.redirect(301, `https://${canonicalHost}${req.originalUrl}`);
    }
    next();
  });

  // ⚠️ Webhook routes MUST be registered BEFORE express.json()
  registerStripeWebhook(app);
  registerLeadOSWebhook(app);
  app.post("/api/comgate/webhook", express.urlencoded({ extended: true, limit: "1mb" }), async (req, res, next) => {
    try {
      await handleComgateWebhook(req, res);
    } catch (err) {
      next(err);
    }
  });

  // Body parser — 2MB for API JSON; file uploads use S3 presigned URLs
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ limit: "2mb", extended: true }));

  // Register extracted route modules
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  registerSeoRoutes(app);
  registerOgRoutes(app);
  registerAiStreamRoute(app);
  registerAiRoutes(app);
  registerNotificationRoutes(app);
  registerGptRoutes(app);

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // Vite dev or static production
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const isProduction = process.env.NODE_ENV === "production" || process.env.RAILWAY_ENVIRONMENT;
  const port = isProduction ? preferredPort : await findAvailablePort(preferredPort);

  if (!isProduction && port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${port}/`);
  });
}

startServer().catch(console.error);

// Social Media Publisher Cron Job (every 5 minutes)
async function runSocialPublisher() {
  try {
    const { publishScheduledPosts } = await import("../routers/social");
    await publishScheduledPosts();
  } catch (err) {
    console.error("[SocialPublisher] Error:", err);
  }
}

setTimeout(() => {
  runSocialPublisher();
  setInterval(runSocialPublisher, 5 * 60 * 1000);
}, 15_000);
