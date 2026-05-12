"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, CheckCircle2, ArrowLeft } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useIncomeCategories } from "@/hooks/useCategories";
import { useAccounts } from "@/hooks/useAccounts";
import { SlideToConfirm } from "@/components/ui/SlideToConfirm";
import { CategoryPicker } from "@/components/ui/CategoryPicker";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";

export default function AddIncomePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [amount, setAmount] = useState("");
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [accountId, setAccountId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { data: rawCats = [], isLoading: loadingCats } = useIncomeCategories();
  const { data: accounts = [] } = useAccounts();

  const categories = rawCats.map((c) => ({ id: c.income_category_id, name: c.income_catagory_name }));
  const num = parseFloat(amount) || 0;
  const isValid = name.trim() && num > 0 && categoryId;

  const handleSubmit = useCallback(async () => {
    if (!isValid || loading) return;
    setLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Not authenticated"); setLoading(false); return; }

    const { data: profile } = await supabase
      .from("profiles").select("default_currency").eq("user_id", user.id).single();
    const currency = profile?.default_currency ?? "INR";

    const { error } = await supabase.from("income_records").insert({
      user_id: user.id,
      income_name: name.trim(),
      income_amount: num,
      income_category: categoryId,
      currency_code: currency,
      transaction_date: date,
      account_id: accountId || null,
      income_description: description.trim() || null,
    });

    setLoading(false);
    if (error) { toast.error(error.message); return; }

    setSuccess(true);
    await queryClient.invalidateQueries({ queryKey: ["transactions"] });
    await queryClient.invalidateQueries({ queryKey: ["accounts"] });
    await queryClient.invalidateQueries({ queryKey: ["category-breakdown"] });

    setTimeout(() => router.back(), 1800);
  }, [isValid, loading, name, num, categoryId, accountId, date, description, queryClient, router]);

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="h-full flex flex-col items-center justify-center gap-4 px-8"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
          className="w-20 h-20 rounded-full bg-income/15 border border-income/30 flex items-center justify-center"
        >
          <CheckCircle2 size={40} className="text-income" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <p className="text-white font-bold text-xl">Income Added</p>
          <p className="text-pale text-sm mt-1">{formatCurrency(num)} recorded</p>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 sm:px-8 pt-5 pb-3 shrink-0 flex items-center gap-3">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => router.back()}
          className="w-9 h-9 rounded-2xl bg-surface border border-border flex items-center justify-center"
        >
          <ArrowLeft size={18} className="text-pale" />
        </motion.button>
        <div>
          <h1 className="text-white text-xl font-bold flex items-center gap-2">
            <TrendingUp size={20} className="text-income" /> Income
          </h1>
          <p className="text-pale text-xs mt-0.5">Record a new income</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-8 pb-8 flex flex-col gap-4">

        {/* Amount hero */}
        <div className="bg-surface border border-income/20 rounded-3xl px-5 py-5 flex flex-col items-center"
          style={{ background: "rgba(0,229,160,0.05)" }}>
          <p className="text-pale text-xs uppercase tracking-wide mb-3">Amount</p>
          <div className="flex items-center gap-1">
            <span className="text-income/60 text-3xl font-bold">₹</span>
            <input
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="bg-transparent text-white text-4xl font-bold w-48 text-center focus:outline-none placeholder-muted/40"
            />
          </div>
          <AnimatePresence>
            {num > 0 && (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="text-income/70 text-xs mt-2 font-medium"
              >
                {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(num)}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Name */}
        <div>
          <label className="text-pale text-xs mb-2 block uppercase tracking-wide">Source of income</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Salary, Freelance, Dividends…"
            className="w-full bg-surface border border-border rounded-2xl px-4 py-3.5 text-white placeholder-muted text-sm focus:outline-none focus:border-income transition-colors"
          />
        </div>

        {/* Category */}
        <div>
          <label className="text-pale text-xs mb-3 block uppercase tracking-wide">Category</label>
          <CategoryPicker
            categories={categories}
            selected={categoryId}
            onSelect={setCategoryId}
            loading={loadingCats}
          />
        </div>

        {/* Account */}
        <div>
          <label className="text-pale text-xs mb-2 block uppercase tracking-wide">Account <span className="normal-case">(optional)</span></label>
          <div className="flex flex-col gap-1.5">
            {accounts.map((acc) => (
              <motion.button
                key={acc.account_id}
                whileTap={{ scale: 0.98 }}
                onClick={() => setAccountId(accountId === acc.account_id ? "" : acc.account_id)}
                className={`flex items-center justify-between px-4 py-3 rounded-2xl border transition-colors text-left ${
                  accountId === acc.account_id
                    ? "border-income bg-income/10"
                    : "border-border bg-surface"
                }`}
              >
                <p className="text-white text-sm font-medium">{acc.account_name}</p>
                <p className="text-pale text-xs">{formatCurrency(acc.balance_amount, acc.currency_code)}</p>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="text-pale text-xs mb-2 block uppercase tracking-wide">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-surface border border-border rounded-2xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-income transition-colors scheme-dark"
          />
        </div>

        {/* Note */}
        <div>
          <label className="text-pale text-xs mb-2 block uppercase tracking-wide">Note <span className="normal-case">(optional)</span></label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Any additional details?"
            className="w-full bg-surface border border-border rounded-2xl px-4 py-3.5 text-white placeholder-muted text-sm focus:outline-none focus:border-income transition-colors"
          />
        </div>

        {/* Summary chip */}
        <AnimatePresence>
          {name.trim() && num > 0 && categoryId && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="bg-income/10 border border-income/20 rounded-2xl px-4 py-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <TrendingUp size={14} className="text-income" />
                <span className="text-white text-xs font-medium truncate max-w-40">{name}</span>
              </div>
              <span className="text-income font-bold text-sm">+{formatCurrency(num)}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Slide to confirm */}
        <SlideToConfirm
          label={loading ? "Recording…" : "Slide to add income"}
          onConfirm={handleSubmit}
          disabled={!isValid || loading}
          color="income"
        />
      </div>
    </div>
  );
}
