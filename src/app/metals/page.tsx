import TopNav from "@/components/app/TopNav";
import Card from "@/components/ui/Card";
import CrossAssetHeatmap from "@/components/dashboard/CrossAssetHeatmap";
import { dataProvider } from "@/data";
import { heatmapAssets as mockHeatmapAssets } from "@/data/mock/heatmap";

const METAL_IDS = new Set([
  "gold",
  "silver",
  "copper",
  "platinum",
  "palladium",
  "aluminum",
  "nickel",
  "zinc",
  "iron-ore",
]);

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export default async function MetalsPage() {
  const data = await dataProvider.getDashboardData();
  const riskScore = data.scores.find((score) => score.id === "risk_sentiment");
  const liveMetals = data.heatmapAssets.filter((asset) => METAL_IDS.has(asset.id));
  const mockMetals = mockHeatmapAssets.filter((asset) => METAL_IDS.has(asset.id));

  const liveById = new Map(liveMetals.map((asset) => [asset.id, asset] as const));
  const metals = mockMetals.map((asset) => liveById.get(asset.id) ?? asset);
  const fallbackMetalIds = mockMetals
    .map((asset) => asset.id)
    .filter((id) => !liveById.has(id));

  const precious = metals.filter((asset) => ["gold", "silver", "platinum", "palladium"].includes(asset.id));
  const industrial = metals.filter((asset) => ["copper", "aluminum", "nickel", "zinc", "iron-ore"].includes(asset.id));

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-[1920px] flex-col gap-4 px-4 py-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Metals</h1>
          <p className="text-sm text-text-muted">Dedicated precious and industrial metals dashboard.</p>
        </div>

        <TopNav />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card title="Precious Metals Avg">
            <div className="font-mono text-lg text-text-primary">{average(precious.map((asset) => asset.returns["1M"])).toFixed(2)}%</div>
            <div className="text-xs text-text-muted">Average 1M return</div>
          </Card>
          <Card title="Industrial Metals Avg">
            <div className="font-mono text-lg text-text-primary">{average(industrial.map((asset) => asset.returns["1M"])).toFixed(2)}%</div>
            <div className="text-xs text-text-muted">Average 1M return</div>
          </Card>
          <Card title="Metals Count">
            <div className="font-mono text-lg text-text-primary">{metals.length}</div>
            <div className="text-xs text-text-muted">Tracked metals assets</div>
          </Card>
        </div>

        {fallbackMetalIds.length > 0 && (
          <Card title="Data Coverage">
            <p className="text-sm text-text-secondary">
              Live data unavailable for:{" "}
              <span className="font-mono">{fallbackMetalIds.join(", ")}</span>. Showing fallback values for those metals.
            </p>
          </Card>
        )}

        <CrossAssetHeatmap
          title="Metals Performance"
          assets={metals}
          macroRiskScore={riskScore?.value ?? 0}
        />
      </div>
    </div>
  );
}
