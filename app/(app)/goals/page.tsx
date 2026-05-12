"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Target, Trophy } from "lucide-react";
import { useGoals, type Goal } from "@/hooks/useGoals";
import { GoalCard } from "@/components/ui/GoalCard";
import { AddGoalSheet } from "@/components/ui/AddGoalSheet";
import { ContributeSheet } from "@/components/ui/ContributeSheet";
import { formatCurrency } from "@/lib/utils";

export default function GoalsPage() {
  const [addOpen, setAddOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const { data: goals, isLoading } = useGoals();

  const activeGoals = (goals ?? []).filter((g) => !g.is_achieved);
  const achievedGoals = (goals ?? []).filter((g) => g.is_achieved);

  const totalTarget = activeGoals.reduce((s, g) => s + g.target_amount, 0);
  const totalSaved = activeGoals.reduce((s, g) => s + g.achieved_amount, 0);
  const overallPct = totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : 0;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-white text-xl font-bold">Goals</h1>
            <p className="text-pale text-xs mt-0.5">
              {activeGoals.length} active · {achievedGoals.length} achieved
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setAddOpen(true)}
            className="w-10 h-10 rounded-2xl bg-brand flex items-center justify-center shadow-lg shadow-brand/30"
          >
            <Plus size={20} className="text-white" />
          </motion.button>
        </div>

        {/* Overall progress card */}
        {activeGoals.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="bg-surface border border-border rounded-2xl px-4 py-3"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-pale text-xs">Overall progress</span>
              <span className="text-brand text-xs font-bold">{Math.round(overallPct)}%</span>
            </div>
            <div className="h-2 bg-black/20 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-brand"
                initial={{ width: 0 }}
                animate={{ width: `${overallPct}%` }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-pale text-[10px]">
                Saved: <span className="text-white font-medium">{formatCurrency(totalSaved)}</span>
              </span>
              <span className="text-pale text-[10px]">
                Target: <span className="text-white font-medium">{formatCurrency(totalTarget)}</span>
              </span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Goal list */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 flex flex-col gap-3">
        {isLoading ? (
          <GoalsSkeleton />
        ) : (goals ?? []).length === 0 ? (
          <EmptyGoals onAdd={() => setAddOpen(true)} />
        ) : (
          <>
            <AnimatePresence mode="popLayout">
              {activeGoals.map((g, i) => (
                <GoalCard
                  key={g.goal_id}
                  goal={g}
                  index={i}
                  onContribute={setSelectedGoal}
                />
              ))}
            </AnimatePresence>

            {achievedGoals.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center gap-2 my-2">
                  <Trophy size={13} className="text-income" />
                  <span className="text-income text-xs font-semibold uppercase tracking-wide">
                    Achieved
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  {achievedGoals.map((g, i) => (
                    <GoalCard
                      key={g.goal_id}
                      goal={g}
                      index={i}
                      onContribute={setSelectedGoal}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>

      <AddGoalSheet isOpen={addOpen} onClose={() => setAddOpen(false)} />
      <ContributeSheet
        goal={selectedGoal}
        isOpen={!!selectedGoal}
        onClose={() => setSelectedGoal(null)}
      />
    </div>
  );
}

function GoalsSkeleton() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
          <div className="w-[88px] h-[88px] rounded-full bg-surface animate-pulse flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 rounded bg-surface animate-pulse" />
            <div className="h-3 w-24 rounded bg-surface animate-pulse" />
            <div className="h-8 w-full rounded-xl bg-surface animate-pulse mt-3" />
          </div>
        </div>
      ))}
    </>
  );
}

function EmptyGoals({ onAdd }: { onAdd: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 px-8 text-center"
    >
      <div className="w-20 h-20 rounded-3xl bg-surface border border-border flex items-center justify-center mb-5">
        <Target size={32} className="text-muted" />
      </div>
      <p className="text-white font-semibold text-base mb-2">No goals yet</p>
      <p className="text-pale text-sm mb-6">
        Set savings goals and track your progress with contributions from any account.
      </p>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onAdd}
        className="bg-brand text-white font-semibold px-6 py-3 rounded-2xl shadow-lg shadow-brand/30"
      >
        Create Goal
      </motion.button>
    </motion.div>
  );
}
