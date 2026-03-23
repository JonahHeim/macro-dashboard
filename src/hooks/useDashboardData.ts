"use client";

import { useEffect, useRef, useState } from "react";
import { DashboardData } from "@/data/types";

interface UseDashboardDataResult {
  data: DashboardData;
  lastUpdated: Date;
  isRefreshing: boolean;
}

const DEFAULT_POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export function useDashboardData(
  initialData: DashboardData,
  pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
): UseDashboardDataResult {
  const [data, setData] = useState<DashboardData>(initialData);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function refresh() {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/dashboard/summary", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json.summary) {
          setData((prev) => ({
            ...prev,
            ...json.summary,
          }));
          setLastUpdated(new Date());
        }
      }
    } catch {
      // silently ignore network errors; stale data is better than crashing
    } finally {
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    intervalRef.current = setInterval(refresh, pollIntervalMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [pollIntervalMs]);

  return { data, lastUpdated, isRefreshing };
}
