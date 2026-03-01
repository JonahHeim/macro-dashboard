"use client";

import React from "react";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { MetricWithData } from "@/types/metrics";
import { formatNumber } from "@/lib/formatting";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";

interface RatesCurvePanelProps {
  metrics: MetricWithData[];
}

function MiniYieldChart({ metric }: { metric: MetricWithData }) {
  const data = metric.series.map((pt) => ({ date: pt.date, value: pt.value }));

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div>
          <span className="text-text-secondary text-xs font-medium">{metric.name}</span>
          <span className="text-text-primary text-sm font-mono tabular-nums ml-2">
            {formatNumber(metric.latestValue, metric.unit)}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Badge value={metric.change1W} label="1W" />
          <Badge value={metric.change1M} label="1M" />
        </div>
      </div>
      <div style={{ height: 120 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={`rate-fill-${metric.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.15} />
                <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" hide />
            <YAxis
              domain={["auto", "auto"]}
              tick={{ fill: "#64748B", fontSize: 10 }}
              width={36}
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
            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--color-accent)"
              strokeWidth={1.5}
              fill={`url(#rate-fill-${metric.id})`}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function MiniSpreadChart({ metric }: { metric: MetricWithData }) {
  const data = metric.series.map((pt) => ({ date: pt.date, value: pt.value }));

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div>
          <span className="text-text-secondary text-xs font-medium">{metric.name}</span>
          <span className="text-text-primary text-sm font-mono tabular-nums ml-2">
            {formatNumber(metric.latestValue, metric.unit)}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Badge value={metric.change1W} label="1W" />
          <Badge value={metric.change1M} label="1M" />
        </div>
      </div>
      <div style={{ height: 120 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <XAxis dataKey="date" hide />
            <YAxis
              domain={["auto", "auto"]}
              tick={{ fill: "#64748B", fontSize: 10 }}
              width={36}
              tickCount={3}
              tickFormatter={(v: number) => v.toFixed(2)}
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
            <ReferenceLine y={0} stroke="#F59E0B" strokeDasharray="4 4" strokeOpacity={0.5} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--color-accent)"
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const SPREAD_IDS = new Set(["spread-2s10s", "spread-3m10y"]);

export default function RatesCurvePanel({ metrics }: RatesCurvePanelProps) {
  return (
    <Card title="Rates & Curves">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {metrics.map((m) =>
          SPREAD_IDS.has(m.id) ? (
            <MiniSpreadChart key={m.id} metric={m} />
          ) : (
            <MiniYieldChart key={m.id} metric={m} />
          )
        )}
      </div>
    </Card>
  );
}
