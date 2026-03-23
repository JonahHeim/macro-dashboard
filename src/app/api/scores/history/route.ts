import { NextRequest, NextResponse } from "next/server";
import { dataProvider } from "@/data";
import { ScoreId } from "@/types/scores";
import { filterSeriesByRange, parseRange } from "@/lib/apiRanges";

export const revalidate = 86400;

const SCORE_IDS: ScoreId[] = ["growth", "inflation", "policy", "liquidity", "risk_sentiment"];

function parseScoreId(value: string | null): ScoreId {
  if (value && SCORE_IDS.includes(value as ScoreId)) {
    return value as ScoreId;
  }
  return "growth";
}

export async function GET(request: NextRequest) {
  try {
    const scoreId = parseScoreId(request.nextUrl.searchParams.get("score"));
    const range = parseRange(request.nextUrl.searchParams.get("range"));

    const data = await dataProvider.getDashboardData();
    const score = data.scores.find((item) => item.id === scoreId);
    if (!score) {
      throw new Error(`Score not found: ${scoreId}`);
    }
    const history = filterSeriesByRange(score.history, range);

    return NextResponse.json({
      asOf: data.capturedAt,
      score: {
        id: score.id,
        name: score.name,
        value: score.value,
        change1W: score.change1W,
        change1M: score.change1M,
        status: score.status,
        lastUpdated: score.lastUpdated,
        confidence: score.confidence,
      },
      range,
      history,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load score history", details: String(error) },
      { status: 500 },
    );
  }
}
