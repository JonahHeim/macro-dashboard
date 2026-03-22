import { MetricCategory, MetricFrequency, MetricWithData, TimeSeriesPoint } from "@/types/metrics";
import { RawDataBundle } from "@/server/modules/ingestion/rawData";
import {
  cleanSeries,
  getChange,
  getLatestValue,
  getWindowForFrequency,
  latestZScore,
  periodsForChange,
  rollingAverage,
  round,
  yoyFromSeries,
} from "@/data/utils/series";

interface MetricConfig {
  id: string;
  name: string;
  category: MetricCategory;
  frequency: MetricFrequency;
  unit: string;
  description: string;
  interpretation: string;
  thresholdLine?: number;
  invertForScore?: boolean;
}

function buildMetric(config: MetricConfig, series: TimeSeriesPoint[]): MetricWithData {
  const cleaned = cleanSeries(series);
  const periods = periodsForChange(config.frequency);

  return {
    id: config.id,
    name: config.name,
    category: config.category,
    frequency: config.frequency,
    unit: config.unit,
    description: config.description,
    interpretation: config.interpretation,
    thresholdLine: config.thresholdLine,
    invertForScore: config.invertForScore,
    series: cleaned,
    latestValue: getLatestValue(cleaned),
    change1W: getChange(cleaned, periods.oneWeek),
    change1M: getChange(cleaned, periods.oneMonth),
    zScore: latestZScore(cleaned, getWindowForFrequency(config.frequency)),
  };
}

function mapDiffSeries(base: TimeSeriesPoint[], subtractor: TimeSeriesPoint[], scale = 1): TimeSeriesPoint[] {
  const byDate = new Map(subtractor.map((point) => [point.date, point.value]));
  return base
    .map((point) => {
      const b = byDate.get(point.date);
      if (b === undefined) return null;
      return { date: point.date, value: round((point.value - b) * scale, 4) };
    })
    .filter((point): point is TimeSeriesPoint => point !== null);
}

function mapRatioSeries(numerator: TimeSeriesPoint[], denominator: TimeSeriesPoint[]): TimeSeriesPoint[] {
  const byDate = new Map(denominator.map((point) => [point.date, point.value]));
  return numerator
    .map((point) => {
      const d = byDate.get(point.date);
      if (d === undefined || d === 0) return null;
      return { date: point.date, value: round(point.value / d, 6) };
    })
    .filter((point): point is TimeSeriesPoint => point !== null);
}

function movingAverageSignal(series: TimeSeriesPoint[], window: number): TimeSeriesPoint[] {
  if (series.length <= window) return [];

  const output: TimeSeriesPoint[] = [];
  for (let idx = window - 1; idx < series.length; idx += 1) {
    const slice = series.slice(idx - window + 1, idx + 1);
    const average = slice.reduce((sum, point) => sum + point.value, 0) / slice.length;
    output.push({ date: series[idx].date, value: series[idx].value > average ? 100 : 0 });
  }
  return output;
}

function breadthFromSymbols(symbols: TimeSeriesPoint[][]): TimeSeriesPoint[] {
  const signals = symbols.map((series) => movingAverageSignal(series, 200)).filter((series) => series.length > 0);
  const bucket = new Map<string, number[]>();

  for (const series of signals) {
    for (const point of series) {
      const values = bucket.get(point.date) ?? [];
      values.push(point.value);
      bucket.set(point.date, values);
    }
  }

  return [...bucket.entries()]
    .map(([date, values]) => ({ date, value: round(values.reduce((a, v) => a + v, 0) / values.length, 2) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function buildPolicySurpriseSeries(policy: TimeSeriesPoint[]): TimeSeriesPoint[] {
  if (policy.length < 2) return [];
  const out: TimeSeriesPoint[] = [];
  for (let idx = 1; idx < policy.length; idx += 1) {
    out.push({
      date: policy[idx].date,
      value: round((policy[idx].value - policy[idx - 1].value) * 100, 2),
    });
  }
  return out;
}

export interface NormalizedMetrics {
  growth: MetricWithData[];
  inflation: MetricWithData[];
  policy: MetricWithData[];
  liquidity: MetricWithData[];
  risk: MetricWithData[];
}

export function normalizeMetrics(raw: RawDataBundle): NormalizedMetrics {
  const f = raw.fred;
  const s = raw.stooq;

  const growth: MetricWithData[] = [
    buildMetric({
      id: "ism-mfg-pmi", name: "ISM Mfg PMI", category: "growth", frequency: "monthly", unit: "index",
      description: "ISM manufacturing survey.", interpretation: "Above 50 suggests expansion.", thresholdLine: 50,
    }, f.NAPM ?? []),
    buildMetric({
      id: "ism-svc-pmi", name: "ISM Services PMI", category: "growth", frequency: "monthly", unit: "index",
      description: "ISM services survey.", interpretation: "Higher indicates stronger service demand.", thresholdLine: 50,
    }, f.NAPMNONMFG ?? []),
    buildMetric({
      id: "ip-yoy", name: "Industrial Production YoY", category: "growth", frequency: "monthly", unit: "%",
      description: "Industrial production YoY.", interpretation: "Higher indicates stronger goods cycle.",
    }, yoyFromSeries(f.INDPRO ?? [], 12)),
    buildMetric({
      id: "retail-sales-yoy", name: "Real Retail Sales YoY", category: "growth", frequency: "monthly", unit: "%",
      description: "Real retail sales YoY.", interpretation: "Higher indicates healthier consumer demand.",
    }, yoyFromSeries(f.RRSFS ?? [], 12)),
    buildMetric({
      id: "gdp-nowcast-proxy", name: "GDP Nowcast Proxy", category: "growth", frequency: "daily", unit: "%",
      description: "Proxy for near-term GDP nowcast.", interpretation: "Rising values suggest improving near-term growth.",
    }, f.GDPNOW ?? []),
    buildMetric({
      id: "lei-yoy", name: "Leading Index YoY", category: "growth", frequency: "monthly", unit: "%",
      description: "Philadelphia Fed Leading Index YoY.", interpretation: "Deep negatives can signal below-trend growth.",
    }, yoyFromSeries(f.USSLIND ?? [], 12)),
    buildMetric({
      id: "unemp-rate", name: "Unemployment Rate", category: "growth", frequency: "monthly", unit: "%",
      description: "US unemployment (U-3).", interpretation: "Persistent rises imply labor cooling.", invertForScore: true,
    }, f.UNRATE ?? []),
    buildMetric({
      id: "init-claims-4w", name: "Initial Claims 4W Avg", category: "growth", frequency: "weekly", unit: "thousands",
      description: "Initial jobless claims 4-week average.", interpretation: "Rising claims can indicate growth cooling.", invertForScore: true,
    }, rollingAverage(f.ICSA ?? [], 4)),
    buildMetric({
      id: "housing-starts", name: "Housing Starts", category: "growth", frequency: "monthly", unit: "units",
      description: "Housing starts.", interpretation: "Higher values indicate stronger rate-sensitive demand.",
    }, f.HOUST ?? []),
    buildMetric({
      id: "bldg-permits", name: "Building Permits", category: "growth", frequency: "monthly", unit: "units",
      description: "Building permits.", interpretation: "Forward-looking indicator for construction activity.",
    }, f.PERMIT ?? []),
    buildMetric({
      id: "consumer-sentiment", name: "Consumer Sentiment", category: "growth", frequency: "monthly", unit: "index",
      description: "UMich Consumer Sentiment index.", interpretation: "Sustained weakness signals slower consumer spending ahead.", thresholdLine: 80,
    }, f.UMCSENT ?? []),
    buildMetric({
      id: "durable-goods-yoy", name: "Durable Goods Orders YoY", category: "growth", frequency: "monthly", unit: "%",
      description: "Manufacturers' new orders for durable goods, YoY.", interpretation: "Leads capex and manufacturing cycles.",
    }, yoyFromSeries(f.DGORDER ?? [], 12)),
    buildMetric({
      id: "capacity-util", name: "Capacity Utilization", category: "growth", frequency: "monthly", unit: "%",
      description: "Total industry capacity utilization rate.", interpretation: "Rising above 80% signals potential inflation from supply constraints.", thresholdLine: 80,
    }, f.TCU ?? []),
  ];

  const inflation: MetricWithData[] = [
    buildMetric({ id: "ppi-final-demand-yoy", name: "PPI Final Demand YoY", category: "inflation", frequency: "monthly", unit: "%", description: "Producer Price Index (Final Demand) YoY.", interpretation: "Upstream price pressure that tends to lead CPI by 1-3 months." }, yoyFromSeries(f.WPSFD49207 ?? [], 12)),
    buildMetric({ id: "pce-headline-yoy", name: "PCE Headline YoY", category: "inflation", frequency: "monthly", unit: "%", description: "PCE Headline YoY.", interpretation: "Broad consumer spending deflator; shows energy and food impulse vs core." }, yoyFromSeries(f.PCEPI ?? [], 12)),
    buildMetric({ id: "cpi-headline-yoy", name: "CPI Headline YoY", category: "inflation", frequency: "monthly", unit: "%", description: "CPI headline YoY.", interpretation: "Broad inflation pressure." }, yoyFromSeries(f.CPIAUCSL ?? [], 12)),
    buildMetric({ id: "cpi-core-yoy", name: "CPI Core YoY", category: "inflation", frequency: "monthly", unit: "%", description: "Core CPI YoY.", interpretation: "Underlying inflation trend." }, yoyFromSeries(f.CPILFESL ?? [], 12)),
    buildMetric({ id: "pce-core-yoy", name: "Core PCE YoY", category: "inflation", frequency: "monthly", unit: "%", description: "Core PCE YoY.", interpretation: "Fed-preferred core inflation." }, yoyFromSeries(f.PCEPILFE ?? [], 12)),
    buildMetric({ id: "supercore-proxy", name: "Supercore Proxy", category: "inflation", frequency: "monthly", unit: "%", description: "Core services ex-housing proxy.", interpretation: "Sticky services inflation proxy." }, yoyFromSeries(f.CUSR0000SA0L2 ?? [], 12)),
    buildMetric({ id: "ahe-yoy", name: "Avg Hourly Earnings YoY", category: "inflation", frequency: "monthly", unit: "%", description: "Wage growth YoY.", interpretation: "Wages can sustain services inflation." }, yoyFromSeries(f.CES0500000003 ?? [], 12)),
    buildMetric({ id: "breakeven-2y", name: "2Y Breakeven Inflation", category: "inflation", frequency: "daily", unit: "%", description: "2Y inflation expectations.", interpretation: "Near-term expectations pulse." }, f.T2YIE ?? []),
    buildMetric({ id: "breakeven-5y5y", name: "5Y5Y Breakeven Inflation", category: "inflation", frequency: "daily", unit: "%", description: "5Y5Y inflation expectations.", interpretation: "Long-run expectations pressure." }, f.T5YIFR ?? []),
    buildMetric({ id: "inflation-swap-1y-proxy", name: "1Y Inflation Swap Proxy", category: "inflation", frequency: "daily", unit: "%", description: "1Y inflation expectation proxy.", interpretation: "Front-end expected inflation pulse." }, f.T1YIE ?? []),
    buildMetric({ id: "umich-5-10y", name: "UMich 5-10Y Expectations", category: "inflation", frequency: "monthly", unit: "%", description: "Survey long-run inflation expectations.", interpretation: "Higher readings suggest anchor drift." }, f.MICH ?? []),
  ];

  const policy: MetricWithData[] = [
    buildMetric({ id: "fed-funds", name: "Fed Funds Rate", category: "policy_rates", frequency: "daily", unit: "%", description: "Target upper bound.", interpretation: "Higher rates are more restrictive." }, f.DFEDTARU ?? []),
    buildMetric({ id: "policy-path-12m", name: "Policy Path 12M Proxy", category: "policy_rates", frequency: "daily", unit: "%", description: "2Y yield minus current Fed Funds rate — market-implied rate change over 12 months.", interpretation: "Negative means market expects cuts; positive means expected hikes.", thresholdLine: 0 }, mapDiffSeries(f.DGS2 ?? [], f.DFEDTARU ?? [])),
    buildMetric({ id: "policy-surprise", name: "Policy Surprise", category: "policy_rates", frequency: "event-driven", unit: "bps", description: "Event-driven policy change proxy.", interpretation: "Positive surprise is hawkish." }, buildPolicySurpriseSeries(f.DFEDTARU ?? [])),
    buildMetric({ id: "ust-2y", name: "UST 2Y Yield", category: "policy_rates", frequency: "daily", unit: "%", description: "2Y treasury yield.", interpretation: "Sensitive to policy expectations." }, f.DGS2 ?? []),
    buildMetric({ id: "ust-10y", name: "UST 10Y Yield", category: "policy_rates", frequency: "daily", unit: "%", description: "10Y treasury yield.", interpretation: "Growth + inflation + term premium." }, f.DGS10 ?? []),
    buildMetric({ id: "spread-2s10s", name: "2s10s Spread", category: "policy_rates", frequency: "daily", unit: "%", description: "10Y-2Y spread.", interpretation: "Inversion implies restriction/recession risk.", thresholdLine: 0 }, mapDiffSeries(f.DGS10 ?? [], f.DGS2 ?? [])),
    buildMetric({ id: "spread-3m10y", name: "3m10y Spread", category: "policy_rates", frequency: "daily", unit: "%", description: "10Y-3M spread.", interpretation: "Sustained inversion is a classic recession signal.", thresholdLine: 0 }, mapDiffSeries(f.DGS10 ?? [], f.DGS3MO ?? [])),
    buildMetric({ id: "tips-10y", name: "10Y TIPS Real Yield", category: "policy_rates", frequency: "daily", unit: "%", description: "10Y real yield.", interpretation: "Higher real yields tighten conditions." }, f.DFII10 ?? []),
    buildMetric({ id: "term-premium", name: "Term Premium Proxy", category: "policy_rates", frequency: "daily", unit: "%", description: "Term premium proxy.", interpretation: "Rising term premium can lift long-end yields." }, f.THREEFYTP10 ?? []),
    buildMetric({ id: "mortgage-rate-30y", name: "30Y Mortgage Rate", category: "policy_rates", frequency: "weekly", unit: "%", description: "Freddie Mac 30Y fixed mortgage rate.", interpretation: "Measures policy transmission to the housing market." }, f.MORTGAGE30US ?? []),
  ];

  const liquidity: MetricWithData[] = [
    buildMetric({ id: "hy-oas", name: "US HY OAS", category: "liquidity_credit", frequency: "daily", unit: "bps", description: "HY spread.", interpretation: "Wider means stress." }, f.BAMLH0A0HYM2 ?? []),
    buildMetric({ id: "ig-oas", name: "US IG OAS", category: "liquidity_credit", frequency: "daily", unit: "bps", description: "IG spread.", interpretation: "Corporate funding stress proxy." }, f.BAMLC0A0CM ?? []),
    buildMetric({ id: "fci", name: "Financial Conditions Index", category: "liquidity_credit", frequency: "weekly", unit: "index", description: "NFCI.", interpretation: "Higher means tighter conditions." }, f.NFCI ?? []),
    buildMetric({ id: "sloos", name: "SLOOS Net Tightening", category: "liquidity_credit", frequency: "quarterly", unit: "%", description: "Loan standards tightening.", interpretation: "Higher values imply weaker future credit impulse." }, f.DRTSCILM ?? []),
    buildMetric({ id: "fra-ois-proxy", name: "FRA-OIS Proxy", category: "liquidity_credit", frequency: "daily", unit: "bps", description: "SOFR - DFF.", interpretation: "Funding stress proxy." }, mapDiffSeries(f.SOFR ?? [], f.DFF ?? [], 100)),
    buildMetric({ id: "repo-policy-spread", name: "Repo GC Spread to Policy", category: "liquidity_credit", frequency: "daily", unit: "bps", description: "SOFR - IORB.", interpretation: "Persistent divergence can indicate funding strain." }, mapDiffSeries(f.SOFR ?? [], f.IORB ?? [], 100)),
    buildMetric({ id: "walcl-yoy", name: "Fed Balance Sheet YoY", category: "liquidity_credit", frequency: "weekly", unit: "%", description: "Fed balance sheet YoY.", interpretation: "Decline implies QT/liquidity drain.", invertForScore: true }, yoyFromSeries(f.WALCL ?? [], 52)),
    buildMetric({ id: "ted-spread", name: "TED Spread", category: "liquidity_credit", frequency: "daily", unit: "bps", description: "TED spread.", interpretation: "Wider values indicate funding stress." }, f.TEDRATE ?? []),
  ];

  const breadth = breadthFromSymbols([
    s["spy.us"] ?? [],
    s["xlb.us"] ?? [],
    s["xlc.us"] ?? [],
    s["xle.us"] ?? [],
    s["xlf.us"] ?? [],
    s["xli.us"] ?? [],
    s["xlk.us"] ?? [],
    s["xlu.us"] ?? [],
    s["xlv.us"] ?? [],
    s["xly.us"] ?? [],
    s["xlp.us"] ?? [],
  ]);

  const risk: MetricWithData[] = [
    buildMetric({ id: "vix", name: "VIX", category: "risk_sentiment", frequency: "daily", unit: "index", description: "Equity volatility.", interpretation: "Higher means risk aversion.", invertForScore: true }, f.VIXCLS ?? []),
    buildMetric({ id: "move-index", name: "MOVE", category: "risk_sentiment", frequency: "daily", unit: "index", description: "Rates volatility.", interpretation: "Higher means macro uncertainty.", invertForScore: true }, f.MOVEINDEX ?? []),
    buildMetric({ id: "cdx-hy-proxy", name: "CDX HY Proxy", category: "risk_sentiment", frequency: "daily", unit: "bps", description: "Credit risk pricing proxy.", interpretation: "Higher means worsening credit conditions.", invertForScore: true }, f.BAMLH0A0HYM2 ?? []),
    buildMetric({ id: "put-call-proxy", name: "Put/Call Proxy", category: "risk_sentiment", frequency: "daily", unit: "index", description: "SKEW-based hedging proxy.", interpretation: "Higher values can imply stronger tail hedging demand.", invertForScore: true }, f.SKEWINDX ?? []),
    buildMetric({ id: "advance-decline-proxy", name: "Advance/Decline Proxy", category: "risk_sentiment", frequency: "daily", unit: "%", description: "Breadth proxy of symbols above 200DMA.", interpretation: "Higher breadth confirms risk appetite." }, breadth),
    buildMetric({ id: "pct-spx-200dma", name: "SPY vs 200DMA", category: "risk_sentiment", frequency: "daily", unit: "%", description: "Whether SPY is trading above its 200-day moving average (100) or below (0).", interpretation: "100 = market in uptrend; 0 = market in downtrend." }, movingAverageSignal(cleanSeries(s["spy.us"] ?? []), 200)),
    buildMetric({ id: "hyg-ief-ratio", name: "HYG/IEF Ratio", category: "risk_sentiment", frequency: "daily", unit: "ratio", description: "Risk-on ratio.", interpretation: "Rising indicates risk-on appetite." }, mapRatioSeries(s["hyg.us"] ?? [], s["ief.us"] ?? [])),
    buildMetric({ id: "cyc-def-ratio", name: "Cyclical/Defensive Ratio", category: "risk_sentiment", frequency: "daily", unit: "ratio", description: "Cyclicals vs defensives.", interpretation: "Rising indicates pro-growth leadership." }, mapRatioSeries(s["xly.us"] ?? [], s["xlp.us"] ?? [])),
  ];

  return { growth, inflation, policy, liquidity, risk };
}
