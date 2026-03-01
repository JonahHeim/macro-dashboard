import { MetricWithData, MetricCategory } from "@/types/metrics";
import { CompositeScore, ScoreId, RegimePoint } from "@/types/scores";
import { HeatmapAsset } from "@/types/heatmap";
import { EducationalNote } from "@/types/educational";

export interface DashboardData {
  scores: CompositeScore[];
  regimeTrail: RegimePoint[];
  growthMetrics: MetricWithData[];
  inflationMetrics: MetricWithData[];
  policyMetrics: MetricWithData[];
  liquidityMetrics: MetricWithData[];
  riskMetrics: MetricWithData[];
  heatmapAssets: HeatmapAsset[];
  educationalNotes: EducationalNote[];
  whatChanged?: string[];
}

export interface DashboardDataProvider {
  getDashboardData(): Promise<DashboardData>;
  getScores(): Promise<CompositeScore[]>;
  getScore(id: ScoreId): Promise<CompositeScore>;
  getMetricsByCategory(category: MetricCategory): Promise<MetricWithData[]>;
  getHeatmapData(): Promise<HeatmapAsset[]>;
  getEducationalNotes(): Promise<EducationalNote[]>;
}
