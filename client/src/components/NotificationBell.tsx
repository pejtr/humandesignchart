/**
 * NotificationBell — Navbar notification icon with:
 * - Red badge showing unread count
 * - Dropdown panel listing recent notifications
 * - Real-time SSE updates with toast on arrival
 * - Mark as read / mark all as read
 */

import { useState, useCallback, useEffect } from "react";
import { Bell, BellRing, CheckCheck, X } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useNotificationsSSE, type IncomingNotification } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// ─── Type colours ─────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  crm_status: {
    color: "bg-purple-100 text-purple-700 border-purple-200",
    dot: "bg-purple-500",
    icon: "🎯",
    label: "CRM Status",
  },
  campaign: {
    color: "bg-green-100 text-green-700 border-green-200",
    dot: "bg-green-500",
    icon: "📧",
    label: "Kampaň",
  },
  system: {
    color: "bg-blue-100 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
    icon: "ℹ️",
    label: "Systém",
  },
  credit: {
    color: "bg-amber-100 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
    icon: "⭐",
    label: "Kredit",
  },
  achievement: {
    color: "bg-rose-100 text-rose-700 border-rose-200",
    dot: "bg-rose-500",
    icon: "🏆",
    label: "Úspěch",
  },
} as const;

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "právě teď";
  if (mins < 60) return `před ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `před ${hrs} h`;
  const days = Math.floor(hrs / 24);
  return `před ${days} d`;
}

interface NotificationBellProps {
  userId: number;
}

export function NotificationBell({ userId }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [localNotifs, setLocalNotifs] = useState<IncomingNotification[]>([]);

  // ─── tRPC queries ────────────────────────────────────────────────────────────
  const utils = trpc.useUtils();
  const { data: notifications = [], isLoading } = trpc.notifications.getAll.useQuery(
    { limit: 20 },
    { enabled: !!userId }
  );
  const { data: unreadData } = trpc.notifications.getUnreadCount.useQuery(
    undefined,
    { enabled: !!userId, refetchInterval: 60_000 }
  );
  const markReadMutation = trpc.notifications.markRead.useMutation({
    onSuccess: () => {
      utils.notifications.getAll.invalidate();
      utils.notifications.getUnreadCount.invalidate();
    },
  });
  const markAllReadMutation = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => {
      utils.notifications.getAll.invalidate();
      utils.notifications.getUnreadCount.invalidate();
      setLocalNotifs([]);
    },
  });

  // ─── SSE real-time updates ───────────────────────────────────────────────────
  const handleNewNotification = useCallback((notif: IncomingNotification) => {
    // Add to local state for immediate display
    setLocalNotifs(prev => [notif, ...prev.slice(0, 19)]);
    // Invalidate tRPC cache so dropdown refreshes
    utils.notifications.getAll.invalidate();
    utils.notifications.getUnreadCount.invalidate();

    // Show toast
    const cfg = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.system;
    toast(notif.title, {
      description: notif.message,
      icon: cfg.icon,
      duration: 6_000,
      action: {
        label: "Zobrazit",
        onClick: () => setOpen(true),
      },
    });
  }, [utils]);

  useNotificationsSSE({ enabled: !!userId, onNotification: handleNewNotification });

  // Merge DB notifications with local SSE-received ones (deduplicate by id)
  const allNotifs = [
    ...localNotifs.filter(ln => !notifications.some(n => n.id === ln.id)),
    ...notifications,
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const unreadCount = (unreadData?.count ?? 0) + localNotifs.filter(n => !notifications.some(db => db.id === n.id)).length;

  const handleMarkRead = (id: number) => {
    markReadMutation.mutate({ id });
    setLocalNotifs(prev => prev.filter(n => n.id !== id));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-full hover:bg-accent/50 transition-colors"
          aria-label={`Notifikace${unreadCount > 0 ? ` (${unreadCount} nepřečtených)` : ""}`}
        >
          {unreadCount > 0 ? (
            <BellRing className="h-5 w-5 text-foreground animate-[wiggle_0.5s_ease-in-out]" />
          ) : (
            <Bell className="h-5 w-5 text-muted-foreground" />
          )}
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-80 p-0 shadow-xl border border-border/60 rounded-xl overflow-hidden"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-muted/30">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Notifikace</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-red-100 text-red-600 border-red-200">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
              >
                <CheckCheck className="h-3.5 w-3.5 mr-1" />
                Vše přečteno
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setOpen(false)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Notification list */}
        <ScrollArea className="max-h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : allNotifs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">Žádné notifikace</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Upozornění na CRM změny a kampaně se zobrazí zde
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {allNotifs.map((notif) => {
                const cfg = TYPE_CONFIG[notif.type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.system;
                const isUnread = !("isRead" in notif) || !(notif as { isRead: boolean }).isRead;
                return (
                  <div
                    key={notif.id}
                    className={`flex gap-3 px-4 py-3 hover:bg-accent/30 transition-colors cursor-pointer group ${
                      isUnread ? "bg-primary/5" : ""
                    }`}
                    onClick={() => {
                      if (isUnread && "isRead" in notif) {
                        handleMarkRead(notif.id);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    {/* Type dot */}
                    <div className="flex-shrink-0 mt-1">
                      <div className={`h-2 w-2 rounded-full mt-1 ${isUnread ? cfg.dot : "bg-muted-foreground/30"}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm leading-snug ${isUnread ? "font-semibold text-foreground" : "font-medium text-foreground/80"}`}>
                          {cfg.icon} {notif.title}
                        </p>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0 mt-0.5">
                          {timeAgo(typeof notif.createdAt === "string" ? notif.createdAt : (notif.createdAt as Date).toISOString())}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                        {notif.message}
                      </p>
                      <span className={`inline-block mt-1.5 text-[10px] px-1.5 py-0.5 rounded border ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {allNotifs.length > 0 && (
          <div className="px-4 py-2 border-t border-border/40 bg-muted/20">
            <p className="text-[10px] text-muted-foreground text-center">
              Zobrazeno posledních {allNotifs.length} notifikací
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
