"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStatisticsData, useCategoryBreakdown, useNetWorthTrend, type Period } from "@/hooks/useTransactions";
import { PeriodToggle } from "@/components/ui/PeriodToggle";
import { SpendingLineChart } from "@/components/ui/SpendingLineChart";
import { SpendingBarChart } from "@/components/ui/SpendingBarChart";
import { CategoryDonutChart } from "@/components/ui/CategoryDonutChart";
import { NetWorthChart } from "@/components/ui/NetWorthChart";
import { BudgetProgressChart } from "@/components/ui/BudgetProgressChart";
import { formatCurrency } from "@/lib/utils";
import { TrendingDown, TrendingUp } from "lucide-react";

const chartVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
};

const periodOrder: Period[] = ["week", "month", "year"];

export default function StatisticsPage() {
  const [period, setPeriod] = useState<Period>("month");
  const [prevPeriod, setPrevPeriod] = useState<Period>("month");
  const [chartType, setChartType] = useState<"line" | "bar">("line");

  const direction = periodOrder.indexOf(period) > periodOrder.indexOf(prevPeriod) ? 1 : -1;

  const { data, isLoading }         = useStatisticsData(period);
  const { data: categories = [] }   = useCategoryBreakdown(period);
  const { data: netWorth = [] }     = useNetWorthTrend();

  const totalIncome  = (data ?? []).reduce((s, p) => s + p.income, 0);
  const totalExpense = (data ?? []).reduce((s, p) => s + p.expense, 0);
  const netSavings   = totalIncome - totalExpense;

  function handlePeriodChange(p: Period) {
    setPrevPeriod(period);
    setPeriod(p);
  }

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-white text-xl font-bold">Statistics</h1>
        <p className="text-pale text-xs mt-0.5">Track your spending patterns</p>
      </div>

      {/* Period toggle */}
      <div className="px-4 mb-5">
        <PeriodToggle value={period} onChange={handlePeriodChange} />
      </div>

      {/* Summary cards */}
      <div className="flex gap-3 px-4 mb-5">
        <SummaryCard label="Income"   amount={totalIncome}  positive />
        <SummaryCard label="Expenses" amount={totalExpense} positive={false} />
        <SummaryCard label="Savings"  amount={netSavings}   positive={netSavings >= 0} net />
      </div>

      {/* ── Income vs Expense ── */}
      <SectionCard title="Income vs Expense">
        <div className="flex gap-2 mb-3">
          {(["line", "bar"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setChartType(t)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                chartType === t
                  ? "bg-brand/20 text-brand border border-brand/40"
                  : "text-muted border border-border"
              }`}
            >
              {t === "line" ? "Line" : "Bar"}
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={period + chartType}
            custom={direction}
            variants={chartVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 240, damping: 28 }}
          >
            {isLoading ? (
              <ChartSkeleton />
            ) : chartType === "line" ? (
              <SpendingLineChart data={data ?? []} />
            ) : (
              <SpendingBarChart data={data ?? []} />
            )}
          </motion.div>
        </AnimatePresence>

        {!isLoading && (
          <div className={`flex items-center gap-2 mt-3 pt-3 border-t border-border`}>
            {netSavings >= 0
              ? <TrendingUp size={15} className="text-income shrink-0" />
              : <TrendingDown size={15} className="text-expense shrink-0" />}
            <p className="text-pale text-xs">
              {netSavings >= 0
                ? `Saved ${formatCurrency(netSavings)} this ${period}`
                : `Overspent by ${formatCurrency(Math.abs(netSavings))} this ${period}`}
            </p>
          </div>
        )}
      </SectionCard>

      {/* ── Spending by Category ── */}
      <SectionCard title="Spending by Category">
        <CategoryDonutChart data={categories} />
      </SectionCard>

      {/* ── Net Worth Trend ── */}
      <SectionCard title="Net Worth Trend" subtitle="Last 6 months">
        <NetWorthChart data={netWorth} />
      </SectionCard>

      {/* ── Budget Progress ── */}
      <SectionCard title="Budget Progress" subtitle="This month">
        <BudgetProgressChart />
      </SectionCard>
    </div>
  );
}

function SectionCard({ title, subtitle, children }: {
  title: string; subtitle?: string; children: React.ReactNode;
}) {
  return (
    <div className="mx-4 mb-4 bg-card border border-border rounded-3xl p-4">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-white font-semibold text-sm">{title}</h2>
        {subtitle && <span className="text-muted text-[10px]">{subtitle}</span>}
      </div>
      {children}
    </div>
  );
}

function SummaryCard({ label, amount, positive, net }: {
  label: string; amount: number; positive: boolean; net?: boolean;
}) {
  const Icon = net
    ? amount >= 0 ? TrendingUp : TrendingDown
    : positive ? TrendingUp : TrendingDown;

  return (
    <div className="flex-1 bg-card border border-border rounded-2xl p-3">
      <div className="flex items-center gap-1.5 mb-2">
        <Icon size={13} className={positive ? "text-income" : "text-expense"} />
        <span className="text-pale text-[10px] font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className={`font-bold text-sm ${net ? (amount >= 0 ? "text-income" : "text-expense") : "text-white"}`}>
        {amount < 0 && "-"}{formatCurrency(Math.abs(amount))}
      </p>
    </div>
  );
}

const SKELETON_HEIGHTS = ["45%", "70%", "55%", "85%", "40%", "65%", "75%"];

function ChartSkeleton() {
  return (
    <div className="flex items-end gap-2 h-55 px-4">
      {SKELETON_HEIGHTS.map((h, i) => (
        <div key={i} className="flex-1 bg-surface/60 rounded-t-md animate-pulse" style={{ height: h }} />
      ))}
    </div>
  );
}
