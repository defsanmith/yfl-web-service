// src/app/(protected)/(user)/dashboard/page.tsx
import { auth } from "@/auth";
import Router from "@/constants/router";
import { redirect } from "next/navigation";

import { getUserBalance } from "@/services/finance";
import {
  getClosedForecastCountForUser,
  getForecastsDueSoonCount,
  getForecastsDueTodayCount,
} from "@/services/forecasts";
import { getUserPredictionMetrics } from "@/services/predictions";
import { getUserWithOrganization } from "@/services/users";
import UserDashboardView from "@/views/home/UserDashboardView";

// ----------------------------------------------
// Page Component
// ----------------------------------------------

// Optional: type for prediction metrics we pass to the view
type PredictionMetricRow = {
  id: string;
  absoluteActualErrorPct: number | null;
};

export default async function UserDashboardPage() {
  const session = await auth();
  if (!session) redirect(Router.SIGN_IN);

  const userId = session.user.id!;
  const dbUser = await getUserWithOrganization(userId);
  const orgId = dbUser?.organizationId ?? null;

  if (!orgId) {
    return (
      <div className="space-y-4 p-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="rounded-md border p-3">
          You are not currently assigned to an organization.
        </div>
      </div>
    );
  }

  const [closedForecasts, dueSoon, dueToday, balance] = await Promise.all([
    getClosedForecastCountForUser({ organizationId: orgId, userId }),
    getForecastsDueSoonCount({ organizationId: orgId, userId, days: 7 }),
    getForecastsDueTodayCount({ organizationId: orgId, userId }),
    getUserBalance(userId),
  ]);

  const stats = [
    {
      id: "closed",
      label: "Closed Forecasts",
      value: closedForecasts,
      up: true,
      delta: "",
      subLabel: "All time",
    },
    {
      id: "dueSoon",
      label: "Due Soon",
      value: dueSoon,
      up: false,
      delta: "",
      subLabel: "Next 7 days",
    },
    {
      id: "dueToday",
      label: "Due Today",
      value: dueToday,
      up: false,
      delta: "",
      subLabel: "By midnight",
    },
    {
      id: "balance",
      label: "Balance",
      value: `$${balance.toLocaleString()}`,
      up: true,
      delta: "",
      subLabel: "Net account balance",
    },
  ];

  // 🔹 fetch this user's prediction metrics (for the chart)
  const predictionMetrics: PredictionMetricRow[] =
    await getUserPredictionMetrics(userId, orgId);

  const displayName =
    session.user.name ??
    (session.user.email ? session.user.email.split("@")[0] : "Player");

  return (
    <UserDashboardView
      userName={displayName}
      stats={stats}
      predictionMetrics={predictionMetrics}
    />
  );
}
