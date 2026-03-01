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
    <div className={`bg-surface border border-border rounded-xl p-4 ${className}`}>
      {title && (
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-text-secondary text-sm font-medium uppercase tracking-wider">
            {title}
          </h3>
          {onInfoClick && (
            <button
              onClick={onInfoClick}
              className="w-5 h-5 rounded-full border border-border text-text-muted text-xs flex items-center justify-center hover:text-text-secondary hover:border-text-muted transition-colors"
              aria-label="Info"
            >
              i
            </button>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
