import { NextRequest, NextResponse } from "next/server";
import { dataProvider } from "@/data";
import { getLatestSnapshots, recordIngestionFailure } from "@/server/persistence/snapshotStore";

export async function GET(request: NextRequest) {
  const token = process.env.INGESTION_JOB_TOKEN;
  const provided = request.nextUrl.searchParams.get("token") ?? request.headers.get("x-ingestion-token");

  if (token && provided !== token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await dataProvider.getDashboardData({ refresh: true });
    const [latest] = await getLatestSnapshots(1);

    return NextResponse.json({
      ok: true,
      mode: request.nextUrl.searchParams.get("mode") ?? "manual",
      snapshotId: latest?.id ?? null,
      capturedAt: data.capturedAt,
      scoreCount: data.scores.length,
    });
  } catch (error) {
    const details = String(error);
    await recordIngestionFailure(details);
    return NextResponse.json(
      { ok: false, error: "Ingestion failed", details },
      { status: 500 },
    );
  }
}
