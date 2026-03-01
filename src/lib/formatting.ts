export function formatNumber(value: number, unit: string): string {
  if (unit === "index" || unit === "ratio") {
    return value.toFixed(1);
  }
  if (unit === "%") {
    return value.toFixed(2) + "%";
  }
  if (unit === "bps") {
    return value.toFixed(0) + " bps";
  }
  if (unit === "USD" || unit === "$") {
    if (value >= 1000000) return "$" + (value / 1000000).toFixed(2) + "M";
    if (value >= 1000) return "$" + value.toLocaleString("en-US", { maximumFractionDigits: 0 });
    return "$" + value.toFixed(2);
  }
  if (unit === "thousands") {
    return (value / 1000).toFixed(0) + "K";
  }
  return value.toFixed(2);
}

export function formatScore(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return sign + value.toFixed(2);
}

export function formatDelta(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return sign + value.toFixed(2);
}

export function formatRelativeTime(isoDate: string): string {
  const now = new Date();
  const date = new Date(isoDate);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
