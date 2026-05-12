"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export interface Country {
  country_code: string;
  country_name: string;
}

export function useCountries() {
  return useQuery<Country[]>({
    queryKey: ["countries"],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("countries")
        .select("country_code, country_name")
        .order("country_name");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: Infinity,
  });
}
