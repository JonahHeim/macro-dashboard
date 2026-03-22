"use client";

import React, { useState } from "react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { CompositeScore } from "@/types/scores";
import { formatScore, formatRelativeTime } from "@/lib/formatting";
import { getScoreColor, getScoreColorClass } from "@/lib/colors";
import Badge from "@/components/ui/Badge";

interface KPICardProps {
  score: CompositeScore;
  onClick?: () => void;
}

export default function KPICard({ score, onClick }: KPICardProps) {
  const [hovered, setHovered] = useState(false);
  const colorClass = getScoreColorClass(score.status);
  const scoreColor = getScoreColor(score.status);

  const sparkData = score.history.slice(-90).map((pt) => ({ v: pt.value }));

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="w-full text-left bg-surface border border-border hover:bg-surface-elevated transition-all duration-200 overflow-hidden"
      style={{
        borderTopColor: scoreColor,
        borderTopWidth: "2px",
        boxShadow: hovered
          ? `0 0 0 1px ${scoreColor}30, 0 4px 16px ${scoreColor}15`
          : "none",
      }}
    >
      {/* Label */}
      <div className="px-3 pt-2.5">
        <div className="text-text-muted text-[10px] font-semibold uppercase tracking-[0.12em]">
          {score.name}
        </div>
      </div>

      {/* Animated value — key forces re-mount (and re-animation) on every data change */}
      <div
        key={Math.round(score.value * 1000)}
        className={`animate-value-pop px-3 pt-1 pb-1 text-3xl font-bold font-mono tabular-nums ${colorClass}`}
      >
        {formatScore(score.value)}
      </div>

      {/* Badges + meta */}
      <div className="px-3 pb-2 flex items-center justify-between">
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

      {/* Edge-to-edge sparkline — score history */}
      {sparkData.length > 4 && (
        <div className="h-9">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={`kpi-fill-${score.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={scoreColor} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={scoreColor} stopOpacity={0}    />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={scoreColor}
                strokeWidth={1.5}
                fill={`url(#kpi-fill-${score.id})`}
                isAnimationActive={false}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </button>
  );
}
