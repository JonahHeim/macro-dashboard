"use client";

import React, { useState } from "react";
import { DashboardData } from "@/data/types";
import KPIStrip from "./KPIStrip";
import RegimeQuadrant from "./RegimeQuadrant";
import RatesCurvePanel from "./RatesCurvePanel";
import GrowthPanel from "./GrowthPanel";
import InflationPanel from "./InflationPanel";
import CrossAssetHeatmap from "./CrossAssetHeatmap";
import EducationalDrawer from "./EducationalDrawer";
import Card from "@/components/ui/Card";
import TopNav from "@/components/app/TopNav";
import ScoreDrilldownModal from "./ScoreDrilldownModal";
import { CompositeScore } from "@/types/scores";
import { useDashboardData } from "@/hooks/useDashboardData";

const RATES_IDS = new Set(["ust-2y", "ust-10y", "spread-2s10s", "spread-3m10y"]);

export default function DashboardLayout(initialData: DashboardData) {
  const { data, lastUpdated, isRefreshing } = useDashboardData(initialData);
  const { scores, regimeTrail, growthMetrics, inflationMetrics, policyMetrics, liquidityMetrics, riskMetrics, heatmapAssets, educationalNotes, whatChanged = [] } = data;

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedScore, setSelectedScore] = useState<CompositeScore | null>(null);

  const growthScore = scores.find((s) => s.id === "growth");
  const inflationScore = scores.find((s) => s.id === "inflation");
  const riskScore = scores.find((s) => s.id === "risk_sentiment");
  const metricsById = Object.fromEntries(
    [...growthMetrics, ...inflationMetrics, ...policyMetrics, ...liquidityMetrics, ...riskMetrics].map((metric) => [metric.id, metric]),
  );

  const ratesMetrics = policyMetrics.filter((m) => RATES_IDS.has(m.id));

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1920px] mx-auto px-4 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-text-primary font-semibold text-xl">Macro Dashboard</h1>
          <div className="flex items-center gap-3">
            <span className="text-xs text-text-muted">
              {isRefreshing ? (
                <span className="animate-pulse">Refreshing…</span>
              ) : (
                <>Updated {lastUpdated.toLocaleTimeString()}</>
              )}
            </span>
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface transition-colors text-sm"
              aria-label="Open educational panel"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 3h5a2 2 0 0 1 2 2v10a1.5 1.5 0 0 0-1.5-1.5H2V3z" />
                <path d="M16 3h-5a2 2 0 0 0-2 2v10a1.5 1.5 0 0 1 1.5-1.5H16V3z" />
              </svg>
              <span className="hidden sm:inline">Learn</span>
            </button>
          </div>
        </div>
        <div className="mb-4">
          <TopNav />
        </div>

        {/* Dashboard grid */}
        <div className="flex flex-col gap-4">
          {/* 1. KPI strip */}
          <KPIStrip scores={scores} onScoreClick={setSelectedScore} />

          {/* 1b. What changed summary */}
          {whatChanged.length > 0 && (
            <Card title="What Changed">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {whatChanged.slice(0, 3).map((item) => (
                  <div
                    key={item}
                    className="rounded-md border border-border bg-surface-elevated px-3 py-2 text-xs text-text-secondary"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* 2. Regime + Rates */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <RegimeQuadrant
              regimeTrail={regimeTrail}
              currentGrowth={growthScore?.value ?? 0}
              currentInflation={inflationScore?.value ?? 0}
            />
            <RatesCurvePanel metrics={ratesMetrics} />
          </div>

          {/* 3. Growth + Inflation */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <GrowthPanel metrics={growthMetrics} />
            <InflationPanel metrics={inflationMetrics} />
          </div>

          {/* 4. Cross-Asset Heatmap */}
          <CrossAssetHeatmap assets={heatmapAssets} macroRiskScore={riskScore?.value ?? 0} />
        </div>
      </div>

      {/* Educational drawer */}
      <EducationalDrawer
        notes={educationalNotes}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
      <ScoreDrilldownModal
        score={selectedScore}
        metricsById={metricsById}
        onClose={() => setSelectedScore(null)}
      />
    </div>
  );
}
