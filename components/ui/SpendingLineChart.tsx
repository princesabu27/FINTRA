"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { ChartPoint } from "@/hooks/useTransactions";
import { formatCurrency } from "@/lib/utils";

interface Props {
  data: ChartPoint[];
}

export function SpendingLineChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1E3357" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: "#4A6FA5", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: "#4A6FA5", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
        />
        <Tooltip
          contentStyle={{
            background: "#0D1F3C",
            border: "1px solid #1E3357",
            borderRadius: "12px",
            fontSize: 12,
          }}
          labelStyle={{ color: "#8BA3C7", marginBottom: 4 }}
          formatter={(value, name) => [
            formatCurrency(Number(value ?? 0)),
            String(name).charAt(0).toUpperCase() + String(name).slice(1),
          ]}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          formatter={(v: string) => (
            <span style={{ color: "#8BA3C7" }}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </span>
          )}
        />
        <Line
          type="monotone"
          dataKey="income"
          stroke="#22C55E"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 5, fill: "#22C55E", strokeWidth: 0 }}
          animationDuration={800}
        />
        <Line
          type="monotone"
          dataKey="expense"
          stroke="#EF4444"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 5, fill: "#EF4444", strokeWidth: 0 }}
          animationDuration={800}
          animationBegin={200}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
