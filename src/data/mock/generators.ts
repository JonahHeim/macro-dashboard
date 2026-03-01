import { TimeSeriesPoint } from "@/types/metrics";

// Simple seeded random for reproducible mock data
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

export function generateTimeSeries(config: {
  startDate: string;
  periods: number;
  frequency: "daily" | "weekly" | "monthly";
  baseValue: number;
  trend: number;
  volatility: number;
  meanRevert?: number;
  mean?: number;
  seed?: number;
  min?: number;
  max?: number;
}): TimeSeriesPoint[] {
  const {
    startDate,
    periods,
    frequency,
    baseValue,
    trend,
    volatility,
    meanRevert = 0,
    mean,
    seed = 42,
    min = -Infinity,
    max = Infinity,
  } = config;

  const rand = seededRandom(seed);
  const points: TimeSeriesPoint[] = [];
  let value = baseValue;
  const revertTarget = mean ?? baseValue;
  const start = new Date(startDate);

  for (let i = 0; i < periods; i++) {
    const date = new Date(start);
    if (frequency === "daily") {
      date.setDate(date.getDate() + i);
      // Skip weekends
      const day = date.getDay();
      if (day === 0 || day === 6) continue;
    } else if (frequency === "weekly") {
      date.setDate(date.getDate() + i * 7);
    } else {
      date.setMonth(date.getMonth() + i);
    }

    // Box-Muller for normal distribution
    const u1 = rand();
    const u2 = rand();
    const normal = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

    const reversion = meanRevert * (revertTarget - value);
    value += trend + reversion + volatility * normal;
    value = Math.max(min, Math.min(max, value));

    points.push({
      date: date.toISOString().split("T")[0],
      value: Math.round(value * 100) / 100,
    });
  }

  return points;
}

export function getLatestValue(series: TimeSeriesPoint[]): number {
  return series[series.length - 1]?.value ?? 0;
}

export function getChange(series: TimeSeriesPoint[], periodsBack: number): number {
  if (series.length < periodsBack + 1) return 0;
  const current = series[series.length - 1].value;
  const past = series[series.length - 1 - periodsBack].value;
  return Math.round((current - past) * 100) / 100;
}
