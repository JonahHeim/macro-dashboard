"use client";

import { DashboardData } from "@/data/types";
import { useDashboardData } from "@/hooks/useDashboardData";
import Card from "@/components/ui/Card";
import MetricChart from "./MetricChart";

const CURVE_IDS = new Set(["ust-2y", "ust-10y", "spread-2s10s", "spread-3m10y", "tips-10y", "fed-funds"]);

export default function PolicyLiquidityClient(initialData: DashboardData) {
  const { data, lastUpdated, isRefreshing } = useDashboardData(initialData);
  const policyScore = data.scores.find((score) => score.id === "policy");
  const liquidityScore = data.scores.find((score) => score.id === "liquidity");
  const policyMetrics = data.policyMetrics.filter((metric) => CURVE_IDS.has(metric.id));

  return (
    <>
      <p className="text-xs text-text-muted">
        {isRefreshing ? (
          <span className="animate-pulse">Refreshing…</span>
        ) : (
          <>Updated {lastUpdated.toLocaleString()}</>
        )}
      </p>

      <Card title="Policy & Curve Metrics">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {policyMetrics.map((metric) => (
            <MetricChart key={metric.id} metric={metric} />
          ))}
        </div>
      </Card>

      <Card title="Liquidity & Credit Metrics">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {data.liquidityMetrics.map((metric) => (
            <MetricChart key={metric.id} metric={metric} />
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Policy Score Contributors">
          <div className="space-y-2 text-sm">
            {policyScore?.contributors.map((item) => (
              <div key={item.metricId} className="flex items-center justify-between rounded-md border border-border bg-surface-elevated px-3 py-2">
                <span className="text-text-secondary">{item.metricName}</span>
                <span className="font-mono text-text-primary">{item.contribution.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Liquidity Score Contributors">
          <div className="space-y-2 text-sm">
            {liquidityScore?.contributors.map((item) => (
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
