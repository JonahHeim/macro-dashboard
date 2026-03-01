export type MetricFrequency = "daily" | "weekly" | "monthly" | "quarterly" | "event-driven";

export type MetricCategory =
  | "growth"
  | "inflation"
  | "policy_rates"
  | "liquidity_credit"
  | "risk_sentiment"
  | "cross_asset";

export interface TimeSeriesPoint {
  date: string;
  value: number;
}

export interface MetricDefinition {
  id: string;
  name: string;
  category: MetricCategory;
  frequency: MetricFrequency;
  unit: string;
  description: string;
  interpretation: string;
  invertForScore?: boolean;
  thresholdLine?: number;
}

export interface MetricWithData extends MetricDefinition {
  series: TimeSeriesPoint[];
  latestValue: number;
  change1W: number;
  change1M: number;
  zScore: number;
}
