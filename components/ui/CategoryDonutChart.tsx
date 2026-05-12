"use client";

import { memo } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import type { CategoryPoint } from "@/hooks/useTransactions";
import { formatCurrency } from "@/lib/utils";

const COLORS = [
  "#1B4FFF", "#22C55E", "#EF4444", "#F59E0B",
  "#8B5CF6", "#EC4899", "#14B8A6", "#F97316",
];

interface Props { data: CategoryPoint[] }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 text-xs">
      <p className="text-white font-semibold">{payload[0].name}</p>
      <p className="text-pale mt-0.5">{formatCurrency(payload[0].value)}</p>
    </div>
  );
}

export const CategoryDonutChart = memo(function CategoryDonutChart({ data }: Props) {
  if (!data.length) return (
    <div className="h-55 flex items-center justify-center text-muted text-sm">No data</div>
  );

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
            animationBegin={0}
            animationDuration={700}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      {/* Centre label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <p className="text-pale text-[10px] uppercase tracking-wide">Total</p>
        <p className="text-white font-bold text-sm">{formatCurrency(total)}</p>
      </div>
      {/* Legend */}
      <div className="flex flex-col gap-1.5 mt-2 px-2">
        {data.slice(0, 5).map((d, i) => (
          <div key={d.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
              <span className="text-pale text-xs truncate max-w-30">{d.name}</span>
            </div>
            <span className="text-white text-xs font-medium">{((d.value / total) * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
});
