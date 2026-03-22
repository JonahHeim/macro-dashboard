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
      className="w-full text-left bg-surface border border-border hover:bg-surface-elevated transition-colors"
      style={{ borderTopColor: getScoreColor(score.status), borderTopWidth: "2px" }}
    >
      {/* Label row */}
      <div className="px-3 pt-2.5 pb-0">
        <div className="text-text-muted text-[10px] font-semibold uppercase tracking-[0.12em]">
          {score.name}
        </div>
      </div>

      {/* Value */}
      <div className={`px-3 pt-1 pb-2 text-3xl font-bold font-mono tabular-nums ${colorClass}`}>
        {formatScore(score.value)}
      </div>

      {/* Badges + meta */}
      <div className="px-3 pb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Badge value={score.change1W} label="1W" />
          <Badge value={score.change1M} label="1M" />
        </div>
        <div className="text-right">
          <div className="text-text-muted text-[10px] font-mono">
            {formatRelativeTime(score.lastUpdated)}
          </div>
          {score.confidence !== undefined && (
            <div className="text-text-muted text-[10px] font-mono">
              CONF&nbsp;{score.confidence}%
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
