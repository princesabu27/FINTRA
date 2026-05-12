"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export interface Budget {
  budget_id: string;
  budget_name: string;
  budget_percentage: number;
  description: string | null;
  monthly: {
    amount: number;
    used_amount: number;
    remaining_amount: number;
  } | null;
}

export type BudgetHealth = "good" | "warning" | "over";

export function getBudgetHealth(used: number, allocated: number): BudgetHealth {
  if (allocated === 0) return "good";
  const ratio = used / allocated;
  if (ratio >= 1) return "over";
  if (ratio >= 0.8) return "warning";
  return "good";
}

export function useBudgets() {
  return useQuery<Budget[]>({
    queryKey: ["budgets"],
    queryFn: async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const now = new Date();
      const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

      const [{ data: budgets }, { data: monthly }] = await Promise.all([
        supabase
          .from("budgets")
          .select("budget_id, budget_name, budget_percentage, description")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .order("budget_name"),
        supabase
          .from("monthly_budgets")
          .select("budget_id, amount, used_amount, remaining_amount")
          .eq("user_id", user.id)
          .eq("start_date", startDate)
          .eq("is_active", true),
      ]);

      const monthlyMap = new Map(
        (monthly ?? []).map((m) => [m.budget_id, m])
      );

      return (budgets ?? []).map((b) => {
        const m = monthlyMap.get(b.budget_id);
        return {
          budget_id: b.budget_id,
          budget_name: b.budget_name,
          budget_percentage: Number(b.budget_percentage),
          description: b.description,
          monthly: m
            ? {
                amount: Number(m.amount),
                used_amount: Number(m.used_amount),
                remaining_amount: Number(m.remaining_amount),
              }
            : null,
        };
      });
    },
  });
}

export function useMonthlyIncome() {
  return useQuery<number>({
    queryKey: ["monthly-income"],
    queryFn: async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const now = new Date();
      const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
        .toISOString().split("T")[0];

      const { data } = await supabase
        .from("income_records")
        .select("income_amount")
        .eq("user_id", user.id)
        .gte("transaction_date", startDate)
        .lt("transaction_date", nextMonth);

      return (data ?? []).reduce((s, r) => s + Number(r.income_amount), 0);
    },
  });
}
