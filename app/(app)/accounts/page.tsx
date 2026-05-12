"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Wallet } from "lucide-react";
import toast from "react-hot-toast";
import { useAccounts, useTotalBalance } from "@/hooks/useAccounts";
import { SwipeableAccountCard } from "@/components/ui/SwipeableAccountCard";
import { AddAccountSheet } from "@/components/ui/AddAccountSheet";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";

export default function AccountsPage() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const { data: accounts, isLoading } = useAccounts();
  const totalBalance = useTotalBalance(accounts ?? []);
  const queryClient = useQueryClient();

  const handleDelete = useCallback(
    async (accountId: string) => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Not authenticated"); return; }

      const { data, error } = await supabase
        .from("accounts")
        .update({ is_active: false })
        .eq("account_id", accountId)
        .eq("user_id", user.id)
        .select("account_id");

      if (error) {
        toast.error(error.message);
        return;
      }
      if (!data || data.length === 0) {
        toast.error("Could not delete account");
        return;
      }
      toast.success("Account removed");
      await queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
    [queryClient]
  );

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="px-4 pt-5 pb-4 shrink-0">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-white text-xl font-bold">Accounts</h1>
            <p className="text-pale text-xs mt-0.5">
              {(accounts ?? []).length} active account{(accounts ?? []).length !== 1 ? "s" : ""}
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setSheetOpen(true)}
            className="w-10 h-10 rounded-2xl bg-brand flex items-center justify-center shadow-lg shadow-brand/30"
          >
            <Plus size={20} className="text-white" />
          </motion.button>
        </div>

        {/* Total balance banner */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-linear-to-r from-brand/20 to-brand/5 border border-brand/20 rounded-2xl px-4 py-4 flex items-center justify-between"
        >
          <div>
            <p className="text-pale text-xs uppercase tracking-wide">Net Worth</p>
            <p className="text-white text-2xl font-bold mt-1">
              {formatCurrency(totalBalance)}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-brand/20 flex items-center justify-center">
            <Wallet size={22} className="text-brand" />
          </div>
        </motion.div>
      </div>

      {/* Account list */}
      <div className="pb-6">
        {isLoading ? (
          <AccountsSkeleton />
        ) : (accounts ?? []).length === 0 ? (
          <EmptyAccounts onAdd={() => setSheetOpen(true)} />
        ) : (
          <AnimatePresence mode="popLayout">
            {(accounts ?? []).map((account, i) => (
              <SwipeableAccountCard
                key={account.account_id}
                account={account}
                onDelete={handleDelete}
                index={i}
              />
            ))}
          </AnimatePresence>
        )}

        {/* Swipe hint */}
        {(accounts ?? []).length > 0 && (
          <p className="text-center text-pale text-xs mt-4 px-4">
            Swipe left on an account to remove it
          </p>
        )}
      </div>

      {/* Add account sheet */}
      <AddAccountSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
    </div>
  );
}

function AccountsSkeleton() {
  return (
    <div className="flex flex-col gap-3 px-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-surface animate-pulse" />
          <div className="flex-1 flex flex-col gap-2">
            <div className="h-4 w-32 rounded bg-surface animate-pulse" />
            <div className="h-3 w-20 rounded bg-surface animate-pulse" />
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="h-4 w-24 rounded bg-surface animate-pulse" />
            <div className="h-3 w-10 rounded bg-surface animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyAccounts({ onAdd }: { onAdd: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 px-8 text-center"
    >
      <div className="w-20 h-20 rounded-3xl bg-surface border border-border flex items-center justify-center mb-5">
        <Wallet size={32} className="text-muted" />
      </div>
      <p className="text-white font-semibold text-base mb-2">No accounts yet</p>
      <p className="text-pale text-sm mb-6">
        Add your first bank account, wallet, or credit card to start tracking.
      </p>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onAdd}
        className="bg-brand text-white font-semibold px-6 py-3 rounded-2xl shadow-lg shadow-brand/30"
      >
        Add Account
      </motion.button>
    </motion.div>
  );
}
