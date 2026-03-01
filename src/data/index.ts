import { MockDataProvider } from "./mock/provider";
import { LiveDataProvider } from "./live/provider";
import { DashboardDataProvider } from "./types";

const shouldUseMock = process.env.MACRO_DASHBOARD_USE_MOCK_DATA === "true";

export const dataProvider: DashboardDataProvider = shouldUseMock
  ? new MockDataProvider()
  : new LiveDataProvider();
