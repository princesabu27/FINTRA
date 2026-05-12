"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, PieChart, TrendingDown, TrendingUp, AlertTriangle } from "lucide-react";
import { useBudgets, useMonthlyIncome } from "@/hooks/useBudgets";
import { BudgetBar } from "@/components/ui/BudgetBar";
import { AddBudgetSheet } from "@/components/ui/AddBudgetSheet";
import { formatCurrency } from "@/lib/utils";

export default function BudgetsPage() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const { data: budgets, isLoading } = useBudgets();
  const { data: monthlyIncome = 0 } = useMonthlyIncome();

  const { totalAllocated, totalSpent, totalBudgeted, overBudgetCount } = useMemo(() => {
    const arr = budgets ?? [];
    return {
      totalAllocated: arr.reduce((s, b) => s + b.budget_percentage, 0),
      totalSpent:     arr.reduce((s, b) => s + (b.monthly?.used_amount ?? 0), 0),
      totalBudgeted:  arr.reduce((s, b) => s + (b.monthly?.amount ?? 0), 0),
      overBudgetCount: arr.filter((b) => b.monthly && b.monthly.used_amount > b.monthly.amount).length,
    };
  }, [budgets]);

  const monthLabel = new Date().toLocaleString("en-US", {
    month: "long", year: "numeric",
  });

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 sm:px-8 pt-5 pb-3 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-white text-xl font-bold">Budgets</h1>
            <p className="text-pale text-xs mt-0.5">{monthLabel}</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setSheetOpen(true)}
            className="w-10 h-10 rounded-2xl bg-brand flex items-center justify-center shadow-lg shadow-brand/30"
          >
            <Plus size={20} className="text-white" />
          </motion.button>
        </div>

        {/* Summary cards row */}
        <div className="flex gap-3">
          <SummaryCard
            label="Income"
            value={formatCurrency(monthlyIncome)}
            icon={<TrendingUp size={14} className="text-income" />}
            accent="text-income"
          />
          <SummaryCard
            label="Budgeted"
            value={formatCurrency(totalBudgeted)}
            icon={<PieChart size={14} className="text-brand" />}
            accent="text-brand"
          />
          <SummaryCard
            label="Spent"
            value={formatCurrency(totalSpent)}
            icon={<TrendingDown size={14} className="text-expense" />}
            accent="text-expense"
          />
        </div>

        {/* Total allocation bar */}
        {(budgets ?? []).length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-4 bg-surface border border-border rounded-2xl px-4 py-3"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-pale text-xs">Total allocation</span>
              <span
                className={`text-xs font-bold ${
                  totalAllocated > 90
                    ? "text-expense"
                    : totalAllocated > 70
                    ? "text-warning"
                    : "text-income"
                }`}
              >
                {totalAllocated}% of income
              </span>
            </div>
            <div className="h-2 bg-black/20 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-brand"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(totalAllocated, 100)}%` }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>

            {/* Over-budget warning */}
            <AnimatePresence>
              {overBudgetCount > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 mt-2.5"
                >
                  <AlertTriangle size={13} className="text-expense flex-shrink-0" />
                  <p className="text-expense text-[11px] font-medium">
                    {overBudgetCount} budget{overBudgetCount > 1 ? "s are" : " is"} over limit this month
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Budget list */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 pb-6">
        {isLoading ? (
          <div className="flex flex-col gap-3"><BudgetsSkeleton /></div>
        ) : (budgets ?? []).length === 0 ? (
          <EmptyBudgets onAdd={() => setSheetOpen(true)} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {(budgets ?? []).map((b, i) => (
              <BudgetBar key={b.budget_id} budget={b} index={i} />
            ))}
          </div>
        )}
      </div>

      <AddBudgetSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        totalAllocated={totalAllocated}
      />
    </div>
  );
}

function SummaryCard({
  label, value, icon, accent,
}: {
  label: string; value: string; icon: React.ReactNode; accent: string;
}) {
  return (
    <div className="flex-1 bg-card border border-border rounded-2xl px-3 py-3">
      <div className="flex items-center gap-1.5 mb-1.5">
        {icon}
        <span className="text-pale text-[10px] uppercase tracking-wide">{label}</span>
      </div>
      <p className={`font-bold text-sm ${accent}`}>{value}</p>
    </div>
  );
}

function BudgetsSkeleton() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <div className="flex justify-between">
            <div className="h-4 w-32 rounded bg-surface animate-pulse" />
            <div className="h-4 w-16 rounded bg-surface animate-pulse" />
          </div>
          <div className="h-2 rounded-full bg-surface animate-pulse" />
          <div className="flex justify-between">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="h-3 w-14 rounded bg-surface animate-pulse" />
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

function EmptyBudgets({ onAdd }: { onAdd: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 px-8 text-center"
    >
      <div className="w-20 h-20 rounded-3xl bg-surface border border-border flex items-center justify-center mb-5">
        <PieChart size={32} className="text-muted" />
      </div>
      <p className="text-white font-semibold text-base mb-2">No budgets yet</p>
      <p className="text-pale text-sm mb-6">
        Create budgets to allocate percentages of your income and track spending limits.
      </p>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onAdd}
        className="bg-brand text-white font-semibold px-6 py-3 rounded-2xl shadow-lg shadow-brand/30"
      >
        Create Budget
      </motion.button>
    </motion.div>
  );
}
