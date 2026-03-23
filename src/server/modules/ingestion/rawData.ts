import { TimeSeriesPoint } from "@/types/metrics";
import { fetchFredSeries } from "@/data/live/fred";
import { fetchStooqSeries } from "@/data/live/markets";

type DataSource = "fred" | "stooq";

interface SourceFailure {
  source: DataSource;
  id: string;
  error: string;
  durationMs: number;
}

interface SourceDiagnostics {
  source: DataSource;
  requested: number;
  succeeded: number;
  failed: number;
  durationMs: number;
  failures: SourceFailure[];
}

export interface IngestionDiagnostics {
  capturedAt: string;
  totalDurationMs: number;
  totalRequested: number;
  totalFailures: number;
  fred: SourceDiagnostics;
  stooq: SourceDiagnostics;
}

export interface RawDataBundle {
  fred: Record<string, TimeSeriesPoint[]>;
  stooq: Record<string, TimeSeriesPoint[]>;
  capturedAt: string;
  diagnostics: IngestionDiagnostics;
}

const FRED_SERIES: string[] = [
  "NAPM",
  "NAPMNONMFG",
  "INDPRO",
  "RRSFS",
  "ICSA",
  "UNRATE",
  "PERMIT",
  "HOUST",
  "USSLIND",
  "GDPNOW",
  "CPIAUCSL",
  "CPILFESL",
  "PCEPILFE",
  "CES0500000003",
  "CUSR0000SA0L2",
  "T2YIE",
  "T5YIFR",
  "MICH",
  "DFEDTARU",
  "DGS2",
  "DGS10",
  "DGS3MO",
  "DFII10",
  "THREEFYTP10",
  "BAMLH0A0HYM2",
  "BAMLC0A0CM",
  "NFCI",
  "WALCL",
  "DRTSCILM",
  "SOFR",
  "DFF",
  "IORB",
  "VIXCLS",
  "MOVEINDEX",
  // Risk — real data replacing proxies
  "STLFSI2",      // St. Louis Fed Financial Stress Index (replaces SKEWINDX)
  "DRCCLACBS",    // Credit Card Delinquency Rate (replaces CDX-HY duplicate)
  // Inflation
  "WPSFD49207",   // PPI Final Demand YoY
  "WPSFD4131",    // PPI Core Final Demand YoY (ex food & energy)
  "PCEPI",        // PCE Headline
  "EXPINF1YR",    // Cleveland Fed 1Y Expected Inflation (replaces T1YIE proxy)
  // Growth
  "UMCSENT",      // Consumer Sentiment
  "DGORDER",      // Durable Goods Orders
  "TCU",          // Capacity Utilization: Total Industry
  "PAYEMS",       // Nonfarm Payrolls (total level, for MoM diff)
  "JTSJOL",       // JOLTS Job Openings
  // Policy / Curve
  "DGS5",         // 5Y Treasury Yield
  "DGS30",        // 30Y Treasury Yield
  "MORTGAGE30US", // 30Y Mortgage Rate
  // Liquidity / Money
  "M2SL",         // M2 Money Supply
  "WRESBAL",      // Reserve Balances with Federal Reserve Banks
];

const STOOQ_SERIES: string[] = [
  "spy.us",
  "qqq.us",
  "iwm.us",
  "acwx.us",   // international ex-US equity (for global breadth)
  "hyg.us",
  "ief.us",
  "xly.us",
  "xlp.us",
  "xlb.us",
  "xlc.us",
  "xle.us",
  "xlf.us",
  "xli.us",
  "xlk.us",
  "xlu.us",
  "xlv.us",
  "dx.f",
  "eurusd",
  "cl.f",
  "xauusd",
  "btcusd",
];

const FRED_START = "2015-01-01";

function asErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

async function safeFred(id: string): Promise<{ id: string; series: TimeSeriesPoint[]; durationMs: number; error?: string }> {
  const started = Date.now();
  try {
    const series = await fetchFredSeries(id, { start: FRED_START });
    return { id, series, durationMs: Date.now() - started };
  } catch (error) {
    return { id, series: [], durationMs: Date.now() - started, error: asErrorMessage(error) };
  }
}

async function safeStooq(symbol: string): Promise<{ id: string; series: TimeSeriesPoint[]; durationMs: number; error?: string }> {
  const started = Date.now();
  try {
    const series = await fetchStooqSeries(symbol);
    return { id: symbol, series, durationMs: Date.now() - started };
  } catch (error) {
    return { id: symbol, series: [], durationMs: Date.now() - started, error: asErrorMessage(error) };
  }
}

function buildSourceDiagnostics(source: DataSource, results: Array<{ id: string; series: TimeSeriesPoint[]; durationMs: number; error?: string }>): SourceDiagnostics {
  const failures: SourceFailure[] = results
    .filter((result) => Boolean(result.error))
    .map((result) => ({
      source,
      id: result.id,
      error: result.error ?? "unknown error",
      durationMs: result.durationMs,
    }));

  return {
    source,
    requested: results.length,
    succeeded: results.length - failures.length,
    failed: failures.length,
    durationMs: results.reduce((sum, result) => sum + result.durationMs, 0),
    failures,
  };
}

export function summarizeIngestionHealth(diagnostics: IngestionDiagnostics): string[] {
  const messages: string[] = [];
  if (diagnostics.totalFailures > 0) {
    messages.push(
      `Data ingestion degraded: ${diagnostics.totalFailures}/${diagnostics.totalRequested} sources failed (FRED ${diagnostics.fred.failed}, Stooq ${diagnostics.stooq.failed}).`,
    );
  }

  if (diagnostics.totalDurationMs >= 7000) {
    messages.push(`Data ingestion slow: ${diagnostics.totalDurationMs}ms total fetch time.`);
  }

  if (diagnostics.fred.failed > 0) {
    const failedIds = diagnostics.fred.failures.slice(0, 3).map((item) => item.id).join(", ");
    messages.push(`FRED failures: ${failedIds}${diagnostics.fred.failed > 3 ? ", ..." : ""}.`);
  }

  if (diagnostics.stooq.failed > 0) {
    const failedIds = diagnostics.stooq.failures.slice(0, 3).map((item) => item.id).join(", ");
    messages.push(`Stooq failures: ${failedIds}${diagnostics.stooq.failed > 3 ? ", ..." : ""}.`);
  }

  return messages;
}

export async function ingestRawData(): Promise<RawDataBundle> {
  const started = Date.now();
  const [fredResults, stooqResults] = await Promise.all([
    Promise.all(FRED_SERIES.map(async (id) => safeFred(id))),
    Promise.all(STOOQ_SERIES.map(async (symbol) => safeStooq(symbol))),
  ]);

  const fredDiagnostics = buildSourceDiagnostics("fred", fredResults);
  const stooqDiagnostics = buildSourceDiagnostics("stooq", stooqResults);
  const capturedAt = new Date().toISOString();
  const diagnostics: IngestionDiagnostics = {
    capturedAt,
    totalDurationMs: Date.now() - started,
    totalRequested: FRED_SERIES.length + STOOQ_SERIES.length,
    totalFailures: fredDiagnostics.failed + stooqDiagnostics.failed,
    fred: fredDiagnostics,
    stooq: stooqDiagnostics,
  };

  return {
    fred: Object.fromEntries(fredResults.map((result) => [result.id, result.series] as const)),
    stooq: Object.fromEntries(stooqResults.map((result) => [result.id, result.series] as const)),
    capturedAt,
    diagnostics,
  };
}
