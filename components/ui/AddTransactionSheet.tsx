"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Loader2, ChevronDown } from "lucide-react";
import { BottomSheet } from "./BottomSheet";
import { CategoryPicker } from "./CategoryPicker";
import { useTransactionSheet } from "@/store/transactionSheet";
import { useExpenseCategories, useIncomeCategories } from "@/hooks/useCategories";
import { useAccounts } from "@/hooks/useAccounts";
import { createClient } from "@/lib/supabase/client";

type Tab = "expense" | "income";

export function AddTransactionSheet() {
  const { isOpen, defaultTab, close } = useTransactionSheet();
  const [tab, setTab] = useState<Tab>(defaultTab);
  const [amount, setAmount] = useState("");
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: expCats, isLoading: loadingExpCats } = useExpenseCategories();
  const { data: incCats, isLoading: loadingIncCats } = useIncomeCategories();
  const { data: accounts } = useAccounts();
  const queryClient = useQueryClient();

  // Derive the category list based on active tab
  const categories =
    tab === "expense"
      ? (expCats ?? []).map((c) => ({ id: c.expense_category_id, name: c.expense_category_name }))
      : (incCats ?? []).map((c) => ({ id: c.income_category_id, name: c.income_catagory_name }));
  const loadingCats = tab === "expense" ? loadingExpCats : loadingIncCats;

  const reset = useCallback(() => {
    setAmount("");
    setName("");
    setCategoryId(null);
    setAccountId(null);
    setDate(new Date().toISOString().split("T")[0]);
    setDescription("");
  }, []);

  const handleTabChange = useCallback(
    (t: Tab) => {
      setTab(t);
      setCategoryId(null);
    },
    []
  );

  const handleClose = useCallback(() => {
    reset();
    close();
  }, [reset, close]);

  const handleAmountKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow only digits and one decimal point
    if (!/[\d.]/.test(e.key) && !["Backspace", "Delete", "Tab", "Enter"].includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleSubmit = useCallback(async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (!name.trim()) {
      toast.error("Enter a name");
      return;
    }
    if (!categoryId) {
      toast.error("Select a category");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast.error("Not authenticated");
      setLoading(false);
      return;
    }

    // Fetch user's default currency
    const { data: profile } = await supabase
      .from("profiles")
      .select("default_currency")
      .eq("user_id", user.id)
      .single();
    const currency = profile?.default_currency ?? "INR";

    let error;
    if (tab === "expense") {
      ({ error } = await supabase.from("expense_records").insert({
        user_id: user.id,
        expense_name: name.trim(),
        expense_amount: numAmount,
        expense_category: categoryId,
        currency_code: currency,
        transaction_date: date,
        account_id: accountId || null,
        description: description.trim() || null,
      }));
    } else {
      ({ error } = await supabase.from("income_records").insert({
        user_id: user.id,
        income_name: name.trim(),
        income_amount: numAmount,
        income_category: categoryId,
        currency_code: currency,
        transaction_date: date,
        account_id: accountId || null,
        income_description: description.trim() || null,
      }));
    }

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(`${tab === "expense" ? "Expense" : "Income"} added!`);
    await queryClient.invalidateQueries({ queryKey: ["transactions"] });
    await queryClient.invalidateQueries({ queryKey: ["accounts"] });
    reset();
    close();
  }, [amount, name, categoryId, accountId, date, description, tab, queryClient, reset, close]);

  return (
    <BottomSheet isOpen={isOpen} onClose={handleClose}>
      <div className="flex flex-col h-full">
        {/* Type tab */}
        <div className="flex mx-5 mt-2 mb-5 bg-surface rounded-2xl p-1">
          {(["expense", "income"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => handleTabChange(t)}
              className="relative flex-1 py-2.5 text-sm font-semibold rounded-xl z-10"
            >
              <AnimatePresence>
                {tab === t && (
                  <motion.div
                    layoutId="tx-tab"
                    className={`absolute inset-0 rounded-xl -z-10 ${
                      t === "expense" ? "bg-expense/20 border border-expense/30" : "bg-income/20 border border-income/30"
                    }`}
                    transition={{ type: "spring", stiffness: 300, damping: 26 }}
                  />
                )}
              </AnimatePresence>
              <span className={tab === t ? (t === "expense" ? "text-expense" : "text-income") : "text-muted"}>
                {t === "expense" ? "Expense" : "Income"}
              </span>
            </button>
          ))}
        </div>

        {/* Amount */}
        <div className="flex flex-col items-center mb-6 px-5">
          <p className="text-pale text-xs mb-2 uppercase tracking-wide">Amount</p>
          <div className="flex items-center gap-2">
            <span className={`text-3xl font-bold ${tab === "expense" ? "text-expense" : "text-income"}`}>
              ₹
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onKeyDown={handleAmountKey}
              placeholder="0"
              className="bg-transparent text-5xl font-bold text-white text-center w-48 focus:outline-none placeholder-surface"
              style={{ caretColor: tab === "expense" ? "#EF4444" : "#22C55E" }}
            />
          </div>
          <div className={`h-0.5 w-32 mt-2 rounded-full ${tab === "expense" ? "bg-expense/40" : "bg-income/40"}`} />
        </div>

        {/* Name */}
        <div className="px-5 mb-5">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={tab === "expense" ? "What did you spend on?" : "Source of income"}
            className="w-full bg-surface border border-border rounded-2xl px-4 py-3.5 text-white placeholder-muted text-sm focus:outline-none focus:border-brand transition-colors"
          />
        </div>

        {/* Category */}
        <div className="mb-5">
          <p className="text-pale text-xs px-5 mb-3 uppercase tracking-wide">Category</p>
          <CategoryPicker
            categories={categories}
            selected={categoryId}
            onSelect={setCategoryId}
            loading={loadingCats}
          />
        </div>

        {/* Account + Date row */}
        <div className="flex gap-3 px-5 mb-4">
          {/* Account selector */}
          <div className="flex-1 relative">
            <select
              value={accountId ?? ""}
              onChange={(e) => setAccountId(e.target.value || null)}
              className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand appearance-none cursor-pointer"
            >
              <option value="">No account</option>
              {(accounts ?? []).map((a) => (
                <option key={a.account_id} value={a.account_id} className="bg-card">
                  {a.account_name}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          </div>

          {/* Date */}
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="flex-1 bg-surface border border-border rounded-2xl px-3 py-3 text-sm text-white focus:outline-none focus:border-brand [color-scheme:dark]"
          />
        </div>

        {/* Description */}
        <div className="px-5 mb-5">
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Note (optional)"
            className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-white placeholder-muted text-sm focus:outline-none focus:border-brand transition-colors"
          />
        </div>

        {/* Submit */}
        <div className="px-5 pb-8">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSubmit}
            disabled={loading}
            className={`w-full py-4 rounded-2xl font-semibold text-white flex items-center justify-center gap-2 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed ${
              tab === "expense"
                ? "bg-expense shadow-expense/30"
                : "bg-income shadow-income/30"
            }`}
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              `Add ${tab === "expense" ? "Expense" : "Income"}`
            )}
          </motion.button>
        </div>
      </div>
    </BottomSheet>
  );
}
