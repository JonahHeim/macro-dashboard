"use client";

import Card from "@/components/ui/Card";
import { HeatmapAsset } from "@/types/heatmap";
import { MetricWithData } from "@/types/metrics";
import { CompositeScore } from "@/types/scores";

const HORIZONS = ["1D", "1W", "1M", "YTD"] as const;

function getMetric(metrics: MetricWithData[], id: string): MetricWithData | null {
  return metrics.find((metric) => metric.id === id) ?? null;
}

function formatValue(value: number, unit: string): string {
  if (!Number.isFinite(value)) return "-";
  if (unit === "%" || unit === "bps") return `${value.toFixed(2)}${unit}`;
  if (unit === "ratio" || unit === "index") return value.toFixed(2);
  return value.toFixed(2);
}

function scoreById(scores: CompositeScore[], id: CompositeScore["id"]): CompositeScore | null {
  return scores.find((score) => score.id === id) ?? null;
}

function assetById(assets: HeatmapAsset[], id: string): HeatmapAsset | null {
  return assets.find((asset) => asset.id === id) ?? null;
}

function scenarioProbabilities(scores: CompositeScore[]): Array<{ label: string; probability: number; trigger: string }> {
  const growth = scoreById(scores, "growth")?.value ?? 0;
  const inflation = scoreById(scores, "inflation")?.value ?? 0;
  const policy = scoreById(scores, "policy")?.value ?? 0;
  const liquidity = scoreById(scores, "liquidity")?.value ?? 0;
  const risk = scoreById(scores, "risk_sentiment")?.value ?? 0;

  const softLanding = Math.max(0, 40 + growth * 12 - inflation * 10 + risk * 10);
  const reaccel = Math.max(0, 20 + growth * 15 + inflation * 7);
  const recession = Math.max(0, 20 - growth * 14 + policy * 8 + liquidity * 8 - risk * 6);
  const stagflation = Math.max(0, 20 + inflation * 16 - growth * 10 + policy * 6);
  const total = softLanding + reaccel + recession + stagflation || 1;

  return [
    { label: "Soft Landing", probability: (softLanding / total) * 100, trigger: "Growth up + inflation cooling + risk stable" },
    { label: "Reacceleration", probability: (reaccel / total) * 100, trigger: "Growth/inflation both rising with tighter rates" },
    { label: "Recession", probability: (recession / total) * 100, trigger: "Growth down + tight policy/liquidity" },
    { label: "Stagflation", probability: (stagflation / total) * 100, trigger: "Inflation up while growth weakens" },
  ];
}

function nextWeekday(base: Date, weekday: number): Date {
  const date = new Date(base);
  const diff = (weekday + 7 - date.getDay()) % 7 || 7;
  date.setDate(date.getDate() + diff);
  return date;
}

function monthDay(base: Date, day: number): Date {
  const date = new Date(base.getFullYear(), base.getMonth(), day);
  if (date <= base) {
    return new Date(base.getFullYear(), base.getMonth() + 1, day);
  }
  return date;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function eventCalendar(): Array<{ event: string; date: string; impact: "High" | "Medium" }> {
  const now = new Date();
  return [
    { event: "US CPI", date: formatDate(monthDay(now, 12)), impact: "High" },
    { event: "US Payrolls", date: formatDate(nextWeekday(new Date(now.getFullYear(), now.getMonth() + 1, 1), 5)), impact: "High" },
    { event: "FOMC", date: formatDate(nextWeekday(now, 3)), impact: "High" },
    { event: "ECB Decision", date: formatDate(nextWeekday(now, 4)), impact: "Medium" },
    { event: "BoJ Decision", date: formatDate(nextWeekday(now, 2)), impact: "Medium" },
  ];
}

function correlation(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length < 2) return 0;
  const avgA = a.reduce((sum, value) => sum + value, 0) / a.length;
  const avgB = b.reduce((sum, value) => sum + value, 0) / b.length;
  let num = 0;
  let denA = 0;
  let denB = 0;
  for (let idx = 0; idx < a.length; idx += 1) {
    const da = a[idx] - avgA;
    const db = b[idx] - avgB;
    num += da * db;
    denA += da * da;
    denB += db * db;
  }
  const denom = Math.sqrt(denA * denB);
  return denom === 0 ? 0 : num / denom;
}

function horizonVector(asset: HeatmapAsset | null): number[] {
  if (!asset) return [0, 0, 0, 0];
  return HORIZONS.map((horizon) => asset.returns[horizon]);
}

function percentWithPositiveReturn(assets: HeatmapAsset[], horizon: "1W" | "1M"): number {
  if (assets.length === 0) return 0;
  const count = assets.filter((asset) => asset.returns[horizon] > 0).length;
  return (count / assets.length) * 100;
}

function eqMarkets(assets: HeatmapAsset[]): HeatmapAsset[] {
  const topEconomyIds = new Set([
    "spx", "ndx", "dow", "rut",
    "eq-china", "eq-germany", "eq-japan", "eq-india", "eq-uk", "eq-france", "eq-italy",
    "eq-canada", "eq-brazil", "eq-korea", "eq-australia", "eq-spain", "eq-mexico", "eq-russia",
  ]);
  return assets.filter((asset) => topEconomyIds.has(asset.id));
}

interface BigPictureBoardProps {
  scores: CompositeScore[];
  growthMetrics: MetricWithData[];
  inflationMetrics: MetricWithData[];
  policyMetrics: MetricWithData[];
  liquidityMetrics: MetricWithData[];
  riskMetrics: MetricWithData[];
  heatmapAssets: HeatmapAsset[];
}

export default function BigPictureBoard({
  scores,
  growthMetrics,
  inflationMetrics,
  policyMetrics,
  liquidityMetrics,
  riskMetrics,
  heatmapAssets,
}: BigPictureBoardProps) {
  const rates = [
    getMetric(policyMetrics, "ust-2y"),
    getMetric(policyMetrics, "ust-10y"),
    getMetric(policyMetrics, "spread-2s10s"),
    getMetric(policyMetrics, "spread-3m10y"),
    getMetric(policyMetrics, "tips-10y"),
  ].filter((metric): metric is MetricWithData => Boolean(metric));
  const bondAssets = ["shy", "ief", "tlt", "tip"]
    .map((id) => assetById(heatmapAssets, id))
    .filter((asset): asset is HeatmapAsset => Boolean(asset));

  const fxAssets = ["dxy", "eurusd", "usdjpy", "usdcnh"]
    .map((id) => assetById(heatmapAssets, id))
    .filter((asset): asset is HeatmapAsset => Boolean(asset));

  const growthBreadthAssets = eqMarkets(heatmapAssets);
  const growth1W = percentWithPositiveReturn(growthBreadthAssets, "1W");
  const growth1M = percentWithPositiveReturn(growthBreadthAssets, "1M");
  const growthFocus = [
    getMetric(growthMetrics, "ism-mfg-pmi"),
    getMetric(growthMetrics, "ism-svc-pmi"),
    getMetric(growthMetrics, "gdp-nowcast"),
  ].filter((metric): metric is MetricWithData => Boolean(metric));

  const inflationFocus = [
    getMetric(inflationMetrics, "cpi-core-yoy"),
    getMetric(inflationMetrics, "pce-core-yoy"),
    getMetric(inflationMetrics, "breakeven-2y"),
    getMetric(inflationMetrics, "breakeven-5y5y"),
  ].filter((metric): metric is MetricWithData => Boolean(metric));

  const sentimentFocus = [
    getMetric(riskMetrics, "vix"),
    getMetric(riskMetrics, "move-index"),
    getMetric(riskMetrics, "stl-fsi"),
    getMetric(riskMetrics, "hyg-ief-ratio"),
  ].filter((metric): metric is MetricWithData => Boolean(metric));

  const creditFocus = [
    getMetric(liquidityMetrics, "hy-oas"),
    getMetric(liquidityMetrics, "ig-oas"),
    getMetric(liquidityMetrics, "sofr-tbill-spread"),
    getMetric(liquidityMetrics, "sofr-ff-spread"),
  ].filter((metric): metric is MetricWithData => Boolean(metric));

  const liquidityFocus = [
    getMetric(liquidityMetrics, "walcl-yoy"),
    getMetric(liquidityMetrics, "fci"),
    getMetric(liquidityMetrics, "sloos"),
    getMetric(policyMetrics, "term-premium"),
  ].filter((metric): metric is MetricWithData => Boolean(metric));

  const corrPairs = [
    { label: "Stocks vs Bonds", a: assetById(heatmapAssets, "spx"), b: assetById(heatmapAssets, "ief") },
    { label: "Stocks vs Dollar", a: assetById(heatmapAssets, "spx"), b: assetById(heatmapAssets, "dxy") },
    { label: "Gold vs Dollar", a: assetById(heatmapAssets, "gold"), b: assetById(heatmapAssets, "dxy") },
    { label: "Oil vs Dollar", a: assetById(heatmapAssets, "wti"), b: assetById(heatmapAssets, "dxy") },
    { label: "Bitcoin vs Stocks", a: assetById(heatmapAssets, "btc"), b: assetById(heatmapAssets, "spx") },
  ].map((pair) => ({
    ...pair,
    value: correlation(horizonVector(pair.a), horizonVector(pair.b)),
  }));

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <Card title="1. Global Rates Panel">
        <p className="mb-2 text-xs text-text-muted">US curve levels plus liquid Treasury instruments for market context.</p>
        <div className="space-y-2 text-sm">
          {rates.map((metric) => (
            <div key={metric.id} className="flex items-center justify-between rounded border border-border bg-surface-elevated px-3 py-2">
              <span className="text-text-secondary">{metric.name}</span>
              <span className="font-mono text-text-primary">{formatValue(metric.latestValue, metric.unit)}</span>
            </div>
          ))}
          {bondAssets.map((asset) => (
            <div key={asset.id} className="flex items-center justify-between rounded border border-border bg-surface-elevated px-3 py-2">
              <span className="text-text-secondary">{asset.name}</span>
              <span className="font-mono text-text-primary">{asset.returns["1M"].toFixed(2)}%</span>
            </div>
          ))}
        </div>
      </Card>

      <Card title="2. FX Regime Panel">
        <div className="space-y-2 text-sm">
          {fxAssets.map((asset) => (
            <div key={asset.id} className="rounded border border-border bg-surface-elevated px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">{asset.name}</span>
                <span className="font-mono text-text-primary">{asset.currentPrice.toFixed(3)}</span>
              </div>
              <div className="mt-1 text-xs text-text-muted">1W {asset.returns["1W"].toFixed(2)}% | 1M {asset.returns["1M"].toFixed(2)}%</div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="3. Global Liquidity Panel">
        <div className="space-y-2 text-sm">
          {liquidityFocus.map((metric) => (
            <div key={metric.id} className="flex items-center justify-between rounded border border-border bg-surface-elevated px-3 py-2">
              <span className="text-text-secondary">{metric.name}</span>
              <span className="font-mono text-text-primary">{formatValue(metric.latestValue, metric.unit)}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card title="4. Credit Stress Panel">
        <div className="space-y-2 text-sm">
          {creditFocus.map((metric) => (
            <div key={metric.id} className="flex items-center justify-between rounded border border-border bg-surface-elevated px-3 py-2">
              <span className="text-text-secondary">{metric.name}</span>
              <span className="font-mono text-text-primary">{formatValue(metric.latestValue, metric.unit)}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card title="5. Growth Breadth Nowcast">
        <div className="rounded border border-border bg-surface-elevated p-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">Top economy equities positive (1W)</span>
            <span className="font-mono text-text-primary">{growth1W.toFixed(0)}%</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-text-secondary">Top economy equities positive (1M)</span>
            <span className="font-mono text-text-primary">{growth1M.toFixed(0)}%</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-text-secondary">Growth composite</span>
            <span className="font-mono text-text-primary">{(scoreById(scores, "growth")?.value ?? 0).toFixed(2)}</span>
          </div>
          <div className="mt-3 space-y-1 border-t border-border pt-2">
            {growthFocus.map((metric) => (
              <div key={metric.id} className="flex items-center justify-between">
                <span className="text-text-secondary">{metric.name}</span>
                <span className="font-mono text-text-primary">{formatValue(metric.latestValue, metric.unit)}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card title="6. Inflation Breadth">
        <div className="space-y-2 text-sm">
          {inflationFocus.map((metric) => (
            <div key={metric.id} className="flex items-center justify-between rounded border border-border bg-surface-elevated px-3 py-2">
              <span className="text-text-secondary">{metric.name}</span>
              <span className="font-mono text-text-primary">{formatValue(metric.latestValue, metric.unit)}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card title="7. Positioning & Sentiment">
        <div className="space-y-2 text-sm">
          {sentimentFocus.map((metric) => (
            <div key={metric.id} className="flex items-center justify-between rounded border border-border bg-surface-elevated px-3 py-2">
              <span className="text-text-secondary">{metric.name}</span>
              <span className="font-mono text-text-primary">{formatValue(metric.latestValue, metric.unit)}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card title="8. Correlation/Risk Map">
        <div className="space-y-2 text-sm">
          {corrPairs.map((pair) => (
            <div key={pair.label} className="flex items-center justify-between rounded border border-border bg-surface-elevated px-3 py-2">
              <span className="text-text-secondary">{pair.label}</span>
              <span className="font-mono text-text-primary">{pair.value.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card title="9. Scenario Dashboard">
        <div className="space-y-2 text-sm">
          {scenarioProbabilities(scores).map((scenario) => (
            <div key={scenario.label} className="rounded border border-border bg-surface-elevated px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">{scenario.label}</span>
                <span className="font-mono text-text-primary">{scenario.probability.toFixed(0)}%</span>
              </div>
              <div className="mt-1 text-xs text-text-muted">{scenario.trigger}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="10. Calendar & Event Risk">
        <div className="space-y-2 text-sm">
          {eventCalendar().map((event) => (
            <div key={event.event} className="flex items-center justify-between rounded border border-border bg-surface-elevated px-3 py-2">
              <div>
                <div className="text-text-secondary">{event.event}</div>
                <div className="text-xs text-text-muted">{event.date}</div>
              </div>
              <span className={`rounded px-2 py-0.5 text-xs ${event.impact === "High" ? "bg-caution/15 text-caution" : "bg-accent/15 text-accent"}`}>
                {event.impact}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
