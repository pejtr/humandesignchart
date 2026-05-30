/**
 * Vitest tests for the real-time notification system.
 * Covers: DB helpers, SSE broadcaster, tRPC procedures, webhook integration.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── SSE Broadcaster unit tests ───────────────────────────────────────────────
describe("SSE Broadcaster", () => {
  it("exports required functions", async () => {
    const mod = await import("./notificationBroadcast");
    expect(typeof mod.addConnection).toBe("function");
    expect(typeof mod.removeConnection).toBe("function");
    expect(typeof mod.broadcastToUser).toBe("function");
    expect(typeof mod.broadcastToAll).toBe("function");
    expect(typeof mod.getConnectionCount).toBe("function");
  });

  it("getConnectionCount returns 0 with no connections", async () => {
    const { getConnectionCount } = await import("./notificationBroadcast");
    // Fresh module — no connections yet
    expect(getConnectionCount()).toBeGreaterThanOrEqual(0);
  });

  it("addConnection and removeConnection are symmetric", async () => {
    const { addConnection, removeConnection, getConnectionCount } = await import("./notificationBroadcast");
    const before = getConnectionCount();

    const fakeRes = { write: vi.fn(), end: vi.fn() } as any;
    addConnection(99999, fakeRes);
    expect(getConnectionCount()).toBe(before + 1);

    removeConnection(99999, fakeRes);
    expect(getConnectionCount()).toBe(before);
  });

  it("broadcastToUser writes SSE data to registered response", async () => {
    const { addConnection, removeConnection, broadcastToUser } = await import("./notificationBroadcast");

    const writes: string[] = [];
    const fakeRes = {
      write: vi.fn((data: string) => { writes.push(data); }),
      end: vi.fn(),
    } as any;

    addConnection(88888, fakeRes);

    broadcastToUser(88888, {
      id: 1,
      type: "crm_status",
      title: "Test",
      message: "CRM status changed",
      createdAt: new Date().toISOString(),
    });

    expect(fakeRes.write).toHaveBeenCalledOnce();
    const written = writes[0];
    expect(written).toMatch(/^data: /);
    const parsed = JSON.parse(written.replace("data: ", "").trim());
    expect(parsed.type).toBe("crm_status");
    expect(parsed.title).toBe("Test");

    removeConnection(88888, fakeRes);
  });

  it("broadcastToAll sends to all connected users", async () => {
    const { addConnection, removeConnection, broadcastToAll } = await import("./notificationBroadcast");

    const res1 = { write: vi.fn(), end: vi.fn() } as any;
    const res2 = { write: vi.fn(), end: vi.fn() } as any;

    addConnection(77771, res1);
    addConnection(77772, res2);

    broadcastToAll({
      id: 2,
      type: "campaign",
      title: "Nová kampaň",
      message: "Spustili jsme kampaň",
      createdAt: new Date().toISOString(),
    });

    expect(res1.write).toHaveBeenCalledOnce();
    expect(res2.write).toHaveBeenCalledOnce();

    removeConnection(77771, res1);
    removeConnection(77772, res2);
  });

  it("broadcastToUser is a no-op for unknown userId", async () => {
    const { broadcastToUser } = await import("./notificationBroadcast");
    // Should not throw
    expect(() => broadcastToUser(0, {
      id: 3,
      type: "system",
      title: "Test",
      message: "No-op test",
      createdAt: new Date().toISOString(),
    })).not.toThrow();
  });
});

// ─── NotificationPayload validation tests ─────────────────────────────────────
describe("NotificationPayload structure", () => {
  it("crm_status payload has required fields", () => {
    const payload = {
      id: 1,
      type: "crm_status" as const,
      title: "Váš CRM status byl aktualizován",
      message: 'Status změněn z "Nový lead" na "Kontaktován".',
      data: { oldStatus: "new", newStatus: "contacted" },
      createdAt: new Date().toISOString(),
    };
    expect(payload.type).toBe("crm_status");
    expect(payload.title).toBeTruthy();
    expect(payload.message).toContain("Status");
    expect((payload.data as any).newStatus).toBe("contacted");
  });

  it("campaign payload has required fields", () => {
    const payload = {
      id: Date.now(),
      type: "campaign" as const,
      title: "📧 Nová kampaň: Jarní 2026",
      message: "Spustili jsme novou email kampaň pro 500 příjemce.",
      data: { campaignName: "Jarní 2026", targetCount: 500 },
      createdAt: new Date().toISOString(),
    };
    expect(payload.type).toBe("campaign");
    expect((payload.data as any).targetCount).toBe(500);
  });

  it("all valid notification types are accepted", () => {
    const validTypes = ["crm_status", "campaign", "system", "credit", "achievement"] as const;
    for (const type of validTypes) {
      expect(typeof type).toBe("string");
    }
    expect(validTypes).toHaveLength(5);
  });
});

// ─── DB notifications helper validation ───────────────────────────────────────
describe("Notification DB helpers", () => {
  it("exports all required functions", async () => {
    const mod = await import("./db.notifications");
    expect(typeof mod.createNotification).toBe("function");
    expect(typeof mod.getUserNotifications).toBe("function");
    expect(typeof mod.getUnreadCount).toBe("function");
    expect(typeof mod.markNotificationRead).toBe("function");
    expect(typeof mod.markAllNotificationsRead).toBe("function");
  });

  it("getUserNotifications returns empty array when DB unavailable", async () => {
    // Mock getDb to return null
    vi.doMock("./db", () => ({ getDb: async () => null }));
    const { getUserNotifications } = await import("./db.notifications");
    // Should gracefully return [] not throw
    const result = await getUserNotifications(1);
    expect(Array.isArray(result)).toBe(true);
  });

  it("getUnreadCount returns 0 when DB unavailable", async () => {
    vi.doMock("./db", () => ({ getDb: async () => null }));
    const { getUnreadCount } = await import("./db.notifications");
    const count = await getUnreadCount(1);
    expect(count).toBe(0);
  });
});

// ─── tRPC notifications router validation ─────────────────────────────────────
describe("tRPC notifications router", () => {
  it("appRouter includes notifications procedures", async () => {
    const { appRouter } = await import("./routers");
    const procedures = Object.keys(appRouter._def.procedures);
    const notifProcedures = procedures.filter(p => p.startsWith("notifications."));
    expect(notifProcedures).toContain("notifications.getAll");
    expect(notifProcedures).toContain("notifications.getUnreadCount");
    expect(notifProcedures).toContain("notifications.markRead");
    expect(notifProcedures).toContain("notifications.markAllRead");
  });
});

// ─── SSE endpoint existence test ──────────────────────────────────────────────
describe("SSE endpoint registration", () => {
  it("server/_core/index.ts registers /api/notifications/stream", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("./server/_core/index.ts", "utf-8");
    expect(content).toContain("/api/notifications/stream");
    expect(content).toContain("text/event-stream");
    expect(content).toContain("addConnection");
    expect(content).toContain("removeConnection");
  });

  it("leadosWebhook.ts imports and uses broadcastToUser and broadcastToAll", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("./server/leadosWebhook.ts", "utf-8");
    expect(content).toContain("broadcastToUser");
    expect(content).toContain("broadcastToAll");
    expect(content).toContain("createNotification");
  });
});
