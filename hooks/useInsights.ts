"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export type InsightType = "monthly_summary" | "goal_forecast" | "anomaly" | "budget_optimization";

export interface Insight {
  insight_id: string;
  insight_type: InsightType;
  title: string;
  content: string;
  severity: "warning" | "critical" | null;
  is_read: boolean;
  created_at: string;
  period_start: string | null;
  period_end: string | null;
}

export function useInsights() {
  return useQuery<Insight[]>({
    queryKey: ["insights"],
    queryFn: async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("ai_insights")
        .select("insight_id, insight_type, title, content, severity, is_read, created_at, period_start, period_end")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useMarkRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (insightId: string) => {
      const supabase = createClient();
      await supabase
        .from("ai_insights")
        .update({ is_read: true })
        .eq("insight_id", insightId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["insights"] });
    },
  });
}

export function useUnreadCount() {
  const { data: insights = [] } = useInsights();
  return insights.filter((i) => !i.is_read).length;
}
