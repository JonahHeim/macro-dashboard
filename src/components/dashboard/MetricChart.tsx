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
      {/* Header row */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-text-secondary text-[11px] font-medium truncate">
            {metric.name}
          </span>
          <div
            className="relative flex-shrink-0"
            onMouseEnter={() => setShowInfo(true)}
            onMouseLeave={() => setShowInfo(false)}
          >
            <button
              type="button"
              className="text-text-muted text-[10px] leading-none hover:text-text-secondary"
              aria-label={`About ${metric.name}`}
              aria-expanded={showInfo}
            >
              ⓘ
            </button>
            {showInfo && (
              <div className="absolute left-0 top-4 z-20 w-64 border border-border bg-surface-elevated p-2 text-[11px] shadow-xl">
                <p className="text-text-secondary">{metric.description}</p>
                <p className="mt-1 text-text-muted">
                  <span className="text-text-secondary">Why it matters:</span>{" "}
                  {metric.interpretation}
                </p>
                <p className="mt-1 text-text-muted">
                  <span className="text-text-secondary">Calculation:</span>{" "}
                  {methodology}
                </p>
              </div>
            )}
          </div>
          <span className="text-text-primary text-[11px] font-mono tabular-nums font-semibold">
            {formatNumber(metric.latestValue, metric.unit)}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Badge value={metric.change1W} label="1W" />
          <Badge value={metric.change1M} label="1M" />
        </div>
      </div>

      {/* Chart */}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 2, right: 2, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={`fill-${metric.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2962FF" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#2962FF" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" hide />
            <YAxis
              domain={["auto", "auto"]}
              tick={{ fill: "#434651", fontSize: 10, fontFamily: "JetBrains Mono, monospace" }}
              width={36}
              tickCount={3}
              tickFormatter={(v: number) => v.toFixed(1)}
            />
            <Tooltip
              content={({ payload, label }) => {
                if (!payload || payload.length === 0) return null;
                const val = payload[0].value as number;
                return (
                  <div className="bg-surface-elevated border border-border-strong px-2 py-1 text-[10px] font-mono shadow-xl">
                    <div className="text-text-muted">{label}</div>
                    <div className="text-text-primary font-semibold">
                      {formatNumber(val, metric.unit)}
                    </div>
                  </div>
                );
              }}
            />
            {metric.thresholdLine !== undefined && (
              <ReferenceLine
                y={metric.thresholdLine}
                stroke="#FF9800"
                strokeDasharray="3 3"
                strokeOpacity={0.6}
              />
            )}
            <Area
              type="monotone"
              dataKey="value"
              stroke="#2962FF"
              strokeWidth={1.5}
              fill={`url(#fill-${metric.id})`}
              isAnimationActive={false}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
