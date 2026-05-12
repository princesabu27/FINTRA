"use client";

import { motion } from "framer-motion";
import { Wallet, CreditCard, PiggyBank, Building2, TrendingUp, Banknote } from "lucide-react";
import type { Account } from "@/hooks/useAccounts";
import { formatCurrency } from "@/lib/utils";
import { useAmountsVisible } from "@/store/amountsVisible";

const typeIcon: Record<string, React.ElementType> = {
  savings: PiggyBank,
  checking: Building2,
  credit_card: CreditCard,
  investment: TrendingUp,
  fixed_deposit: Banknote,
  cash: Wallet,
  wallet: Wallet,
};

const typeColors: Record<string, string> = {
  savings: "bg-brand/20 text-brand",
  checking: "bg-blue-500/20 text-blue-400",
  credit_card: "bg-expense/20 text-expense",
  investment: "bg-income/20 text-income",
  fixed_deposit: "bg-warning/20 text-warning",
  cash: "bg-purple-500/20 text-purple-400",
  wallet: "bg-purple-500/20 text-purple-400",
};

interface AccountStripProps {
  accounts: Account[];
}

export function AccountStrip({ accounts }: AccountStripProps) {
  const { visible } = useAmountsVisible();
  if (accounts.length === 0) return null;

  return (
    <div className="flex gap-3 overflow-x-auto px-4 pb-2 no-scrollbar">
      {accounts.map((account, i) => {
        const Icon = typeIcon[account.account_type] ?? Wallet;
        const colorClass = typeColors[account.account_type] ?? "bg-brand/20 text-brand";
        const isNegative = Number(account.balance_amount) < 0;

        return (
          <motion.div
            key={account.account_id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07, type: "spring", stiffness: 200 }}
            className="flex-shrink-0 bg-card border border-border rounded-2xl p-4 w-44"
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${colorClass}`}>
              <Icon size={18} />
            </div>
            <p className="text-white font-semibold text-base truncate">
              {visible ? formatCurrency(account.balance_amount, account.currency_code) : "••••••"}
            </p>
            <p className="text-pale text-xs mt-0.5 truncate">{account.account_name}</p>
            {isNegative && visible && (
              <span className="text-[10px] text-expense font-medium">Negative</span>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
