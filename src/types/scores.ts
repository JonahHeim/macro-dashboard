import { TimeSeriesPoint } from "./metrics";

export type ScoreId =
  | "growth"
  | "inflation"
  | "policy"
  | "liquidity"
  | "risk_sentiment";

export type RegimeLabel =
  | "Goldilocks"
  | "Reflation"
  | "Overheat / Stagflation"
  | "Disinflation Slowdown";

export type ScoreStatus = "positive" | "negative" | "caution" | "neutral";

export interface ScoreContributor {
  metricId: string;
  metricName: string;
  zScore: number;
  weight: number;
  contribution: number;
}

export interface CompositeScore {
  id: ScoreId;
  name: string;
  value: number;
  change1W: number;
  change1M: number;
  status: ScoreStatus;
  lastUpdated: string;
  confidence?: number;
  history: TimeSeriesPoint[];
  contributors: ScoreContributor[];
}

export interface RegimePoint {
  date: string;
  growthScore: number;
  inflationScore: number;
}
