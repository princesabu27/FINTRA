"use client";

import { motion } from "framer-motion";
import { useBudgets, getBudgetHealth } from "@/hooks/useBudgets";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

const HEALTH_COLORS = {
  good:    "bg-income",
  warning: "bg-amber-400",
  over:    "bg-expense",
};

export function BudgetProgressChart() {
  const { data: budgets = [], isLoading } = useBudgets();
  const active = budgets.filter((b) => b.monthly);

  if (isLoading) return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-1.5">
          <div className="h-3 w-32 rounded bg-surface animate-pulse" />
          <div className="h-2 w-full rounded-full bg-surface animate-pulse" />
        </div>
      ))}
    </div>
  );

  if (!active.length) return (
    <p className="text-muted text-xs text-center py-4">No active budgets this month</p>
  );

  return (
    <div className="flex flex-col gap-4">
      {active.map((b) => {
        const used = b.monthly!.used_amount;
        const total = b.monthly!.amount;
        const pct = total > 0 ? Math.min((used / total) * 100, 100) : 0;
        const health = getBudgetHealth(used, total);

        return (
          <div key={b.budget_id}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-white text-xs font-medium truncate max-w-[140px]">{b.budget_name}</span>
              <span className="text-pale text-[10px]">
                {formatCurrency(used)} / {formatCurrency(total)}
              </span>
            </div>
            <div className="h-2 w-full bg-surface rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className={cn("h-full rounded-full", HEALTH_COLORS[health])}
              />
            </div>
            <p className={cn(
              "text-[10px] mt-1",
              health === "good" ? "text-income" : health === "warning" ? "text-amber-400" : "text-expense"
            )}>
              {health === "over"
                ? `Over by ${formatCurrency(used - total)}`
                : `${formatCurrency(b.monthly!.remaining_amount)} remaining`}
            </p>
          </div>
        );
      })}
    </div>
  );
}
