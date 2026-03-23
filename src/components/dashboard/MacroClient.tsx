"use client";

import { DashboardData } from "@/data/types";
import { useDashboardData } from "@/hooks/useDashboardData";
import { formatUtcTimestamp } from "@/lib/formatting";
import Card from "@/components/ui/Card";
import MetricChart from "./MetricChart";

export default function MacroClient(initialData: DashboardData) {
  const { data, lastUpdated, isRefreshing } = useDashboardData(initialData);
  const growthScore = data.scores.find((score) => score.id === "growth");
  const inflationScore = data.scores.find((score) => score.id === "inflation");

  return (
    <>
      <p className="text-xs text-text-muted">
        {isRefreshing ? (
          <span className="animate-pulse">Refreshing…</span>
        ) : (
          <>Updated {formatUtcTimestamp(data.capturedAt)}</>
        )}
      </p>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Growth Indicators">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {data.growthMetrics.map((metric) => (
              <MetricChart key={metric.id} metric={metric} />
            ))}
          </div>
        </Card>

        <Card title="Inflation Indicators">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {data.inflationMetrics.map((metric) => (
              <MetricChart key={metric.id} metric={metric} />
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Growth Contributors">
          <div className="space-y-2 text-sm">
            {growthScore?.contributors.map((item) => (
              <div key={item.metricId} className="flex items-center justify-between rounded-md border border-border bg-surface-elevated px-3 py-2">
                <span className="text-text-secondary">{item.metricName}</span>
                <span className="font-mono text-text-primary">{item.contribution.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Inflation Contributors">
          <div className="space-y-2 text-sm">
            {inflationScore?.contributors.map((item) => (
              <div key={item.metricId} className="flex items-center justify-between rounded-md border border-border bg-surface-elevated px-3 py-2">
                <span className="text-text-secondary">{item.metricName}</span>
                <span className="font-mono text-text-primary">{item.contribution.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
