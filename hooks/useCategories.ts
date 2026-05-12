"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export interface ExpenseCategory {
  expense_category_id: string;
  expense_category_name: string;
  expense_category_icon: string | null;
  expense_classification: string | null;
  budget_id: string | null;
}

export interface IncomeCategory {
  income_category_id: string;
  income_catagory_name: string;
  income_classification: string;
  is_budgetable: boolean;
}

export interface ExpenseClassification {
  expense_classification_name: string;
}

export interface IncomeClassification {
  income_classification_name: string;
}

export function useExpenseCategories() {
  return useQuery<ExpenseCategory[]>({
    queryKey: ["expense-categories"],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("expense_categories")
        .select("expense_category_id, expense_category_name, expense_category_icon, expense_classification, budget_id")
        .eq("is_active", true)
        .order("expense_category_name");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useIncomeCategories() {
  return useQuery<IncomeCategory[]>({
    queryKey: ["income-categories"],
    queryFn: async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from("income_categories")
        .select("income_category_id, income_catagory_name, income_classification, is_budgetable")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("income_catagory_name");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useExpenseClassifications() {
  return useQuery<ExpenseClassification[]>({
    queryKey: ["expense-classifications"],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("expense_classification")
        .select("expense_classification_name")
        .order("expense_classification_name");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: Infinity,
  });
}

export function useIncomeClassifications() {
  return useQuery<IncomeClassification[]>({
    queryKey: ["income-classifications"],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("income_classification")
        .select("income_classification_name")
        .order("income_classification_name");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: Infinity,
  });
}

export function useAddExpenseClassification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("expense_classification")
        .insert({ expense_classification_name: name.trim() });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["expense-classifications"] }),
  });
}

export function useAddIncomeClassification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("income_classification")
        .insert({ income_classification_name: name.trim() });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["income-classifications"] }),
  });
}

export function useAddExpenseCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      name: string;
      classification: string;
      budget_id: string | null;
    }) => {
      const supabase = createClient();
      const { error } = await supabase.from("expense_categories").insert({
        expense_category_name: payload.name.trim(),
        expense_classification: payload.classification || null,
        budget_id: payload.budget_id || null,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["expense-categories"] }),
  });
}

export function useAddIncomeCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      name: string;
      classification: string;
      is_budgetable: boolean;
    }) => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("income_categories").insert({
        user_id: user.id,
        income_catagory_name: payload.name.trim(),
        income_classification: payload.classification,
        is_budgetable: payload.is_budgetable,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["income-categories"] }),
  });
}

export function useDeactivateExpenseCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("expense_categories")
        .update({ is_active: false })
        .eq("expense_category_id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["expense-categories"] }),
  });
}

export function useDeactivateIncomeCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("income_categories")
        .update({ is_active: false })
        .eq("income_category_id", id)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["income-categories"] }),
  });
}
