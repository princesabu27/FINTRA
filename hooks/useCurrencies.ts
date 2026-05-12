"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export interface Currency {
  currency_code: string;
  currency_name: string;
  currency_symbol: string;
  country_code: string;
}

export function useCurrencies() {
  return useQuery<Currency[]>({
    queryKey: ["currencies"],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("currencies")
        .select("currency_code, currency_name, currency_symbol, country_code")
        .order("currency_code");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: Infinity,
  });
}
