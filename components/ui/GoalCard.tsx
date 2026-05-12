"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { CheckCircle2, Target } from "lucide-react";
import { type Goal } from "@/hooks/useGoals";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

const SIZE = 88;
const STROKE = 7;
const R = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * R;

interface GoalCardProps {
  goal: Goal;
  index: number;
  onContribute: (goal: Goal) => void;
}

export function GoalCard({ goal, index, onContribute }: GoalCardProps) {
  const pct = goal.target_amount > 0
    ? Math.min((goal.achieved_amount / goal.target_amount) * 100, 100)
    : 0;

  const progress = useMotionValue(0);
  const dashOffset = useTransform(progress, (v) =>
    CIRCUMFERENCE - (v / 100) * CIRCUMFERENCE
  );
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;
    const ctrl = animate(progress, pct, {
      duration: 1,
      delay: index * 0.1,
      ease: [0.22, 1, 0.36, 1],
    });
    return ctrl.stop;
  }, [pct, index, progress]);

  const color = goal.is_achieved ? "#22C55E" : pct >= 75 ? "#1B4FFF" : pct >= 40 ? "#F59E0B" : "#4A6FA5";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, type: "spring", stiffness: 200, damping: 22 }}
      className="bg-card border border-border rounded-2xl p-4"
    >
      <div className="flex items-center gap-4">
        {/* Circular progress ring */}
        <div className="relative flex-shrink-0" style={{ width: SIZE, height: SIZE }}>
          <svg width={SIZE} height={SIZE} className="-rotate-90">
            {/* Track */}
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              fill="none"
              stroke="#122040"
              strokeWidth={STROKE}
            />
            {/* Progress */}
            <motion.circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              fill="none"
              stroke={color}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              style={{ strokeDashoffset: dashOffset }}
            />
          </svg>
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {goal.is_achieved ? (
              <CheckCircle2 size={22} className="text-income" />
            ) : (
              <>
                <span className="text-white text-sm font-bold leading-none">{Math.round(pct)}%</span>
                <span className="text-pale text-[9px] mt-0.5">done</span>
              </>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-white font-semibold text-sm truncate">{goal.goal_name}</p>
            {goal.is_achieved && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-income/20 text-income flex-shrink-0">
                Achieved!
              </span>
            )}
          </div>

          <div className="mt-2 flex items-center justify-between">
            <div>
              <p className="text-pale text-[10px]">Saved</p>
              <p className="text-white text-xs font-semibold">{formatCurrency(goal.achieved_amount)}</p>
            </div>
            <div className="text-right">
              <p className="text-pale text-[10px]">Target</p>
              <p className="text-white text-xs font-semibold">{formatCurrency(goal.target_amount)}</p>
            </div>
            <div className="text-right">
              <p className="text-pale text-[10px]">Left</p>
              <p className={cn("text-xs font-semibold", goal.remaining_amount <= 0 ? "text-income" : "text-pale")}>
                {formatCurrency(Math.max(0, goal.remaining_amount))}
              </p>
            </div>
          </div>

          {!goal.is_achieved && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onContribute(goal)}
              className="mt-3 w-full bg-brand/15 border border-brand/30 text-brand text-xs font-semibold py-2 rounded-xl"
            >
              + Contribute
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
