"use client";

import React, { useState } from "react";
import { EducationalNote } from "@/types/educational";

interface EducationalDrawerProps {
  notes: EducationalNote[];
  isOpen: boolean;
  onClose: () => void;
}

export default function EducationalDrawer({
  notes,
  isOpen,
  onClose,
}: EducationalDrawerProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-[360px] bg-surface border-l border-border z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-text-primary text-lg font-semibold">Learn</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M4 4L12 12M12 4L4 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto h-[calc(100%-65px)] p-4 space-y-2">
          {notes.map((note) => {
            const isExpanded = expandedIds.has(note.sectionId);
            return (
              <div key={note.sectionId} className="border border-border rounded-lg">
                <button
                  onClick={() => toggle(note.sectionId)}
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-surface-elevated transition-colors rounded-lg"
                >
                  <span className="text-text-primary text-sm font-medium">
                    {note.title}
                  </span>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    className={`text-text-muted transition-transform duration-200 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  >
                    <path
                      d="M3 5L7 9L11 5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                {isExpanded && (
                  <div className="px-3 pb-3 space-y-3">
                    <div>
                      <div className="text-accent text-xs font-medium uppercase tracking-wider mb-1">
                        Why it matters
                      </div>
                      <p className="text-text-secondary text-sm leading-relaxed">
                        {note.whyItMatters}
                      </p>
                    </div>
                    <div>
                      <div className="text-accent text-xs font-medium uppercase tracking-wider mb-1">
                        How to interpret
                      </div>
                      <p className="text-text-secondary text-sm leading-relaxed">
                        {note.howToInterpret}
                      </p>
                    </div>
                    <div>
                      <div className="text-caution text-xs font-medium uppercase tracking-wider mb-1">
                        Common pitfall
                      </div>
                      <p className="text-text-secondary text-sm leading-relaxed">
                        {note.pitfall}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
