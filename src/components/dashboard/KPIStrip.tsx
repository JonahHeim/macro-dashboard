"use client";

import React from "react";
import { CompositeScore } from "@/types/scores";
import KPICard from "./KPICard";

interface KPIStripProps {
  scores: CompositeScore[];
  onScoreClick?: (score: CompositeScore) => void;
}

export default function KPIStrip({ scores, onScoreClick }: KPIStripProps) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      {scores.map((score, idx) => (
        <div
          key={score.id}
          className={
            idx === scores.length - 1 && scores.length % 2 !== 0
              ? "col-span-2 lg:col-span-1"
              : ""
          }
        >
          <KPICard score={score} onClick={() => onScoreClick?.(score)} />
        </div>
      ))}
    </div>
  );
}
