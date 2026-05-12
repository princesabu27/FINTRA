"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export interface AccountType {
  account_type: string;
  description: string | null;
}

export function useAccountTypes() {
  return useQuery<AccountType[]>({
    queryKey: ["account-types"],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("account_types")
        .select("account_type, description")
        .order("account_type");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: Infinity,
  });
}
