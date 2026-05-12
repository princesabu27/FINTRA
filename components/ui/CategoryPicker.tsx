"use client";

import { motion } from "framer-motion";
import {
  Utensils, ShoppingCart, Zap, Car, Home, Heart, Gamepad2,
  Plane, GraduationCap, TrendingUp, Briefcase, Gift, Coffee,
  Smartphone, Shirt, Droplets, Wifi, MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Maps keyword in category name → icon
const iconMap: [string, React.ElementType][] = [
  ["food", Utensils], ["grocery", ShoppingCart], ["electric", Zap],
  ["transport", Car], ["rent", Home], ["health", Heart],
  ["entertainment", Gamepad2], ["travel", Plane], ["education", GraduationCap],
  ["invest", TrendingUp], ["salary", Briefcase], ["gift", Gift],
  ["coffee", Coffee], ["phone", Smartphone], ["cloth", Shirt],
  ["water", Droplets], ["internet", Wifi],
];

export function getCategoryIcon(name: string): React.ElementType {
  const lower = name.toLowerCase();
  for (const [key, Icon] of iconMap) {
    if (lower.includes(key)) return Icon;
  }
  return MoreHorizontal;
}

const COLORS = [
  "#1B4FFF", "#22C55E", "#EF4444", "#F59E0B", "#8B5CF6",
  "#EC4899", "#06B6D4", "#F97316", "#14B8A6", "#6366F1",
];

interface CategoryPickerProps<T extends { id: string; name: string }> {
  categories: T[];
  selected: string | null;
  onSelect: (id: string) => void;
  loading?: boolean;
}

export function CategoryPicker<T extends { id: string; name: string }>({
  categories,
  selected,
  onSelect,
  loading,
}: CategoryPickerProps<T>) {
  if (loading) {
    return (
      <div className="flex gap-3 overflow-x-auto px-5 pb-2 no-scrollbar">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-2xl bg-surface animate-pulse" />
            <div className="w-12 h-3 rounded bg-surface animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <p className="px-5 text-pale text-sm">
        No categories found. Add some in your Supabase dashboard.
      </p>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto px-5 pb-2 no-scrollbar">
      {categories.map((cat, i) => {
        const Icon = getCategoryIcon(cat.name);
        const color = COLORS[i % COLORS.length];
        const isSelected = selected === cat.id;

        return (
          <motion.button
            key={cat.id}
            whileTap={{ scale: 0.9 }}
            onClick={() => onSelect(cat.id)}
            className="flex-shrink-0 flex flex-col items-center gap-2"
          >
            <div
              className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center transition-all border-2",
                isSelected ? "border-white scale-105" : "border-transparent"
              )}
              style={{ backgroundColor: color + "25", color }}
            >
              <Icon size={22} />
            </div>
            <span
              className={cn(
                "text-[10px] font-medium text-center w-16 truncate",
                isSelected ? "text-white" : "text-pale"
              )}
            >
              {cat.name}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
