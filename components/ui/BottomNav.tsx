"use client";

import { memo, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, PieChart, Plus, X,
  Wallet, Clock, TrendingDown, TrendingUp, ArrowLeftRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const LEFT_TABS  = [
  { href: "/",        icon: Home,     label: "Home"    },
  { href: "/budgets", icon: PieChart, label: "Budgets" },
];
const RIGHT_TABS = [
  { href: "/accounts", icon: Wallet, label: "Accounts" },
  { href: "/history",  icon: Clock,  label: "History"  },
];

const FAB_ACTIONS = [
  { key: "expense",  label: "Expense",  icon: TrendingDown,   bg: "bg-expense",  shadow: "shadow-expense/40"  },
  { key: "income",   label: "Income",   icon: TrendingUp,     bg: "bg-income",   shadow: "shadow-income/40"   },
  { key: "transfer", label: "Transfer", icon: ArrowLeftRight, bg: "bg-brand",    shadow: "shadow-brand/40"    },
] as const;

export const BottomNav = memo(function BottomNav() {
  const pathname  = usePathname();
  const router    = useRouter();
  const [fabOpen, setFabOpen] = useState(false);

  const handleAction = useCallback((key: typeof FAB_ACTIONS[number]["key"]) => {
    setFabOpen(false);
    if (key === "transfer") {
      router.push("/pay");
    } else if (key === "expense") {
      router.push("/add/expense");
    } else {
      router.push("/add/income");
    }
  }, [router]);

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {fabOpen && (
          <motion.div
            key="fab-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setFabOpen(false)}
            className="fixed inset-0 z-40 bg-black/50"
          />
        )}
      </AnimatePresence>

      <nav className="fixed bottom-0 left-0 right-0 z-50 max-w-2xl mx-auto">
        {/* FAB action bubbles */}
        <AnimatePresence>
          {fabOpen && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 flex flex-col items-center gap-3">
              {[...FAB_ACTIONS].reverse().map((action, i) => {
                const Icon = action.icon;
                return (
                  <motion.div
                    key={action.key}
                    initial={{ opacity: 0, y: 20, scale: 0.7 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 16, scale: 0.7 }}
                    transition={{ type: "spring", stiffness: 400, damping: 28, delay: i * 0.05 }}
                    className="flex items-center gap-3"
                  >
                    <motion.span
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      transition={{ delay: i * 0.05 + 0.05 }}
                      className="text-white text-sm font-semibold glass px-3 py-1.5 rounded-xl shadow-lg"
                    >
                      {action.label}
                    </motion.span>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleAction(action.key)}
                      className={`w-12 h-12 rounded-full ${action.bg} flex items-center justify-center shadow-lg ${action.shadow}`}
                    >
                      <Icon size={20} className="text-white" />
                    </motion.button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>

        <div className="glass-nav pb-safe px-2">
          <div className="flex items-center justify-around">
            {LEFT_TABS.map((tab) => (
              <NavTab key={tab.href} tab={tab} pathname={pathname} />
            ))}

            {/* FAB */}
            <button
              onClick={() => setFabOpen((o) => !o)}
              className="relative flex flex-col items-center -mt-5"
            >
              <motion.div
                animate={fabOpen ? { rotate: 45, scale: 1 } : { rotate: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-brand/40"
                style={{ background: "linear-gradient(135deg, #6C63FF 0%, #00E5A0 100%)" }}
              >
                {fabOpen ? <X size={26} className="text-white" /> : <Plus size={26} className="text-white" />}
              </motion.div>
              <span className="text-[10px] font-semibold mt-1" style={{ color: "#00E5A0" }}>Add</span>
            </button>

            {RIGHT_TABS.map((tab) => (
              <NavTab key={tab.href} tab={tab} pathname={pathname} />
            ))}
          </div>
        </div>
      </nav>
    </>
  );
});

function NavTab({ tab, pathname }: {
  tab: { href: string; icon: React.ElementType; label: string };
  pathname: string;
}) {
  const isActive = pathname === tab.href;
  const Icon = tab.icon;
  return (
    <Link href={tab.href} className="flex flex-col items-center py-2.5 px-3 gap-1">
      <motion.div whileTap={{ scale: 0.85 }} className="relative">
        {/* Active pill background */}
        {isActive && (
          <motion.div
            layoutId="nav-pill"
            className="absolute inset-0 -m-2 rounded-2xl"
            style={{ background: "rgba(108,99,255,0.18)", border: "1px solid rgba(108,99,255,0.30)" }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        )}
        <Icon
          size={22}
          className="relative z-10 transition-colors duration-200"
          style={{ color: isActive ? "#6C63FF" : "#5B6A8A" }}
        />
      </motion.div>
      <span
        className="text-[10px] font-semibold transition-colors duration-200"
        style={{ color: isActive ? "#6C63FF" : "#5B6A8A" }}
      >
        {tab.label}
      </span>
    </Link>
  );
}
