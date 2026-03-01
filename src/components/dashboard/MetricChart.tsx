"use client";

import React, { useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { MetricWithData } from "@/types/metrics";
import { formatNumber } from "@/lib/formatting";
import Badge from "@/components/ui/Badge";

interface MetricChartProps {
  metric: MetricWithData;
  height?: number;
}

function buildMethodologyText(metric: MetricWithData): string {
  const id = metric.id.toLowerCase();
  const name = metric.name.toLowerCase();

  if (id.includes("yoy") || name.includes("yoy")) {
    return "Year-over-year percent change: ((current / value one year ago) - 1) * 100.";
  }
  if (id.includes("spread") || name.includes("spread")) {
    return "Spread metric: difference between two underlying rates/series, shown in the metric unit.";
  }
  if (id.includes("ratio") || name.includes("ratio")) {
    return "Ratio metric: one asset/series divided by another to show relative performance or risk appetite.";
  }
  if (id.includes("breakeven") || id.includes("yield") || id.includes("fed-funds")) {
    return "Direct market/economic level from the source series; the plotted value is the latest observed reading.";
  }
  if (id.includes("proxy")) {
    return "Proxy metric: derived approximation built from related observable market/economic series.";
  }

  return "Source series level metric: latest reading from the normalized time series.";
}

export default function MetricChart({ metric, height = 100 }: MetricChartProps) {
  const [showInfo, setShowInfo] = useState(false);
  const methodology = useMemo(() => buildMethodologyText(metric), [metric]);
  const chartData = metric.series.map((pt) => ({
    date: pt.date,
    value: pt.value,
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-text-secondary text-sm font-medium">
            {metric.name}
          </span>
          <div
            className="relative"
            onMouseEnter={() => setShowInfo(true)}
            onMouseLeave={() => setShowInfo(false)}
          >
            <button
              type="button"
              className="h-4 w-4 rounded-full border border-border text-[10px] leading-none text-text-muted hover:text-text-secondary"
              aria-label={`About ${metric.name}`}
              aria-expanded={showInfo}
            >
              i
            </button>
            {showInfo && (
              <div className="absolute left-0 top-5 z-20 w-64 rounded-md border border-border bg-surface-elevated p-2 text-xs shadow-lg">
                <p className="text-text-secondary">{metric.description}</p>
                <p className="mt-1 text-text-muted">
                  <span className="font-medium text-text-secondary">Why it matters:</span>{" "}
                  {metric.interpretation}
                </p>
                <p className="mt-1 text-text-muted">
                  <span className="font-medium text-text-secondary">How it is calculated:</span>{" "}
                  {methodology}
                </p>
              </div>
            )}
          </div>
          <span className="text-text-primary text-sm font-mono tabular-nums">
            {formatNumber(metric.latestValue, metric.unit)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge value={metric.change1W} label="1W" />
          <Badge value={metric.change1M} label="1M" />
        </div>
      </div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={`fill-${metric.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.15} />
                <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" hide />
            <YAxis
              domain={["auto", "auto"]}
              tick={{ fill: "#64748B", fontSize: 10 }}
              width={40}
              tickCount={3}
              tickFormatter={(v: number) => v.toFixed(1)}
            />
            <Tooltip
              content={({ payload, label }) => {
                if (!payload || payload.length === 0) return null;
                const val = payload[0].value as number;
                return (
                  <div className="bg-surface-elevated border border-border rounded px-2 py-1 text-xs">
                    <div className="text-text-muted">{label}</div>
                    <div className="text-text-primary font-mono">
                      {formatNumber(val, metric.unit)}
                    </div>
                  </div>
                );
              }}
            />
            {metric.thresholdLine !== undefined && (
              <ReferenceLine
                y={metric.thresholdLine}
                stroke="#F59E0B"
                strokeDasharray="4 4"
                strokeOpacity={0.5}
              />
            )}
            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--color-accent)"
              strokeWidth={1.5}
              fill={`url(#fill-${metric.id})`}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
