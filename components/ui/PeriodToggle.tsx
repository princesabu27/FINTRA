"use client";

import { motion } from "framer-motion";
import type { Period } from "@/hooks/useTransactions";
import { cn } from "@/lib/utils";

const periods: { value: Period; label: string }[] = [
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
];

interface PeriodToggleProps {
  value: Period;
  onChange: (p: Period) => void;
}

export function PeriodToggle({ value, onChange }: PeriodToggleProps) {
  return (
    <div className="bg-surface rounded-2xl p-1 flex gap-1">
      {periods.map((p) => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className={cn(
            "relative flex-1 py-2 text-sm font-medium rounded-xl transition-colors z-10",
            value === p.value ? "text-white" : "text-muted"
          )}
        >
          {value === p.value && (
            <motion.div
              layoutId="period-bg"
              className="absolute inset-0 bg-brand rounded-xl -z-10"
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            />
          )}
          {p.label}
        </button>
      ))}
    </div>
  );
}
