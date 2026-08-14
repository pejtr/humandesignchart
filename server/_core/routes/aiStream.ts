import type { Express } from "express";
import { generateOwnedReading, OwnedReadingError, OwnedReadingInputSchema } from "../../ai/ownedReading";
import { productionOwnedReadingDependencies } from "../../ai/productionOwnedReading";
import { countAiReadingsByUser, getUserById } from "../../db";
import { canGenerateAiReading, isPremiumUser } from "../../stripeProducts";
import { sdk } from "../sdk";

export function registerAiStreamRoute(app: Express) {
  app.post("/api/ai/stream", async (req, res) => {
    let user;
    try {
      user = await sdk.authenticateRequest(req);
    } catch {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const parsedInput = OwnedReadingInputSchema.safeParse(req.body);
    if (!parsedInput.success) {
      return res.status(400).json({ error: "Invalid reading request", issues: parsedInput.error.issues.map(({ path, code }) => ({ path, code })) });
    }

    const currentUser = await getUserById(user.id);
    if (!currentUser) return res.status(401).json({ error: "Unauthorized" });
    const totalReadings = await countAiReadingsByUser(user.id);
    const access = canGenerateAiReading(currentUser, totalReadings);
    if (!access.allowed) return res.status(402).json({ error: "free_limit_reached", reason: access.reason });

    try {
      const result = await generateOwnedReading({
        userId: user.id,
        input: parsedInput.data,
        consumeCredit: !isPremiumUser(currentUser) && currentUser.aiReadingCredits > 0,
        dependencies: productionOwnedReadingDependencies(),
      });

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders();
      res.write(`data: ${JSON.stringify({ token: result.content })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true, id: result.id, groundingStatus: result.groundingStatus })}\n\n`);
      return res.end();
    } catch (error) {
      if (error instanceof OwnedReadingError) {
        if (error.code === "CHART_NOT_FOUND") return res.status(404).json({ error: "Chart not found" });
        if (error.code === "INVALID_CANONICAL_CHART") return res.status(412).json({ error: "Stored chart must be recalculated before an AI reading can be generated" });
        console.error("[AI Grounding] Stream reading rejected", { userId: user.id, chartId: parsedInput.data.chartId, code: error.code, message: error.message });
        return res.status(502).json({ error: "AI_GROUNDING_FAILED", groundingCode: error.code });
      }
      console.error("[AI Stream] Generation failed", error);
      return res.status(500).json({ error: "generation_failed" });
    }
  });
}
