import { NextResponse } from "next/server";
import { dataProvider } from "@/data";

export async function GET() {
  try {
    const scores = await dataProvider.getScores();
    return NextResponse.json({ asOf: new Date().toISOString(), scores });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load latest scores", details: String(error) },
      { status: 500 },
    );
  }
}
