"use client";

import { useRef, useCallback } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Wallet, CreditCard, PiggyBank, Building2, TrendingUp, Banknote, Trash2 } from "lucide-react";
import type { Account } from "@/hooks/useAccounts";
import { formatCurrency } from "@/lib/utils";

const TYPE_META: Record<string, { icon: React.ElementType; color: string }> = {
  savings:       { icon: PiggyBank,  color: "#1B4FFF" },
  checking:      { icon: Building2,  color: "#3B82F6" },
  credit_card:   { icon: CreditCard, color: "#EF4444" },
  investment:    { icon: TrendingUp, color: "#22C55E" },
  fixed_deposit: { icon: Banknote,   color: "#F59E0B" },
  cash:          { icon: Wallet,     color: "#8B5CF6" },
  wallet:        { icon: Wallet,     color: "#8B5CF6" },
  loan:          { icon: CreditCard, color: "#F97316" },
};

function getTypeMeta(type: string) {
  return TYPE_META[type.toLowerCase()] ?? { icon: Wallet, color: "#4A6FA5" };
}

const DELETE_THRESHOLD = -80;

interface SwipeableAccountCardProps {
  account: Account;
  onDelete: (id: string) => void;
  index: number;
}

export function SwipeableAccountCard({ account, onDelete, index }: SwipeableAccountCardProps) {
  const x = useMotionValue(0);
  const deleteOpacity = useTransform(x, [0, DELETE_THRESHOLD], [0, 1]);
  const cardScale = useTransform(x, [0, DELETE_THRESHOLD], [1, 0.97]);
  const isDeleting = useRef(false);

  const { icon: Icon, color } = getTypeMeta(account.account_type);
  const isNegative = Number(account.balance_amount) < 0;

  const handleDragEnd = useCallback(
    (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
      const shouldDelete =
        info.offset.x < DELETE_THRESHOLD || info.velocity.x < -600;
      if (shouldDelete && !isDeleting.current) {
        isDeleting.current = true;
        animate(x, -500, { duration: 0.25, ease: "easeIn", onComplete: () => onDelete(account.account_id) });
      } else {
        animate(x, 0, { type: "spring", stiffness: 300, damping: 28 });
      }
    },
    [account.account_id, onDelete, x]
  );

  return (
    <div className="relative mx-4 mb-3">
      {/* Delete backdrop */}
      <motion.div
        style={{ opacity: deleteOpacity }}
        className="absolute inset-y-0 right-0 w-20 bg-expense/20 rounded-2xl flex items-center justify-center"
      >
        <Trash2 size={20} className="text-expense" />
      </motion.div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.07, type: "spring", stiffness: 200, damping: 22 }}
        drag="x"
        dragConstraints={{ left: DELETE_THRESHOLD * 1.2, right: 0 }}
        dragElastic={{ left: 0.15, right: 0.05 }}
        onDragEnd={handleDragEnd}
        style={{ x, scale: cardScale }}
        className="glass rounded-2xl p-4 flex items-center gap-4 cursor-grab active:cursor-grabbing select-none"
      >
        {/* Icon */}
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: color + "20", color }}
        >
          <Icon size={22} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">{account.account_name}</p>
          <p className="text-pale text-xs mt-0.5 capitalize">
            {account.account_type.replace(/_/g, " ")}
          </p>
        </div>

        {/* Balance */}
        <div className="text-right flex-shrink-0">
          <p className={`font-bold text-base ${isNegative ? "text-expense" : "text-white"}`}>
            {formatCurrency(account.balance_amount, account.currency_code)}
          </p>
          <p className="text-pale text-[11px] mt-0.5">
            {account.currency_code}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
