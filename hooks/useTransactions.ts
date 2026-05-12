"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export type TxType = "expense" | "income";

export interface Transaction {
  id: string;
  name: string;
  amount: number;
  type: TxType;
  category_name: string;
  currency_code: string;
  transaction_date: string;
  account_id: string | null;
  description: string | null;
}

export function useRecentTransactions(limit = 20) {
  return useQuery<Transaction[]>({
    queryKey: ["transactions", "recent", limit],
    queryFn: async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const [{ data: expenses }, { data: incomes }] = await Promise.all([
        supabase
          .from("expense_records")
          .select(
            "expense_record_id, expense_name, expense_amount, currency_code, transaction_date, account_id, description, expense_categories(expense_category_name)"
          )
          .eq("user_id", user.id)
          .order("transaction_date", { ascending: false })
          .limit(limit),
        supabase
          .from("income_records")
          .select(
            "income_record_id, income_name, income_amount, currency_code, transaction_date, account_id, income_description, income_categories(income_catagory_name)"
          )
          .eq("user_id", user.id)
          .order("transaction_date", { ascending: false })
          .limit(limit),
      ]);

      const txExpenses: Transaction[] = (expenses ?? []).map((e) => ({
        id: e.expense_record_id,
        name: e.expense_name,
        amount: Number(e.expense_amount),
        type: "expense",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        category_name: (e.expense_categories as any)?.expense_category_name ?? "Other",
        currency_code: e.currency_code,
        transaction_date: e.transaction_date,
        account_id: e.account_id,
        description: (e as any).description ?? null,
      }));

      const txIncomes: Transaction[] = (incomes ?? []).map((i) => ({
        id: i.income_record_id,
        name: i.income_name,
        amount: Number(i.income_amount),
        type: "income",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        category_name: (i.income_categories as any)?.income_catagory_name ?? "Other",
        currency_code: i.currency_code,
        transaction_date: i.transaction_date,
        account_id: i.account_id,
        description: (i as any).income_description ?? null,
      }));

      return [...txExpenses, ...txIncomes]
        .sort(
          (a, b) =>
            new Date(b.transaction_date).getTime() -
            new Date(a.transaction_date).getTime()
        )
        .slice(0, limit);
    },
    staleTime: 30000,
  });
}

export interface CategoryPoint {
  name: string;
  value: number;
}

export interface NetWorthPoint {
  label: string;
  balance: number;
}

export function useCategoryBreakdown(period: Period = "month") {
  return useQuery<CategoryPoint[]>({
    queryKey: ["category-breakdown", period],
    queryFn: async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const now = new Date();
      let startStr: string;
      if (period === "week") {
        const d = new Date(now); d.setDate(now.getDate() - 6);
        startStr = d.toISOString().split("T")[0];
      } else if (period === "month") {
        startStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
      } else {
        startStr = `${now.getFullYear()}-01-01`;
      }

      const { data } = await supabase
        .from("expense_records")
        .select("expense_amount, expense_categories(expense_category_name)")
        .eq("user_id", user.id)
        .gte("transaction_date", startStr);

      const map: Record<string, number> = {};
      for (const e of data ?? []) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cat = (e.expense_categories as any)?.expense_category_name ?? "Other";
        map[cat] = (map[cat] ?? 0) + Number(e.expense_amount);
      }
      return Object.entries(map)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
    },
    staleTime: 60000,
  });
}

export function useNetWorthTrend() {
  return useQuery<NetWorthPoint[]>({
    queryKey: ["net-worth-trend"],
    queryFn: async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      const now = new Date();
      const points: NetWorthPoint[] = [];

      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const startStr = d.toISOString().split("T")[0];
        const endD = new Date(d.getFullYear(), d.getMonth() + 1, 1);
        const endStr = endD.toISOString().split("T")[0];

        const [{ data: inc }, { data: exp }] = await Promise.all([
          supabase.from("income_records").select("income_amount")
            .eq("user_id", user.id).gte("transaction_date", startStr).lt("transaction_date", endStr),
          supabase.from("expense_records").select("expense_amount")
            .eq("user_id", user.id).gte("transaction_date", startStr).lt("transaction_date", endStr),
        ]);

        const income = (inc ?? []).reduce((s, r) => s + Number(r.income_amount), 0);
        const expense = (exp ?? []).reduce((s, r) => s + Number(r.expense_amount), 0);
        const prev = points[points.length - 1]?.balance ?? 0;
        points.push({ label: months[d.getMonth()], balance: prev + income - expense });
      }
      return points;
    },
    staleTime: 300000,
  });
}

export type Period = "week" | "month" | "year";

export interface ChartPoint {
  label: string;
  income: number;
  expense: number;
}

export function useStatisticsData(period: Period) {
  return useQuery<ChartPoint[]>({
    queryKey: ["statistics", period],
    queryFn: async () => {
      const supabase = createClient();
      const now = new Date();

      let startDate: Date;
      let groupFn: (date: string) => string;
      let labels: string[];

      if (period === "week") {
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 6);
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        groupFn = (d) => days[new Date(d).getDay()];
        labels = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(now);
          d.setDate(now.getDate() - (6 - i));
          return days[d.getDay()];
        });
      } else if (period === "month") {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        groupFn = (d) => String(new Date(d).getDate());
        labels = Array.from({ length: daysInMonth }, (_, i) => String(i + 1));
      } else {
        startDate = new Date(now.getFullYear(), 0, 1);
        const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        groupFn = (d) => months[new Date(d).getMonth()];
        labels = months;
      }

      const startStr = startDate.toISOString().split("T")[0];

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return labels.map((label) => ({ label, income: 0, expense: 0 }));

      const [{ data: expenses }, { data: incomes }] = await Promise.all([
        supabase
          .from("expense_records")
          .select("expense_amount, transaction_date")
          .eq("user_id", user.id)
          .gte("transaction_date", startStr),
        supabase
          .from("income_records")
          .select("income_amount, transaction_date")
          .eq("user_id", user.id)
          .gte("transaction_date", startStr),
      ]);

      const expMap: Record<string, number> = {};
      for (const e of expenses ?? []) {
        const key = groupFn(e.transaction_date);
        expMap[key] = (expMap[key] ?? 0) + Number(e.expense_amount);
      }
      const incMap: Record<string, number> = {};
      for (const i of incomes ?? []) {
        const key = groupFn(i.transaction_date);
        incMap[key] = (incMap[key] ?? 0) + Number(i.income_amount);
      }

      return labels.map((label) => ({
        label,
        income: incMap[label] ?? 0,
        expense: expMap[label] ?? 0,
      }));
    },
    staleTime: 60000,
  });
}
