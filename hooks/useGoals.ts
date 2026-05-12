"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export interface Goal {
  goal_id: string;
  goal_name: string;
  target_amount: number;
  achieved_amount: number;
  remaining_amount: number;
  currency_code: string;
  is_achieved: boolean;
  created_at: string;
}

export function useGoals() {
  return useQuery<Goal[]>({
    queryKey: ["goals"],
    queryFn: async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("goals")
        .select("goal_id, goal_name, target_amount, achieved_amount, remaining_amount, currency_code, is_achieved, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });


      if (error) throw error;
      // drop created_at — not used in UI
      return (data ?? []).map((g) => ({
        ...g,
        target_amount: Number(g.target_amount),
        achieved_amount: Number(g.achieved_amount),
        remaining_amount: Number(g.remaining_amount),
      }));
    },
    staleTime: 30000,
  });
}
