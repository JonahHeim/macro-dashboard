import { NextResponse } from "next/server";
import { dataProvider } from "@/data";

export const revalidate = 86400;

export async function GET() {
  try {
    const data = await dataProvider.getDashboardData();
    return NextResponse.json({ asOf: data.capturedAt, scores: data.scores });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load latest scores", details: String(error) },
      { status: 500 },
    );
  }
}
