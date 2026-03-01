import { NextRequest, NextResponse } from "next/server";
import { dataProvider } from "@/data";
import { filterSeriesByRange, parseRange } from "@/lib/apiRanges";

interface RouteContext {
  params: Promise<{ metricId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { metricId } = await context.params;
    const range = parseRange(request.nextUrl.searchParams.get("range"));

    const data = await dataProvider.getDashboardData();
    const allMetrics = [
      ...data.growthMetrics,
      ...data.inflationMetrics,
      ...data.policyMetrics,
      ...data.liquidityMetrics,
      ...data.riskMetrics,
    ];

    const metric = allMetrics.find((item) => item.id === metricId);
    if (!metric) {
      return NextResponse.json({ error: `Metric not found: ${metricId}` }, { status: 404 });
    }

    return NextResponse.json({
      asOf: new Date().toISOString(),
      metric: {
        id: metric.id,
        name: metric.name,
        category: metric.category,
        frequency: metric.frequency,
        unit: metric.unit,
        latestValue: metric.latestValue,
        change1W: metric.change1W,
        change1M: metric.change1M,
        zScore: metric.zScore,
        lastUpdated: metric.series[metric.series.length - 1]?.date ?? null,
      },
      range,
      series: filterSeriesByRange(metric.series, range),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load metric series", details: String(error) },
      { status: 500 },
    );
  }
}
