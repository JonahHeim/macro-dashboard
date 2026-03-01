"use client";

import React from "react";
import { MetricWithData } from "@/types/metrics";
import Card from "@/components/ui/Card";
import MetricChart from "./MetricChart";

interface GrowthPanelProps {
  metrics: MetricWithData[];
}

export default function GrowthPanel({ metrics }: GrowthPanelProps) {
  return (
    <Card title="Growth">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {metrics.map((m) => (
          <MetricChart key={m.id} metric={m} />
        ))}
      </div>
    </Card>
  );
}
