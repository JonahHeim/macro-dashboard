import { describe, expect, it } from "vitest";
import { calculateConfidence, mergeScoreHistory, yoyFromSeries } from "@/data/utils/series";

describe("series utils", () => {
  it("computes YoY percentage change", () => {
    const series = [
      { date: "2024-01-01", value: 100 },
      { date: "2025-01-01", value: 110 },
      { date: "2026-01-01", value: 121 },
    ];

    expect(yoyFromSeries(series, 1)).toEqual([
      { date: "2025-01-01", value: 10 },
      { date: "2026-01-01", value: 10 },
    ]);
  });

  it("computes contributor confidence by directional agreement", () => {
    expect(
      calculateConfidence([
        { contribution: 1 },
        { contribution: 2 },
        { contribution: -1 },
      ]),
    ).toBe(33);
  });

  it("merges weighted score histories across components", () => {
    const merged = mergeScoreHistory(
      [
        {
          series: [
            { date: "2025-01-01", value: 1 },
            { date: "2025-01-02", value: 3 },
          ],
          weight: 0.5,
        },
        {
          series: [
            { date: "2025-01-01", value: 1 },
            { date: "2025-01-02", value: 1 },
          ],
          weight: 0.5,
        },
      ],
      10,
    );

    expect(merged).toEqual([
      { date: "2025-01-01", value: 1 },
      { date: "2025-01-02", value: 2 },
    ]);
  });
});
