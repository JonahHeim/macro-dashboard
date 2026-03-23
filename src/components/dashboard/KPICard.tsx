"use client";

import React, { useState } from "react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { CompositeScore } from "@/types/scores";
import { formatScore, formatUtcTimestamp } from "@/lib/formatting";
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
  const confidence = score.confidence ?? 0;

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="terminal-panel w-full overflow-hidden text-left"
      style={{
        borderColor: hovered ? `${scoreColor}66` : undefined,
        boxShadow: hovered
          ? `0 0 0 1px ${scoreColor}35, 0 20px 40px ${scoreColor}18`
          : undefined,
        transform: hovered ? "translateY(-2px)" : undefined,
      }}
    >
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{ background: `linear-gradient(90deg, ${scoreColor}, transparent 72%)` }}
        />
        <div className="absolute -right-10 top-0 h-16 w-28 rotate-12 bg-white/[0.03]" />

        <div className="flex items-start justify-between px-4 pb-2 pt-4">
          <div>
            <div className="terminal-header-label text-text-muted">
              {score.name}
            </div>
            <div className="mt-2 flex items-end gap-2">
              <div
                key={Math.round(score.value * 1000)}
                className={`animate-value-pop text-4xl font-semibold leading-none font-mono tabular-nums ${colorClass}`}
              >
                {formatScore(score.value)}
              </div>
              <div className="mb-1 text-[10px] uppercase tracking-[0.18em] text-text-muted">
                composite
              </div>
            </div>
          </div>
          <div className="terminal-data-chip min-w-[94px] px-2.5 py-2 text-right">
            <div className="text-[9px] uppercase tracking-[0.16em] text-text-muted">confidence</div>
            <div className="mt-1 font-mono text-sm text-text-primary">{confidence}%</div>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_auto] items-end gap-3 border-t border-border/70 px-4 py-3">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Badge value={score.change1W} label="1W" />
              <Badge value={score.change1M} label="1M" />
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.14em] text-text-muted">
              <span>last print {formatUtcTimestamp(score.lastUpdated)}</span>
              <span className="h-1 w-1 rounded-full bg-border-strong" />
              <span>click for drilldown</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-[0.16em] text-text-muted">state</div>
            <div className={`mt-1 font-mono text-sm uppercase ${colorClass}`}>{score.status}</div>
          </div>
        </div>

        {sparkData.length > 4 && (
        <div className="h-14 border-t border-border/70 bg-[linear-gradient(180deg,rgba(14,21,33,0.28),rgba(4,8,13,0.16))] px-1 pb-1 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={`kpi-fill-${score.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={scoreColor} stopOpacity={0.34} />
                  <stop offset="95%" stopColor={scoreColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={scoreColor}
                strokeWidth={1.8}
                fill={`url(#kpi-fill-${score.id})`}
                isAnimationActive={false}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        )}
      </div>
    </button>
  );
}
