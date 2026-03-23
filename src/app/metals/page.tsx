import TopNav from "@/components/app/TopNav";
import MetalsClient from "@/components/dashboard/MetalsClient";
import { dataProvider } from "@/data";

export const revalidate = 86400;

export default async function MetalsPage() {
  const data = await dataProvider.getDashboardData();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-[1920px] flex-col gap-4 px-4 py-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Metals</h1>
          <p className="text-sm text-text-muted">Dedicated precious and industrial metals dashboard.</p>
        </div>

        <TopNav />

        <MetalsClient {...data} />
      </div>
    </div>
  );
}
