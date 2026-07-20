import { Express } from "express";

export function registerNotificationRoutes(app: Express) {
  // ─── Real-time Notifications SSE Endpoint ──────────────────────────────
  app.get("/api/notifications/stream", async (req, res) => {
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

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    const { addConnection, removeConnection } = await import("../notificationBroadcast");
    addConnection(userId, res);

    res.write(`: connected\n\n`);

    const heartbeat = setInterval(() => {
      try { res.write(": heartbeat\n\n"); } catch { clearInterval(heartbeat); }
    }, 30_000);

    req.on("close", () => {
      clearInterval(heartbeat);
      removeConnection(userId!, res);
    });
  });
}
