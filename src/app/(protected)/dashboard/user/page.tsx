// src/app/(protected)/(user)/dashboard/page.tsx
import { auth } from "@/auth";
import Router from "@/constants/router";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

import type { Prisma } from "@/generated/prisma";
import { getUpcomingForecastsForUser } from "@/services/forecasts";
import { getOrganizationLeaderboardWithSort } from "@/services/leaderboard";
import type { UpcomingForecast } from "@/views/forecasts/UpcomingForecastView";
import UpcomingForecastsTable from "@/views/forecasts/UpcomingForecastView";
import UserDashboardView from "@/views/home/UserDashboardView";
import LeaderboardView from "@/views/leaderboard/LeaderboardView";

// Define type with relations for forecasts
type ForecastWithRelations = Prisma.ForecastGetPayload<{
  include: {
    organization: { select: { id: true; name: true } };
    category: { select: { id: true; name: true; color: true } };
    predictions: { select: { id: true; userId: true; value: true } };
  };
}>;

// Map forecasts to table rows
function toUpcomingForecasts(
  forecasts: ForecastWithRelations[] | undefined,
  currentUserId?: string
): UpcomingForecast[] {
  const now = new Date();

  return (forecasts ?? []).map((f): UpcomingForecast => {
    const mine = f.predictions.find((p) =>
      currentUserId ? p.userId === currentUserId : true
    );

    // ---- convert string -> number per forecast type ----
    let prediction: number | null = null;
    if (mine?.value != null) {
      if (f.type === "CONTINUOUS") {
        const n = Number(mine.value);
        prediction = Number.isFinite(n) ? n : null;
      } else if (f.type === "BINARY") {
        if (mine.value === "true") prediction = 1;
        else if (mine.value === "false") prediction = 0;
      } // CATEGORICAL -> keep null since UI expects number
    }

    const due = f.dueDate ? new Date(f.dueDate) : null;
    const computedStatus: UpcomingForecast["status"] =
      due && due < now
        ? "Completed"
        : prediction !== null
        ? "In Progress"
        : "Open";

    return {
      id: f.id,
      title: f.title,
      type: f.type ?? null,
      status: computedStatus,
      org: f.organization?.name ?? null,
      prediction,
      reviewer: null,
    };
  });
}

type PageProps = {
  searchParams: Promise<{
    sortBy?: string;
    sortOrder?: string;
  }>;
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

  // NOTE: pass userId now that the service filters predictions by user
  const forecasts = await getUpcomingForecastsForUser({
    organizationId: orgId,
    userId,
    limit: 20,
  });

  const displayName =
    session.user.name ??
    (session.user.email ? session.user.email.split("@")[0] : "Player");

  const upcoming = toUpcomingForecasts(forecasts, userId);

  // Fetch leaderboard data
  const leaderboardData = await getOrganizationLeaderboardWithSort({
    organizationId: orgId,
    sortBy,
    sortOrder: sortOrder as "asc" | "desc",
  });

  // Get organization name for leaderboard
  const organization = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { name: true },
  });

  return (
    <div className="p-6 space-y-6">
      <UserDashboardView userName={displayName} />

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Your Forecasts</h2>

        <UpcomingForecastsTable
          data={upcoming}
          pageSize={10}
          hrefBase="/forecasts"
          newHref="/forecasts/new"
        />

        <p className="text-sm text-muted-foreground">
          Showing {upcoming.length.toLocaleString()} upcoming forecasts
        </p>
      </section>

      {/* Leaderboard Section */}
      <section className="space-y-3">
        <LeaderboardView
          data={leaderboardData}
          organizationName={organization?.name || "Unknown"}
          isOrgAdmin={false}
          currentUserId={userId}
        />
      </section>
    </div>
  );
}
