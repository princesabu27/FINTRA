"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Tag, TrendingDown, TrendingUp, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import {
  useExpenseCategories,
  useIncomeCategories,
  useDeactivateExpenseCategory,
  useDeactivateIncomeCategory,
} from "@/hooks/useCategories";
import { getCategoryIcon } from "@/components/ui/CategoryPicker";
import { AddExpenseCategorySheet } from "@/components/ui/AddExpenseCategorySheet";
import { AddIncomeCategorySheet } from "@/components/ui/AddIncomeCategorySheet";
import { cn } from "@/lib/utils";

type Tab = "expense" | "income";

const COLORS = [
  "#1B4FFF","#22C55E","#EF4444","#F59E0B","#8B5CF6",
  "#EC4899","#06B6D4","#F97316","#14B8A6","#6366F1",
];

export default function CategoriesPage() {
  const [tab, setTab]               = useState<Tab>("expense");
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [incomeOpen, setIncomeOpen]   = useState(false);

  const { data: expenseCategories = [], isLoading: loadingExpense } = useExpenseCategories();
  const { data: incomeCategories  = [], isLoading: loadingIncome  } = useIncomeCategories();
  const deactivateExpense = useDeactivateExpenseCategory();
  const deactivateIncome  = useDeactivateIncomeCategory();

  async function handleDeleteExpense(id: string) {
    try {
      await deactivateExpense.mutateAsync(id);
      toast.success("Category removed");
    } catch { toast.error("Could not remove category"); }
  }

  async function handleDeleteIncome(id: string) {
    try {
      await deactivateIncome.mutateAsync(id);
      toast.success("Category removed");
    } catch { toast.error("Could not remove category"); }
  }

  // Group expense categories by classification
  const expenseGroups = expenseCategories.reduce<Record<string, typeof expenseCategories>>(
    (acc, cat) => {
      const key = cat.expense_classification ?? "Uncategorised";
      if (!acc[key]) acc[key] = [];
      acc[key].push(cat);
      return acc;
    },
    {}
  );

  const incomeGroups = incomeCategories.reduce<Record<string, typeof incomeCategories>>(
    (acc, cat) => {
      const key = cat.income_classification ?? "Uncategorised";
      if (!acc[key]) acc[key] = [];
      acc[key].push(cat);
      return acc;
    },
    {}
  );

  return (
    <>
      <div className="flex flex-col pb-6">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-5 pb-4">
          <div>
            <h1 className="text-white text-xl font-bold">Categories</h1>
            <p className="text-pale text-xs mt-0.5">
              {tab === "expense"
                ? `${expenseCategories.length} expense categories`
                : `${incomeCategories.length} income categories`}
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => tab === "expense" ? setExpenseOpen(true) : setIncomeOpen(true)}
            className={cn(
              "w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg",
              tab === "expense" ? "bg-expense shadow-expense/30" : "bg-income shadow-income/30"
            )}
          >
            <Plus size={20} className="text-white" />
          </motion.button>
        </div>

        {/* Tab toggle */}
        <div className="flex gap-2 px-4 mb-5">
          {(["expense", "income"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-semibold border transition-colors",
                tab === t
                  ? t === "expense"
                    ? "bg-expense/15 border-expense/40 text-expense"
                    : "bg-income/15 border-income/40 text-income"
                  : "bg-surface border-border text-muted"
              )}
            >
              {t === "expense"
                ? <TrendingDown size={15} />
                : <TrendingUp size={15} />}
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, x: tab === "expense" ? -30 : 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: tab === "expense" ? 30 : -30 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
          >
            {tab === "expense" ? (
              loadingExpense ? (
                <CategorySkeleton />
              ) : expenseCategories.length === 0 ? (
                <EmptyState type="expense" onAdd={() => setExpenseOpen(true)} />
              ) : (
                <div className="flex flex-col gap-5 px-4">
                  {Object.entries(expenseGroups).map(([group, cats]) => (
                    <div key={group}>
                      <p className="text-pale text-[11px] uppercase tracking-widest mb-2 px-1">{group}</p>
                      <div className="flex flex-col gap-2">
                        {cats.map((cat, i) => {
                          const Icon = getCategoryIcon(cat.expense_category_name);
                          const color = COLORS[i % COLORS.length];
                          return (
                            <CategoryRow
                              key={cat.expense_category_id}
                              icon={<Icon size={18} />}
                              color={color}
                              name={cat.expense_category_name}
                              badge={cat.expense_classification ?? undefined}
                              onDelete={() => handleDeleteExpense(cat.expense_category_id)}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              loadingIncome ? (
                <CategorySkeleton />
              ) : incomeCategories.length === 0 ? (
                <EmptyState type="income" onAdd={() => setIncomeOpen(true)} />
              ) : (
                <div className="flex flex-col gap-5 px-4">
                  {Object.entries(incomeGroups).map(([group, cats]) => (
                    <div key={group}>
                      <p className="text-pale text-[11px] uppercase tracking-widest mb-2 px-1">{group}</p>
                      <div className="flex flex-col gap-2">
                        {cats.map((cat, i) => {
                          const Icon = getCategoryIcon(cat.income_catagory_name);
                          const color = COLORS[i % COLORS.length];
                          return (
                            <CategoryRow
                              key={cat.income_category_id}
                              icon={<Icon size={18} />}
                              color={color}
                              name={cat.income_catagory_name}
                              badge={cat.income_classification}
                              extra={cat.is_budgetable ? "Budgetable" : undefined}
                              onDelete={() => handleDeleteIncome(cat.income_category_id)}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <AddExpenseCategorySheet isOpen={expenseOpen} onClose={() => setExpenseOpen(false)} />
      <AddIncomeCategorySheet  isOpen={incomeOpen}  onClose={() => setIncomeOpen(false)} />
    </>
  );
}

function CategoryRow({ icon, color, name, badge, extra, onDelete }: {
  icon: React.ReactNode;
  color: string;
  name: string;
  badge?: string;
  extra?: string;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3.5">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: color + "20", color }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">{name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {badge && (
            <span className="text-[10px] text-muted border border-border rounded-full px-2 py-0.5">
              {badge}
            </span>
          )}
          {extra && (
            <span className="text-[10px] text-income border border-income/30 rounded-full px-2 py-0.5">
              {extra}
            </span>
          )}
        </div>
      </div>
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={onDelete}
        className="w-8 h-8 rounded-xl bg-surface flex items-center justify-center shrink-0"
      >
        <Trash2 size={14} className="text-muted" />
      </motion.button>
    </div>
  );
}

function EmptyState({ type, onAdd }: { type: Tab; onAdd: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 px-8 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center mb-4">
        <Tag size={24} className="text-muted" />
      </div>
      <p className="text-white font-semibold text-sm mb-1">No {type} categories</p>
      <p className="text-pale text-xs mb-5">Add your first {type} category to get started.</p>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onAdd}
        className={cn(
          "font-semibold text-white px-6 py-3 rounded-2xl shadow-lg text-sm",
          type === "expense" ? "bg-expense shadow-expense/30" : "bg-income shadow-income/30"
        )}
      >
        Add Category
      </motion.button>
    </motion.div>
  );
}

function CategorySkeleton() {
  return (
    <div className="flex flex-col gap-2 px-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3.5">
          <div className="w-10 h-10 rounded-xl bg-surface animate-pulse shrink-0" />
          <div className="flex-1 flex flex-col gap-2">
            <div className="h-3 w-32 rounded bg-surface animate-pulse" />
            <div className="h-2.5 w-20 rounded bg-surface animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
