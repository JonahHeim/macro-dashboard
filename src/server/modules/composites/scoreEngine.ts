import { CompositeScore, ScoreContributor, ScoreId, ScoreStatus } from "@/types/scores";
import { MetricWithData, TimeSeriesPoint } from "@/types/metrics";
import {
  calculateConfidence,
  getChange,
  getWindowForFrequency,
  latestDate,
  mergeScoreHistory,
  round,
  trailingZScores,
} from "@/data/utils/series";
import { NormalizedMetrics } from "@/server/modules/normalization/metricLibrary";

function statusForScore(id: ScoreId, value: number): ScoreStatus {
  switch (id) {
    case "growth":
      if (value > 1) return "positive";
      if (value < -1) return "negative";
      return Math.abs(value) <= 0.3 ? "neutral" : "caution";
    case "inflation":
      if (value > 1) return "negative";
      if (value < -0.3) return "positive";
      return Math.abs(value) <= 0.3 ? "neutral" : "caution";
    case "policy":
      if (value > 1) return "negative";
      if (value < -0.5) return "positive";
      return Math.abs(value) <= 0.3 ? "neutral" : "caution";
    case "liquidity":
      if (value > 1.2) return "negative";
      if (value < 0.5) return "positive";
      return "caution";
    case "risk_sentiment":
      if (value > 0.8) return "positive";
      if (value < -0.8) return "negative";
      return Math.abs(value) <= 0.3 ? "neutral" : "caution";
    default:
      return "neutral";
  }
}

function getMetric(metrics: MetricWithData[], id: string): MetricWithData {
  const found = metrics.find((metric) => metric.id === id);
  if (!found) {
    throw new Error(`Metric not found: ${id}`);
  }
  return found;
}

function buildSyntheticMetric(
  id: string,
  name: string,
  category: MetricWithData["category"],
  a: MetricWithData,
  b: MetricWithData,
  scale = 1,
): MetricWithData {
  const byDate = new Map(b.series.map((point) => [point.date, point.value]));
  const series = a.series
    .map((point) => {
      const bValue = byDate.get(point.date);
      if (bValue === undefined) return null;
      return { date: point.date, value: round((point.value - bValue) * scale, 4) };
    })
    .filter((point): point is TimeSeriesPoint => point !== null);

  return {
    ...a,
    id,
    name,
    category,
    unit: a.unit,
    description: `${name} synthetic metric`,
    interpretation: "Derived from two source metrics.",
    series,
    latestValue: series.at(-1)?.value ?? 0,
    change1W: getChange(series, 5),
    change1M: getChange(series, 22),
    zScore: trailingZScores(series, getWindowForFrequency(a.frequency)).at(-1)?.value ?? 0,
  };
}

interface Component {
  metric: MetricWithData;
  weight: number;
  invert?: boolean;
}

function buildContributor(component: Component): ScoreContributor {
  const z = component.invert ? -component.metric.zScore : component.metric.zScore;
  const contribution = round(z * component.weight, 3);
  return {
    metricId: component.metric.id,
    metricName: component.metric.name,
    zScore: round(z, 3),
    weight: component.weight,
    contribution,
  };
}

function buildScore(id: ScoreId, name: string, components: Component[], fallbackDate: string): CompositeScore {
  const contributors = components.map(buildContributor);
  const value = round(contributors.reduce((sum, item) => sum + item.contribution, 0), 2);

  const history = mergeScoreHistory(
    components.map((component) => ({
      series: trailingZScores(component.metric.series, getWindowForFrequency(component.metric.frequency)),
      weight: component.weight,
      invert: component.invert,
    })),
    260,
  );

  return {
    id,
    name,
    value,
    change1W: getChange(history, 5),
    change1M: getChange(history, 22),
    status: statusForScore(id, value),
    lastUpdated: history.at(-1)?.date ?? fallbackDate,
    history,
    contributors,
    confidence: calculateConfidence(contributors),
  };
}

export function buildCompositeScores(metrics: NormalizedMetrics): CompositeScore[] {
  const growth = buildScore(
    "growth",
    "Growth Score",
    [
      { metric: getMetric(metrics.growth, "ism-mfg-pmi"), weight: 1 / 7 },
      { metric: getMetric(metrics.growth, "ism-svc-pmi"), weight: 1 / 7 },
      { metric: getMetric(metrics.growth, "ip-yoy"), weight: 1 / 7 },
      { metric: getMetric(metrics.growth, "retail-sales-yoy"), weight: 1 / 7 },
      { metric: getMetric(metrics.growth, "init-claims-4w"), weight: 1 / 7, invert: true },
      { metric: getMetric(metrics.growth, "unemp-rate"), weight: 1 / 7, invert: true },
      { metric: getMetric(metrics.growth, "bldg-permits"), weight: 1 / 7 },
    ],
    latestDate(metrics.growth.flatMap((metric) => metric.series)),
  );

  const inflation = buildScore(
    "inflation",
    "Inflation Score",
    [
      { metric: getMetric(metrics.inflation, "cpi-core-yoy"), weight: 0.15 },
      { metric: getMetric(metrics.inflation, "pce-core-yoy"), weight: 0.15 },
      { metric: getMetric(metrics.inflation, "supercore-proxy"), weight: 0.15 },
      { metric: getMetric(metrics.inflation, "ahe-yoy"), weight: 0.15 },
      { metric: getMetric(metrics.inflation, "breakeven-2y"), weight: 0.2 },
      { metric: getMetric(metrics.inflation, "breakeven-5y5y"), weight: 0.2 },
    ],
    latestDate(metrics.inflation.flatMap((metric) => metric.series)),
  );

  const realPolicy = buildSyntheticMetric(
    "real-policy-proxy",
    "Real Policy Proxy",
    "policy_rates",
    getMetric(metrics.policy, "fed-funds"),
    getMetric(metrics.inflation, "pce-core-yoy"),
  );

  const policy = buildScore(
    "policy",
    "Policy Score",
    [
      { metric: realPolicy, weight: 0.35 },
      { metric: getMetric(metrics.liquidity, "fci"), weight: 0.25 },
      { metric: getMetric(metrics.policy, "tips-10y"), weight: 0.2 },
      { metric: getMetric(metrics.policy, "spread-2s10s"), weight: 0.2, invert: true },
    ],
    latestDate(metrics.policy.flatMap((metric) => metric.series)),
  );

  const liquidity = buildScore(
    "liquidity",
    "Liquidity Score",
    [
      { metric: getMetric(metrics.liquidity, "hy-oas"), weight: 0.22 },
      { metric: getMetric(metrics.liquidity, "ig-oas"), weight: 0.18 },
      { metric: getMetric(metrics.liquidity, "fra-ois-proxy"), weight: 0.14 },
      { metric: getMetric(metrics.liquidity, "repo-policy-spread"), weight: 0.14 },
      { metric: getMetric(metrics.liquidity, "walcl-yoy"), weight: 0.16, invert: true },
      { metric: getMetric(metrics.liquidity, "sloos"), weight: 0.16 },
    ],
    latestDate(metrics.liquidity.flatMap((metric) => metric.series)),
  );

  const risk = buildScore(
    "risk_sentiment",
    "Risk Sentiment",
    [
      { metric: getMetric(metrics.risk, "vix"), weight: 1 / 6, invert: true },
      { metric: getMetric(metrics.risk, "move-index"), weight: 1 / 6, invert: true },
      { metric: getMetric(metrics.risk, "hyg-ief-ratio"), weight: 1 / 6 },
      { metric: getMetric(metrics.risk, "advance-decline-proxy"), weight: 1 / 6 },
      { metric: getMetric(metrics.risk, "pct-spx-200dma"), weight: 1 / 6 },
      { metric: getMetric(metrics.risk, "cyc-def-ratio"), weight: 1 / 6 },
    ],
    latestDate(metrics.risk.flatMap((metric) => metric.series)),
  );

  return [growth, inflation, policy, liquidity, risk];
}

export function buildRegimeTrail(scores: CompositeScore[]) {
  const growth = scores.find((score) => score.id === "growth");
  const inflation = scores.find((score) => score.id === "inflation");
  if (!growth || !inflation) {
    return [];
  }

  const growthMap = new Map(growth.history.map((point) => [point.date, point.value]));
  const inflationMap = new Map(inflation.history.map((point) => [point.date, point.value]));

  return [...new Set([...growthMap.keys(), ...inflationMap.keys()])]
    .sort((a, b) => a.localeCompare(b))
    .slice(-90)
    .map((date) => ({
      date,
      growthScore: growthMap.get(date) ?? growth.value,
      inflationScore: inflationMap.get(date) ?? inflation.value,
    }));
}
