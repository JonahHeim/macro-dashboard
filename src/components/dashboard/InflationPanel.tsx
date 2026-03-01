"use client";

import React from "react";
import { MetricWithData } from "@/types/metrics";
import Card from "@/components/ui/Card";
import MetricChart from "./MetricChart";

interface InflationPanelProps {
  metrics: MetricWithData[];
}

export default function InflationPanel({ metrics }: InflationPanelProps) {
  return (
    <Card title="Inflation">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {metrics.map((m) => (
          <MetricChart key={m.id} metric={m} />
        ))}
      </div>
    </Card>
  );
}
