import { dataProvider } from "@/data";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

export const revalidate = 86400;

export default async function DashboardPage() {
  const data = await dataProvider.getDashboardData();

  return <DashboardLayout {...data} />;
}
