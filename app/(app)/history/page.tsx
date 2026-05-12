"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingDown, TrendingUp, Clock } from "lucide-react";
import { useRecentTransactions } from "@/hooks/useTransactions";
import { useAccounts } from "@/hooks/useAccounts";
import { useTransactionSheet } from "@/store/transactionSheet";
import { formatCurrency } from "@/lib/utils";

type Filter = "all" | "expense" | "income";

function groupByDate(transactions: ReturnType<typeof useRecentTransactions>["data"]) {
  const groups: { label: string; date: string; items: NonNullable<typeof transactions> }[] = [];
  const map = new Map<string, NonNullable<typeof transactions>>();

  for (const tx of transactions ?? []) {
    const d = tx.transaction_date;
    if (!map.has(d)) map.set(d, []);
    map.get(d)!.push(tx);
  }

  const today     = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  for (const [date, items] of map) {
    const label =
      date === today     ? "Today" :
      date === yesterday ? "Yesterday" :
      new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
    groups.push({ label, date, items });
  }

  return groups.sort((a, b) => b.date.localeCompare(a.date));
}

export default function HistoryPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const { data: transactions, isLoading } = useRecentTransactions(100);
  const { data: accounts = [] } = useAccounts();
  const openSheet = useTransactionSheet((s) => s.open);

  const accountMap = useMemo(
    () => new Map(accounts.map((a) => [a.account_id, a.account_name])),
    [accounts]
  );

  const filtered = useMemo(
    () => (transactions ?? []).filter((tx) => filter === "all" || tx.type === filter),
    [transactions, filter]
  );

  const groups = useMemo(() => groupByDate(filtered), [filtered]);

  const totalExpense = useMemo(
    () => (transactions ?? []).filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    [transactions]
  );
  const totalIncome = useMemo(
    () => (transactions ?? []).filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
    [transactions]
  );

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 sm:px-8 pt-5 pb-3 shrink-0">
        <h1 className="text-white text-xl font-bold">History</h1>
        <p className="text-pale text-xs mt-0.5">All transactions</p>

        {/* Summary strip */}
        {!isLoading && (transactions ?? []).length > 0 && (
          <div className="flex gap-3 mt-4">
            <div className="flex-1 bg-income/10 border border-income/20 rounded-2xl px-3 py-2.5">
              <p className="text-pale text-[10px] uppercase tracking-wide mb-0.5">Income</p>
              <p className="text-income text-sm font-bold">{formatCurrency(totalIncome)}</p>
            </div>
            <div className="flex-1 bg-expense/10 border border-expense/20 rounded-2xl px-3 py-2.5">
              <p className="text-pale text-[10px] uppercase tracking-wide mb-0.5">Expenses</p>
              <p className="text-expense text-sm font-bold">{formatCurrency(totalExpense)}</p>
            </div>
            <div className="flex-1 bg-surface border border-border rounded-2xl px-3 py-2.5">
              <p className="text-pale text-[10px] uppercase tracking-wide mb-0.5">Net</p>
              <p className={`text-sm font-bold ${totalIncome - totalExpense >= 0 ? "text-income" : "text-expense"}`}>
                {formatCurrency(Math.abs(totalIncome - totalExpense))}
              </p>
            </div>
          </div>
        )}

        {/* Filter pills */}
        <div className="flex gap-2 mt-4">
          {(["all", "expense", "income"] as Filter[]).map((f) => (
            <motion.button
              key={f}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors ${
                filter === f
                  ? f === "expense" ? "bg-expense text-white"
                  : f === "income"  ? "bg-income text-white"
                  : "bg-brand text-white"
                  : "bg-surface border border-border text-pale"
              }`}
            >
              {f === "all" ? "All" : f === "expense" ? "Expenses" : "Income"}
            </motion.button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 pb-6">
        {isLoading ? (
          <HistorySkeleton />
        ) : groups.length === 0 ? (
          <EmptyHistory onAdd={() => openSheet("expense")} />
        ) : (
          <AnimatePresence mode="popLayout">
            {groups.map((group) => (
              <motion.div
                key={group.date}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mb-5"
              >
                {/* Date label */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-pale text-xs font-semibold">{group.label}</span>
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-muted text-[10px]">{group.items.length} txn{group.items.length !== 1 ? "s" : ""}</span>
                </div>

                {/* Transactions */}
                <div className="bg-card border border-border rounded-2xl overflow-hidden">
                  {group.items.map((tx, i) => (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className={`flex items-center gap-3 px-4 py-3.5 ${
                        i < group.items.length - 1 ? "border-b border-border/50" : ""
                      }`}
                    >
                      {/* Icon */}
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        tx.type === "expense" ? "bg-expense/15" : "bg-income/15"
                      }`}>
                        {tx.type === "expense"
                          ? <TrendingDown size={16} className="text-expense" />
                          : <TrendingUp   size={16} className="text-income"  />
                        }
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{tx.name}</p>
                        <p className="text-pale text-[10px] mt-0.5 truncate">
                          {tx.category_name}
                          {tx.account_id && accountMap.get(tx.account_id)
                            ? ` · ${accountMap.get(tx.account_id)}`
                            : ""}
                        </p>
                        {tx.description && (
                          <p className="text-muted text-[10px] mt-0.5 truncate italic">{tx.description}</p>
                        )}
                      </div>

                      {/* Amount */}
                      <p className={`text-sm font-bold shrink-0 ${
                        tx.type === "expense" ? "text-expense" : "text-income"
                      }`}>
                        {tx.type === "expense" ? "−" : "+"}{formatCurrency(tx.amount)}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

function HistorySkeleton() {
  return (
    <div className="mt-2 flex flex-col gap-5">
      {Array.from({ length: 3 }).map((_, g) => (
        <div key={g}>
          <div className="h-3 w-20 rounded bg-surface animate-pulse mb-3" />
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={`flex items-center gap-3 px-4 py-3.5 ${i < 2 ? "border-b border-border/50" : ""}`}>
                <div className="w-9 h-9 rounded-xl bg-surface animate-pulse shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-32 rounded bg-surface animate-pulse" />
                  <div className="h-2.5 w-20 rounded bg-surface animate-pulse" />
                </div>
                <div className="h-4 w-16 rounded bg-surface animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyHistory({ onAdd }: { onAdd: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 px-8 text-center"
    >
      <div className="w-20 h-20 rounded-3xl bg-surface border border-border flex items-center justify-center mb-5">
        <Clock size={32} className="text-muted" />
      </div>
      <p className="text-white font-semibold text-base mb-2">No transactions yet</p>
      <p className="text-pale text-sm mb-6">
        Add your first expense or income to start tracking your financial history.
      </p>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onAdd}
        className="bg-brand text-white font-semibold px-6 py-3 rounded-2xl shadow-lg shadow-brand/30"
      >
        Add Transaction
      </motion.button>
    </motion.div>
  );
}
