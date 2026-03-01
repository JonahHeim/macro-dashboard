import { TimeSeriesPoint } from "@/types/metrics";

export type RangeKey = "1m" | "3m" | "1y" | "3y" | "all";

export function parseRange(value: string | null): RangeKey {
  if (value === "1m" || value === "3m" || value === "1y" || value === "3y" || value === "all") {
    return value;
  }
  return "1y";
}

function daysForRange(range: RangeKey): number | null {
  switch (range) {
    case "1m":
      return 31;
    case "3m":
      return 93;
    case "1y":
      return 366;
    case "3y":
      return 1096;
    case "all":
      return null;
    default:
      return 366;
  }
}

export function filterSeriesByRange(series: TimeSeriesPoint[], range: RangeKey): TimeSeriesPoint[] {
  const days = daysForRange(range);
  if (days === null || series.length === 0) {
    return series;
  }

  const latest = new Date(series[series.length - 1].date);
  const cutoff = new Date(latest);
  cutoff.setDate(cutoff.getDate() - days);

  return series.filter((point) => new Date(point.date) >= cutoff);
}

const HORIZON_KEYS = ["1D", "1W", "1M", "YTD"] as const;

export type HorizonKey = typeof HORIZON_KEYS[number];

export function parseHorizons(input: string | null): HorizonKey[] {
  if (!input) {
    return [...HORIZON_KEYS];
  }

  const normalized = input
    .split(",")
    .map((item) => item.trim().toUpperCase())
    .filter((item): item is HorizonKey => HORIZON_KEYS.includes(item as HorizonKey));

  return normalized.length > 0 ? normalized : [...HORIZON_KEYS];
}
