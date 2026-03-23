"use client";

import React from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  ReferenceArea,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { RegimePoint } from "@/types/scores";
import Card from "@/components/ui/Card";

interface RegimeQuadrantProps {
  regimeTrail: RegimePoint[];
  currentGrowth: number;
  currentInflation: number;
}

interface TrailPoint {
  x: number;
  y: number;
  opacity: number;
  isCurrent: boolean;
}

// Quadrant definitions with TV-palette colors
const QUADRANTS = [
  { x1: 0, x2: 2, y1: 0, y2: 2, fill: "#EF5350", label: "Overheat / Stagflation", pos: "top-right" },
  { x1: -2, x2: 0, y1: 0, y2: 2, fill: "#2962FF", label: "Reflation",              pos: "top-left"  },
  { x1: 0, x2: 2, y1: -2, y2: 0, fill: "#26A69A", label: "Goldilocks",             pos: "bot-right" },
  { x1: -2, x2: 0, y1: -2, y2: 0, fill: "#FF9800", label: "Disinflation Slowdown", pos: "bot-left"  },
] as const;

const LABEL_POS: Record<string, string> = {
  "top-right": "absolute top-6 right-5 text-right",
  "top-left":  "absolute top-6 left-14 text-left",
  "bot-right": "absolute bottom-8 right-5 text-right",
  "bot-left":  "absolute bottom-8 left-14 text-left",
};

const LABEL_COLOR: Record<string, string> = {
  "top-right": "#EF5350",
  "top-left":  "#2962FF",
  "bot-right": "#26A69A",
  "bot-left":  "#FF9800",
};

export default function RegimeQuadrant({
  regimeTrail,
  currentGrowth,
  currentInflation,
}: RegimeQuadrantProps) {
  const trailData: TrailPoint[] = regimeTrail.map((pt, idx) => ({
    x: pt.growthScore,
    y: pt.inflationScore,
    opacity: 0.12 + (idx / regimeTrail.length) * 0.5,
    isCurrent: false,
  }));

  const currentData: TrailPoint[] = [
    { x: currentGrowth, y: currentInflation, opacity: 1, isCurrent: true },
  ];

  return (
    <Card title="Macro Regime">
      <div className="relative w-full" style={{ height: 360 }}>
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4">
          <div className="terminal-data-chip px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
            Growth {currentGrowth.toFixed(2)}
          </div>
          <div className="terminal-data-chip px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
            Inflation {currentInflation.toFixed(2)}
          </div>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 18, right: 16, bottom: 24, left: 16 }}>
            <CartesianGrid strokeDasharray="0" stroke="rgba(65, 89, 121, 0.32)" />

            {QUADRANTS.map((q) => (
              <ReferenceArea
                key={q.label}
                x1={q.x1} x2={q.x2} y1={q.y1} y2={q.y2}
                fill={q.fill}
                fillOpacity={0.07}
              />
            ))}

            <XAxis
              type="number"
              dataKey="x"
              domain={[-2, 2]}
              tickCount={5}
              tick={{ fill: "#627287", fontSize: 10, fontFamily: "IBM Plex Mono, monospace" }}
              label={{ value: "Growth →", position: "insideBottom", offset: -12, fill: "#627287", fontSize: 10 }}
            />
            <YAxis
              type="number"
              dataKey="y"
              domain={[-2, 2]}
              tickCount={5}
              tick={{ fill: "#627287", fontSize: 10, fontFamily: "IBM Plex Mono, monospace" }}
              label={{ value: "Inflation →", angle: -90, position: "insideLeft", offset: 14, fill: "#627287", fontSize: 10 }}
            />

            {/* Axis crosshairs */}
            <ReferenceLine x={0} stroke="#4d6483" strokeWidth={1} strokeOpacity={0.65} />
            <ReferenceLine y={0} stroke="#4d6483" strokeWidth={1} strokeOpacity={0.65} />

            <Tooltip
              content={({ payload }) => {
                if (!payload || payload.length === 0) return null;
                const d = payload[0].payload as TrailPoint;
                return (
                  <div className="terminal-panel px-3 py-2 text-[10px] font-mono shadow-2xl">
                    <div className="text-text-secondary">Growth:&nbsp;{d.x.toFixed(2)}</div>
                    <div className="text-text-secondary">Inflation:&nbsp;{d.y.toFixed(2)}</div>
                  </div>
                );
              }}
            />

            {/* Faded trail */}
            <Scatter data={trailData} isAnimationActive={false}>
              {trailData.map((pt, idx) => (
                <Cell key={idx} fill="#89a2c4" fillOpacity={pt.opacity} r={3} />
              ))}
            </Scatter>

            {/* Current point */}
            <Scatter data={currentData} isAnimationActive={false}>
              <Cell fill="#6ea8ff" r={7} />
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>

        {/* Pulsing beacon overlay — positioned on top of the current dot */}
        <div
          className="absolute pointer-events-none"
          style={{
            // Map data coords [-2,2] to CSS % within the chart plot area
            // Chart margins: top 18, right 16, bottom 24, left 16 (+ y-axis ~30px)
            left:   `calc(${((currentGrowth + 2) / 4) * 100}% - 6px)`,
            top:    `calc(${((2 - currentInflation) / 4) * 100}% - 6px)`,
          }}
        >
          <span className="animate-beacon absolute inline-flex h-3 w-3 rounded-full bg-accent opacity-60" />
        </div>

        {/* Quadrant labels */}
        {QUADRANTS.map((q) => (
          <div
            key={q.label}
            className={`${LABEL_POS[q.pos]} pointer-events-none font-mono text-[10px] font-semibold uppercase tracking-wider`}
            style={{ color: `${LABEL_COLOR[q.pos]}99` }}
          >
            {q.label}
          </div>
        ))}
      </div>
    </Card>
  );
}
