"use client";

import { DashboardData } from "@/data/types";
import { useDashboardData } from "@/hooks/useDashboardData";
import BigPictureBoard from "./BigPictureBoard";

export default function BigPictureClient(initialData: DashboardData) {
  const { data, lastUpdated, isRefreshing } = useDashboardData(initialData);

  return (
    <>
      <p className="text-xs text-text-muted">
        {isRefreshing ? (
          <span className="animate-pulse">Refreshing…</span>
        ) : (
          <>Updated {lastUpdated.toLocaleString()}</>
        )}
      </p>
      <BigPictureBoard
        scores={data.scores}
        growthMetrics={data.growthMetrics}
        inflationMetrics={data.inflationMetrics}
        policyMetrics={data.policyMetrics}
        liquidityMetrics={data.liquidityMetrics}
        riskMetrics={data.riskMetrics}
        heatmapAssets={data.heatmapAssets}
      />
    </>
  );
}
