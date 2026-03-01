import TopNav from "@/components/app/TopNav";
import Card from "@/components/ui/Card";
import CrossAssetHeatmap from "@/components/dashboard/CrossAssetHeatmap";
import MetricChart from "@/components/dashboard/MetricChart";
import { dataProvider } from "@/data";

export default async function MarketsPage() {
  const data = await dataProvider.getDashboardData();
  const riskScore = data.scores.find((score) => score.id === "risk_sentiment");

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-[1920px] flex-col gap-4 px-4 py-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Markets</h1>
          <p className="text-sm text-text-muted">Cross-asset confirmation and divergence view.</p>
        </div>

        <TopNav />

        <Card title="Risk Regime">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {data.scores.map((score) => (
              <div key={score.id} className="rounded-md border border-border bg-surface-elevated px-3 py-2">
                <div className="text-xs uppercase tracking-wider text-text-muted">{score.name}</div>
                <div className="font-mono text-lg text-text-primary">{score.value.toFixed(2)}</div>
                <div className="text-xs text-text-secondary">1W: {score.change1W.toFixed(2)} | 1M: {score.change1M.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Risk Sentiment Inputs">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {data.riskMetrics.map((metric) => (
              <MetricChart key={metric.id} metric={metric} />
            ))}
          </div>
        </Card>

        <CrossAssetHeatmap assets={data.heatmapAssets} macroRiskScore={riskScore?.value ?? 0} />
      </div>
    </div>
  );
}
