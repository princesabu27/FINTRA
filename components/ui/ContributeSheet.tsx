"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Loader2, Wallet } from "lucide-react";
import { BottomSheet } from "./BottomSheet";
import { createClient } from "@/lib/supabase/client";
import { useAccounts } from "@/hooks/useAccounts";
import { type Goal } from "@/hooks/useGoals";
import { formatCurrency } from "@/lib/utils";

interface ContributeSheetProps {
  goal: Goal | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ContributeSheet({ goal, isOpen, onClose }: ContributeSheetProps) {
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: accounts = [] } = useAccounts();
  const queryClient = useQueryClient();

  const reset = useCallback(() => {
    setAmount("");
    setAccountId("");
    setNote("");
  }, []);

  const handleClose = useCallback(() => { reset(); onClose(); }, [reset, onClose]);

  const handleSubmit = useCallback(async () => {
    if (!goal) return;
    const num = parseFloat(amount);
    if (!num || num <= 0) { toast.error("Enter a valid amount"); return; }
    if (!accountId) { toast.error("Select an account"); return; }

    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Not authenticated"); setLoading(false); return; }

    const account = accounts.find((a) => a.account_id === accountId);

    const { error } = await supabase.from("goal_contributions").insert({
      user_id: user.id,
      goal_id: goal.goal_id,
      account_id: accountId,
      amount: num,
      currency_code: account?.currency_code ?? goal.currency_code,
      contributed_at: new Date().toISOString().split("T")[0],
      note: note.trim() || null,
    });

    setLoading(false);
    if (error) { toast.error(error.message); return; }

    toast.success("Contribution added!");
    await queryClient.invalidateQueries({ queryKey: ["goals"] });
    reset();
    onClose();
  }, [goal, amount, accountId, note, accounts, queryClient, reset, onClose]);

  if (!goal) return null;

  const remaining = goal.remaining_amount;
  const pct = goal.target_amount > 0
    ? Math.min((goal.achieved_amount / goal.target_amount) * 100, 100)
    : 0;

  return (
    <BottomSheet isOpen={isOpen} onClose={handleClose} title={`Contribute to "${goal.goal_name}"`} fullHeight={false}>
      <div className="flex flex-col gap-5 px-5 pt-2 pb-10">

        {/* Goal progress summary */}
        <div className="bg-surface border border-border rounded-2xl px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-pale text-xs">Progress</span>
            <span className="text-white text-xs font-bold">{Math.round(pct)}%</span>
          </div>
          <div className="h-2 bg-black/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-brand"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-pale text-[10px]">
              Saved: <span className="text-white font-medium">{formatCurrency(goal.achieved_amount)}</span>
            </span>
            <span className="text-pale text-[10px]">
              Remaining: <span className="text-income font-medium">{formatCurrency(Math.max(0, remaining))}</span>
            </span>
          </div>
        </div>

        {/* Amount */}
        <div>
          <label className="text-pale text-xs mb-2 block uppercase tracking-wide">Amount</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-sm font-semibold">₹</span>
            <input
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full bg-surface border border-border rounded-2xl pl-8 pr-4 py-3.5 text-white placeholder-muted text-sm focus:outline-none focus:border-brand transition-colors"
            />
          </div>
          {remaining > 0 && (
            <button
              onClick={() => setAmount(remaining.toFixed(2))}
              className="mt-2 text-brand text-xs font-medium"
            >
              Fill remaining ({formatCurrency(remaining)})
            </button>
          )}
        </div>

        {/* Account */}
        <div>
          <label className="text-pale text-xs mb-2 block uppercase tracking-wide">From Account</label>
          <div className="flex flex-col gap-2">
            {accounts.map((acc) => (
              <motion.button
                key={acc.account_id}
                whileTap={{ scale: 0.98 }}
                onClick={() => setAccountId(acc.account_id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-colors ${
                  accountId === acc.account_id
                    ? "border-brand bg-brand/10"
                    : "border-border bg-surface"
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-brand/20 flex items-center justify-center flex-shrink-0">
                  <Wallet size={14} className="text-brand" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-white text-sm font-medium">{acc.account_name}</p>
                  <p className="text-pale text-xs">{formatCurrency(acc.balance_amount)}</p>
                </div>
                {accountId === acc.account_id && (
                  <motion.div
                    layoutId="acc-check"
                    className="w-5 h-5 rounded-full bg-brand flex items-center justify-center"
                  >
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </motion.div>
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="text-pale text-xs mb-2 block uppercase tracking-wide">
            Note <span className="normal-case">(optional)</span>
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Monthly saving"
            className="w-full bg-surface border border-border rounded-2xl px-4 py-3.5 text-white placeholder-muted text-sm focus:outline-none focus:border-brand transition-colors"
          />
        </div>

        {/* Submit */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-brand py-4 rounded-2xl font-semibold text-white flex items-center justify-center gap-2 shadow-lg shadow-brand/30 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : "Add Contribution"}
        </motion.button>
      </div>
    </BottomSheet>
  );
}
