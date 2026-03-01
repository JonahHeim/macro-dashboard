import TopNav from "@/components/app/TopNav";
import Card from "@/components/ui/Card";
import MetricChart from "@/components/dashboard/MetricChart";
import { dataProvider } from "@/data";

export default async function MacroPage() {
  const data = await dataProvider.getDashboardData();
  const growthScore = data.scores.find((score) => score.id === "growth");
  const inflationScore = data.scores.find((score) => score.id === "inflation");

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-[1920px] flex-col gap-4 px-4 py-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Macro</h1>
          <p className="text-sm text-text-muted">Growth and inflation drill-down with score contributors.</p>
        </div>

        <TopNav />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card title="Growth Indicators">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {data.growthMetrics.map((metric) => (
                <MetricChart key={metric.id} metric={metric} />
              ))}
            </div>
          </Card>

          <Card title="Inflation Indicators">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {data.inflationMetrics.map((metric) => (
                <MetricChart key={metric.id} metric={metric} />
              ))}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card title="Growth Contributors">
            <div className="space-y-2 text-sm">
              {growthScore?.contributors.map((item) => (
                <div key={item.metricId} className="flex items-center justify-between rounded-md border border-border bg-surface-elevated px-3 py-2">
                  <span className="text-text-secondary">{item.metricName}</span>
                  <span className="font-mono text-text-primary">{item.contribution.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Inflation Contributors">
            <div className="space-y-2 text-sm">
              {inflationScore?.contributors.map((item) => (
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
