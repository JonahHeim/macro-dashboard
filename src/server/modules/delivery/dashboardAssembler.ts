import { DashboardData } from "@/data/types";
import { buildMarketHeatmapAssets } from "@/data/live/markets";
import { educationalNotes } from "@/data/mock/educational";
import { ingestRawData, summarizeIngestionHealth } from "@/server/modules/ingestion/rawData";
import { normalizeMetrics } from "@/server/modules/normalization/metricLibrary";
import { buildCompositeScores, buildRegimeTrail } from "@/server/modules/composites/scoreEngine";
import { buildContributorHeadline, buildWhatChangedSummary } from "@/server/modules/insights/insightEngine";

export async function assembleDashboardData(): Promise<DashboardData> {
  const raw = await ingestRawData();
  const normalized = normalizeMetrics(raw);
  const scores = buildCompositeScores(normalized);
  const regimeTrail = buildRegimeTrail(scores);
  const heatmapAssets = await buildMarketHeatmapAssets(raw.fred);
  const healthMessages = summarizeIngestionHealth(raw.diagnostics);
  const whatChanged = [
    ...healthMessages,
    ...buildWhatChangedSummary(scores),
    ...buildContributorHeadline(scores).slice(0, 2),
  ];

  return {
    capturedAt: raw.capturedAt,
    scores,
    regimeTrail,
    growthMetrics: normalized.growth,
    inflationMetrics: normalized.inflation,
    policyMetrics: normalized.policy,
    liquidityMetrics: normalized.liquidity,
    riskMetrics: normalized.risk,
    heatmapAssets,
    educationalNotes,
    whatChanged,
  };
}
