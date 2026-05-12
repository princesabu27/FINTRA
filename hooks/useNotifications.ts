"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

export interface AppNotification {
  notification_id: string;
  type: "budget_alert" | "low_balance" | "daily_summary" | "transaction";
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

export function useNotifications() {
  return useQuery<AppNotification[]>({
    queryKey: ["notifications"],
    queryFn: async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from("notifications")
        .select("notification_id, type, title, body, is_read, created_at, metadata")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 60000,
    refetchOnWindowFocus: false,
    staleTime: 30000,
  });
}

export function useUnreadCount() {
  const { data } = useNotifications();
  return useMemo(() => (data ?? []).filter((n) => !n.is_read).length, [data]);
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useMarkRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (notificationId: string) => {
      const supabase = createClient();
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("notification_id", notificationId);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
}
