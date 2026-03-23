import TopNav from "@/components/app/TopNav";
import PolicyLiquidityClient from "@/components/dashboard/PolicyLiquidityClient";
import { dataProvider } from "@/data";

export default async function PolicyLiquidityPage() {
  const data = await dataProvider.getDashboardData();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-[1920px] flex-col gap-4 px-4 py-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Policy & Liquidity</h1>
          <p className="text-sm text-text-muted">Rates transmission, curve behavior, and tightness proxies.</p>
        </div>

        <TopNav />

        <PolicyLiquidityClient {...data} />
      </div>
    </div>
  );
}
