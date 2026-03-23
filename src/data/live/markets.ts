import { HeatmapAsset } from "@/types/heatmap";
import { TimeSeriesPoint } from "@/types/metrics";
import { cleanSeries, parseCsv, round } from "@/data/utils/series";

interface MarketConfig {
  id: HeatmapAsset["id"];
  name: string;
  ticker: string;
  category: HeatmapAsset["category"];
  stooqSymbols?: string[];
}

const MARKET_CONFIGS: MarketConfig[] = [
  // Top economy equity market proxies (country ETFs).
  { id: "spx", name: "S&P 500", ticker: "SPY", category: "equity", stooqSymbols: ["spy.us"] },
  { id: "ndx", name: "Nasdaq 100", ticker: "QQQ", category: "equity", stooqSymbols: ["qqq.us"] },
  { id: "dow", name: "Dow Jones", ticker: "DIA", category: "equity", stooqSymbols: ["dia.us"] },
  { id: "rut", name: "Russell 2000", ticker: "IWM", category: "equity", stooqSymbols: ["iwm.us"] },
  { id: "eq-china", name: "China Equity Market", ticker: "FXI", category: "equity", stooqSymbols: ["fxi.us", "mchi.us"] },
  { id: "eq-germany", name: "Germany Equity Market", ticker: "EWG", category: "equity", stooqSymbols: ["ewg.us"] },
  { id: "eq-japan", name: "Japan Equity Market", ticker: "EWJ", category: "equity", stooqSymbols: ["ewj.us"] },
  { id: "eq-india", name: "India Equity Market", ticker: "INDA", category: "equity", stooqSymbols: ["inda.us"] },
  { id: "eq-uk", name: "United Kingdom Equity Market", ticker: "EWU", category: "equity", stooqSymbols: ["ewu.us"] },
  { id: "eq-france", name: "France Equity Market", ticker: "EWQ", category: "equity", stooqSymbols: ["ewq.us"] },
  { id: "eq-italy", name: "Italy Equity Market", ticker: "EWI", category: "equity", stooqSymbols: ["ewi.us"] },
  { id: "eq-canada", name: "Canada Equity Market", ticker: "EWC", category: "equity", stooqSymbols: ["ewc.us"] },
  { id: "eq-brazil", name: "Brazil Equity Market", ticker: "EWZ", category: "equity", stooqSymbols: ["ewz.us"] },
  { id: "eq-korea", name: "South Korea Equity Market", ticker: "EWY", category: "equity", stooqSymbols: ["ewy.us"] },
  { id: "eq-australia", name: "Australia Equity Market", ticker: "EWA", category: "equity", stooqSymbols: ["ewa.us"] },
  { id: "eq-spain", name: "Spain Equity Market", ticker: "EWP", category: "equity", stooqSymbols: ["ewp.us"] },
  { id: "eq-mexico", name: "Mexico Equity Market", ticker: "EWW", category: "equity", stooqSymbols: ["eww.us"] },
  { id: "eq-russia", name: "Russia Equity Market", ticker: "ERUS", category: "equity", stooqSymbols: ["erus.us", "rsx.us"] },

  { id: "shy", name: "UST 2Y Proxy", ticker: "SHY", category: "fixed_income", stooqSymbols: ["shy.us"] },
  { id: "ief", name: "UST 10Y Proxy", ticker: "IEF", category: "fixed_income", stooqSymbols: ["ief.us"] },
  { id: "tlt", name: "UST 20Y+ Treasury", ticker: "TLT", category: "fixed_income", stooqSymbols: ["tlt.us"] },
  { id: "agg", name: "Agg Bond", ticker: "AGG", category: "fixed_income", stooqSymbols: ["agg.us"] },
  { id: "bndx", name: "Intl Bond (Hedged)", ticker: "BNDX", category: "fixed_income", stooqSymbols: ["bndx.us"] },
  { id: "bwx", name: "Intl Treasury Bond", ticker: "BWX", category: "fixed_income", stooqSymbols: ["bwx.us"] },
  { id: "lqd", name: "US IG Corporate Bond", ticker: "LQD", category: "fixed_income", stooqSymbols: ["lqd.us"] },
  { id: "hyg", name: "US HY Corporate Bond", ticker: "HYG", category: "fixed_income", stooqSymbols: ["hyg.us"] },
  { id: "emb", name: "EM Sovereign Bond", ticker: "EMB", category: "fixed_income", stooqSymbols: ["emb.us"] },
  { id: "tip", name: "US TIPS Bond", ticker: "TIP", category: "fixed_income", stooqSymbols: ["tip.us"] },
  { id: "dxy", name: "US Dollar Index", ticker: "DX", category: "fx", stooqSymbols: ["dx.f"] },
  { id: "eurusd", name: "EUR/USD", ticker: "EURUSD", category: "fx", stooqSymbols: ["eurusd"] },
  { id: "gbpusd", name: "GBP/USD", ticker: "GBPUSD", category: "fx", stooqSymbols: ["gbpusd"] },
  { id: "audusd", name: "AUD/USD", ticker: "AUDUSD", category: "fx", stooqSymbols: ["audusd"] },
  { id: "nzdusd", name: "NZD/USD", ticker: "NZDUSD", category: "fx", stooqSymbols: ["nzdusd"] },
  { id: "usdchf", name: "USD/CHF", ticker: "USDCHF", category: "fx", stooqSymbols: ["usdchf"] },
  { id: "usdcad", name: "USD/CAD", ticker: "USDCAD", category: "fx", stooqSymbols: ["usdcad"] },
  { id: "usdjpy", name: "USD/JPY", ticker: "USDJPY", category: "fx", stooqSymbols: ["usdjpy"] },
  { id: "usdcnh", name: "USD/CNH", ticker: "USDCNH", category: "fx", stooqSymbols: ["usdcnh", "usdcny"] },
  { id: "usdmxn", name: "USD/MXN", ticker: "USDMXN", category: "fx", stooqSymbols: ["usdmxn"] },
  { id: "usdbrl", name: "USD/BRL", ticker: "USDBRL", category: "fx", stooqSymbols: ["usdbrl"] },
  { id: "wti", name: "WTI Crude Oil", ticker: "CL", category: "commodity", stooqSymbols: ["cl.f"] },
  { id: "gold", name: "Gold", ticker: "XAUUSD", category: "commodity", stooqSymbols: ["xauusd"] },
  { id: "silver", name: "Silver", ticker: "XAGUSD", category: "commodity", stooqSymbols: ["xagusd", "si.f"] },
  { id: "copper", name: "Copper", ticker: "HG", category: "commodity", stooqSymbols: ["hg.f"] },
  { id: "platinum", name: "Platinum", ticker: "PL", category: "commodity", stooqSymbols: ["pl.f"] },
  { id: "palladium", name: "Palladium", ticker: "PA", category: "commodity", stooqSymbols: ["pa.f"] },
  { id: "aluminum", name: "Aluminum", ticker: "JJU", category: "commodity", stooqSymbols: ["jju.us", "ali.f"] },
  { id: "nickel", name: "Nickel", ticker: "JJN", category: "commodity", stooqSymbols: ["jjn.us", "ni.f"] },
  { id: "zinc", name: "Zinc", ticker: "ZN", category: "commodity", stooqSymbols: ["zn.f", "dbb.us"] },
  { id: "iron-ore", name: "Iron Ore", ticker: "PICK", category: "commodity", stooqSymbols: ["pick.us"] },
  { id: "btc", name: "Bitcoin", ticker: "BTCUSD", category: "crypto", stooqSymbols: ["btcusd"] },
];

export async function fetchStooqSeries(symbol: string): Promise<TimeSeriesPoint[]> {
  const url = `https://stooq.com/q/d/l/?s=${encodeURIComponent(symbol)}&i=d`;
  const response = await fetch(url, { next: { revalidate: 86400 } });
  if (!response.ok) {
    throw new Error(`Stooq request failed for ${symbol}: ${response.status}`);
  }

  const csv = await response.text();
  const rows = parseCsv(csv);
  if (rows.length <= 1) {
    return [];
  }

  const data: TimeSeriesPoint[] = [];
  for (let idx = 1; idx < rows.length; idx += 1) {
    const [date, , , , close] = rows[idx];
    if (!date || !close) {
      continue;
    }

    const closeValue = Number.parseFloat(close);
    if (!Number.isFinite(closeValue)) {
      continue;
    }

    data.push({ date, value: closeValue });
  }

  return cleanSeries(data);
}

function getReturn(series: TimeSeriesPoint[], periodsBack: number): number {
  if (series.length <= periodsBack) {
    return 0;
  }

  const latest = series.at(-1)?.value ?? 0;
  const prior = series[series.length - 1 - periodsBack]?.value ?? latest;
  if (prior === 0) {
    return 0;
  }
  return round(((latest / prior) - 1) * 100, 2);
}

export async function buildMarketHeatmapAssets(): Promise<HeatmapAsset[]> {
  const results = await Promise.all(
    MARKET_CONFIGS.map(async (config) => {
      if (!config.stooqSymbols || config.stooqSymbols.length === 0) {
        return null;
      }

      try {
        let series: TimeSeriesPoint[] = [];
        for (const symbol of config.stooqSymbols) {
          try {
            series = await fetchStooqSeries(symbol);
            if (series.length > 0) {
              break;
            }
          } catch {
            // Continue to next fallback symbol.
          }
        }
        if (series.length === 0) return null;

        const currentPrice = round(series.at(-1)?.value ?? 0, 3);
        const oneDay = getReturn(series, 1);
        const oneWeek = getReturn(series, 5);
        const oneMonth = getReturn(series, 22);

        const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
        const ytdBase = series.find((point) => point.date >= yearStart) ?? series[0];
        const ytd = ytdBase && ytdBase.value !== 0
          ? round(((currentPrice / ytdBase.value) - 1) * 100, 2)
          : 0;

        return {
          id: config.id,
          name: config.name,
          ticker: config.ticker,
          category: config.category,
          currentPrice,
          returns: {
            "1D": oneDay,
            "1W": oneWeek,
            "1M": oneMonth,
            YTD: ytd,
          },
        } satisfies HeatmapAsset;
      } catch {
        return null;
      }
    }),
  );

  return results.filter((item): item is HeatmapAsset => item !== null);
}
