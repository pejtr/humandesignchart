/**
 * In-memory SSE broadcaster for real-time user notifications.
 * Maintains a Map of userId → Set<Response> for active SSE connections.
 * Also supports broadcast to ALL connected users (for campaign events).
 */

import type { Response } from "express";

// userId → set of active SSE response objects
const connections = new Map<number, Set<Response>>();

export function addConnection(userId: number, res: Response): void {
  if (!connections.has(userId)) {
    connections.set(userId, new Set());
  }
  connections.get(userId)!.add(res);
}

export function removeConnection(userId: number, res: Response): void {
  const set = connections.get(userId);
  if (set) {
    set.delete(res);
    if (set.size === 0) connections.delete(userId);
  }
}

export interface NotificationPayload {
  id: number;
  type: "crm_status" | "campaign" | "system" | "credit" | "achievement";
  title: string;
  message: string;
  data?: unknown;
  createdAt: string;
}

/** Send a notification to a specific user (all their open tabs). */
export function broadcastToUser(userId: number, payload: NotificationPayload): void {
  const set = connections.get(userId);
  if (!set || set.size === 0) return;
  const data = `data: ${JSON.stringify(payload)}\n\n`;
  for (const res of Array.from(set)) {
    try {
      res.write(data);
    } catch {
      // Connection dropped — remove silently
      set.delete(res);
    }
  }
}

/** Send a notification to ALL currently connected users (e.g. new campaign). */
export function broadcastToAll(payload: NotificationPayload): void {
  const data = `data: ${JSON.stringify(payload)}\n\n`;
  for (const [userId, set] of Array.from(connections.entries())) {
    for (const res of Array.from(set)) {
      try {
        res.write(data);
      } catch {
        set.delete(res);
      }
    }
    if (set.size === 0) connections.delete(userId);
  }
}

/** Returns number of currently connected users (for monitoring). */
export function getConnectionCount(): number {
  return connections.size;
}
