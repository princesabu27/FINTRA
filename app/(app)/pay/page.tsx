"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeftRight, ChevronDown, Loader2, CheckCircle2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useAccounts } from "@/hooks/useAccounts";
import { useExpenseCategories } from "@/hooks/useCategories";
import { SlideToConfirm } from "@/components/ui/SlideToConfirm";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function PayPage() {
  const [amount, setAmount] = useState("");
  const [name, setName] = useState("");
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useExpenseCategories();
  const queryClient = useQueryClient();

  const fromAccount = accounts.find((a) => a.account_id === fromId);
  const toAccount = accounts.find((a) => a.account_id === toId);
  const num = parseFloat(amount) || 0;

  const isValid = name.trim() && num > 0 && fromId && toId && fromId !== toId && categoryId;

  const handleTransfer = useCallback(async () => {
    if (!isValid || loading) return;

    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Not authenticated"); setLoading(false); return; }

    const account = accounts.find((a) => a.account_id === fromId);

    const { error } = await supabase.from("transfer_records").insert({
      user_id: user.id,
      from_account_id: fromId,
      to_account_id: toId,
      expense_category: categoryId,
      transfer_name: name.trim(),
      transfer_amount: num,
      currency_code: account?.currency_code ?? "INR",
      transfer_date: date,
      description: description.trim() || null,
    });

    setLoading(false);
    if (error) { toast.error(error.message); return; }

    setSuccess(true);
    await queryClient.invalidateQueries({ queryKey: ["accounts"] });
    await queryClient.invalidateQueries({ queryKey: ["transactions"] });

    setTimeout(() => {
      setSuccess(false);
      setAmount("");
      setName("");
      setFromId("");
      setToId("");
      setCategoryId("");
      setDescription("");
      setDate(new Date().toISOString().split("T")[0]);
    }, 2000);
  }, [isValid, loading, fromId, toId, categoryId, name, num, description, accounts, queryClient]);

  const swapAccounts = useCallback(() => {
    setFromId((prev) => { setToId(prev); return toId; });
  }, [toId]);

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
          <p className="text-white font-bold text-xl">Transfer Complete</p>
          <p className="text-pale text-sm mt-1">{formatCurrency(num)} moved successfully</p>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 flex-shrink-0">
        <h1 className="text-white text-xl font-bold">Transfer</h1>
        <p className="text-pale text-xs mt-0.5">Move money between your accounts</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 flex flex-col gap-4">

        {/* Amount hero */}
        <div className="bg-surface border border-border rounded-3xl px-5 py-5 flex flex-col items-center">
          <p className="text-pale text-xs uppercase tracking-wide mb-3">Amount</p>
          <div className="flex items-center gap-1">
            <span className="text-muted text-3xl font-bold">₹</span>
            <input
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="bg-transparent text-white text-4xl font-bold w-48 text-center focus:outline-none placeholder-muted/40"
            />
          </div>
          {fromAccount && num > 0 && num > fromAccount.balance_amount && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-expense text-xs mt-2"
            >
              Insufficient balance ({formatCurrency(fromAccount.balance_amount)} available)
            </motion.p>
          )}
        </div>

        {/* From / To accounts */}
        <div className="relative flex flex-col gap-2">
          <AccountSelect
            label="From"
            accounts={accounts.filter((a) => a.account_id !== toId)}
            value={fromId}
            onChange={setFromId}
          />

          {/* Swap button */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <motion.button
              whileTap={{ rotate: 180, scale: 0.9 }}
              onClick={swapAccounts}
              className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center shadow"
            >
              <ArrowLeftRight size={15} className="text-brand" />
            </motion.button>
          </div>

          <AccountSelect
            label="To"
            accounts={accounts.filter((a) => a.account_id !== fromId)}
            value={toId}
            onChange={setToId}
          />
        </div>

        {/* Transfer name */}
        <div>
          <label className="text-pale text-xs mb-2 block uppercase tracking-wide">Transfer Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Savings transfer"
            className="w-full bg-surface border border-border rounded-2xl px-4 py-3.5 text-white placeholder-muted text-sm focus:outline-none focus:border-brand transition-colors"
          />
        </div>

        {/* Category */}
        <div>
          <label className="text-pale text-xs mb-2 block uppercase tracking-wide">Category</label>
          <div className="relative">
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-surface border border-border rounded-2xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-brand appearance-none transition-colors"
            >
              <option value="" disabled className="bg-card">Select category</option>
              {categories.map((c) => (
                <option key={c.expense_category_id} value={c.expense_category_id} className="bg-card">{c.expense_category_name}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="text-pale text-xs mb-2 block uppercase tracking-wide">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-surface border border-border rounded-2xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-brand transition-colors scheme-dark"
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-pale text-xs mb-2 block uppercase tracking-wide">
            Note <span className="normal-case">(optional)</span>
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's this transfer for?"
            className="w-full bg-surface border border-border rounded-2xl px-4 py-3.5 text-white placeholder-muted text-sm focus:outline-none focus:border-brand transition-colors"
          />
        </div>

        {/* Summary chip */}
        <AnimatePresence>
          {fromAccount && toAccount && num > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="bg-brand/10 border border-brand/20 rounded-2xl px-4 py-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-2 text-xs text-pale">
                <span className="text-white font-medium truncate max-w-[80px]">{fromAccount.account_name}</span>
                <ArrowLeftRight size={12} className="text-brand flex-shrink-0" />
                <span className="text-white font-medium truncate max-w-[80px]">{toAccount.account_name}</span>
              </div>
              <span className="text-brand font-bold text-sm">{formatCurrency(num)}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Slide to confirm */}
        {loading ? (
          <div className="h-14 rounded-2xl bg-surface border border-border flex items-center justify-center gap-2">
            <Loader2 size={18} className="animate-spin text-brand" />
            <span className="text-pale text-sm">Processing…</span>
          </div>
        ) : (
          <SlideToConfirm
            label="Slide to transfer"
            onConfirm={handleTransfer}
            disabled={!isValid || (fromAccount ? num > fromAccount.balance_amount : false)}
          />
        )}
      </div>
    </div>
  );
}

function AccountSelect({
  label,
  accounts,
  value,
  onChange,
}: {
  label: string;
  accounts: { account_id: string; account_name: string; balance_amount: number; account_type: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  const selected = accounts.find((a) => a.account_id === value);

  return (
    <div className="bg-surface border border-border rounded-2xl px-4 py-3">
      <p className="text-pale text-[10px] uppercase tracking-wide mb-2">{label}</p>
      {accounts.length === 0 ? (
        <p className="text-muted text-sm">No accounts available</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {accounts.map((acc) => (
            <motion.button
              key={acc.account_id}
              whileTap={{ scale: 0.98 }}
              onClick={() => onChange(acc.account_id)}
              className={cn(
                "flex items-center justify-between px-3 py-2.5 rounded-xl border transition-colors text-left",
                value === acc.account_id
                  ? "border-brand bg-brand/10"
                  : "border-transparent bg-black/20"
              )}
            >
              <div>
                <p className="text-white text-sm font-medium">{acc.account_name}</p>
                <p className="text-pale text-[10px]">{acc.account_type}</p>
              </div>
              <div className="text-right">
                <p className="text-white text-xs font-semibold">{formatCurrency(acc.balance_amount)}</p>
                {value === acc.account_id && (
                  <motion.div
                    layoutId={`check-${label}`}
                    className="w-4 h-4 rounded-full bg-brand flex items-center justify-center ml-auto mt-1"
                  >
                    <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                      <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </motion.div>
                )}
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
