import { NextResponse } from "next/server";
import { dataProvider } from "@/data";

export async function GET() {
  try {
    const data = await dataProvider.getDashboardData();

    return NextResponse.json({
      asOf: new Date().toISOString(),
      summary: {
        scores: data.scores,
        regimeTrail: data.regimeTrail,
        whatChanged: data.whatChanged ?? [],
        growthMetrics: data.growthMetrics,
        inflationMetrics: data.inflationMetrics,
        policyMetrics: data.policyMetrics,
        liquidityMetrics: data.liquidityMetrics,
        riskMetrics: data.riskMetrics,
        heatmapAssets: data.heatmapAssets,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load dashboard summary", details: String(error) },
      { status: 500 },
    );
  }
}
