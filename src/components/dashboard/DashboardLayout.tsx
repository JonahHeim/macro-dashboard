"use client";

import React, { useMemo, useState } from "react";
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
import { formatScore } from "@/lib/formatting";

const RATES_IDS = new Set(["ust-2y", "ust-10y", "spread-2s10s", "spread-3m10y"]);

function inferRegime(growth: number, inflation: number): string {
  if (growth >= 0 && inflation >= 0) return "Overheat";
  if (growth < 0 && inflation >= 0) return "Reflation";
  if (growth >= 0 && inflation < 0) return "Goldilocks";
  return "Disinflation";
}

export default function DashboardLayout(initialData: DashboardData) {
  const { data, lastUpdated, isRefreshing } = useDashboardData(initialData);
  const {
    scores,
    regimeTrail,
    growthMetrics,
    inflationMetrics,
    policyMetrics,
    liquidityMetrics,
    riskMetrics,
    heatmapAssets,
    educationalNotes,
    whatChanged = [],
  } = data;

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedScore, setSelectedScore] = useState<CompositeScore | null>(null);

  const growthScore = scores.find((s) => s.id === "growth");
  const inflationScore = scores.find((s) => s.id === "inflation");
  const policyScore = scores.find((s) => s.id === "policy");
  const liquidityScore = scores.find((s) => s.id === "liquidity");
  const riskScore = scores.find((s) => s.id === "risk_sentiment");

  const metricsById = Object.fromEntries(
    [...growthMetrics, ...inflationMetrics, ...policyMetrics, ...liquidityMetrics, ...riskMetrics].map((metric) => [metric.id, metric]),
  );

  const ratesMetrics = policyMetrics.filter((m) => RATES_IDS.has(m.id));
  const regimeName = inferRegime(growthScore?.value ?? 0, inflationScore?.value ?? 0);

  const headlineStats = useMemo(
    () => [
      {
        label: "Regime",
        value: regimeName,
        tone: "text-caution",
      },
      {
        label: "Growth",
        value: formatScore(growthScore?.value ?? 0),
        tone: "text-text-primary",
      },
      {
        label: "Inflation",
        value: formatScore(inflationScore?.value ?? 0),
        tone: "text-text-primary",
      },
      {
        label: "Policy",
        value: formatScore(policyScore?.value ?? 0),
        tone: "text-text-primary",
      },
      {
        label: "Liquidity",
        value: formatScore(liquidityScore?.value ?? 0),
        tone: "text-text-primary",
      },
    ],
    [growthScore?.value, inflationScore?.value, liquidityScore?.value, policyScore?.value, regimeName],
  );

  return (
    <div className="dashboard-shell min-h-screen bg-background">
      <div className="mx-auto flex max-w-[1920px] flex-col gap-4 px-3 py-3 lg:px-5">
        <header className="terminal-panel overflow-hidden">
          <div className="grid gap-4 px-4 py-4 lg:grid-cols-[1.45fr_0.95fr] lg:px-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="terminal-data-chip px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-caution">
                  JH Macro Desk
                </span>
                <span className="terminal-data-chip px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
                  Bloomberg x TradingView Edition
                </span>
                <span className="terminal-data-chip px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-accent-soft">
                  Daily Snapshot Cadence
                </span>
              </div>

              <div className="max-w-4xl">
                <h1 className="text-[clamp(2rem,4vw,3.8rem)] font-semibold leading-[0.96] tracking-[-0.05em] text-text-primary">
                  Multi-asset macro intelligence
                  <span className="block text-text-secondary">with terminal density and chart-first discipline.</span>
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-text-secondary">
                  Built for reading regime transitions fast: composite scores, quadrant context, rates transmission,
                  inflation pressure, and cross-asset confirmation in one institutional control surface.
                </p>
              </div>

              <div className="grid gap-2 md:grid-cols-5">
                {headlineStats.map((item) => (
                  <div key={item.label} className="terminal-data-chip px-3 py-3">
                    <div className="terminal-header-label text-text-muted">{item.label}</div>
                    <div className={`mt-2 font-mono text-lg ${item.tone}`}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-1">
              <div className="terminal-data-chip relative overflow-hidden px-4 py-4">
                <div className="absolute inset-y-0 left-0 w-1 bg-caution/80" />
                <div className="pl-3">
                  <div className="terminal-header-label text-text-muted">Snapshot</div>
                  <div className="mt-2 text-lg font-medium text-text-primary">{lastUpdated.toLocaleString()}</div>
                  <div className="mt-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
                    {isRefreshing ? (
                      <>
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full rounded-full bg-caution opacity-70 animate-ping" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-caution" />
                        </span>
                        Refreshing runtime summary
                      </>
                    ) : (
                      <>
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full rounded-full bg-positive opacity-55 animate-ping" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-positive" />
                        </span>
                        Data path online
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="terminal-data-chip px-4 py-4">
                <div className="terminal-header-label text-text-muted">Desk Notes</div>
                <div className="mt-3 space-y-2 text-[12px] leading-5 text-text-secondary">
                  {(whatChanged.length > 0 ? whatChanged : ["No fresh alerts in this snapshot."]).slice(0, 2).map((item) => (
                    <div key={item} className="border-l border-border-strong pl-3">
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="terminal-data-chip px-4 py-4">
                <div className="terminal-header-label text-text-muted">Signal Tape</div>
                <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-text-secondary">
                  <div className="border border-border px-2 py-2">Risk {formatScore(riskScore?.value ?? 0)}</div>
                  <div className="border border-border px-2 py-2">Curve {ratesMetrics.length} lines</div>
                  <div className="border border-border px-2 py-2">Assets {heatmapAssets.length}</div>
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(true)}
                    className="border border-caution/45 px-2 py-2 text-caution hover:bg-caution/10"
                  >
                    Open Learn
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <TopNav />

        <div className="flex flex-col gap-3">
          <KPIStrip scores={scores} onScoreClick={setSelectedScore} />

          {whatChanged.length > 0 && (
            <Card title="Pulse Notes">
              <div className="grid gap-2 md:grid-cols-3">
                {whatChanged.slice(0, 3).map((item, index) => (
                  <div
                    key={item}
                    className="terminal-data-chip relative overflow-hidden px-3 py-3 text-[11px] leading-5 text-text-secondary"
                  >
                    <div className="absolute left-0 top-0 h-full w-1 bg-caution/75" />
                    <div className="pl-3">
                      <div className="terminal-header-label text-text-muted">Alert 0{index + 1}</div>
                      <div className="mt-2">{item}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.15fr_0.85fr]">
            <RegimeQuadrant
              regimeTrail={regimeTrail}
              currentGrowth={growthScore?.value ?? 0}
              currentInflation={inflationScore?.value ?? 0}
            />
            <RatesCurvePanel metrics={ratesMetrics} />
          </div>

          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            <GrowthPanel metrics={growthMetrics} />
            <InflationPanel metrics={inflationMetrics} />
          </div>

          <CrossAssetHeatmap assets={heatmapAssets} macroRiskScore={riskScore?.value ?? 0} />
        </div>
      </div>

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
