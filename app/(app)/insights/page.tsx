"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RefreshCw, Brain, Target, PieChart, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useInsights, useMarkRead, type InsightType } from "@/hooks/useInsights";
import { InsightCard } from "@/components/ui/InsightCard";

type Filter = "all" | InsightType;

const FILTERS: { key: Filter; label: string; icon: React.ElementType }[] = [
  { key: "all",                 label: "All",     icon: Sparkles    },
  { key: "monthly_summary",     label: "Monthly", icon: Brain       },
  { key: "goal_forecast",       label: "Goals",   icon: Target      },
  { key: "budget_optimization", label: "Budget",  icon: PieChart    },
  { key: "anomaly",             label: "Alerts",  icon: AlertTriangle },
];

const GENERATE_ACTIONS: {
  type: Exclude<InsightType, "anomaly">;
  label: string;
  icon: React.ElementType;
  payload?: Record<string, unknown>;
}[] = [
  { type: "monthly_summary",     label: "Monthly Report",  icon: Brain,    payload: { month: currentMonth() } },
  { type: "goal_forecast",       label: "Goal Forecast",   icon: Target    },
  { type: "budget_optimization", label: "Budget Tips",     icon: PieChart  },
];

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function InsightsPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [generating, setGenerating] = useState<string | null>(null);

  const { data: insights = [], isLoading } = useInsights();
  const { mutate: markRead } = useMarkRead();
  const queryClient = useQueryClient();

  const filtered = filter === "all"
    ? insights
    : insights.filter((i) => i.insight_type === filter);

  const unreadCount = insights.filter((i) => !i.is_read).length;

  const generate = useCallback(async (type: string, payload?: Record<string, unknown>) => {
    setGenerating(type);
    try {
      const res = await fetch("/api/ai/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      toast.success("Insight generated!");
      await queryClient.invalidateQueries({ queryKey: ["insights"] });
    } catch (err) {
      toast.error(String(err));
    } finally {
      setGenerating(null);
    }
  }, [queryClient]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-white text-xl font-bold">AI Insights</h1>
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="bg-brand text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center"
                >
                  {unreadCount}
                </motion.span>
              )}
            </div>
            <p className="text-pale text-xs mt-0.5">Powered by Gemini 2.0 Flash</p>
          </div>
        </div>

        {/* Generate buttons */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {GENERATE_ACTIONS.map((action) => {
            const Icon = action.icon;
            const isLoading = generating === action.type;
            return (
              <motion.button
                key={action.type}
                whileTap={{ scale: 0.95 }}
                onClick={() => generate(action.type, action.payload)}
                disabled={!!generating}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface border border-border text-pale text-xs font-medium whitespace-nowrap flex-shrink-0 disabled:opacity-50 transition-colors hover:border-brand hover:text-brand"
              >
                {isLoading ? (
                  <RefreshCw size={12} className="animate-spin text-brand" />
                ) : (
                  <Icon size={12} />
                )}
                {action.label}
              </motion.button>
            );
          })}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-none">
          {FILTERS.map((f) => {
            const isActive = filter === f.key;
            const count = f.key === "all"
              ? insights.length
              : insights.filter((i) => i.insight_type === f.key).length;
            return (
              <motion.button
                key={f.key}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilter(f.key)}
                className={`relative px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap flex-shrink-0 transition-colors ${
                  isActive ? "bg-brand text-white" : "bg-surface border border-border text-pale"
                }`}
              >
                {f.label}
                {count > 0 && (
                  <span className={`ml-1.5 text-[10px] font-bold ${isActive ? "text-white/70" : "text-muted"}`}>
                    {count}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Insights list */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 flex flex-col gap-3">
        {isLoading ? (
          <InsightsSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyInsights filter={filter} onGenerate={() => generate("monthly_summary", { month: currentMonth() })} />
        ) : (
          <AnimatePresence mode="popLayout">
            {filtered.map((insight, i) => (
              <InsightCard
                key={insight.insight_id}
                insight={insight}
                index={i}
                onRead={markRead}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

function InsightsSkeleton() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-surface animate-pulse" />
            <div className="flex-1 space-y-1.5">
              <div className="h-2.5 w-20 rounded bg-surface animate-pulse" />
              <div className="h-3.5 w-40 rounded bg-surface animate-pulse" />
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="h-3 w-full rounded bg-surface animate-pulse" />
            <div className="h-3 w-4/5 rounded bg-surface animate-pulse" />
            <div className="h-3 w-3/5 rounded bg-surface animate-pulse" />
          </div>
        </div>
      ))}
    </>
  );
}

function EmptyInsights({ filter, onGenerate }: { filter: Filter; onGenerate: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 px-8 text-center"
    >
      <div className="w-20 h-20 rounded-3xl bg-surface border border-border flex items-center justify-center mb-5">
        <Sparkles size={32} className="text-muted" />
      </div>
      <p className="text-white font-semibold text-base mb-2">
        {filter === "all" ? "No insights yet" : `No ${filter.replace("_", " ")} insights`}
      </p>
      <p className="text-pale text-sm mb-6">
        Generate your first AI-powered financial insight using Gemini.
      </p>
      {filter === "all" && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onGenerate}
          className="bg-brand text-white font-semibold px-6 py-3 rounded-2xl shadow-lg shadow-brand/30 flex items-center gap-2"
        >
          <Sparkles size={16} />
          Generate Monthly Report
        </motion.button>
      )}
    </motion.div>
  );
}
