import TopNav from "@/components/app/TopNav";
import MarketsClient from "@/components/dashboard/MarketsClient";
import { dataProvider } from "@/data";

export const revalidate = 86400;

export default async function MarketsPage() {
  const data = await dataProvider.getDashboardData();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-[1920px] flex-col gap-4 px-4 py-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Markets</h1>
          <p className="text-sm text-text-muted">Cross-asset confirmation and divergence view.</p>
        </div>

        <TopNav />

        <MarketsClient {...data} />
      </div>
    </div>
  );
}
