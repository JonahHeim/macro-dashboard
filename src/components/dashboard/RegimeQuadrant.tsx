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

export default function RegimeQuadrant({
  regimeTrail,
  currentGrowth,
  currentInflation,
}: RegimeQuadrantProps) {
  const trailData: TrailPoint[] = regimeTrail.map((pt, idx) => ({
    x: pt.growthScore,
    y: pt.inflationScore,
    opacity: 0.15 + (idx / regimeTrail.length) * 0.55,
    isCurrent: false,
  }));

  const currentData: TrailPoint[] = [
    { x: currentGrowth, y: currentInflation, opacity: 1, isCurrent: true },
  ];

  return (
    <Card title="Macro Regime">
      <div className="relative w-full" style={{ height: 400 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1C2333" />

            {/* Quadrant backgrounds */}
            <ReferenceArea
              x1={0}
              x2={2}
              y1={0}
              y2={2}
              fill="#EF4444"
              fillOpacity={0.05}
            />
            <ReferenceArea
              x1={-2}
              x2={0}
              y1={0}
              y2={2}
              fill="#3B82F6"
              fillOpacity={0.05}
            />
            <ReferenceArea
              x1={0}
              x2={2}
              y1={-2}
              y2={0}
              fill="#22C55E"
              fillOpacity={0.05}
            />
            <ReferenceArea
              x1={-2}
              x2={0}
              y1={-2}
              y2={0}
              fill="#F59E0B"
              fillOpacity={0.05}
            />

            <XAxis
              type="number"
              dataKey="x"
              domain={[-2, 2]}
              tickCount={5}
              tick={{ fill: "#64748B", fontSize: 11 }}
              label={{
                value: "Growth Score",
                position: "insideBottom",
                offset: -10,
                fill: "#64748B",
                fontSize: 12,
              }}
            />
            <YAxis
              type="number"
              dataKey="y"
              domain={[-2, 2]}
              tickCount={5}
              tick={{ fill: "#64748B", fontSize: 11 }}
              label={{
                value: "Inflation Score",
                angle: -90,
                position: "insideLeft",
                offset: 10,
                fill: "#64748B",
                fontSize: 12,
              }}
            />

            <ReferenceLine x={0} stroke="#2A3346" strokeWidth={1} />
            <ReferenceLine y={0} stroke="#2A3346" strokeWidth={1} />

            <Tooltip
              content={({ payload }) => {
                if (!payload || payload.length === 0) return null;
                const d = payload[0].payload as TrailPoint;
                return (
                  <div className="bg-surface-elevated border border-border rounded px-2 py-1 text-xs">
                    <div className="text-text-secondary">
                      Growth: {d.x.toFixed(2)}
                    </div>
                    <div className="text-text-secondary">
                      Inflation: {d.y.toFixed(2)}
                    </div>
                  </div>
                );
              }}
            />

            {/* Trail scatter */}
            <Scatter data={trailData} isAnimationActive={false}>
              {trailData.map((pt, idx) => (
                <Cell
                  key={idx}
                  fill="#94A3B8"
                  fillOpacity={pt.opacity}
                  r={3}
                />
              ))}
            </Scatter>

            {/* Current point */}
            <Scatter data={currentData} isAnimationActive={false}>
              <Cell fill="var(--color-accent)" r={8} />
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>

        {/* Quadrant labels */}
        <div className="absolute top-6 right-6 text-xs text-negative/70 font-medium pointer-events-none">
          Overheat / Stagflation
        </div>
        <div className="absolute top-6 left-10 text-xs text-accent/70 font-medium pointer-events-none">
          Reflation
        </div>
        <div className="absolute bottom-8 right-6 text-xs text-positive/70 font-medium pointer-events-none">
          Goldilocks
        </div>
        <div className="absolute bottom-8 left-10 text-xs text-caution/70 font-medium pointer-events-none">
          Disinflation Slowdown
        </div>
      </div>
    </Card>
  );
}
