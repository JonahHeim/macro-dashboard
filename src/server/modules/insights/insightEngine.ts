import { CompositeScore } from "@/types/scores";

export function buildWhatChangedSummary(scores: CompositeScore[]): string[] {
  const movers = [...scores]
    .sort((a, b) => Math.abs(b.change1W) - Math.abs(a.change1W))
    .slice(0, 3);

  return movers.map((score) => {
    const direction = score.change1W >= 0 ? "up" : "down";
    return `${score.name} moved ${direction} ${Math.abs(score.change1W).toFixed(2)} this week.`;
  });
}

export function buildContributorHeadline(scores: CompositeScore[]): string[] {
  return scores.map((score) => {
    const top = [...score.contributors].sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))[0];
    if (!top) {
      return `${score.name}: no contributor data.`;
    }
    const sign = top.contribution >= 0 ? "positive" : "negative";
    return `${score.name} top ${sign} driver: ${top.metricName} (${top.contribution.toFixed(3)}).`;
  });
}
