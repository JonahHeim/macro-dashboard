import { describe, expect, it } from "vitest";
import { summarizeIngestionHealth } from "@/server/modules/ingestion/rawData";
import type { IngestionDiagnostics } from "@/server/modules/ingestion/rawData";

function buildDiagnostics(overrides?: Partial<IngestionDiagnostics>): IngestionDiagnostics {
  return {
    capturedAt: "2026-02-28T00:00:00.000Z",
    totalDurationMs: 1800,
    totalRequested: 10,
    totalFailures: 0,
    fred: {
      source: "fred",
      requested: 6,
      succeeded: 6,
      failed: 0,
      durationMs: 900,
      failures: [],
    },
    stooq: {
      source: "stooq",
      requested: 4,
      succeeded: 4,
      failed: 0,
      durationMs: 900,
      failures: [],
    },
    ...overrides,
  };
}

describe("summarizeIngestionHealth", () => {
  it("returns empty messages for healthy ingestion", () => {
    expect(summarizeIngestionHealth(buildDiagnostics())).toEqual([]);
  });

  it("emits degraded health messages for failures and latency", () => {
    const diagnostics = buildDiagnostics({
      totalDurationMs: 8400,
      totalFailures: 2,
      fred: {
        source: "fred",
        requested: 6,
        succeeded: 5,
        failed: 1,
        durationMs: 2500,
        failures: [{ source: "fred", id: "NAPM", error: "timeout", durationMs: 1200 }],
      },
      stooq: {
        source: "stooq",
        requested: 4,
        succeeded: 3,
        failed: 1,
        durationMs: 2300,
        failures: [{ source: "stooq", id: "spy.us", error: "500", durationMs: 600 }],
      },
    });

    expect(summarizeIngestionHealth(diagnostics)).toEqual([
      "Data ingestion degraded: 2/10 sources failed (FRED 1, Stooq 1).",
      "Data ingestion slow: 8400ms total fetch time.",
      "FRED failures: NAPM.",
      "Stooq failures: spy.us.",
    ]);
  });
});
