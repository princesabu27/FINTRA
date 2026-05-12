"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { getBudgetHealth, type Budget } from "@/hooks/useBudgets";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

const HEALTH_STYLES = {
  good:    { bar: "#1B4FFF", bg: "bg-brand/10",   badge: "bg-brand/20 text-brand",   label: "On track" },
  warning: { bar: "#F59E0B", bg: "bg-warning/10", badge: "bg-warning/20 text-warning", label: "Almost full" },
  over:    { bar: "#EF4444", bg: "bg-expense/10", badge: "bg-expense/20 text-expense", label: "Over budget" },
};

interface BudgetBarProps {
  budget: Budget;
  index: number;
}

export function BudgetBar({ budget, index }: BudgetBarProps) {
  const { monthly, budget_name, budget_percentage, description } = budget;

  const used      = monthly?.used_amount ?? 0;
  const allocated = monthly?.amount ?? 0;
  const remaining = monthly?.remaining_amount ?? 0;

  const pct     = allocated > 0 ? Math.min((used / allocated) * 100, 100) : 0;
  const health  = getBudgetHealth(used, allocated);
  const style   = HEALTH_STYLES[health];

  // Animate the bar fill on mount
  const width = useMotionValue(0);
  const widthPct = useTransform(width, (v) => `${v}%`);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;
    const controls = animate(width, pct, {
      duration: 0.8,
      delay: index * 0.08,
      ease: [0.22, 1, 0.36, 1],
    });
    return controls.stop;
  }, [pct, index, width]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, type: "spring", stiffness: 200, damping: 22 }}
      className={cn("rounded-2xl p-4 border border-border", style.bg)}
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 mr-3">
          <p className="text-white font-semibold text-sm truncate">{budget_name}</p>
          {description && (
            <p className="text-pale text-xs mt-0.5 truncate">{description}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", style.badge)}>
            {style.label}
          </span>
          <span className="text-pale text-[10px]">{budget_percentage}% of income</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-black/20 rounded-full overflow-hidden mb-3">
        <motion.div
          className="h-full rounded-full"
          style={{ width: widthPct, backgroundColor: style.bar }}
        />
      </div>

      {/* Bottom amounts */}
      <div className="flex items-center justify-between">
        <div className="text-center">
          <p className="text-pale text-[10px] mb-0.5">Spent</p>
          <p className="text-white text-xs font-semibold">{formatCurrency(used)}</p>
        </div>
        <div className="text-center">
          <p className="text-pale text-[10px] mb-0.5">Allocated</p>
          <p className="text-white text-xs font-semibold">{formatCurrency(allocated)}</p>
        </div>
        <div className="text-center">
          <p className="text-pale text-[10px] mb-0.5">Remaining</p>
          <p
            className={cn(
              "text-xs font-semibold",
              remaining < 0 ? "text-expense" : "text-income"
            )}
          >
            {formatCurrency(Math.abs(remaining))}
          </p>
        </div>
        <div className="text-center">
          <p className="text-pale text-[10px] mb-0.5">Used</p>
          <p
            className={cn(
              "text-xs font-bold",
              health === "good" ? "text-brand" : health === "warning" ? "text-warning" : "text-expense"
            )}
          >
            {Math.round(pct)}%
          </p>
        </div>
      </div>
    </motion.div>
  );
}
