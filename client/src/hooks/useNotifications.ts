/**
 * useNotifications — SSE hook for real-time notification streaming.
 * Connects to /api/notifications/stream and fires onNotification callback
 * when a new notification arrives. Automatically reconnects on disconnect.
 */

import { useEffect, useRef, useCallback } from "react";

export interface IncomingNotification {
  id: number;
  type: "crm_status" | "campaign" | "system" | "credit" | "achievement";
  title: string;
  message: string;
  data?: unknown;
  createdAt: string;
}

interface UseNotificationsOptions {
  enabled: boolean; // Only connect when user is authenticated
  onNotification: (notif: IncomingNotification) => void;
}

export function useNotificationsSSE({ enabled, onNotification }: UseNotificationsOptions) {
  const esRef = useRef<EventSource | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onNotifRef = useRef(onNotification);

  // Keep callback ref fresh without re-triggering effect
  useEffect(() => {
    onNotifRef.current = onNotification;
  }, [onNotification]);

  const connect = useCallback(() => {
    if (!enabled) return;
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }

    const es = new EventSource("/api/notifications/stream", { withCredentials: true });
    esRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as IncomingNotification;
        if (data && data.id && data.type) {
          onNotifRef.current(data);
        }
      } catch {
        // Ignore malformed messages (e.g. heartbeat comments are not dispatched as messages)
      }
    };

    es.onerror = () => {
      es.close();
      esRef.current = null;
      // Reconnect after 5 seconds
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      reconnectTimer.current = setTimeout(connect, 5_000);
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    connect();
    return () => {
      esRef.current?.close();
      esRef.current = null;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, [enabled, connect]);
}
