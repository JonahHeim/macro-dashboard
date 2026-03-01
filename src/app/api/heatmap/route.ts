import { NextRequest, NextResponse } from "next/server";
import { dataProvider } from "@/data";
import { HorizonKey, parseHorizons } from "@/lib/apiRanges";

export async function GET(request: NextRequest) {
  try {
    const horizons = parseHorizons(request.nextUrl.searchParams.get("horizons"));
    const assets = await dataProvider.getHeatmapData();

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
      asOf: new Date().toISOString(),
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
