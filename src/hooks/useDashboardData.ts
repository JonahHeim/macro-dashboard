"use client";

import { useEffect, useState } from "react";
import { DashboardData } from "@/data/types";

interface UseDashboardDataResult {
  data: DashboardData;
  lastUpdated: Date;
  isRefreshing: boolean;
}

export function useDashboardData(initialData: DashboardData): UseDashboardDataResult {
  const [data, setData] = useState<DashboardData>(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function refreshOnce() {
      setIsRefreshing(true);
      try {
        const res = await fetch("/api/dashboard/summary", { cache: "no-store" });
        if (!res.ok || cancelled) {
          return;
        }

        const json = await res.json();
        if (!cancelled && json.summary) {
          setData(json.summary as DashboardData);
        }
      } catch {
        // Keep prerendered snapshot if the refresh request fails.
      } finally {
        if (!cancelled) {
          setIsRefreshing(false);
        }
      }
    }

    void refreshOnce();
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, lastUpdated: new Date(data.capturedAt), isRefreshing };
}
