import TopNav from "@/components/app/TopNav";
import BigPictureBoard from "@/components/dashboard/BigPictureBoard";
import { dataProvider } from "@/data";

export default async function BigPicturePage() {
  const data = await dataProvider.getDashboardData();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-[1920px] flex-col gap-4 px-4 py-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Big Picture</h1>
          <p className="text-sm text-text-muted">
            Global macro dashboard covering rates, FX, liquidity, credit, scenarios, and event risk.
          </p>
        </div>

        <TopNav />

        <BigPictureBoard
          scores={data.scores}
          growthMetrics={data.growthMetrics}
          inflationMetrics={data.inflationMetrics}
          policyMetrics={data.policyMetrics}
          liquidityMetrics={data.liquidityMetrics}
          riskMetrics={data.riskMetrics}
          heatmapAssets={data.heatmapAssets}
        />
      </div>
    </div>
  );
}
