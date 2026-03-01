"use client";

import React from "react";
import { CompositeScore } from "@/types/scores";
import { formatScore, formatRelativeTime } from "@/lib/formatting";
import { getScoreColor, getScoreColorClass } from "@/lib/colors";
import Badge from "@/components/ui/Badge";

interface KPICardProps {
  score: CompositeScore;
  onClick?: () => void;
}

export default function KPICard({ score, onClick }: KPICardProps) {
  const colorClass = getScoreColorClass(score.status);

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left bg-surface border border-border rounded-lg p-3 border-l-4 hover:bg-surface-elevated transition-colors"
      style={{ borderLeftColor: getScoreColor(score.status) }}
    >
      <div className="text-text-secondary text-xs font-medium uppercase tracking-wider mb-1">
        {score.name}
      </div>
      <div className={`text-2xl font-semibold font-mono tabular-nums ${colorClass}`}>
        {formatScore(score.value)}
      </div>
      <div className="flex items-center gap-2 mt-2">
        <Badge value={score.change1W} label="1W" />
        <Badge value={score.change1M} label="1M" />
      </div>
      <div className="text-text-muted text-xs mt-2">
        {formatRelativeTime(score.lastUpdated)}
      </div>
      {score.confidence !== undefined && (
        <div className="text-text-muted text-[11px] mt-1">
          Confidence: {score.confidence}%
        </div>
      )}
    </button>
  );
}
