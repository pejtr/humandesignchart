import { Express } from "express";
import { getSystemPrompt, getReadingPrompt } from "../../ai/prompts";

export function registerAiStreamRoute(app: Express) {
  // ─── AI Streaming SSE Endpoint ────────────────────────────────────────
  app.post("/api/ai/stream", async (req, res) => {
    const { chartData, readingType, chartId, locale } = req.body as {
      chartData?: Record<string, unknown>;
      readingType?: string;
      chartId?: number;
      locale?: string;
    };
    const isEn = locale === 'en';

    let userId: number | null = null;
    try {
      const { sdk } = await import("../sdk");
      const user = await sdk.authenticateRequest(req as any);
      if (user) userId = user.id;
    } catch { /* no-op */ }

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    try {
      const { getUserById, countAiReadingsByUser } = await import("../../db");
      const { canGenerateAiReading } = await import("../../stripeProducts");
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
      res.status(503).json({ error: "Reading availability could not be verified" });
      return;
    }

    if (!chartData || !readingType) {
      res.status(400).json({ error: "Missing chartData or readingType" });
      return;
    }

    if (typeof chartData !== "object" || Array.isArray(chartData)) {
      res.status(400).json({ error: "Invalid chartData" });
      return;
    }
    const chart: Record<string, unknown> = { ...chartData };
    if (readingType === "moon") {
      const { getMoonReadingContext } = await import("../../routers/transit");
      chart.currentMoon = await getMoonReadingContext();
    }

    const systemPrompt = getSystemPrompt(isEn);
    const userPrompt = getReadingPrompt(chart, readingType, isEn);

    const { ENV } = await import("../env");
    const apiUrl = `${ENV.llmBaseUrl.replace(/\/$/, "")}/chat/completions`;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    let fullContent = "";
    const upstreamAbort = new AbortController();
    const upstreamTimeout = setTimeout(() => upstreamAbort.abort(), 45_000);

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
          max_tokens: 1800,
        }),
        signal: upstreamAbort.signal,
      });

      if (!llmRes.ok || !llmRes.body) {
        res.write(`data: ${JSON.stringify({ error: "LLM error" })}\n\n`);
        res.end();
        return;
      }

      const reader = llmRes.body.getReader();
      const decoder = new TextDecoder();
      let pendingLine = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        pendingLine += decoder.decode(value, { stream: true });
        const lines = pendingLine.split("\n");
        pendingLine = lines.pop() ?? "";

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

      if (fullContent && chartId && chartId > 0) {
        try {
          const { createAiReading } = await import("../../db");
          await createAiReading({
            userId: userId!,
            chartId,
            readingType,
            content: fullContent,
          });
        } catch (e) {
          console.warn("[AI Stream] Failed to save reading:", e);
        }
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    } catch (err: any) {
      const error = err?.name === "AbortError" ? "timeout" : "generation_failed";
      res.write(`data: ${JSON.stringify({ error })}\n\n`);
    } finally {
      clearTimeout(upstreamTimeout);
      res.end();
    }
  });
}
