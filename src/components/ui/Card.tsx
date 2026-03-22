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
    <div className={`bg-surface border border-border ${className}`}>
      {title && (
        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
          <h3 className="text-text-muted text-[10px] font-semibold uppercase tracking-[0.12em]">
            {title}
          </h3>
          {onInfoClick && (
            <button
              onClick={onInfoClick}
              className="text-text-muted text-[10px] hover:text-text-secondary transition-colors leading-none"
              aria-label="Info"
            >
              ⓘ
            </button>
          )}
        </div>
      )}
      <div className="p-3">
        {children}
      </div>
    </div>
  );
}
