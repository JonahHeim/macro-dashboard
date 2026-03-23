import { MetricCategory } from "@/types/metrics";
import { ScoreId } from "@/types/scores";
import { DashboardDataProvider } from "@/data/types";
import { mockScores, regimeTrail } from "./scores";
import { growthMetrics } from "./metrics-growth";
import { inflationMetrics } from "./metrics-inflation";
import { policyMetrics } from "./metrics-policy";
import { liquidityMetrics } from "./metrics-liquidity";
import { riskMetrics } from "./metrics-risk";
import { heatmapAssets } from "./heatmap";
import { educationalNotes } from "./educational";

export class MockDataProvider implements DashboardDataProvider {
  async getDashboardData() {
    return {
      capturedAt: new Date().toISOString(),
      scores: mockScores,
      regimeTrail,
      growthMetrics,
      inflationMetrics,
      policyMetrics,
      liquidityMetrics,
      riskMetrics,
      heatmapAssets,
      educationalNotes,
      whatChanged: [
        "Growth Score moved down 0.04 this week.",
        "Inflation Score moved up 0.06 this week.",
        "Risk Sentiment moved down 0.05 this week.",
      ],
    };
  }

  async getScores() {
    return mockScores;
  }

  async getScore(id: ScoreId) {
    const score = mockScores.find((s) => s.id === id);
    if (!score) {
      throw new Error(`Score not found: ${id}`);
    }
    return score;
  }

  async getMetricsByCategory(category: MetricCategory) {
    switch (category) {
      case "growth":
        return growthMetrics;
      case "inflation":
        return inflationMetrics;
      case "policy_rates":
        return policyMetrics;
      case "liquidity_credit":
        return liquidityMetrics;
      case "risk_sentiment":
        return riskMetrics;
      default:
        return [];
    }
  }

  async getHeatmapData() {
    return heatmapAssets;
  }

  async getEducationalNotes() {
    return educationalNotes;
  }
}
