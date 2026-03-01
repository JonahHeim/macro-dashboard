import { describe, expect, it } from "vitest";
import { filterSeriesByRange, parseHorizons, parseRange } from "@/lib/apiRanges";

describe("apiRanges", () => {
  it("defaults to 1y for unsupported ranges", () => {
    expect(parseRange("invalid")).toBe("1y");
    expect(parseRange(null)).toBe("1y");
  });

  it("parses and normalizes horizons", () => {
    expect(parseHorizons("1d, 1w, bad")).toEqual(["1D", "1W"]);
    expect(parseHorizons(null)).toEqual(["1D", "1W", "1M", "YTD"]);
  });

  it("filters a series by range cutoff", () => {
    const series = [
      { date: "2024-01-01", value: 1 },
      { date: "2024-06-01", value: 2 },
      { date: "2025-01-01", value: 3 },
      { date: "2025-12-31", value: 4 },
    ];

    expect(filterSeriesByRange(series, "1m")).toEqual([{ date: "2025-12-31", value: 4 }]);
    expect(filterSeriesByRange(series, "all")).toEqual(series);
  });
});
