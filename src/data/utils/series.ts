import { TimeSeriesPoint, MetricFrequency } from "@/types/metrics";

export function parseCsv(raw: string): string[][] {
  const lines = raw.trim().split(/\r?\n/);
  return lines.map((line) => line.split(",").map((cell) => cell.trim()));
}

export function cleanSeries(points: TimeSeriesPoint[]): TimeSeriesPoint[] {
  return points
    .filter((point) => Number.isFinite(point.value) && !Number.isNaN(new Date(point.date).getTime()))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function round(value: number, digits = 2): number {
  const p = 10 ** digits;
  return Math.round(value * p) / p;
}

export function getLatestValue(series: TimeSeriesPoint[]): number {
  return series.at(-1)?.value ?? 0;
}

export function getChange(series: TimeSeriesPoint[], periodsBack: number): number {
  if (series.length <= periodsBack) {
    return 0;
  }
  const latest = series.at(-1)?.value ?? 0;
  const prior = series[series.length - 1 - periodsBack]?.value ?? latest;
  return round(latest - prior, 2);
}

export function yoyFromSeries(series: TimeSeriesPoint[], periodsPerYear: number): TimeSeriesPoint[] {
  if (series.length <= periodsPerYear) {
    return [];
  }

  const out: TimeSeriesPoint[] = [];
  for (let idx = periodsPerYear; idx < series.length; idx += 1) {
    const current = series[idx];
    const prior = series[idx - periodsPerYear];
    if (prior.value === 0) {
      continue;
    }

    out.push({
      date: current.date,
      value: round(((current.value / prior.value) - 1) * 100, 2),
    });
  }
  return out;
}

export function rollingAverage(series: TimeSeriesPoint[], window: number): TimeSeriesPoint[] {
  if (window <= 1 || series.length < window) {
    return [...series];
  }

  const out: TimeSeriesPoint[] = [];
  let rollingSum = 0;
  for (let idx = 0; idx < series.length; idx += 1) {
    rollingSum += series[idx].value;
    if (idx >= window) {
      rollingSum -= series[idx - window].value;
    }

    if (idx >= window - 1) {
      out.push({
        date: series[idx].date,
        value: round(rollingSum / window, 2),
      });
    }
  }

  return out;
}

export function trailingZScores(series: TimeSeriesPoint[], window: number): TimeSeriesPoint[] {
  if (series.length < 2) {
    return series.map((point) => ({ ...point, value: 0 }));
  }

  const out: TimeSeriesPoint[] = [];
  for (let idx = 0; idx < series.length; idx += 1) {
    const start = Math.max(0, idx - window + 1);
    const slice = series.slice(start, idx + 1).map((point) => point.value);
    const mean = slice.reduce((acc, value) => acc + value, 0) / slice.length;
    const variance = slice.reduce((acc, value) => acc + ((value - mean) ** 2), 0) / slice.length;
    const sd = Math.sqrt(variance);
    const z = sd === 0 ? 0 : (series[idx].value - mean) / sd;

    out.push({
      date: series[idx].date,
      value: round(z, 3),
    });
  }

  return out;
}

export function latestZScore(series: TimeSeriesPoint[], window: number): number {
  return trailingZScores(series, window).at(-1)?.value ?? 0;
}

export function getWindowForFrequency(frequency: MetricFrequency): number {
  switch (frequency) {
    case "daily":
      return 252;
    case "weekly":
      return 104;
    case "monthly":
      return 60;
    case "quarterly":
      return 40;
    case "event-driven":
      return 30;
    default:
      return 60;
  }
}

export function periodsForChange(frequency: MetricFrequency): { oneWeek: number; oneMonth: number } {
  switch (frequency) {
    case "daily":
      return { oneWeek: 5, oneMonth: 22 };
    case "weekly":
      return { oneWeek: 1, oneMonth: 4 };
    case "monthly":
      return { oneWeek: 1, oneMonth: 1 };
    case "quarterly":
      return { oneWeek: 1, oneMonth: 1 };
    case "event-driven":
      return { oneWeek: 1, oneMonth: 1 };
    default:
      return { oneWeek: 1, oneMonth: 1 };
  }
}

export function calculateScoreValue(contributors: Array<{ contribution: number }>): number {
  if (contributors.length === 0) {
    return 0;
  }
  const total = contributors.reduce((acc, item) => acc + item.contribution, 0);
  return round(total, 2);
}

export function calculateConfidence(contributors: Array<{ contribution: number }>): number {
  if (contributors.length === 0) {
    return 0;
  }

  const signal = contributors
    .map((item) => Math.sign(item.contribution))
    .reduce((acc, value) => acc + value, 0);

  return Math.round((Math.abs(signal) / contributors.length) * 100);
}

export function mergeScoreHistory(
  components: Array<{ series: TimeSeriesPoint[]; weight: number; invert?: boolean }>,
  maxPoints = 260,
): TimeSeriesPoint[] {
  if (components.length === 0) {
    return [];
  }

  const allDates = new Set<string>();
  for (const component of components) {
    for (const point of component.series) {
      allDates.add(point.date);
    }
  }

  const sortedDates = [...allDates].sort((a, b) => a.localeCompare(b));
  const pointers = components.map(() => 0);
  const output: TimeSeriesPoint[] = [];

  for (const date of sortedDates) {
    let weighted = 0;
    let totalWeight = 0;

    for (let idx = 0; idx < components.length; idx += 1) {
      const component = components[idx];
      const series = component.series;
      while (pointers[idx] + 1 < series.length && series[pointers[idx] + 1].date <= date) {
        pointers[idx] += 1;
      }

      const candidate = series[pointers[idx]];
      if (!candidate || candidate.date > date) {
        continue;
      }

      const value = component.invert ? -candidate.value : candidate.value;
      weighted += value * component.weight;
      totalWeight += component.weight;
    }

    if (totalWeight > 0) {
      output.push({ date, value: round(weighted / totalWeight, 3) });
    }
  }

  return output.slice(-maxPoints);
}

export function latestDate(series: TimeSeriesPoint[]): string {
  return series.at(-1)?.date ?? new Date().toISOString().slice(0, 10);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
