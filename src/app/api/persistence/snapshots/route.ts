import { NextRequest, NextResponse } from "next/server";
import { getLatestSnapshots } from "@/server/persistence/snapshotStore";

export async function GET(request: NextRequest) {
  const limitRaw = request.nextUrl.searchParams.get("limit");
  const limitParsed = limitRaw ? Number.parseInt(limitRaw, 10) : 20;
  const limit = Number.isFinite(limitParsed) && limitParsed > 0 ? Math.min(limitParsed, 200) : 20;

  try {
    const snapshots = await getLatestSnapshots(limit);
    return NextResponse.json({
      count: snapshots.length,
      snapshots,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load snapshots", details: String(error) },
      { status: 500 },
    );
  }
}
