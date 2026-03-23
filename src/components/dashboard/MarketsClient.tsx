"use client";

import { DashboardData } from "@/data/types";
import { useDashboardData } from "@/hooks/useDashboardData";
import Card from "@/components/ui/Card";
import MetricChart from "./MetricChart";
import CrossAssetHeatmap from "./CrossAssetHeatmap";

export default function MarketsClient(initialData: DashboardData) {
  const { data, lastUpdated, isRefreshing } = useDashboardData(initialData);
  const riskScore = data.scores.find((score) => score.id === "risk_sentiment");

  return (
    <>
      <p className="text-xs text-text-muted">
        {isRefreshing ? (
          <span className="animate-pulse">Refreshing…</span>
        ) : (
          <>Updated {lastUpdated.toLocaleTimeString()}</>
        )}
      </p>

      <Card title="Risk Regime">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {data.scores.map((score) => (
            <div key={score.id} className="rounded-md border border-border bg-surface-elevated px-3 py-2">
              <div className="text-xs uppercase tracking-wider text-text-muted">{score.name}</div>
              <div className="font-mono text-lg text-text-primary">{score.value.toFixed(2)}</div>
              <div className="text-xs text-text-secondary">1W: {score.change1W.toFixed(2)} | 1M: {score.change1M.toFixed(2)}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Risk Sentiment Inputs">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {data.riskMetrics.map((metric) => (
            <MetricChart key={metric.id} metric={metric} />
          ))}
        </div>
      </Card>

      <CrossAssetHeatmap assets={data.heatmapAssets} macroRiskScore={riskScore?.value ?? 0} />
    </>
  );
}
