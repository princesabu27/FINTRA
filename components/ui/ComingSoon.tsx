"use client";

import { motion } from "framer-motion";

export function ComingSoon({ title, icon }: { title: string; icon: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-4 text-center px-8">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 16 }}
        className="text-6xl"
      >
        {icon}
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <h2 className="text-white text-xl font-bold">{title}</h2>
        <p className="text-pale text-sm mt-2">Coming in the next phase</p>
      </motion.div>
    </div>
  );
}
