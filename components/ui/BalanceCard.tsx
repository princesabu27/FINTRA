"use client";

import { useEffect } from "react";
import { motion, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, TrendingUp } from "lucide-react";
import { useAmountsVisible } from "@/store/amountsVisible";

interface BalanceCardProps {
  totalBalance: number;
  firstName: string;
  currency?: string;
}

export function BalanceCard({
  totalBalance,
  firstName,
  currency = "INR",
}: BalanceCardProps) {
  const { visible, toggle } = useAmountsVisible();

  const spring = useSpring(0, { stiffness: 60, damping: 20 });
  const display = useTransform(spring, (v) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(v)
  );

  useEffect(() => {
    spring.set(totalBalance);
  }, [totalBalance, spring]);

  return (
    <div className="relative mx-4 rounded-3xl overflow-hidden p-6 shadow-2xl shadow-brand/20"
      style={{
        background: "linear-gradient(135deg, rgba(108,99,255,0.45) 0%, rgba(0,229,160,0.20) 100%)",
        backdropFilter: "blur(32px)",
        WebkitBackdropFilter: "blur(32px)",
        border: "1px solid rgba(255,255,255,0.15)",
      }}
    >
      {/* Breathing orb 1 */}
      <motion.div
        className="absolute -top-12 -right-12 w-48 h-48 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(108,99,255,0.35) 0%, transparent 70%)" }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Breathing orb 2 */}
      <motion.div
        className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(0,229,160,0.20) 0%, transparent 70%)" }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
      />

      <div className="relative z-10">
        {/* Greeting */}
        <p className="text-white/70 text-sm font-medium mb-1">
          Good {getTimeOfDay()}, {firstName} 👋
        </p>

        {/* Balance */}
        <div className="flex items-center gap-3 mt-2">
          <div className="relative overflow-hidden">
            <AnimatePresence mode="wait">
              {!visible ? (
                <motion.span
                  key="hidden"
                  initial={{ opacity: 0, filter: "blur(8px)" }}
                  animate={{ opacity: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, filter: "blur(8px)" }}
                  transition={{ duration: 0.25 }}
                  className="text-4xl font-bold tracking-tight gradient-text block"
                >
                  ••••••
                </motion.span>
              ) : (
                <motion.span
                  key="visible"
                  initial={{ opacity: 0, filter: "blur(8px)", y: 6 }}
                  animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                  exit={{ opacity: 0, filter: "blur(8px)", y: -6 }}
                  transition={{ duration: 0.3 }}
                  className="text-4xl font-bold tracking-tight gradient-text block"
                >
                  {display}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <motion.button
            whileTap={{ scale: 0.85, rotate: 15 }}
            whileHover={{ scale: 1.1 }}
            onClick={toggle}
            className="text-white/50 hover:text-white transition-colors"
          >
            <AnimatePresence mode="wait">
              {visible ? (
                <motion.div key="eye" initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: 20 }} transition={{ duration: 0.18 }}>
                  <Eye size={18} />
                </motion.div>
              ) : (
                <motion.div key="eye-off" initial={{ scale: 0, rotate: 20 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: -20 }} transition={{ duration: 0.18 }}>
                  <EyeOff size={18} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        <p className="text-white/50 text-sm mt-1">Total net worth</p>

        {/* Bottom row */}
        <div className="flex items-center justify-between mt-5">
          <motion.div
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
            style={{ background: "rgba(0,229,160,0.15)", border: "1px solid rgba(0,229,160,0.25)" }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <TrendingUp size={14} className="text-income" />
            </motion.div>
            <span className="text-xs font-medium text-income">This month</span>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
