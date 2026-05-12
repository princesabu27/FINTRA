"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Bell, TrendingDown, TrendingUp, PiggyBank, Wallet, CheckCheck, X } from "lucide-react";
import { BottomSheet } from "./BottomSheet";
import { useNotifications, useMarkAllRead, useMarkRead, type AppNotification } from "@/hooks/useNotifications";
import { usePushSubscription } from "@/hooks/usePushSubscription";
import { cn } from "@/lib/utils";

function formatRelative(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const TYPE_META: Record<AppNotification["type"], { icon: React.ElementType; color: string; bg: string }> = {
  budget_alert:    { icon: PiggyBank,    color: "text-amber-400",  bg: "bg-amber-400/10"  },
  low_balance:     { icon: Wallet,       color: "text-red-400",    bg: "bg-red-400/10"    },
  daily_summary:   { icon: TrendingUp,   color: "text-brand",      bg: "bg-brand/10"      },
  transaction:     { icon: TrendingDown, color: "text-green-400",  bg: "bg-green-400/10"  },
};

interface NotificationSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationSheet({ isOpen, onClose }: NotificationSheetProps) {
  const { data: notifications = [], isLoading } = useNotifications();
  const markAllRead = useMarkAllRead();
  const markRead = useMarkRead();
  const { permission, subscribe } = usePushSubscription();

  const unread = notifications.filter((n) => !n.is_read).length;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Notifications" fullHeight>
      <div className="flex flex-col h-full">
        {/* Actions bar */}
        <div className="flex items-center justify-between px-5 pb-3 shrink-0">
          <p className="text-pale text-xs">{unread > 0 ? `${unread} unread` : "All caught up"}</p>
          <div className="flex items-center gap-3">
            {permission !== "granted" && (
              <button
                onClick={subscribe}
                className="text-brand text-xs font-medium"
              >
                Enable push
              </button>
            )}
            {unread > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                className="flex items-center gap-1 text-pale text-xs hover:text-white transition-colors"
              >
                <CheckCheck size={13} />
                Mark all read
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 pb-6">
          {isLoading ? (
            <NotificationSkeleton />
          ) : notifications.length === 0 ? (
            <EmptyNotifications />
          ) : (
            <AnimatePresence initial={false}>
              {notifications.map((n, i) => {
                const meta = TYPE_META[n.type] ?? TYPE_META.transaction;
                const Icon = meta.icon;
                return (
                  <motion.div
                    key={n.notification_id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => !n.is_read && markRead.mutate(n.notification_id)}
                    className={cn(
                      "flex gap-3 p-3 rounded-2xl mb-2 cursor-pointer transition-colors",
                      n.is_read ? "bg-surface/50" : "bg-surface border border-border"
                    )}
                  >
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", meta.bg)}>
                      <Icon size={18} className={meta.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn("text-sm font-medium leading-snug", n.is_read ? "text-pale" : "text-white")}>
                          {n.title}
                        </p>
                        {!n.is_read && (
                          <div className="w-2 h-2 rounded-full bg-brand shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-pale text-xs mt-0.5 leading-snug">{n.body}</p>
                      <p className="text-muted text-[10px] mt-1">{formatRelative(n.created_at)}</p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>
    </BottomSheet>
  );
}

function NotificationSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-3 p-3 rounded-2xl bg-surface">
          <div className="w-10 h-10 rounded-xl bg-border animate-pulse shrink-0" />
          <div className="flex-1 flex flex-col gap-2 pt-1">
            <div className="h-3 w-40 rounded bg-border animate-pulse" />
            <div className="h-3 w-56 rounded bg-border animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyNotifications() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center mb-4">
        <Bell size={24} className="text-muted" />
      </div>
      <p className="text-white font-semibold text-sm mb-1">No notifications yet</p>
      <p className="text-pale text-xs">Budget alerts and activity will appear here.</p>
    </div>
  );
}
