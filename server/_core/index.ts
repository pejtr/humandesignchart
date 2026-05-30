import "dotenv/config";
import express from "express";
import { GATE_DESCRIPTIONS } from "../../shared/hdContent";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
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
  // ⚠️ Stripe webhook MUST be registered BEFORE express.json() to allow raw body for signature verification
  registerStripeWebhook(app);
  // ⚠️ LeadOS webhook also needs raw body for HMAC-SHA256 signature verification
  registerLeadOSWebhook(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

  // ─── SEO: Sitemap.xml (bilingual with hreflang) ─────────────────────
  app.get("/sitemap.xml", (_req, res) => {
    const baseUrl = "https://humandesignmapa.cz";
    const now = new Date().toISOString().split("T")[0];
    const pages = [
      { loc: "/", priority: "1.0", changefreq: "weekly" },
      { loc: "/calculate", priority: "0.9", changefreq: "monthly" },
      { loc: "/encyclopedia", priority: "0.8", changefreq: "monthly" },
      { loc: "/ai-guide", priority: "0.7", changefreq: "monthly" },
      { loc: "/transits", priority: "0.7", changefreq: "daily" },
      { loc: "/transit-calendar", priority: "0.6", changefreq: "daily" },
      { loc: "/celebrities", priority: "0.7", changefreq: "monthly" },
      { loc: "/comparison", priority: "0.6", changefreq: "monthly" },
      { loc: "/return-chart", priority: "0.6", changefreq: "monthly" },
      { loc: "/variables", priority: "0.6", changefreq: "monthly" },
      { loc: "/iching", priority: "0.6", changefreq: "monthly" },
      { loc: "/types/generator", priority: "0.8", changefreq: "monthly" },
      { loc: "/types/manifesting-generator", priority: "0.8", changefreq: "monthly" },
      { loc: "/types/projector", priority: "0.8", changefreq: "monthly" },
      { loc: "/types/manifestor", priority: "0.8", changefreq: "monthly" },
      { loc: "/types/reflector", priority: "0.8", changefreq: "monthly" },
      { loc: "/blog", priority: "0.8", changefreq: "weekly" },
      { loc: "/blog/co-je-human-design", priority: "0.7", changefreq: "monthly" },
      { loc: "/blog/5-typu-human-design", priority: "0.7", changefreq: "monthly" },
      { loc: "/blog/strategie-v-human-design", priority: "0.7", changefreq: "monthly" },
      { loc: "/blog/autorita-v-human-design", priority: "0.7", changefreq: "monthly" },
      { loc: "/blog/profily-v-human-design", priority: "0.7", changefreq: "monthly" },
      { loc: "/blog/9-center-v-human-design", priority: "0.7", changefreq: "monthly" },
      { loc: "/blog/generator-strategie-reagovat", priority: "0.7", changefreq: "monthly" },
      { loc: "/blog/projektor-cekat-na-pozvani", priority: "0.7", changefreq: "monthly" },
      { loc: "/blog/human-design-a-vztahy", priority: "0.7", changefreq: "monthly" },
      { loc: "/blog/inkarnacni-kriz-zivotni-ucel", priority: "0.7", changefreq: "monthly" },
      { loc: "/blog/jak-cist-bodygraph", priority: "0.7", changefreq: "monthly" },
      { loc: "/daily-transit", priority: "0.6", changefreq: "daily" },
      { loc: "/incarnation-cross", priority: "0.6", changefreq: "monthly" },
    ];
    const locales = ["cs", "en"];
    const urls = pages.flatMap(p => locales.map(lang => {
      const loc = `${baseUrl}/${lang}${p.loc}`;
      const alternates = locales.map(l => `    <xhtml:link rel="alternate" hreflang="${l}" href="${baseUrl}/${l}${p.loc}" />`).join("\n");
      return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n${alternates}\n  </url>`;
    })).join("\n");
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>`;
    res.set("Content-Type", "application/xml");
    res.send(xml);
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
      const { getUserById, countAiReadingsByUser } = await import("../db");
      const { canGenerateAiReading } = await import("../stripeProducts");
      const user = await getUserById(userId);
      if (user) {
        const totalReadings = await countAiReadingsByUser(userId);
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

    const prompts: Record<string, string> = {
      overview: `Provide a comprehensive overview of this Human Design chart. Type: ${chart.type}, Profile: ${chart.profile} ${chart.profileName}, Authority: ${chart.authority}, Definition: ${chart.definition}, Strategy: ${chart.strategy}. Defined Centers: ${(chart.centers as any[])?.filter((c: any) => c.defined).map((c: any) => c.name).join(", ")}. Channels: ${(chart.channels as any[])?.map((c: any) => `${c.gate1}-${c.gate2}`).join(", ")}. Incarnation Cross: ${(chart.incarnationCross as any)?.name}. Give deep insights about their life purpose, strengths, and how to live correctly.`,
      type_strategy: `Provide a deep analysis of being a ${chart.type} with the strategy "${chart.strategy}". Explain the signature theme "${chart.signature}" and the not-self theme "${chart.notSelf}". Describe the aura type "${chart.aura}" and how it affects interactions. Give practical advice for living as this type.`,
      profile: `Analyze the profile ${chart.profile} (${chart.profileName}) in depth. Explain the conscious line ${(chart.profile as string)?.split("/")[0]} and unconscious line ${(chart.profile as string)?.split("/")[1]}. Describe how these lines interact, the life themes, and practical implications for relationships, career, and personal growth.`,
      authority: `Explain the ${chart.authority} authority in detail. How should this person make decisions? What does it feel like when they follow their authority correctly vs. when they don't? Give practical exercises and tips for developing trust in this authority.`,
      incarnation_cross: (() => {
        const crossName = (chart.incarnationCross as any)?.name || '';
        const crossType = (chart.incarnationCross as any)?.type || '';
        const gates: number[] = (chart.incarnationCross as any)?.gates || [];
        const gateDetails = gates.map((g: number) => {
          const d = GATE_DESCRIPTIONS[g];
          if (!d) return `Gate ${g}`;
          const name = isEn ? d.nameEn : d.name;
          const theme = isEn ? d.themeEn : d.theme;
          const gift = isEn ? d.giftKeywordEn : d.giftKeyword;
          const shadow = isEn ? d.shadowKeyword : d.shadowKeyword;
          const desc = isEn ? d.descriptionEn : d.description;
          return `Gate ${g} (${name}, ${d.iChing} ${d.hexagram}, Center: ${d.center}, Circuit: ${d.circuit}): Theme — ${theme}. Gift: ${gift}, Shadow: ${shadow}. ${desc}`;
        }).join('\n\n');
        return isEn
          ? `Analyze the Incarnation Cross: "${crossName}" (${crossType}). The four gates are:\n\n${gateDetails}\n\nProvide a deep, structured analysis with these sections:\n1. **Life Theme & Purpose** — What is the core life mission of this cross? How do all 4 gates work together?\n2. **Conscious Gates (Personality Sun & Earth)** — Analyze gates ${gates[0]} and ${gates[1]}: their gifts, themes, and how they shape conscious identity\n3. **Unconscious Gates (Design Sun & Earth)** — Analyze gates ${gates[2]} and ${gates[3]}: their deeper unconscious gifts and how others see this person\n4. **How to Live This Cross** — Practical, specific guidance: daily practices, environments, relationships, and situations that support this cross\n5. **Challenges & Shadow Work** — What are the shadow aspects to be aware of? How to transform them?\n6. **Affirmation** — A powerful, personalized affirmation for this cross`
          : `Analyzuj Inkarnační kříž: "${crossName}" (${crossType}). Čtyři brány jsou:\n\n${gateDetails}\n\nPoskytni hlubokou, strukturovanou analýzu s těmito sekcemi:\n1. **Životní téma a poslání** — Jaké je základní životní poslání tohoto kříže? Jak všechny 4 brány spolupracují?\n2. **Vědomé brány (Osobnost — Slunce a Země)** — Analyzuj brány ${gates[0]} a ${gates[1]}: jejich dary, témata a jak formují vědomou identitu\n3. **Nevědomé brány (Design — Slunce a Země)** — Analyzuj brány ${gates[2]} a ${gates[3]}: jejich hlubší nevědomé dary a jak tě ostatní vnímají\n4. **Jak žít svůj kříž** — Praktické, konkrétní vedení: každodenní praxe, prostředí, vztahy a situace, které podporují tento kříž\n5. **Výzvy a práce se stínem** — Jaké jsou stínové aspekty, na které si dát pozor? Jak je transformovat?\n6. **Afirmace** — Silná, personalizovaná afirmace pro tento kříž`;
      })(),
      channels: `Analyze the defined channels: ${(chart.channels as any[])?.map((c: any) => `${c.gate1}-${c.gate2} (${c.centerA} to ${c.centerB})`).join("; ")}. For each channel, explain its energy, gifts, and challenges. Describe how these channels work together as a whole.`,
      relationships: `Based on this chart (Type: ${chart.type}, Profile: ${chart.profile}, Authority: ${chart.authority}, Definition: ${chart.definition}), provide relationship guidance. What type of partners are most compatible? How does their definition affect partnerships? What electromagnetic connections should they look for?`,
      career: `Based on this chart (Type: ${chart.type}, Profile: ${chart.profile}, Authority: ${chart.authority}, Defined channels: ${(chart.channels as any[])?.map((c: any) => `${c.gate1}-${c.gate2}`).join(", ")}), provide career guidance. What types of work environments suit them? What roles align with their design? How should they approach career decisions using their authority?`,
    };

    const systemPrompt = isEn
      ? `You are an expert in the Human Design system with deep knowledge of Ra Uru Hu's teachings. Provide deep, specific, and practical interpretations. Use a warm yet professional tone. Structure responses clearly using markdown formatting. Be specific to the given chart — avoid generic advice. IMPORTANT: Always respond in English. Use correct Human Design terminology. NEVER start with a greeting like "Hello!" or "Hi there" — begin directly with the interpretation or section heading.`
      : `Jsi expert na systém Human Design s hlubokými znalostmi Ra Uru Hu a jeho učení. Poskytuj hluboké, specifické a praktické výklady. Používej vřelý, ale profesionální tón. Strukturuj odpovědi přehledně pomocí markdown formátování. Buď specifický k danému chartu — vyhýbej se obecným radám. DŮLEŽITÉ: Vždy odpovídej v češtině. Používej správnou českou HD terminologii. NIKDY nezačínej oslovením jako "Ahoj!", "Dobrý den," nebo podobnými pozdravy — začni rovnou výkladem nebo nadpisem sekce.`;

    const { ENV } = await import("./env");
    const apiUrl = ENV.forgeApiUrl
      ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions`
      : "https://forge.manus.im/v1/chat/completions";

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
          authorization: `Bearer ${ENV.forgeApiKey}`,
        },
        body: JSON.stringify({
          model: "gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompts[readingType] || prompts.overview },
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
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
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
