"use client";

import React from "react";
import { formatDelta } from "@/lib/formatting";
import { getChangeColor } from "@/lib/colors";

interface BadgeProps {
  value: number;
  label?: string;
  invert?: boolean;
  size?: "sm" | "md";
}

export default function Badge({ value, label, invert = false, size = "sm" }: BadgeProps) {
  const colorClass = getChangeColor(value, invert);
  const arrow = value >= 0 ? "▲" : "▼";
  const sizeClasses = size === "sm" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-1";

  return (
    <span
      className={`inline-flex items-center gap-0.5 bg-surface-elevated border border-border ${sizeClasses} font-mono tabular-nums`}
    >
      {label && <span className="text-text-muted mr-0.5">{label}</span>}
      <span className={colorClass}>
        {arrow}&nbsp;{formatDelta(value)}
      </span>
    </span>
  );
}
