import { dataProvider } from "@/data";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

export default async function DashboardPage() {
  const data = await dataProvider.getDashboardData();

  return (
    <DashboardLayout
      scores={data.scores}
      regimeTrail={data.regimeTrail}
      growthMetrics={data.growthMetrics}
      inflationMetrics={data.inflationMetrics}
      policyMetrics={data.policyMetrics}
      liquidityMetrics={data.liquidityMetrics}
      riskMetrics={data.riskMetrics}
      heatmapAssets={data.heatmapAssets}
      educationalNotes={data.educationalNotes}
      whatChanged={data.whatChanged ?? []}
    />
  );
}
