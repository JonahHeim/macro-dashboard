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
      <div className="max-w-[1920px] mx-auto px-3 py-3">
        {/* Terminal header bar */}
        <div className="flex items-center justify-between py-2 border-b border-border-strong mb-0">
          <div className="flex items-center gap-3">
            <span className="text-caution font-mono font-bold text-sm tracking-widest uppercase">
              Macro Terminal
            </span>
            <span className="text-border-strong">│</span>
            <span className="text-text-muted text-[11px] font-mono flex items-center gap-1.5">
              {isRefreshing ? (
                <>
                  {/* Amber pulse when refreshing */}
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-caution opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-caution" />
                  </span>
                  <span className="animate-pulse text-caution">REFRESHING...</span>
                </>
              ) : (
                <>
                  {/* Green steady pulse = live data */}
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-positive opacity-40" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-positive" />
                  </span>
                  DATA AS OF {lastUpdated.toLocaleTimeString()}
                </>
              )}
            </span>
          </div>
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 border border-border text-text-muted hover:text-text-secondary hover:border-border-strong transition-colors text-[11px] font-mono uppercase tracking-wider"
            aria-label="Open educational panel"
          >
            <svg
              width="14"
              height="14"
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

        {/* Tab navigation */}
        <div className="mb-3">
          <TopNav />
        </div>

        {/* Dashboard grid */}
        <div className="flex flex-col gap-2">
          {/* 1. KPI strip */}
          <KPIStrip scores={scores} onScoreClick={setSelectedScore} />

          {/* 1b. What changed summary */}
          {whatChanged.length > 0 && (
            <Card title="What Changed">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5">
                {whatChanged.slice(0, 3).map((item) => (
                  <div
                    key={item}
                    className="border border-border bg-surface-elevated px-2 py-1.5 text-[11px] text-text-secondary font-mono"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* 2. Regime + Rates */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            <RegimeQuadrant
              regimeTrail={regimeTrail}
              currentGrowth={growthScore?.value ?? 0}
              currentInflation={inflationScore?.value ?? 0}
            />
            <RatesCurvePanel metrics={ratesMetrics} />
          </div>

          {/* 3. Growth + Inflation */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
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
