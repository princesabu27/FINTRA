"use client";

import { motion } from "framer-motion";
import { Brain, TrendingUp, Target, AlertTriangle, PieChart, CheckCircle2 } from "lucide-react";
import { type Insight, type InsightType } from "@/hooks/useInsights";
import { cn } from "@/lib/utils";

const TYPE_CONFIG: Record<InsightType, {
  icon: React.ElementType;
  label: string;
  accent: string;
  bg: string;
  border: string;
}> = {
  monthly_summary: {
    icon: Brain,
    label: "Monthly Summary",
    accent: "text-brand",
    bg: "bg-brand/10",
    border: "border-brand/20",
  },
  goal_forecast: {
    icon: Target,
    label: "Goal Forecast",
    accent: "text-income",
    bg: "bg-income/10",
    border: "border-income/20",
  },
  anomaly: {
    icon: AlertTriangle,
    label: "Anomaly Alert",
    accent: "text-expense",
    bg: "bg-expense/10",
    border: "border-expense/20",
  },
  budget_optimization: {
    icon: PieChart,
    label: "Budget Tips",
    accent: "text-warning",
    bg: "bg-warning/10",
    border: "border-warning/20",
  },
};

const SEVERITY_STYLES = {
  warning: "bg-warning/20 text-warning",
  critical: "bg-expense/20 text-expense",
};

interface InsightCardProps {
  insight: Insight;
  index: number;
  onRead: (id: string) => void;
}

export function InsightCard({ insight, index, onRead }: InsightCardProps) {
  const cfg = TYPE_CONFIG[insight.insight_type] ?? TYPE_CONFIG.monthly_summary;
  const Icon = cfg.icon;

  const date = new Date(insight.created_at).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, type: "spring", stiffness: 200, damping: 22 }}
      onClick={() => { if (!insight.is_read) onRead(insight.insight_id); }}
      className={cn(
        "rounded-2xl p-4 border transition-opacity cursor-default",
        cfg.bg, cfg.border,
        !insight.is_read && "ring-1 ring-inset ring-white/5"
      )}
    >
      {/* Header row */}
      <div className="flex items-start gap-3 mb-3">
        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0", cfg.bg, "border", cfg.border)}>
          <Icon size={16} className={cfg.accent} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn("text-[10px] font-semibold uppercase tracking-wide", cfg.accent)}>
              {cfg.label}
            </span>
            {insight.severity && (
              <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize", SEVERITY_STYLES[insight.severity])}>
                {insight.severity}
              </span>
            )}
            {!insight.is_read && (
              <span className="w-1.5 h-1.5 rounded-full bg-brand flex-shrink-0" />
            )}
          </div>
          <p className="text-white font-semibold text-sm mt-0.5 leading-snug">{insight.title}</p>
        </div>

        {insight.is_read && (
          <CheckCircle2 size={14} className="text-muted flex-shrink-0 mt-0.5" />
        )}
      </div>

      {/* Content */}
      <p className="text-pale text-sm leading-relaxed">{insight.content}</p>

      {/* Footer */}
      <p className="text-muted text-[10px] mt-3">{date}</p>
    </motion.div>
  );
}
