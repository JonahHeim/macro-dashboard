import { describe, expect, it } from "vitest";
import { buildContributorHeadline, buildWhatChangedSummary } from "@/server/modules/insights/insightEngine";
import { CompositeScore } from "@/types/scores";

const buildScore = (
  name: string,
  change1W: number,
  contributors: CompositeScore["contributors"],
): CompositeScore => ({
  id: "growth",
  name,
  value: 0.1,
  change1W,
  change1M: 0,
  status: "neutral",
  lastUpdated: "2026-01-01",
  history: [],
  contributors,
  confidence: 90,
});

describe("insightEngine", () => {
  it("sorts top weekly movers by absolute change", () => {
    const scores = [
      buildScore("A", 0.1, []),
      buildScore("B", -0.6, []),
      buildScore("C", 0.4, []),
      buildScore("D", 0.2, []),
    ];

    expect(buildWhatChangedSummary(scores)).toEqual([
      "B moved down 0.60 this week.",
      "C moved up 0.40 this week.",
      "D moved up 0.20 this week.",
    ]);
  });

  it("builds contributor headline from largest absolute contribution", () => {
    const scores = [
      buildScore("Growth Score", 0, [
        { metricId: "m1", metricName: "Metric 1", zScore: 0.2, weight: 0.5, contribution: 0.1 },
        { metricId: "m2", metricName: "Metric 2", zScore: -0.8, weight: 0.5, contribution: -0.4 },
      ]),
    ];

    expect(buildContributorHeadline(scores)).toEqual([
      "Growth Score top negative driver: Metric 2 (-0.400).",
    ]);
  });
});
