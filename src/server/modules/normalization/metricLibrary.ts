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
      id: "gdp-nowcast", name: "GDP Nowcast (Atlanta Fed)", category: "growth", frequency: "daily", unit: "%",
      description: "Atlanta Fed GDPNow real-time estimate of current-quarter GDP growth.", interpretation: "Rising values suggest improving near-term growth.",
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
    buildMetric({
      id: "nfp-yoy", name: "Nonfarm Payrolls YoY", category: "growth", frequency: "monthly", unit: "%",
      description: "Total nonfarm payrolls, year-over-year % change.", interpretation: "Deceleration toward 0 flags labor market cooling.",
    }, yoyFromSeries(f.PAYEMS ?? [], 12)),
    buildMetric({
      id: "jolts-openings", name: "JOLTS Job Openings", category: "growth", frequency: "monthly", unit: "thousands",
      description: "Total job openings from the JOLTS survey.", interpretation: "Sustained declines from elevated levels signal labor demand cooling.",
    }, f.JTSJOL ?? []),
  ];

  const inflation: MetricWithData[] = [
    buildMetric({ id: "ppi-final-demand-yoy", name: "PPI Final Demand YoY", category: "inflation", frequency: "monthly", unit: "%", description: "Producer Price Index (Final Demand) YoY.", interpretation: "Upstream price pressure that tends to lead CPI by 1-3 months." }, yoyFromSeries(f.WPSFD49207 ?? [], 12)),
    buildMetric({ id: "pce-headline-yoy", name: "PCE Headline YoY", category: "inflation", frequency: "monthly", unit: "%", description: "PCE Headline YoY.", interpretation: "Broad consumer spending deflator; shows energy and food impulse vs core." }, yoyFromSeries(f.PCEPI ?? [], 12)),
    buildMetric({ id: "cpi-headline-yoy", name: "CPI Headline YoY", category: "inflation", frequency: "monthly", unit: "%", description: "CPI headline YoY.", interpretation: "Broad inflation pressure." }, yoyFromSeries(f.CPIAUCSL ?? [], 12)),
    buildMetric({ id: "cpi-core-yoy", name: "CPI Core YoY", category: "inflation", frequency: "monthly", unit: "%", description: "Core CPI YoY.", interpretation: "Underlying inflation trend." }, yoyFromSeries(f.CPILFESL ?? [], 12)),
    buildMetric({ id: "pce-core-yoy", name: "Core PCE YoY", category: "inflation", frequency: "monthly", unit: "%", description: "Core PCE YoY.", interpretation: "Fed-preferred core inflation." }, yoyFromSeries(f.PCEPILFE ?? [], 12)),
    buildMetric({ id: "ppi-core-yoy", name: "PPI Core Final Demand YoY", category: "inflation", frequency: "monthly", unit: "%", description: "PPI Final Demand ex Food & Energy, YoY.", interpretation: "Underlying upstream cost pressure; leads CPI core by 1-3 months." }, yoyFromSeries(f.WPSFD4131 ?? [], 12)),
    buildMetric({ id: "supercore", name: "Services ex-Housing CPI YoY", category: "inflation", frequency: "monthly", unit: "%", description: "CPI: Services Less Shelter, YoY (CUSR0000SA0L2).", interpretation: "The Fed's most-watched 'supercore' — sticky wage-driven services inflation." }, yoyFromSeries(f.CUSR0000SA0L2 ?? [], 12)),
    buildMetric({ id: "ahe-yoy", name: "Avg Hourly Earnings YoY", category: "inflation", frequency: "monthly", unit: "%", description: "Wage growth YoY.", interpretation: "Wages can sustain services inflation." }, yoyFromSeries(f.CES0500000003 ?? [], 12)),
    buildMetric({ id: "breakeven-2y", name: "2Y Breakeven Inflation", category: "inflation", frequency: "daily", unit: "%", description: "2Y inflation expectations.", interpretation: "Near-term expectations pulse." }, f.T2YIE ?? []),
    buildMetric({ id: "breakeven-5y5y", name: "5Y5Y Breakeven Inflation", category: "inflation", frequency: "daily", unit: "%", description: "5Y5Y inflation expectations.", interpretation: "Long-run expectations pressure." }, f.T5YIFR ?? []),
    buildMetric({ id: "expinf-1y", name: "1Y Expected Inflation (Cleveland Fed)", category: "inflation", frequency: "monthly", unit: "%", description: "Cleveland Fed model-based 1-year expected inflation.", interpretation: "Model-derived near-term inflation expectation combining surveys, TIPS, and swap data." }, f.EXPINF1YR ?? []),
    buildMetric({ id: "umich-5-10y", name: "UMich 5-10Y Expectations", category: "inflation", frequency: "monthly", unit: "%", description: "Survey long-run inflation expectations.", interpretation: "Higher readings suggest anchor drift." }, f.MICH ?? []),
  ];

  const policy: MetricWithData[] = [
    buildMetric({ id: "fed-funds", name: "Fed Funds Rate", category: "policy_rates", frequency: "daily", unit: "%", description: "Target upper bound.", interpretation: "Higher rates are more restrictive." }, f.DFEDTARU ?? []),
    buildMetric({ id: "policy-path-12m", name: "1Y Treasury Minus Fed Funds", category: "policy_rates", frequency: "daily", unit: "%", description: "1-year Treasury constant maturity minus the effective federal funds rate.", interpretation: "Negative means markets are pricing cuts over the next year; positive means expected hikes.", thresholdLine: 0 }, f.T1YFF ?? []),
    buildMetric({ id: "policy-surprise", name: "Fed Funds Rate Change", category: "policy_rates", frequency: "event-driven", unit: "bps", description: "Step change in the Fed's target upper bound between consecutive observations.", interpretation: "Positive changes are hawkish; negative changes are dovish." }, buildPolicySurpriseSeries(f.DFEDTARU ?? [])),
    buildMetric({ id: "ust-2y", name: "UST 2Y Yield", category: "policy_rates", frequency: "daily", unit: "%", description: "2Y treasury yield.", interpretation: "Sensitive to policy expectations." }, f.DGS2 ?? []),
    buildMetric({ id: "ust-10y", name: "UST 10Y Yield", category: "policy_rates", frequency: "daily", unit: "%", description: "10Y treasury yield.", interpretation: "Growth + inflation + term premium." }, f.DGS10 ?? []),
    buildMetric({ id: "spread-2s10s", name: "2s10s Spread", category: "policy_rates", frequency: "daily", unit: "%", description: "10Y-2Y spread.", interpretation: "Inversion implies restriction/recession risk.", thresholdLine: 0 }, mapDiffSeries(f.DGS10 ?? [], f.DGS2 ?? [])),
    buildMetric({ id: "spread-3m10y", name: "3m10y Spread", category: "policy_rates", frequency: "daily", unit: "%", description: "10Y-3M spread.", interpretation: "Sustained inversion is a classic recession signal.", thresholdLine: 0 }, mapDiffSeries(f.DGS10 ?? [], f.DGS3MO ?? [])),
    buildMetric({ id: "tips-10y", name: "10Y TIPS Real Yield", category: "policy_rates", frequency: "daily", unit: "%", description: "10Y real yield.", interpretation: "Higher real yields tighten conditions." }, f.DFII10 ?? []),
    buildMetric({ id: "term-premium", name: "10Y Term Premium", category: "policy_rates", frequency: "daily", unit: "%", description: "10-year Treasury term premium model published via FRED.", interpretation: "Rising term premium can lift long-end yields even if policy expectations are stable." }, f.THREEFYTP10 ?? []),
    buildMetric({ id: "ust-5y", name: "UST 5Y Yield", category: "policy_rates", frequency: "daily", unit: "%", description: "5Y treasury yield.", interpretation: "Mid-curve policy expectations anchor." }, f.DGS5 ?? []),
    buildMetric({ id: "ust-30y", name: "UST 30Y Yield", category: "policy_rates", frequency: "daily", unit: "%", description: "30Y treasury yield.", interpretation: "Long-run growth and inflation expectations plus term premium." }, f.DGS30 ?? []),
    buildMetric({ id: "spread-5y30y", name: "5s30s Spread", category: "policy_rates", frequency: "daily", unit: "%", description: "30Y-5Y spread.", interpretation: "Curve steepness beyond the belly; bear steepening signals reflation or fiscal stress.", thresholdLine: 0 }, mapDiffSeries(f.DGS30 ?? [], f.DGS5 ?? [])),
    buildMetric({ id: "mortgage-rate-30y", name: "30Y Mortgage Rate", category: "policy_rates", frequency: "weekly", unit: "%", description: "Freddie Mac 30Y fixed mortgage rate.", interpretation: "Measures policy transmission to the housing market." }, f.MORTGAGE30US ?? []),
  ];

  const liquidity: MetricWithData[] = [
    buildMetric({ id: "hy-oas", name: "US HY OAS", category: "liquidity_credit", frequency: "daily", unit: "bps", description: "HY spread.", interpretation: "Wider means stress." }, f.BAMLH0A0HYM2 ?? []),
    buildMetric({ id: "ig-oas", name: "US IG OAS", category: "liquidity_credit", frequency: "daily", unit: "bps", description: "Investment-grade option-adjusted spread.", interpretation: "Wider spreads indicate tighter corporate funding conditions." }, f.BAMLC0A0CM ?? []),
    buildMetric({ id: "fci", name: "Financial Conditions Index", category: "liquidity_credit", frequency: "weekly", unit: "index", description: "NFCI.", interpretation: "Higher means tighter conditions." }, f.NFCI ?? []),
    buildMetric({ id: "sloos", name: "SLOOS Net Tightening", category: "liquidity_credit", frequency: "quarterly", unit: "%", description: "Loan standards tightening.", interpretation: "Higher values imply weaker future credit impulse." }, f.DRTSCILM ?? []),
    buildMetric({ id: "sofr-ff-spread", name: "SOFR vs Fed Funds Spread", category: "liquidity_credit", frequency: "daily", unit: "bps", description: "SOFR minus Fed Funds rate in basis points.", interpretation: "Elevated spread signals short-end funding pressure." }, mapDiffSeries(f.SOFR ?? [], f.DFF ?? [], 100)),
    buildMetric({ id: "sofr-iorb-spread", name: "SOFR vs IORB Spread", category: "liquidity_credit", frequency: "daily", unit: "bps", description: "SOFR minus IORB (interest on reserve balances) in basis points.", interpretation: "Persistent negative spread indicates reserve scarcity and potential repo stress." }, mapDiffSeries(f.SOFR ?? [], f.IORB ?? [], 100)),
    buildMetric({ id: "walcl-yoy", name: "Fed Balance Sheet YoY", category: "liquidity_credit", frequency: "weekly", unit: "%", description: "Fed balance sheet YoY.", interpretation: "Decline implies QT/liquidity drain.", invertForScore: true }, yoyFromSeries(f.WALCL ?? [], 52)),
    buildMetric({ id: "sofr-tbill-spread", name: "SOFR vs 3M T-Bill Spread", category: "liquidity_credit", frequency: "daily", unit: "bps", description: "SOFR minus 3-month T-bill yield — modern equivalent of the TED spread.", interpretation: "Widens during interbank/funding stress; replaced the now-discontinued TEDRATE series." }, mapDiffSeries(f.SOFR ?? [], f.DGS3MO ?? [], 100)),
    buildMetric({ id: "m2-yoy", name: "M2 Money Supply YoY", category: "liquidity_credit", frequency: "monthly", unit: "%", description: "M2 money supply year-over-year % change.", interpretation: "Sustained contraction removes the monetary fuel that supports asset prices and growth.", invertForScore: true }, yoyFromSeries(f.M2SL ?? [], 12)),
    buildMetric({ id: "reserve-balances", name: "Bank Reserve Balances", category: "liquidity_credit", frequency: "weekly", unit: "billions", description: "Reserve balances with the Federal Reserve (excess reserves).", interpretation: "Declining reserves during QT signal tightening systemic liquidity.", invertForScore: true }, f.WRESBAL ?? []),
  ];

  const breadth = breadthFromSymbols([
    s["spy.us"] ?? [],
    s["acwx.us"] ?? [],  // international ex-US
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
    buildMetric({ id: "credit-card-delinq", name: "Credit Card Delinquency Rate", category: "risk_sentiment", frequency: "quarterly", unit: "%", description: "Delinquency rate on credit card loans at commercial banks (DRCCLACBS).", interpretation: "Rising delinquencies signal consumer stress and tightening credit conditions.", invertForScore: true }, f.DRCCLACBS ?? []),
    buildMetric({ id: "stl-fsi", name: "Financial Stress Index", category: "risk_sentiment", frequency: "weekly", unit: "index", description: "St. Louis Fed Financial Stress Index (STLFSI2).", interpretation: "Values above 0 indicate above-average financial stress; spikes precede risk-off regimes.", invertForScore: true }, f.STLFSI2 ?? []),
    buildMetric({ id: "market-breadth", name: "Market Breadth (% Above 200DMA)", category: "risk_sentiment", frequency: "daily", unit: "%", description: "Share of US sectors + international equity ETFs trading above their 200-day moving average.", interpretation: "High breadth confirms broad risk appetite; breadth divergence from price is a warning sign." }, breadth),
    buildMetric({ id: "pct-spx-200dma", name: "SPY vs 200DMA", category: "risk_sentiment", frequency: "daily", unit: "%", description: "Whether SPY is trading above its 200-day moving average (100) or below (0).", interpretation: "100 = market in uptrend; 0 = market in downtrend." }, movingAverageSignal(cleanSeries(s["spy.us"] ?? []), 200)),
    buildMetric({ id: "hyg-ief-ratio", name: "HYG/IEF Ratio", category: "risk_sentiment", frequency: "daily", unit: "ratio", description: "Risk-on ratio.", interpretation: "Rising indicates risk-on appetite." }, mapRatioSeries(s["hyg.us"] ?? [], s["ief.us"] ?? [])),
    buildMetric({ id: "cyc-def-ratio", name: "Cyclical/Defensive Ratio", category: "risk_sentiment", frequency: "daily", unit: "ratio", description: "Cyclicals vs defensives.", interpretation: "Rising indicates pro-growth leadership." }, mapRatioSeries(s["xly.us"] ?? [], s["xlp.us"] ?? [])),
  ];

  return { growth, inflation, policy, liquidity, risk };
}
