"use client";

import React from "react";
import { HeatmapAsset } from "@/types/heatmap";
import { getHeatmapCellStyle } from "@/lib/colors";
import { formatNumber } from "@/lib/formatting";
import Card from "@/components/ui/Card";

interface CrossAssetHeatmapProps {
  assets: HeatmapAsset[];
  macroRiskScore?: number;
  title?: string;
}

const RETURN_KEYS = ["1D", "1W", "1M", "YTD"] as const;
const PRECIOUS_METAL_IDS = new Set(["gold", "silver", "platinum", "palladium"]);
const INDUSTRIAL_METAL_IDS = new Set(["copper", "aluminum", "nickel", "zinc", "iron-ore"]);

function formatReturn(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function isDivergence(asset: HeatmapAsset, macroRiskScore: number): boolean {
  const oneWeek = asset.returns["1W"];
  const riskOnExpected = macroRiskScore >= 0;
  const riskAsset = asset.category === "equity" || asset.category === "crypto" || asset.id === "wti";
  const defensiveAsset = asset.category === "fixed_income" || asset.id === "gold";

  if (riskAsset) {
    return riskOnExpected ? oneWeek < 0 : oneWeek > 0;
  }

  if (defensiveAsset) {
    return riskOnExpected ? oneWeek > 0 : oneWeek < 0;
  }

  return false;
}

function sectionForAsset(asset: HeatmapAsset): { key: string; label: string } {
  if (asset.category === "commodity") {
    if (PRECIOUS_METAL_IDS.has(asset.id)) {
      return { key: "commodity-precious", label: "Precious Metals" };
    }
    if (INDUSTRIAL_METAL_IDS.has(asset.id)) {
      return { key: "commodity-industrial", label: "Industrial Metals" };
    }
    return { key: "commodity-other", label: "Other Commodities" };
  }

  if (asset.category === "equity") return { key: "equity", label: "Equities" };
  if (asset.category === "fixed_income") return { key: "fixed_income", label: "Fixed Income" };
  if (asset.category === "fx") return { key: "fx", label: "FX" };
  if (asset.category === "crypto") return { key: "crypto", label: "Crypto" };
  return { key: asset.category, label: asset.category };
}

export default function CrossAssetHeatmap({ assets, macroRiskScore = 0, title = "Cross-Asset Performance" }: CrossAssetHeatmapProps) {
  const sectionOrder: string[] = [];
  const grouped: Record<string, { label: string; assets: HeatmapAsset[] }> = {};

  for (const asset of assets) {
    const section = sectionForAsset(asset);
    if (!grouped[section.key]) {
      sectionOrder.push(section.key);
      grouped[section.key] = { label: section.label, assets: [] };
    }
    grouped[section.key].assets.push(asset);
  }

  return (
    <Card title={title}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-text-muted text-xs font-medium uppercase tracking-wider py-2 pr-4">
                Asset
              </th>
              <th className="text-right text-text-muted text-xs font-medium uppercase tracking-wider py-2 px-3">
                Price
              </th>
              <th className="text-center text-text-muted text-xs font-medium uppercase tracking-wider py-2 px-3">
                Flag
              </th>
              {RETURN_KEYS.map((k) => (
                <th
                  key={k}
                  className="text-right text-text-muted text-xs font-medium uppercase tracking-wider py-2 px-3"
                >
                  {k}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sectionOrder.map((sectionKey, sectionIdx) => (
              <React.Fragment key={sectionKey}>
                {sectionIdx > 0 && (
                  <tr>
                    <td colSpan={7} className="py-1">
                      <div className="border-t border-border/50" />
                    </td>
                  </tr>
                )}
                <tr>
                  <td colSpan={7} className="py-1 pr-4 text-xs font-medium uppercase tracking-wider text-text-muted">
                    {grouped[sectionKey].label}
                  </td>
                </tr>
                {grouped[sectionKey].assets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-surface-elevated transition-colors">
                    <td className="py-2 pr-4">
                      <div className="text-text-primary text-sm">{asset.name}</div>
                      <div className="text-text-muted text-xs">{asset.ticker}</div>
                    </td>
                    <td className="text-right py-2 px-3 text-text-secondary font-mono tabular-nums text-sm">
                      {formatNumber(asset.currentPrice, "$")}
                    </td>
                    <td className="text-center py-2 px-3">
                      {isDivergence(asset, macroRiskScore) ? (
                        <span className="inline-flex items-center rounded border border-caution/40 bg-caution/10 px-1.5 py-0.5 text-[11px] text-caution">
                          Divergence
                        </span>
                      ) : (
                        <span className="text-text-muted text-[11px]">Aligned</span>
                      )}
                    </td>
                    {RETURN_KEYS.map((k) => {
                      const val = asset.returns[k];
                      const style = getHeatmapCellStyle(val);
                      return (
                        <td
                          key={k}
                          className="text-right py-2 px-3 font-mono tabular-nums text-sm rounded"
                          style={{ backgroundColor: style.bg, color: style.text }}
                        >
                          {formatReturn(val)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
