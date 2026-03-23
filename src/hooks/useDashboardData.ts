"use client";

import { DashboardData } from "@/data/types";

interface UseDashboardDataResult {
  data: DashboardData;
  lastUpdated: Date;
  isRefreshing: boolean;
}

export function useDashboardData(initialData: DashboardData): UseDashboardDataResult {
  const lastUpdated = new Date(initialData.capturedAt);
  return { data: initialData, lastUpdated, isRefreshing: false };
}
