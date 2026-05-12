"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { BottomSheet } from "./BottomSheet";
import { createClient } from "@/lib/supabase/client";

const HEALTH_COLOR = (pct: number) =>
  pct >= 40 ? "#EF4444" : pct >= 20 ? "#F59E0B" : "#1B4FFF";

interface AddBudgetSheetProps {
  isOpen: boolean;
  onClose: () => void;
  totalAllocated: number; // sum of existing budget percentages
}

export function AddBudgetSheet({ isOpen, onClose, totalAllocated }: AddBudgetSheetProps) {
  const [name, setName]           = useState("");
  const [percentage, setPercentage] = useState(10);
  const [description, setDescription] = useState("");
  const [loading, setLoading]     = useState(false);

  const queryClient = useQueryClient();
  const remaining   = Math.max(0, 100 - totalAllocated);
  const wouldExceed = totalAllocated + percentage > 100;
  const overage     = Math.max(0, totalAllocated + percentage - 100);
  const barColor    = wouldExceed ? "#EF4444" : HEALTH_COLOR(percentage);

  const reset = useCallback(() => {
    setName("");
    setPercentage(10);
    setDescription("");
  }, []);

  const handleClose = useCallback(() => { reset(); onClose(); }, [reset, onClose]);

  const handleSubmit = useCallback(async () => {
    if (!name.trim()) { toast.error("Enter a budget name"); return; }
    if (percentage <= 0) { toast.error("Percentage must be greater than 0"); return; }
    if (totalAllocated + percentage > 100) {
      toast.error(`Only ${remaining}% of income is unallocated`);
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Not authenticated"); setLoading(false); return; }

    const { error } = await supabase.from("budgets").insert({
      user_id: user.id,
      budget_name: name.trim(),
      budget_percentage: percentage,
      description: description.trim() || null,
      is_active: true,
    });

    setLoading(false);
    if (error) { toast.error(error.message); return; }

    toast.success("Budget created!");
    await queryClient.invalidateQueries({ queryKey: ["budgets"] });
    reset();
    onClose();
  }, [name, percentage, description, totalAllocated, remaining, queryClient, reset, onClose]);

  return (
    <BottomSheet isOpen={isOpen} onClose={handleClose} title="New Budget" fullHeight={false}>
      <div className="flex flex-col gap-5 px-5 pt-2 pb-10">

        {/* Budget name */}
        <div>
          <label className="text-pale text-xs mb-2 block uppercase tracking-wide">Budget Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Food & Dining"
            className="w-full bg-surface border border-border rounded-2xl px-4 py-3.5 text-white placeholder-muted text-sm focus:outline-none focus:border-brand transition-colors"
          />
        </div>

        {/* Percentage slider */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-pale text-xs uppercase tracking-wide">Allocation</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPercentage((p) => Math.max(1, p - 1))}
                className="w-7 h-7 rounded-lg bg-surface border border-border text-white text-sm font-bold flex items-center justify-center"
              >−</button>
              <span className="text-2xl font-bold w-16 text-center" style={{ color: barColor }}>
                {percentage}%
              </span>
              <button
                onClick={() => setPercentage((p) => Math.min(100, p + 1))}
                className="w-7 h-7 rounded-lg bg-surface border border-border text-white text-sm font-bold flex items-center justify-center"
              >+</button>
            </div>
          </div>

          {/* Slider */}
          <input
            type="range"
            min={1}
            max={100}
            value={percentage}
            onChange={(e) => setPercentage(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, ${barColor} ${percentage}%, #1E3357 ${percentage}%)`,
            }}
          />

          {/* Stacked allocation bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-pale text-[10px]">Income allocation</span>
              <span className={`text-[10px] font-medium ${wouldExceed ? "text-expense" : "text-income"}`}>
                {totalAllocated + percentage}% / 100%
              </span>
            </div>
            <div className="h-3 bg-surface rounded-full overflow-hidden flex">
              {/* Already allocated */}
              <motion.div
                className="h-full bg-brand/50"
                animate={{ width: `${Math.min(totalAllocated, 100)}%` }}
                transition={{ duration: 0.3 }}
              />
              {/* New allocation */}
              <motion.div
                className="h-full"
                style={{ background: wouldExceed ? "#EF4444" : "#22C55E" }}
                animate={{ width: `${Math.min(percentage, 100 - totalAllocated)}%` }}
                transition={{ duration: 0.3 }}
              />
              {/* Overage indicator */}
              {overage > 0 && (
                <motion.div
                  className="h-full bg-expense/60"
                  animate={{ width: `${overage}%` }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </div>
            <div className="flex items-center justify-between mt-2 text-[10px]">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-brand/50 inline-block" />
                  <span className="text-pale">Existing {totalAllocated}%</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ background: wouldExceed ? "#EF4444" : "#22C55E" }} />
                  <span className="text-pale">This {Math.min(percentage, remaining)}%</span>
                </span>
              </div>
              <span className={remaining === 0 ? "text-expense" : remaining < 10 ? "text-amber-400" : "text-income"}>
                {remaining}% free
              </span>
            </div>
          </div>

          {/* Overflow warning */}
          <AnimatePresence>
            {wouldExceed && (
              <motion.div
                initial={{ opacity: 0, y: -6, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -6, height: 0 }}
                className="mt-3 bg-expense/10 border border-expense/30 rounded-2xl px-4 py-3"
              >
                <p className="text-expense text-xs font-medium">
                  Exceeds 100% by {overage}% — reduce to {remaining}% or less.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Full allocation warning */}
          <AnimatePresence>
            {remaining === 0 && !wouldExceed && (
              <motion.div
                initial={{ opacity: 0, y: -6, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -6, height: 0 }}
                className="mt-3 bg-amber-400/10 border border-amber-400/30 rounded-2xl px-4 py-3"
              >
                <p className="text-amber-400 text-xs font-medium">
                  100% of income is already allocated. Remove or reduce an existing budget first.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Description */}
        <div>
          <label className="text-pale text-xs mb-2 block uppercase tracking-wide">
            Description <span className="normal-case">(optional)</span>
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this budget for?"
            className="w-full bg-surface border border-border rounded-2xl px-4 py-3.5 text-white placeholder-muted text-sm focus:outline-none focus:border-brand transition-colors"
          />
        </div>

        {/* Submit */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSubmit}
          disabled={loading || wouldExceed || remaining === 0}
          className="w-full bg-brand py-4 rounded-2xl font-semibold text-white flex items-center justify-center gap-2 shadow-lg shadow-brand/30 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : wouldExceed ? (
            `Reduce by ${overage}%`
          ) : remaining === 0 ? (
            "No allocation left"
          ) : (
            `Create Budget · ${percentage}%`
          )}
        </motion.button>
      </div>
    </BottomSheet>
  );
}
