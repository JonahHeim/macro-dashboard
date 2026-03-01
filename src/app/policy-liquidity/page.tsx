import TopNav from "@/components/app/TopNav";
import Card from "@/components/ui/Card";
import MetricChart from "@/components/dashboard/MetricChart";
import { dataProvider } from "@/data";

const CURVE_IDS = new Set(["ust-2y", "ust-10y", "spread-2s10s", "spread-3m10y", "tips-10y", "fed-funds"]);

export default async function PolicyLiquidityPage() {
  const data = await dataProvider.getDashboardData();
  const policyScore = data.scores.find((score) => score.id === "policy");
  const liquidityScore = data.scores.find((score) => score.id === "liquidity");

  const policyMetrics = data.policyMetrics.filter((metric) => CURVE_IDS.has(metric.id));

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-[1920px] flex-col gap-4 px-4 py-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Policy & Liquidity</h1>
          <p className="text-sm text-text-muted">Rates transmission, curve behavior, and tightness proxies.</p>
        </div>

        <TopNav />

        <Card title="Policy & Curve Metrics">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {policyMetrics.map((metric) => (
              <MetricChart key={metric.id} metric={metric} />
            ))}
          </div>
        </Card>

        <Card title="Liquidity & Credit Metrics">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {data.liquidityMetrics.map((metric) => (
              <MetricChart key={metric.id} metric={metric} />
            ))}
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card title="Policy Score Contributors">
            <div className="space-y-2 text-sm">
              {policyScore?.contributors.map((item) => (
                <div key={item.metricId} className="flex items-center justify-between rounded-md border border-border bg-surface-elevated px-3 py-2">
                  <span className="text-text-secondary">{item.metricName}</span>
                  <span className="font-mono text-text-primary">{item.contribution.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Liquidity Score Contributors">
            <div className="space-y-2 text-sm">
              {liquidityScore?.contributors.map((item) => (
                <div key={item.metricId} className="flex items-center justify-between rounded-md border border-border bg-surface-elevated px-3 py-2">
                  <span className="text-text-secondary">{item.metricName}</span>
                  <span className="font-mono text-text-primary">{item.contribution.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
