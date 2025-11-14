import { auth } from "@/auth";
import Router from "@/constants/router";
import type { Prisma } from "@/generated/prisma";
import { Role } from "@/generated/prisma";
import prisma from "@/lib/prisma";
import { getUpcomingForecastsForUser } from "@/services/forecasts";
import { getOrganizationLeaderboardWithSort } from "@/services/leaderboard";
import { getOrganizationById } from "@/services/organizations";
import type { UpcomingForecast } from "@/views/forecasts/UpcomingForecastView";
import LeaderboardView from "@/views/leaderboard/LeaderboardView";
import { redirect } from "next/navigation";

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

export default async function ProtectedRootPage({ searchParams }: PageProps) {
  const session = await auth();

  if (!session) {
    redirect(Router.SIGN_IN);
  }

  const { sortBy = "accuracyRate", sortOrder = "desc" } = await searchParams;

  // Super Admin - redirect to their dashboard
  if (session.user.role === Role.SUPER_ADMIN) {
    redirect(Router.DASHBOARD_SUPER_ADMIN);
  }

  // Org Admin - show dashboard with leaderboard
  if (session.user.role === Role.ORG_ADMIN) {
    if (!session.user.organizationId) {
      redirect(Router.UNAUTHORIZED);
    }

    const organization = await getOrganizationById(session.user.organizationId);
    if (!organization) {
      redirect(Router.UNAUTHORIZED);
    }

    const leaderboardData = await getOrganizationLeaderboardWithSort({
      organizationId: session.user.organizationId,
      sortBy,
      sortOrder: sortOrder as "asc" | "desc",
    });

    return (
      <div className="space-y-6">
        <LeaderboardView
          data={leaderboardData}
          organizationName={organization.name}
          isOrgAdmin={true}
        />
      </div>
    );
  }

  // Regular User - show dashboard with forecasts and leaderboard
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

  const forecasts = await getUpcomingForecastsForUser({
    organizationId: orgId,
    userId,
    limit: 20,
  });

  const displayName =
    session.user.name ??
    (session.user.email ? session.user.email.split("@")[0] : "Player");

  const upcoming = toUpcomingForecasts(forecasts, userId);

  const leaderboardData = await getOrganizationLeaderboardWithSort({
    organizationId: orgId,
    sortBy,
    sortOrder: sortOrder as "asc" | "desc",
  });

  const organization = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { name: true },
  });

  return (
    <div>
      {/* <section className="space-y-3">
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
      </section> */}

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
