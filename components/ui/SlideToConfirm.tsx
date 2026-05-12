"use client";

import { useRef, useCallback, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";

interface SlideToConfirmProps {
  label: string;
  onConfirm: () => void;
  disabled?: boolean;
  color?: "brand" | "expense" | "income";
}

const THUMB_W = 56;

const COLOR_MAP = {
  brand:   { bg: "#6C63FF", track: "#122040", border: "#1E3357", shadow: "rgba(108,99,255,0.4)" },
  expense: { bg: "#FF5C7A", track: "#200d12", border: "#331522", shadow: "rgba(255,92,122,0.4)" },
  income:  { bg: "#00E5A0", track: "#062018", border: "#0d3322", shadow: "rgba(0,229,160,0.4)"  },
};

export function SlideToConfirm({ label, onConfirm, disabled = false, color = "brand" }: SlideToConfirmProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const [confirmed, setConfirmed] = useState(false);
  const { bg, track, border, shadow } = COLOR_MAP[color];

  const trackWidth = useCallback(() => {
    return (trackRef.current?.offsetWidth ?? 300) - THUMB_W - 8;
  }, []);

  const bgOpacity = useTransform(x, [0, trackWidth()], [0, 1]);
  const labelOpacity = useTransform(x, [0, trackWidth() * 0.4], [1, 0]);

  const handleDragEnd = useCallback(
    (_: unknown, info: { velocity: { x: number } }) => {
      if (disabled) return;
      const maxX = trackWidth();
      const threshold = maxX * 0.75;

      if (x.get() > threshold || info.velocity.x > 800) {
        animate(x, maxX, { duration: 0.15 }).then(() => {
          setConfirmed(true);
          onConfirm();
          setTimeout(() => {
            setConfirmed(false);
            animate(x, 0, { type: "spring", stiffness: 300, damping: 28 });
          }, 1200);
        });
      } else {
        animate(x, 0, { type: "spring", stiffness: 400, damping: 30 });
      }
    },
    [x, trackWidth, disabled, onConfirm]
  );

  return (
    <div
      ref={trackRef}
      className={`relative h-14 rounded-2xl overflow-hidden ${disabled ? "opacity-50 pointer-events-none" : ""}`}
      style={{ background: track, border: `1px solid ${border}` }}
    >
      {/* Fill highlight */}
      <motion.div
        className="absolute inset-0 rounded-2xl"
        style={{ opacity: bgOpacity, backgroundColor: bg }}
      />

      {/* Label */}
      <motion.span
        className="absolute inset-0 flex items-center justify-center text-pale text-sm font-semibold pointer-events-none select-none"
        style={{ opacity: labelOpacity }}
      >
        {label}
      </motion.span>

      {/* Thumb */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: trackWidth() }}
        dragElastic={0}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        style={{ x, left: 4, top: 4, backgroundColor: bg, boxShadow: `0 4px 20px ${shadow}` }}
        className="absolute w-[56px] h-[calc(100%-8px)] rounded-xl flex items-center justify-center cursor-grab active:cursor-grabbing z-10"
        whileTap={{ scale: 0.95 }}
      >
        {confirmed ? (
          <motion.div initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
            <Check size={22} className="text-white" />
          </motion.div>
        ) : (
          <motion.div animate={{ x: [0, 4, 0] }} transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}>
            <ArrowRight size={22} className="text-white" />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
