import TopNav from "@/components/app/TopNav";
import Card from "@/components/ui/Card";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-[1920px] flex-col gap-4 px-4 py-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Settings</h1>
          <p className="text-sm text-text-muted">Data mode and runtime options.</p>
        </div>

        <TopNav />

        <Card title="Data Source">
          <div className="space-y-3 text-sm text-text-secondary">
            <p>Live data is enabled by default via FRED and market feed adapters.</p>
            <div className="rounded-md border border-border bg-surface-elevated p-3 font-mono text-xs text-text-primary">
              MACRO_DASHBOARD_USE_MOCK_DATA=true
            </div>
            <p>Set this environment variable to force the app to use mock data for demos/offline use.</p>
            <pre className="rounded-md border border-border bg-surface-elevated p-3 font-mono text-xs text-text-primary whitespace-pre-wrap">
{`DATABASE_URL=postgres://...
REDIS_URL=redis://...
INGESTION_JOB_TOKEN=...`}
            </pre>
            <p>Optional infra env vars enable Postgres persistence, Redis caching, and protected ingest jobs.</p>
          </div>
        </Card>

        <Card title="API Endpoints">
          <ul className="space-y-2 text-sm text-text-secondary">
            <li><span className="font-mono text-text-primary">/api/dashboard/summary</span></li>
            <li><span className="font-mono text-text-primary">/api/scores/latest</span></li>
            <li><span className="font-mono text-text-primary">/api/scores/history?score=growth&range=3y</span></li>
            <li><span className="font-mono text-text-primary">/api/heatmap?horizons=1d,1w,1m,ytd</span></li>
            <li><span className="font-mono text-text-primary">/api/series/ust-10y?range=max</span></li>
            <li><span className="font-mono text-text-primary">/api/jobs/ingest?mode=manual</span></li>
            <li><span className="font-mono text-text-primary">/api/persistence/snapshots?limit=20</span></li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
