import type { ServerResponse } from "http";

const connections = new Map<number, Set<ServerResponse>>();

export function addConnection(userId: number, res: ServerResponse): void {
  if (!connections.has(userId)) {
    connections.set(userId, new Set());
  }
  connections.get(userId)!.add(res);
}

export function removeConnection(userId: number, res: ServerResponse): void {
  connections.get(userId)?.delete(res);
  if (connections.get(userId)?.size === 0) {
    connections.delete(userId);
  }
}

export function broadcastToUser(userId: number, data: Record<string, unknown>): void {
  const userConnections = connections.get(userId);
  if (!userConnections) return;
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const res of userConnections) {
    try { res.write(payload); } catch { userConnections.delete(res); }
  }
}

export function broadcastToAll(data: Record<string, unknown>): void {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const [, userConnections] of connections) {
    for (const res of userConnections) {
      try { res.write(payload); } catch { userConnections.delete(res); }
    }
  }
}
