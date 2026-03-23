import TopNav from "@/components/app/TopNav";
import MacroClient from "@/components/dashboard/MacroClient";
import { dataProvider } from "@/data";

export default async function MacroPage() {
  const data = await dataProvider.getDashboardData();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-[1920px] flex-col gap-4 px-4 py-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Macro</h1>
          <p className="text-sm text-text-muted">Growth and inflation drill-down with score contributors.</p>
        </div>

        <TopNav />

        <MacroClient {...data} />
      </div>
    </div>
  );
}
