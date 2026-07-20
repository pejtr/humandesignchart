import { Express } from "express";
import { z } from "zod";

export function registerAiRoutes(app: Express) {
  // ─── AI Reading Rating Endpoint ─────────────────────────────────────────
  app.post("/api/ai/rating", async (req, res) => {
    const parsed = z.object({
      readingId: z.coerce.number().int().positive(),
      rating: z.enum(["up", "down"]).nullable(),
    }).safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid readingId or rating" });
      return;
    }
    try {
      const { sdk } = await import("./sdk");
      const user = await sdk.authenticateRequest(req as any);
      if (!user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const { updateReadingRating } = await import("../db");
      await updateReadingRating(parsed.data.readingId, user.id, parsed.data.rating);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });
}
