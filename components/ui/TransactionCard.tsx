"use client";

import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart, Utensils, Zap, Car, Home, Heart, Gamepad2,
  Plane, GraduationCap, TrendingUp, Briefcase, Gift, MoreHorizontal,
  ArrowDownLeft, ArrowUpRight,
} from "lucide-react";
import type { Transaction } from "@/hooks/useTransactions";
import { formatCurrency, formatDateShort } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useAmountsVisible } from "@/store/amountsVisible";

const categoryIcon: Record<string, React.ElementType> = {
  food: Utensils, grocery: ShoppingCart, electricity: Zap, transport: Car,
  rent: Home, health: Heart, entertainment: Gamepad2, travel: Plane,
  education: GraduationCap, investment: TrendingUp, salary: Briefcase, gift: Gift,
};

function getCategoryIcon(name: string): React.ElementType {
  const lower = name.toLowerCase();
  for (const key of Object.keys(categoryIcon)) {
    if (lower.includes(key)) return categoryIcon[key];
  }
  return MoreHorizontal;
}

interface Props {
  transaction: Transaction;
  index?: number;
}

export const TransactionCard = memo(function TransactionCard({ transaction, index = 0 }: Props) {
  const Icon = getCategoryIcon(transaction.category_name);
  const isIncome = transaction.type === "income";
  const { visible } = useAmountsVisible();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 200, damping: 22 }}
      whileTap={{ scale: 0.98, backgroundColor: "rgba(255,255,255,0.03)" }}
      className="flex items-center gap-3 px-4 py-3"
    >
      {/* Icon */}
      <div
        className={cn(
          "w-11 h-11 rounded-2xl flex items-center justify-center shrink-0",
          isIncome ? "bg-income/15 text-income" : "bg-expense/10 text-expense"
        )}
      >
        <Icon size={20} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium text-sm truncate">{transaction.name}</p>
        <p className="text-pale text-xs mt-0.5">{transaction.category_name}</p>
      </div>

      {/* Amount + date */}
      <div className="flex flex-col items-end gap-0.5">
        <AnimatePresence mode="wait">
          <motion.span
            key={visible ? "shown" : "hidden"}
            initial={{ opacity: 0, filter: "blur(6px)", y: 4 }}
            animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
            exit={{ opacity: 0, filter: "blur(6px)", y: -4 }}
            transition={{ duration: 0.2 }}
            className={cn("font-semibold text-sm", isIncome ? "text-income" : "text-expense")}
          >
            {visible
              ? `${isIncome ? "+" : "-"}${formatCurrency(transaction.amount, transaction.currency_code)}`
              : "••••"}
          </motion.span>
        </AnimatePresence>
        <span className="text-pale text-[11px]">
          {formatDateShort(transaction.transaction_date)}
        </span>
      </div>

      {/* Direction indicator */}
      <div className={cn("shrink-0", isIncome ? "text-income/50" : "text-expense/50")}>
        {isIncome ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
      </div>
    </motion.div>
  );
});
