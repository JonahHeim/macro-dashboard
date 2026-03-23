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
      className={`inline-flex items-center gap-1 border border-border-strong bg-[linear-gradient(180deg,rgba(22,33,49,0.95),rgba(10,17,27,0.95))] ${sizeClasses} font-mono tabular-nums shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]`}
    >
      {label && <span className="text-text-muted/90">{label}</span>}
      <span className={colorClass}>
        {arrow}&nbsp;{formatDelta(value)}
      </span>
    </span>
  );
}
