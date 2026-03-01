import { TimeSeriesPoint } from "@/types/metrics";
import { cleanSeries, parseCsv } from "@/data/utils/series";

const FRED_GRAPH_CSV = "https://fred.stlouisfed.org/graph/fredgraph.csv";

export async function fetchFredSeries(
  seriesId: string,
  options?: { start?: string; end?: string },
): Promise<TimeSeriesPoint[]> {
  const params = new URLSearchParams({ id: seriesId });
  if (options?.start) {
    params.set("cosd", options.start);
  }
  if (options?.end) {
    params.set("coed", options.end);
  }

  const response = await fetch(`${FRED_GRAPH_CSV}?${params.toString()}`, {
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`FRED request failed for ${seriesId}: ${response.status}`);
  }

  const csv = await response.text();
  const rows = parseCsv(csv);
  if (rows.length <= 1) {
    return [];
  }

  const output: TimeSeriesPoint[] = [];
  for (let idx = 1; idx < rows.length; idx += 1) {
    const [date, raw] = rows[idx];
    if (!date || !raw || raw === ".") {
      continue;
    }

    const value = Number.parseFloat(raw);
    if (!Number.isFinite(value)) {
      continue;
    }

    output.push({ date, value });
  }

  return cleanSeries(output);
}
