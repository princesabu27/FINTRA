"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, ChevronRight, TrendingUp, TrendingDown, Percent, Target } from "lucide-react";
import { useAmountsVisible } from "@/store/amountsVisible";
import { BalanceCard } from "@/components/ui/BalanceCard";
import { AccountStrip } from "@/components/ui/AccountStrip";
import { TransactionCard } from "@/components/ui/TransactionCard";
import { PullToRefresh } from "@/components/ui/PullToRefresh";
import { NotificationSheet } from "@/components/ui/NotificationSheet";
import { BudgetProgressChart } from "@/components/ui/BudgetProgressChart";
import { useUnreadCount } from "@/hooks/useNotifications";
import { useCategoryBreakdown } from "@/hooks/useTransactions";
import { useMonthlyIncome } from "@/hooks/useBudgets";
import { useGoals } from "@/hooks/useGoals";
import { CategoryDonutChart } from "@/components/ui/CategoryDonutChart";
import { formatCurrency } from "@/lib/utils";
import type { Account } from "@/hooks/useAccounts";
import type { Transaction } from "@/hooks/useTransactions";

interface Props {
  firstName: string;
  lastName: string;
  profilePic: string | null;
  initialAccounts: Account[];
  initialTransactions: Transaction[];
}

export function DashboardClient({ firstName, lastName, profilePic, initialAccounts, initialTransactions }: Props) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [notifOpen, setNotifOpen] = useState(false);
  const unreadCount = useUnreadCount();
  const { data: categories = [] } = useCategoryBreakdown("month");
  const { data: monthlyIncome = 0 } = useMonthlyIncome();
  const { data: goals = [] } = useGoals();

  const totalBalance = initialAccounts.reduce(
    (s, a) => s + Number(a.balance_amount),
    0
  );

  const monthlyExpense = categories.reduce((s, c) => s + c.value, 0);
  const savingsRate = monthlyIncome > 0
    ? Math.max(0, Math.round(((monthlyIncome - monthlyExpense) / monthlyIncome) * 100))
    : 0;

  const activeGoals = goals.filter((g) => !g.is_achieved);
  const { visible } = useAmountsVisible();
  const prefersReduced = useReducedMotion();

  const sectionVariants = {
    hidden: { opacity: 0, y: prefersReduced ? 0 : 20 },
    show:   { opacity: 1, y: 0 },
  };
  const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
  };

  async function handleRefresh() {
    await queryClient.invalidateQueries({ queryKey: ["accounts"] });
    await queryClient.invalidateQueries({ queryKey: ["transactions"] });
  }

  return (
    <>
    <PullToRefresh onRefresh={handleRefresh}>
      <motion.div
        className="flex flex-col gap-5 pb-6 pt-safe"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* Profile card + notification bell */}
        <motion.div variants={sectionVariants} transition={{ type: "spring", stiffness: 280, damping: 26 }} className="flex items-center justify-between px-4 sm:px-8 pt-4 gap-3">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push("/profile")}
            className="flex items-center gap-3 flex-1 min-w-0"
          >
            {/* Avatar */}
            <div className="w-11 h-11 rounded-2xl bg-brand/20 border border-brand/30 flex items-center justify-center shrink-0 overflow-hidden">
              {profilePic ? (
                <img src={profilePic} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-brand font-bold text-base">
                  {firstName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            {/* Name + date */}
            <div className="text-left min-w-0">
              <p className="text-white font-semibold text-sm truncate">
                {firstName} {lastName}
              </p>
              <p className="text-pale text-xs mt-0.5">
                {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
              </p>
            </div>
          </motion.button>

          {/* Notification bell */}
          <motion.button
            whileTap={{ scale: 0.88 }}
            animate={unreadCount > 0 ? { rotate: [0, -12, 12, -8, 8, 0] } : {}}
            transition={unreadCount > 0 ? { duration: 0.5, delay: 1 } : {}}
            onClick={() => setNotifOpen(true)}
            className="relative w-10 h-10 rounded-2xl bg-surface border border-border flex items-center justify-center shrink-0"
          >
            <Bell size={18} className="text-pale" />
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 20 }}
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand text-white text-[9px] font-bold flex items-center justify-center"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </motion.span>
            )}
          </motion.button>
        </motion.div>

        {/* Balance hero */}
        <motion.div variants={sectionVariants} transition={{ type: "spring", stiffness: 280, damping: 26 }}>
          <BalanceCard totalBalance={totalBalance} firstName={firstName} />
        </motion.div>

        {/* Quick stats row */}
        <motion.div variants={sectionVariants} transition={{ type: "spring", stiffness: 280, damping: 26 }} className="px-4 sm:px-8 grid grid-cols-3 gap-2.5 sm:gap-4">
          <QuickStat
            icon={<TrendingUp size={14} className="text-income" />}
            label="Income"
            value={visible ? formatCurrency(monthlyIncome) : "••••"}
            color="income"
          />
          <QuickStat
            icon={<TrendingDown size={14} className="text-expense" />}
            label="Spent"
            value={visible ? formatCurrency(monthlyExpense) : "••••"}
            color="expense"
          />
          <QuickStat
            icon={<Percent size={14} className="text-brand" />}
            label="Saved"
            value={visible ? `${savingsRate}%` : "••"}
            color="brand"
          />
        </motion.div>

        {/* Accounts */}
        <motion.section variants={sectionVariants} transition={{ type: "spring", stiffness: 280, damping: 26 }}>
          <div className="flex items-center justify-between px-4 sm:px-8 mb-3">
            <h2 className="text-white font-semibold text-sm">My Accounts</h2>
            <Link
              href="/accounts"
              className="flex items-center gap-0.5 text-brand text-xs font-medium"
            >
              {initialAccounts.length > 0
                ? `${initialAccounts.length} accounts`
                : "Add one"}
              <ChevronRight size={13} />
            </Link>
          </div>
          {initialAccounts.length > 0 && (
            <AccountStrip accounts={initialAccounts} />
          )}
        </motion.section>

        {/* Spending + Budget — side by side on wider screens */}
        <motion.div
          variants={sectionVariants}
          transition={{ type: "spring", stiffness: 280, damping: 26 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-5 px-4 sm:px-8"
        >
          {categories.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-white font-semibold text-sm">Spending This Month</h2>
                <Link href="/statistics" className="flex items-center gap-0.5 text-brand text-xs font-medium">
                  Details <ChevronRight size={13} />
                </Link>
              </div>
              <div className="bg-card border border-border rounded-3xl p-4">
                <CategoryDonutChart data={categories} />
              </div>
            </section>
          )}

          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white font-semibold text-sm">Budget Health</h2>
              <Link href="/budgets" className="flex items-center gap-0.5 text-brand text-xs font-medium">
                Manage <ChevronRight size={13} />
              </Link>
            </div>
            <div className="bg-card border border-border rounded-3xl p-4">
              <BudgetProgressChart />
            </div>
          </section>
        </motion.div>

        {/* Goals progress */}
        {activeGoals.length > 0 && (
          <motion.section variants={sectionVariants} transition={{ type: "spring", stiffness: 280, damping: 26 }}>
            <div className="flex items-center justify-between px-4 sm:px-8 mb-3">
              <h2 className="text-white font-semibold text-sm">Savings Goals</h2>
              <Link href="/goals" className="flex items-center gap-0.5 text-brand text-xs font-medium">
                {activeGoals.length} active <ChevronRight size={13} />
              </Link>
            </div>
            <div className="flex gap-3 px-4 sm:px-8 overflow-x-auto pb-1 scrollbar-hide">
              {activeGoals.slice(0, 5).map((goal, i) => (
                <GoalCard key={goal.goal_id} goal={goal} index={i} />
              ))}
            </div>
          </motion.section>
        )}

        {/* Transactions */}
        <motion.section variants={sectionVariants} transition={{ type: "spring", stiffness: 280, damping: 26 }} className="flex-1">
          <div className="flex items-center justify-between px-4 sm:px-8 mb-2">
            <h2 className="text-white font-semibold text-sm">Recent Transactions</h2>
            <span className="text-pale text-xs">{initialTransactions.length} items</span>
          </div>

          {initialTransactions.length === 0 ? (
            <EmptyTransactions />
          ) : (
            <div className="divide-y divide-border/50">
              {initialTransactions.map((tx, i) => (
                <TransactionCard key={tx.id} transaction={tx} index={i} />
              ))}
            </div>
          )}
        </motion.section>
      </motion.div>
    </PullToRefresh>
    <NotificationSheet isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
    </>
  );
}

function QuickStat({ icon, label, value, color }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: "income" | "expense" | "brand";
}) {
  const borderColors = { income: "rgba(0,229,160,0.20)", expense: "rgba(255,92,122,0.20)", brand: "rgba(108,99,255,0.20)" };
  const bgColors    = { income: "rgba(0,229,160,0.08)",  expense: "rgba(255,92,122,0.08)",  brand: "rgba(108,99,255,0.08)"  };
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.03 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
      className="flex flex-col gap-1.5 rounded-2xl p-3"
      style={{ background: bgColors[color], border: `1px solid ${borderColors[color]}` }}
    >
      <div className="flex items-center gap-1.5">{icon}<span className="text-pale text-[10px] uppercase tracking-wide">{label}</span></div>
      <AnimatePresence mode="wait">
        <motion.p
          key={value}
          initial={{ opacity: 0, y: 4, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -4, filter: "blur(4px)" }}
          transition={{ duration: 0.2 }}
          className="text-white font-bold text-sm leading-tight truncate"
        >
          {value}
        </motion.p>
      </AnimatePresence>
    </motion.div>
  );
}

function GoalCard({ goal, index }: { goal: import("@/hooks/useGoals").Goal; index: number }) {
  const pct = goal.target_amount > 0
    ? Math.min(Math.round((goal.achieved_amount / goal.target_amount) * 100), 100)
    : 0;
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, type: "spring", stiffness: 200, damping: 22 }}
      className="shrink-0 w-44 bg-card border border-border rounded-2xl p-4 flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="w-8 h-8 rounded-xl bg-brand/15 flex items-center justify-center shrink-0">
          <Target size={15} className="text-brand" />
        </div>
        <span className="text-brand text-xs font-bold">{pct}%</span>
      </div>
      <div>
        <p className="text-white text-xs font-semibold leading-tight truncate">{goal.goal_name}</p>
        <p className="text-pale text-[10px] mt-0.5">{formatCurrency(goal.achieved_amount)} of {formatCurrency(goal.target_amount)}</p>
      </div>
      <div className="h-1.5 w-full bg-surface rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: index * 0.06 }}
          className="h-full rounded-full bg-brand"
        />
      </div>
    </motion.div>
  );
}

function EmptyTransactions() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-8 text-center"
    >
      <div className="w-16 h-16 rounded-3xl bg-surface border border-border flex items-center justify-center mb-4">
        <span className="text-3xl">📊</span>
      </div>
      <p className="text-white font-semibold mb-1">No transactions yet</p>
      <p className="text-pale text-sm">Add your first income or expense to get started</p>
    </motion.div>
  );
}
