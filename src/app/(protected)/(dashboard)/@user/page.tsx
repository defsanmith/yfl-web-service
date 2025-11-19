// src/app/(protected)/(user)/dashboard/page.tsx
import { auth } from "@/auth";
import Router from "@/constants/router";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

import { getUserBalance } from "@/services/finance";
import {
  getClosedForecastCountForUser,
  getForecasts,
  getForecastsDueSoonCount,
  getForecastsDueTodayCount,
} from "@/services/forecasts";
import { getOrganizationLeaderboardWithSort } from "@/services/leaderboard";
import UserDashboardView from "@/views/home/UserDashboardView";
import LeaderboardView from "@/views/leaderboard/LeaderboardView";

// ----------------------------------------------
// Page Component
// ----------------------------------------------

type PageProps = {
  searchParams: Promise<{
    sortBy?: string;
    sortOrder?: string;
  }>;
};

// Optional: type for prediction metrics we pass to the view
type PredictionMetricRow = {
  id: string;
  absoluteActualErrorPct: number | null;
};

export default async function UserDashboardPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session) redirect(Router.SIGN_IN);

  const { sortBy = "accuracyRate", sortOrder = "desc" } = await searchParams;

  const userId = session.user.id!;
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true, name: true, email: true },
  });
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
    await prisma.prediction.findMany({
      where: {
        userId,
        forecast: { organizationId: orgId },
        absoluteActualErrorPct: { not: null },
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        absoluteActualErrorPct: true,
      },
      take: 50,
    });

  const displayName =
    session.user.name ??
    (session.user.email ? session.user.email.split("@")[0] : "Player");

  // Fetch leaderboard data
  const leaderboardData = await getOrganizationLeaderboardWithSort({
    organizationId: orgId,
    sortBy,
    sortOrder: sortOrder as "asc" | "desc",
  });

  // Get organization name and filter options for leaderboard
  const [organization, forecastsResult, categoriesResult] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: orgId },
      select: { name: true },
    }),
    getForecasts({
      organizationId: orgId,
      limit: 100,
    }),
    getCategories({
      organizationId: orgId,
      limit: 100,
    }),
  ]);

  return (
    <div className="p-6 space-y-6">
      <UserDashboardView
        userName={displayName}
        stats={stats}
        predictionMetrics={predictionMetrics}
      />

      <section className="space-y-3">
        <LeaderboardView
          data={leaderboardData}
          organizationName={organization?.name || "Unknown"}
          isOrgAdmin={false}
          currentUserId={userId}
          forecasts={forecastsResult.forecasts}
          categories={categoriesResult.categories}
        />
      </section>
    </div>
  );
}
