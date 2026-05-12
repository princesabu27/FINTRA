"use client";

import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip,
} from "recharts";
import type { NetWorthPoint } from "@/hooks/useTransactions";
import { formatCurrency } from "@/lib/utils";

interface Props { data: NetWorthPoint[] }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 text-xs">
      <p className="text-pale mb-0.5">{label}</p>
      <p className={`font-semibold ${val >= 0 ? "text-income" : "text-expense"}`}>
        {formatCurrency(val)}
      </p>
    </div>
  );
}

export function NetWorthChart({ data }: Props) {
  if (!data.length) return (
    <div className="h-[180px] flex items-center justify-center text-muted text-sm">No data</div>
  );

  const positive = (data[data.length - 1]?.balance ?? 0) >= 0;
  const color = positive ? "#22C55E" : "#EF4444";

  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.25} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1E3357" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: "#4A6FA5", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fill: "#4A6FA5", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `₹${Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="balance"
          stroke={color}
          strokeWidth={2}
          fill="url(#netGrad)"
          dot={{ fill: color, r: 3, strokeWidth: 0 }}
          animationDuration={700}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
