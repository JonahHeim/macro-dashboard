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
  const arrow = value >= 0 ? "\u25B2" : "\u25BC";
  const sizeClasses = size === "sm" ? "text-xs px-1.5 py-0.5" : "text-sm px-2 py-1";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md bg-surface-elevated ${sizeClasses} font-mono tabular-nums`}
    >
      {label && <span className="text-text-muted">{label}</span>}
      <span className={colorClass}>
        {arrow} {formatDelta(value)}
      </span>
    </span>
  );
}
