import { ScoreStatus } from "@/types/scores";

export function getScoreColor(status: ScoreStatus): string {
  switch (status) {
    case "positive": return "var(--color-positive)";
    case "negative": return "var(--color-negative)";
    case "caution": return "var(--color-caution)";
    case "neutral": return "var(--color-neutral)";
  }
}

export function getScoreColorClass(status: ScoreStatus): string {
  switch (status) {
    case "positive": return "text-positive";
    case "negative": return "text-negative";
    case "caution": return "text-caution";
    case "neutral": return "text-neutral";
  }
}

export function getScoreBgClass(status: ScoreStatus): string {
  switch (status) {
    case "positive": return "bg-positive/10 border-positive/30";
    case "negative": return "bg-negative/10 border-negative/30";
    case "caution": return "bg-caution/10 border-caution/30";
    case "neutral": return "bg-neutral/10 border-neutral/30";
  }
}

export function getChangeColor(value: number, invert = false): string {
  const v = invert ? -value : value;
  if (v > 0.01) return "text-positive";
  if (v < -0.01) return "text-negative";
  return "text-neutral";
}

// TradingView-palette heatmap (pine green / tomato red)
export function getHeatmapCellStyle(value: number): { bg: string; text: string } {
  const abs = Math.abs(value);
  const intensity = Math.min(abs / 5, 1);

  if (value > 0.05) {
    return {
      bg: `rgba(38, 166, 154, ${0.08 + intensity * 0.38})`,
      text: intensity > 0.3 ? "#26A69A" : "#4DB6AC",
    };
  }
  if (value < -0.05) {
    return {
      bg: `rgba(239, 83, 80, ${0.08 + intensity * 0.38})`,
      text: intensity > 0.3 ? "#EF5350" : "#EF9A9A",
    };
  }
  return {
    bg: "transparent",
    text: "#434651",
  };
}
