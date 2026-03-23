import { DashboardDataProvider } from "@/data/types";
import { ScoreId } from "@/types/scores";
import { MetricCategory } from "@/types/metrics";
import { growthMetrics as fallbackGrowth } from "@/data/mock/metrics-growth";
import { inflationMetrics as fallbackInflation } from "@/data/mock/metrics-inflation";
import { policyMetrics as fallbackPolicy } from "@/data/mock/metrics-policy";
import { liquidityMetrics as fallbackLiquidity } from "@/data/mock/metrics-liquidity";
import { riskMetrics as fallbackRisk } from "@/data/mock/metrics-risk";
import { heatmapAssets as fallbackHeatmap } from "@/data/mock/heatmap";
import { mockScores, regimeTrail as fallbackRegime } from "@/data/mock/scores";
import { educationalNotes } from "@/data/mock/educational";
import { assembleDashboardData } from "@/server/modules/delivery/dashboardAssembler";
import { getLatestDashboardSnapshot, persistDashboardSnapshot, recordIngestionFailure } from "@/server/persistence/snapshotStore";

function fallbackDashboardData(reason: string, consecutiveFailures: number, lastSuccessAt: string | null) {
  const details = [`Live data unavailable. Showing fallback dataset.`, `Reason: ${reason}`];
  if (lastSuccessAt) {
    details.push(`Last successful live snapshot: ${lastSuccessAt}.`);
  }
  if (consecutiveFailures > 1) {
    details.push(`Consecutive live-data failures: ${consecutiveFailures}.`);
  }

  return {
    capturedAt: lastSuccessAt ?? new Date().toISOString(),
    scores: mockScores,
    regimeTrail: fallbackRegime,
    growthMetrics: fallbackGrowth,
    inflationMetrics: fallbackInflation,
    policyMetrics: fallbackPolicy,
    liquidityMetrics: fallbackLiquidity,
    riskMetrics: fallbackRisk,
    heatmapAssets: fallbackHeatmap,
    educationalNotes,
    whatChanged: details,
  };
}

export class LiveDataProvider implements DashboardDataProvider {
  private refreshPromise: ReturnType<typeof assembleDashboardData> | null = null;
  private consecutiveFailures = 0;
  private lastSuccessAt: string | null = null;

  async getDashboardData(options?: { refresh?: boolean }) {
    if (!options?.refresh) {
      const snapshot = await getLatestDashboardSnapshot();
      if (snapshot) {
        this.lastSuccessAt = snapshot.capturedAt;
        return snapshot;
      }
    }

    if (!this.refreshPromise) {
      this.refreshPromise = assembleDashboardData();
    }

    try {
      const data = await this.refreshPromise;
      this.lastSuccessAt = data.capturedAt;
      this.consecutiveFailures = 0;
      this.refreshPromise = null;

      try {
        await persistDashboardSnapshot(data);
      } catch (error) {
        const persistenceMessage = `Persist snapshot failed: ${error instanceof Error ? error.message : String(error)}`;
        console.error(`[LiveDataProvider] ${persistenceMessage}`);
        void recordIngestionFailure(persistenceMessage);
      }

      return data;
    } catch (error) {
      this.refreshPromise = null;
      this.consecutiveFailures += 1;
      const reason = error instanceof Error ? error.message : String(error);
      const details = error instanceof Error && error.stack ? error.stack : reason;
      console.error(`[LiveDataProvider] assembleDashboardData failed: ${reason}`);
      void recordIngestionFailure(details);

      const snapshot = await getLatestDashboardSnapshot();
      if (snapshot) {
        return {
          ...snapshot,
          whatChanged: [
            ...(snapshot.whatChanged ?? []),
            `Live refresh failed. Showing last saved snapshot from ${snapshot.capturedAt}.`,
          ],
        };
      }

      return fallbackDashboardData(reason, this.consecutiveFailures, this.lastSuccessAt);
    }
  }

  async getScores() {
    const data = await this.getDashboardData();
    return data.scores;
  }

  async getScore(id: ScoreId) {
    const score = (await this.getScores()).find((item) => item.id === id);
    if (!score) {
      throw new Error(`Score not found: ${id}`);
    }
    return score;
  }

  async getMetricsByCategory(category: MetricCategory) {
    const data = await this.getDashboardData();
    if (category === "growth") return data.growthMetrics;
    if (category === "inflation") return data.inflationMetrics;
    if (category === "policy_rates") return data.policyMetrics;
    if (category === "liquidity_credit") return data.liquidityMetrics;
    if (category === "risk_sentiment") return data.riskMetrics;
    return [];
  }

  async getHeatmapData() {
    const data = await this.getDashboardData();
    return data.heatmapAssets;
  }

  async getEducationalNotes() {
    const data = await this.getDashboardData();
    return data.educationalNotes;
  }
}
