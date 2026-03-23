import { NextRequest, NextResponse } from "next/server";
import { dataProvider } from "@/data";
import { HorizonKey, parseHorizons } from "@/lib/apiRanges";

export const revalidate = 86400;

export async function GET(request: NextRequest) {
  try {
    const data = await dataProvider.getDashboardData();
    const horizons = parseHorizons(request.nextUrl.searchParams.get("horizons"));
    const assets = data.heatmapAssets;

    const filteredAssets = assets.map((asset) => {
      const returns: Partial<Record<HorizonKey, number>> = {};
      for (const horizon of horizons) {
        returns[horizon] = asset.returns[horizon];
      }

      return {
        id: asset.id,
        name: asset.name,
        ticker: asset.ticker,
        category: asset.category,
        currentPrice: asset.currentPrice,
        returns,
      };
    });

    return NextResponse.json({
      asOf: data.capturedAt,
      horizons,
      assets: filteredAssets,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load heatmap", details: String(error) },
      { status: 500 },
    );
  }
}
