"use client";

import { useRef, useState, useCallback } from "react";
import { motion, useAnimation } from "framer-motion";
import { RefreshCw } from "lucide-react";

const THRESHOLD = 72;

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const scrollTop = containerRef.current?.scrollTop ?? 0;
    if (scrollTop === 0) startY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const scrollTop = containerRef.current?.scrollTop ?? 0;
      if (scrollTop > 0 || startY.current === 0) return;
      const delta = Math.max(0, e.touches[0].clientY - startY.current);
      // Resistance: slow down pull as it gets further
      const resistance = delta / (delta + THRESHOLD);
      setPullY(Math.min(delta * resistance, THRESHOLD + 10));
    },
    []
  );

  const handleTouchEnd = useCallback(async () => {
    if (pullY >= THRESHOLD * 0.7 && !refreshing) {
      setRefreshing(true);
      await controls.start({ y: THRESHOLD, transition: { type: "spring", stiffness: 200 } });
      try {
        await onRefresh();
      } finally {
        await controls.start({ y: 0, transition: { type: "spring", stiffness: 200 } });
        setRefreshing(false);
        setPullY(0);
      }
    } else {
      controls.start({ y: 0, transition: { type: "spring", stiffness: 300 } });
      setPullY(0);
    }
    startY.current = 0;
  }, [pullY, refreshing, controls, onRefresh]);

  return (
    <div className="relative overflow-hidden flex-1">
      {/* Refresh indicator */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 flex items-center justify-center transition-opacity"
        style={{
          opacity: pullY > 10 ? Math.min(pullY / THRESHOLD, 1) : 0,
          transform: `translate(-50%, ${pullY * 0.5 - 24}px)`,
        }}
      >
        <motion.div
          animate={refreshing ? { rotate: 360 } : { rotate: (pullY / THRESHOLD) * 180 }}
          transition={refreshing ? { repeat: Infinity, duration: 0.7, ease: "linear" } : {}}
          className="w-8 h-8 rounded-full bg-brand/20 border border-brand/40 flex items-center justify-center"
        >
          <RefreshCw size={14} className="text-brand" />
        </motion.div>
      </div>

      {/* Scrollable content */}
      <motion.div
        ref={containerRef}
        animate={controls}
        style={{ y: refreshing ? undefined : pullY * 0.4 }}
        className="h-full overflow-y-auto"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </motion.div>
    </div>
  );
}
