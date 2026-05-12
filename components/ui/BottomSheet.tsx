"use client";

import { useRef, useCallback } from "react";
import { motion, AnimatePresence, useDragControls, useMotionValue } from "framer-motion";
import { X } from "lucide-react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** Full height (default) or auto height */
  fullHeight?: boolean;
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  fullHeight = true,
}: BottomSheetProps) {
  const dragControls = useDragControls();
  const y = useMotionValue(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  const handleDragEnd = useCallback(
    (_: unknown, info: { velocity: { y: number }; offset: { y: number } }) => {
      const shouldClose = info.velocity.y > 400 || info.offset.y > 200;
      if (shouldClose) {
        onClose();
      } else {
        y.set(0);
      }
    },
    [onClose, y]
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            ref={sheetRef}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%", transition: { type: "spring", stiffness: 400, damping: 40 } }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            drag="y"
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={handleDragEnd}
            style={{ y }}
            className={`fixed bottom-18 left-0 right-0 z-50 max-w-md mx-auto glass-strong rounded-t-3xl overflow-hidden flex flex-col ${
              fullHeight ? "h-[calc(92vh-4.5rem)]" : "max-h-[calc(92vh-4.5rem)]"
            }`}
          >
            {/* Drag handle */}
            <div
              className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing flex-shrink-0"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <motion.div
                className="w-10 h-1 rounded-full bg-border"
                whileHover={{ scaleX: 1.3, backgroundColor: "rgba(108,99,255,0.6)" }}
                transition={{ duration: 0.2 }}
              />
            </div>

            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-5 py-3 flex-shrink-0">
                <h2 className="text-white font-semibold text-base">{title}</h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-pale hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
