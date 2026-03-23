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
            <tr className="border-b border-border-strong">
              <th className="py-3 pr-4 text-left font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted">
                Asset
              </th>
              <th className="px-3 py-3 text-right font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted">
                Price
              </th>
              <th className="px-3 py-3 text-center font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted">
                Flag
              </th>
              {RETURN_KEYS.map((k) => (
                <th
                  key={k}
                  className="px-3 py-3 text-right font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted"
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
                      <div className="border-t border-border-strong/60" />
                    </td>
                  </tr>
                )}
                <tr>
                  <td colSpan={7} className="py-2 pr-4">
                    <span className="terminal-data-chip inline-flex px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-text-secondary">
                      {grouped[sectionKey].label}
                    </span>
                  </td>
                </tr>
                {grouped[sectionKey].assets.map((asset) => (
                  <tr key={asset.id} className="border-b border-border/35 transition-colors hover:bg-white/[0.025]">
                    <td className="py-2 pr-4">
                      <div className="text-sm text-text-primary">{asset.name}</div>
                      <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">{asset.ticker}</div>
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-sm tabular-nums text-text-secondary">
                      {formatNumber(asset.currentPrice, "$")}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {isDivergence(asset, macroRiskScore) ? (
                        <span className="terminal-data-chip inline-flex items-center border-caution/45 bg-caution/10 px-2 py-1 text-[10px] font-mono uppercase tracking-[0.14em] text-caution">
                          Divergence
                        </span>
                      ) : (
                        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">Aligned</span>
                      )}
                    </td>
                    {RETURN_KEYS.map((k) => {
                      const val = asset.returns[k];
                      const style = getHeatmapCellStyle(val);
                      return (
                        <td
                          key={k}
                          className="px-3 py-2 text-right font-mono text-sm tabular-nums"
                          style={{
                            backgroundColor: style.bg,
                            color: style.text,
                            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.03)",
                          }}
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
