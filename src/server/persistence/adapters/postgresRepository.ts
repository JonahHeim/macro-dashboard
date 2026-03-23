import { Pool } from "pg";
import { DashboardData } from "@/data/types";

let pool: Pool | null = null;

function getPool(): Pool | null {
  const url = process.env.DATABASE_URL;
  if (!url) {
    return null;
  }

  if (!pool) {
    pool = new Pool({ connectionString: url });
  }
  return pool;
}

export async function persistToPostgres(runKey: string, data: DashboardData): Promise<void> {
  const clientPool = getPool();
  if (!clientPool) {
    return;
  }

  const client = await clientPool.connect();
  const capturedAt = data.capturedAt;

  try {
    await client.query("BEGIN");

    await client.query(
      `INSERT INTO ingestion_runs (run_key, captured_at, ok, mode)
       VALUES ($1, $2, TRUE, $3)
       ON CONFLICT (run_key) DO NOTHING`,
      [runKey, capturedAt, "auto"],
    );

    const snapshot = await client.query(
      `INSERT INTO score_snapshots (snapshot_key, captured_at, what_changed)
       VALUES ($1, $2, $3::jsonb)
       ON CONFLICT (snapshot_key) DO UPDATE SET what_changed = EXCLUDED.what_changed
       RETURNING id`,
      [runKey, capturedAt, JSON.stringify(data.whatChanged ?? [])],
    );

    const snapshotId: number | undefined = snapshot.rows[0]?.id;
    if (snapshotId) {
      for (const score of data.scores) {
        await client.query(
          `INSERT INTO score_snapshot_values
            (snapshot_id, score_id, score_name, score_value, change_1w, change_1m, confidence, status)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
           ON CONFLICT (snapshot_id, score_id)
           DO UPDATE SET score_value=EXCLUDED.score_value, change_1w=EXCLUDED.change_1w, change_1m=EXCLUDED.change_1m,
                         confidence=EXCLUDED.confidence, status=EXCLUDED.status`,
          [snapshotId, score.id, score.name, score.value, score.change1W, score.change1M, score.confidence ?? null, score.status],
        );
      }
    }

    const allMetrics = [
      ...data.growthMetrics,
      ...data.inflationMetrics,
      ...data.policyMetrics,
      ...data.liquidityMetrics,
      ...data.riskMetrics,
    ];

    for (const metric of allMetrics) {
      const latest = metric.series[metric.series.length - 1];
      if (!latest) continue;

      await client.query(
        `INSERT INTO transformed_series_points
          (metric_id, metric_name, category, point_date, point_value, z_score, captured_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (metric_id, point_date, captured_at) DO NOTHING`,
        [metric.id, metric.name, metric.category, latest.date, latest.value, metric.zScore, capturedAt],
      );
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function markRunFailed(runKey: string, reason: string): Promise<void> {
  const clientPool = getPool();
  if (!clientPool) {
    return;
  }

  await clientPool.query(
    `INSERT INTO ingestion_runs (run_key, captured_at, ok, mode, error_message)
     VALUES ($1, NOW(), FALSE, $2, $3)
     ON CONFLICT (run_key)
     DO UPDATE SET ok = FALSE, error_message = EXCLUDED.error_message`,
    [runKey, "auto", reason.slice(0, 2000)],
  );
}
