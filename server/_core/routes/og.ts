import { Express } from "express";

export function registerOgRoutes(app: Express) {
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
      res.set("Cache-Control", "public, max-age=86400, s-maxage=86400");
      res.send(pngBuffer);
    } catch (err) {
      console.error("[OG Generator] Error:", err);
      res.status(500).send("Internal Server Error");
    }
  });
}
