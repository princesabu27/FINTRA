"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { BottomSheet } from "./BottomSheet";
import { createClient } from "@/lib/supabase/client";

interface AddGoalSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddGoalSheet({ isOpen, onClose }: AddGoalSheetProps) {
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [loading, setLoading] = useState(false);

  const queryClient = useQueryClient();

  const reset = useCallback(() => { setName(""); setTarget(""); }, []);
  const handleClose = useCallback(() => { reset(); onClose(); }, [reset, onClose]);

  const handleSubmit = useCallback(async () => {
    if (!name.trim()) { toast.error("Enter a goal name"); return; }
    const num = parseFloat(target);
    if (!num || num <= 0) { toast.error("Enter a valid target amount"); return; }

    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Not authenticated"); setLoading(false); return; }

    // Get user's default currency
    const { data: profile } = await supabase
      .from("profiles")
      .select("default_currency")
      .eq("user_id", user.id)
      .single();

    const currencyCode = profile?.default_currency ?? "INR";

    const { error } = await supabase.from("goals").insert({
      user_id: user.id,
      goal_name: name.trim(),
      target_amount: num,
      achieved_amount: 0,
      remaining_amount: num,
      currency_code: currencyCode,
      is_achieved: false,
    });

    setLoading(false);
    if (error) { toast.error(error.message); return; }

    toast.success("Goal created!");
    await queryClient.invalidateQueries({ queryKey: ["goals"] });
    reset();
    onClose();
  }, [name, target, queryClient, reset, onClose]);

  return (
    <BottomSheet isOpen={isOpen} onClose={handleClose} title="New Goal" fullHeight={false}>
      <div className="flex flex-col gap-5 px-5 pt-2 pb-10">

        {/* Goal name */}
        <div>
          <label className="text-pale text-xs mb-2 block uppercase tracking-wide">Goal Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Emergency Fund"
            className="w-full bg-surface border border-border rounded-2xl px-4 py-3.5 text-white placeholder-muted text-sm focus:outline-none focus:border-brand transition-colors"
          />
        </div>

        {/* Target amount */}
        <div>
          <label className="text-pale text-xs mb-2 block uppercase tracking-wide">Target Amount</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-sm font-semibold">₹</span>
            <input
              type="number"
              inputMode="decimal"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="0"
              className="w-full bg-surface border border-border rounded-2xl pl-8 pr-4 py-3.5 text-white placeholder-muted text-sm focus:outline-none focus:border-brand transition-colors"
            />
          </div>
        </div>

        {/* Quick presets */}
        <div>
          <p className="text-pale text-xs mb-2 uppercase tracking-wide">Quick Presets</p>
          <div className="flex gap-2 flex-wrap">
            {[10000, 25000, 50000, 100000, 500000].map((v) => (
              <motion.button
                key={v}
                whileTap={{ scale: 0.95 }}
                onClick={() => setTarget(String(v))}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                  target === String(v)
                    ? "bg-brand border-brand text-white"
                    : "bg-surface border-border text-pale"
                }`}
              >
                ₹{v >= 100000 ? `${v / 100000}L` : v >= 1000 ? `${v / 1000}K` : v}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-brand py-4 rounded-2xl font-semibold text-white flex items-center justify-center gap-2 shadow-lg shadow-brand/30 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : "Create Goal"}
        </motion.button>
      </div>
    </BottomSheet>
  );
}
