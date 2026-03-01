"use client";

import React from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CompositeScore } from "@/types/scores";
import { MetricWithData } from "@/types/metrics";
import { formatNumber } from "@/lib/formatting";

interface ScoreDrilldownModalProps {
  score: CompositeScore | null;
  metricsById: Record<string, MetricWithData>;
  onClose: () => void;
}

function ContributorSparkline({ metric }: { metric: MetricWithData }) {
  const points = metric.series.slice(-60).map((point) => ({ date: point.date, value: point.value }));

  return (
    <div className="h-16 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <XAxis dataKey="date" hide />
          <YAxis hide domain={["auto", "auto"]} />
          <Tooltip
            content={({ payload, label }) => {
              if (!payload || payload.length === 0) return null;
              const value = payload[0].value as number;
              return (
                <div className="rounded border border-border bg-surface px-2 py-1 text-xs">
                  <div className="text-text-muted">{label}</div>
                  <div className="font-mono text-text-primary">{formatNumber(value, metric.unit)}</div>
                </div>
              );
            }}
          />
          <Line type="monotone" dataKey="value" stroke="var(--color-accent)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function ScoreDrilldownModal({ score, metricsById, onClose }: ScoreDrilldownModalProps) {
  if (!score) {
    return null;
  }

  const contributors = [...score.contributors].sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/45" onClick={onClose} />
      <div className="fixed inset-x-4 top-8 z-[60] mx-auto max-w-3xl rounded-xl border border-border bg-surface p-4 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-text-primary">{score.name} Contributors</h2>
            <p className="text-xs text-text-muted">Click outside to close. Top drivers sorted by absolute contribution.</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md border border-border px-2 py-1 text-xs text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
          >
            Close
          </button>
        </div>

        <div className="max-h-[65vh] space-y-3 overflow-y-auto pr-1">
          {contributors.map((contributor) => {
            const metric = metricsById[contributor.metricId];
            return (
              <div key={contributor.metricId} className="rounded-lg border border-border bg-surface-elevated p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-text-primary">{contributor.metricName}</div>
                    <div className="text-xs text-text-muted">z={contributor.zScore.toFixed(2)} · weight={contributor.weight.toFixed(2)}</div>
                  </div>
                  <div className={`font-mono text-sm ${contributor.contribution >= 0 ? "text-positive" : "text-negative"}`}>
                    {contributor.contribution >= 0 ? "+" : ""}
                    {contributor.contribution.toFixed(3)}
                  </div>
                </div>
                {metric ? (
                  <>
                    <ContributorSparkline metric={metric} />
                    <div className="mt-2 text-xs text-text-secondary">Latest: {formatNumber(metric.latestValue, metric.unit)}</div>
                  </>
                ) : (
                  <div className="text-xs text-text-muted">Series unavailable for this contributor.</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
