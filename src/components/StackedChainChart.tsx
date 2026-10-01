"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHAIN_META, ChainDayRow, ChainId } from "@/lib/dune";
import { formatCompactNumber, formatCompactUsd, formatDate } from "@/lib/format";

type Metric = "aum" | "volume" | "txCount" | "wallets";

const CHAIN_ORDER: ChainId[] = ["solana", "ethereum", "base", "tempo"];

function pivot(rows: ChainDayRow[], metric: Metric) {
  const byDate = new Map<string, Record<string, number | string>>();
  for (const row of rows) {
    const entry = byDate.get(row.date) ?? { date: row.date };
    entry[row.chain] = row[metric] ?? 0;
    byDate.set(row.date, entry);
  }
  return [...byDate.values()].sort((a, b) =>
    String(a.date).localeCompare(String(b.date))
  );
}

export function StackedChainChart({
  rows,
  metric,
  title,
  isCurrency,
}: {
  rows: ChainDayRow[];
  metric: Metric;
  title: string;
  isCurrency: boolean;
}) {
  const data = pivot(rows, metric);
  const formatter = isCurrency ? formatCompactUsd : formatCompactNumber;

  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h3 className="text-sm font-medium text-white/70">{title}</h3>
        <div className="flex h-56 items-center justify-center text-sm text-white/30">
          No live history yet — connect DUNE_API_KEY to populate this chart.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h3 className="text-sm font-medium text-white/70">{title}</h3>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={(d) => formatDate(String(d))}
              stroke="rgba(255,255,255,0.3)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              minTickGap={24}
            />
            <YAxis
              tickFormatter={(v) => formatter(Number(v))}
              stroke="rgba(255,255,255,0.3)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={56}
            />
            <Tooltip
              formatter={(value) => formatter(Number(value))}
              labelFormatter={(d) => formatDate(String(d))}
              contentStyle={{
                background: "#0b0b14",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12,
                fontSize: 12,
              }}
            />
            <Legend
              formatter={(value) => CHAIN_META[value as ChainId]?.label ?? value}
              wrapperStyle={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}
            />
            {CHAIN_ORDER.map((chain) => (
              <Area
                key={chain}
                type="monotone"
                dataKey={chain}
                stackId="1"
                stroke={CHAIN_META[chain].color}
                fill={CHAIN_META[chain].color}
                fillOpacity={chain === "solana" ? 0.5 : 0.25}
                strokeWidth={chain === "solana" ? 2 : 1}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
