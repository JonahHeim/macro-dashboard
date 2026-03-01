import { promises as fs } from "node:fs";
import path from "node:path";
import { DashboardData } from "@/data/types";
import { MetricWithData } from "@/types/metrics";
import { persistToPostgres, markRunFailed } from "@/server/persistence/adapters/postgresRepository";
import { cacheJson } from "@/server/cache/redisCache";

const DATA_DIR = path.join(process.cwd(), ".macro-persistence");
const SNAPSHOT_FILE = path.join(DATA_DIR, "score-snapshots.json");
const SERIES_FILE = path.join(DATA_DIR, "series-store.json");
const INGESTION_LOG_FILE = path.join(DATA_DIR, "ingestion-log.json");

interface StoredSnapshot {
  id: string;
  capturedAt: string;
  scoreValues: Array<{ id: string; value: number; change1W: number; change1M: number; confidence?: number }>;
  whatChanged: string[];
}

interface StoredSeriesPayload {
  capturedAt: string;
  rawSeries: Array<{ metricId: string; metricName: string; category: string; points: number }>;
  transformedSeries: Array<{ metricId: string; metricName: string; category: string; latestValue: number; zScore: number }>;
}

async function ensureStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const content = await fs.readFile(filePath, "utf8");
    return JSON.parse(content) as T;
  } catch {
    return fallback;
  }
}

async function writeJsonFile<T>(filePath: string, data: T): Promise<void> {
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function flattenMetrics(data: DashboardData): MetricWithData[] {
  return [
    ...data.growthMetrics,
    ...data.inflationMetrics,
    ...data.policyMetrics,
    ...data.liquidityMetrics,
    ...data.riskMetrics,
  ];
}

export async function persistDashboardSnapshot(data: DashboardData): Promise<string> {
  await ensureStore();

  const capturedAt = new Date().toISOString();
  const id = `${capturedAt.replace(/[:.]/g, "-")}`;

  const snapshots = await readJsonFile<StoredSnapshot[]>(SNAPSHOT_FILE, []);
  const candidateValues = data.scores.map((score) => ({
    id: score.id,
    value: score.value,
    change1W: score.change1W,
    change1M: score.change1M,
    confidence: score.confidence,
  }));
  const latest = snapshots.at(-1);
  if (latest) {
    const latestTs = new Date(latest.capturedAt).getTime();
    const currentTs = new Date(capturedAt).getTime();
    const withinThreeHours = currentTs - latestTs < 3 * 60 * 60 * 1000;
    const sameValues = JSON.stringify(latest.scoreValues) === JSON.stringify(candidateValues);
    if (withinThreeHours && sameValues) {
      return latest.id;
    }
  }

  snapshots.push({
    id,
    capturedAt,
    scoreValues: candidateValues,
    whatChanged: data.whatChanged ?? [],
  });

  const trimmedSnapshots = snapshots.slice(-1000);
  await writeJsonFile(SNAPSHOT_FILE, trimmedSnapshots);

  const metrics = flattenMetrics(data);
  const seriesStore = await readJsonFile<StoredSeriesPayload[]>(SERIES_FILE, []);
  seriesStore.push({
    capturedAt,
    rawSeries: metrics.map((metric) => ({
      metricId: metric.id,
      metricName: metric.name,
      category: metric.category,
      points: metric.series.length,
    })),
    transformedSeries: metrics.map((metric) => ({
      metricId: metric.id,
      metricName: metric.name,
      category: metric.category,
      latestValue: metric.latestValue,
      zScore: metric.zScore,
    })),
  });
  await writeJsonFile(SERIES_FILE, seriesStore.slice(-500));

  const ingestionLog = await readJsonFile<Array<{ id: string; capturedAt: string; ok: boolean }>>(INGESTION_LOG_FILE, []);
  ingestionLog.push({ id, capturedAt, ok: true });
  await writeJsonFile(INGESTION_LOG_FILE, ingestionLog.slice(-2000));

  await persistToPostgres(id, data);
  await cacheJson("macro:dashboard:latest", {
    capturedAt,
    scores: data.scores,
    whatChanged: data.whatChanged ?? [],
  }, 1800);

  return id;
}

export async function recordIngestionFailure(reason: string): Promise<void> {
  await ensureStore();
  const failureId = `failed-${Date.now()}`;
  const ingestionLog = await readJsonFile<Array<{ id: string; capturedAt: string; ok: boolean; reason?: string }>>(INGESTION_LOG_FILE, []);
  ingestionLog.push({
    id: failureId,
    capturedAt: new Date().toISOString(),
    ok: false,
    reason,
  });
  await writeJsonFile(INGESTION_LOG_FILE, ingestionLog.slice(-2000));
  await markRunFailed(failureId, reason);
}

export async function getLatestSnapshots(limit = 20): Promise<StoredSnapshot[]> {
  await ensureStore();
  const snapshots = await readJsonFile<StoredSnapshot[]>(SNAPSHOT_FILE, []);
  return snapshots.slice(-limit).reverse();
}
