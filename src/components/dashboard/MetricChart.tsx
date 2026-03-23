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
  const valueTone = metric.change1M > 0.01 ? "text-positive" : metric.change1M < -0.01 ? "text-negative" : "text-text-primary";

  return (
    <div className="terminal-data-chip overflow-hidden px-3 py-3">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[11px] font-medium text-text-secondary">
              {metric.name}
            </span>
            <div
              className="relative flex-shrink-0"
              onMouseEnter={() => setShowInfo(true)}
              onMouseLeave={() => setShowInfo(false)}
            >
              <button
                type="button"
                className="text-[10px] leading-none text-text-muted hover:text-text-primary"
                aria-label={`About ${metric.name}`}
                aria-expanded={showInfo}
              >
                ⓘ
              </button>
              {showInfo && (
                <div className="terminal-panel absolute left-0 top-4 z-20 w-72 p-3 text-[11px] shadow-2xl">
                  <p className="text-text-secondary">{metric.description}</p>
                  <p className="mt-2 text-text-muted">
                    <span className="text-text-secondary">Why it matters:</span>{" "}
                    {metric.interpretation}
                  </p>
                  <p className="mt-2 text-text-muted">
                    <span className="text-text-secondary">Calculation:</span>{" "}
                    {methodology}
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className={`mt-1 font-mono text-lg font-semibold tabular-nums ${valueTone}`}>
            {formatNumber(metric.latestValue, metric.unit)}
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-[0.16em] text-text-muted">
            {metric.category.replaceAll("_", " ")}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Badge value={metric.change1W} label="1W" />
          <Badge value={metric.change1M} label="1M" />
        </div>
      </div>

      <div className="mb-2 h-px bg-[linear-gradient(90deg,rgba(255,159,26,0.42),rgba(49,71,99,0.15),transparent)]" />

      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={`fill-${metric.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3f7cff" stopOpacity={0.28} />
                <stop offset="95%" stopColor="#3f7cff" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" hide />
            <YAxis
              domain={["auto", "auto"]}
              tick={{ fill: "#5f728b", fontSize: 10, fontFamily: "IBM Plex Mono, monospace" }}
              width={36}
              tickCount={3}
              tickFormatter={(v: number) => v.toFixed(1)}
            />
            <Tooltip
              cursor={{ stroke: "rgba(255,255,255,0.08)", strokeWidth: 1 }}
              content={({ payload, label }) => {
                if (!payload || payload.length === 0) return null;
                const val = payload[0].value as number;
                return (
                  <div className="terminal-panel px-3 py-2 text-[10px] font-mono shadow-2xl">
                    <div className="text-text-muted">{label}</div>
                    <div className="mt-1 text-text-primary">
                      {formatNumber(val, metric.unit)}
                    </div>
                  </div>
                );
              }}
            />
            {metric.thresholdLine !== undefined && (
              <ReferenceLine
                y={metric.thresholdLine}
                stroke="#ff9f1a"
                strokeDasharray="4 4"
                strokeOpacity={0.7}
              />
            )}
            <Area
              type="monotone"
              dataKey="value"
              stroke="#6ea8ff"
              strokeWidth={1.8}
              fill={`url(#fill-${metric.id})`}
              isAnimationActive={false}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.14em] text-text-muted">
        <span>range {chartData.length} pts</span>
        <span>signal monitor</span>
      </div>
    </div>
  );
}
