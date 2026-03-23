"use client";

import React from "react";

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  onInfoClick?: () => void;
}

export default function Card({ title, children, className = "", onInfoClick }: CardProps) {
  return (
    <div className={`terminal-panel ${className}`}>
      {title && (
        <div className="relative flex items-center justify-between border-b border-border-strong px-4 py-3">
          <div className="absolute inset-y-0 left-0 w-px bg-caution/60" />
          <h3 className="terminal-header-label pl-2 text-text-secondary">
            {title}
          </h3>
          {onInfoClick && (
            <button
              onClick={onInfoClick}
              className="terminal-data-chip px-2 py-1 text-[10px] leading-none text-text-muted hover:text-text-primary"
              aria-label="Info"
            >
              INFO
            </button>
          )}
        </div>
      )}
      <div className="relative p-4">
        {children}
      </div>
    </div>
  );
}
