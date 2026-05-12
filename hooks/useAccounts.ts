"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export interface Account {
  account_id: string;
  account_name: string;
  balance_amount: number;
  account_type: string;
  currency_code: string;
  is_active: boolean;
}

export function useAccounts() {
  return useQuery<Account[]>({
    queryKey: ["accounts"],
    queryFn: async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from("accounts")
        .select("account_id, account_name, balance_amount, account_type, currency_code, is_active")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30000,
  });
}

export function useTotalBalance(accounts: Account[]) {
  return accounts.reduce((sum, a) => sum + Number(a.balance_amount), 0);
}
