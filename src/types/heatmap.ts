export interface HeatmapAsset {
  id: string;
  name: string;
  ticker: string;
  category: "equity" | "fixed_income" | "fx" | "commodity" | "crypto";
  returns: {
    "1D": number;
    "1W": number;
    "1M": number;
    "YTD": number;
  };
  currentPrice: number;
}
