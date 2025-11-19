import { auth } from "@/auth";
import Router from "@/constants/router";
import { Role } from "@/generated/prisma";
import prisma from "@/lib/prisma";
import { getCategories } from "@/services/categories";
import { getForecasts } from "@/services/forecasts";
import { getOrganizationLeaderboardWithSort } from "@/services/leaderboard";
import { getOrganizationById } from "@/services/organizations";
import LeaderboardView from "@/views/leaderboard/LeaderboardView";
import { redirect } from "next/navigation";

type PageProps = {
  searchParams: Promise<{
    sortBy?: string;
    sortOrder?: string;
    forecastIds?: string;
    categoryIds?: string;
    forecastTypes?: string;
    recentCount?: string;
    minForecasts?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
};

export default async function ProtectedRootPage({ searchParams }: PageProps) {
  const session = await auth();

  if (!session) {
    redirect(Router.SIGN_IN);
  }

  const {
    sortBy = "accuracyRate",
    sortOrder = "desc",
    forecastIds,
    categoryIds,
    forecastTypes,
    recentCount,
    minForecasts,
    dateFrom,
    dateTo,
  } = await searchParams;

  // Super Admin → their dashboard
  if (session.user.role === Role.SUPER_ADMIN) {
    redirect(Router.DASHBOARD_SUPER_ADMIN);
  }

  // Org Admin → org admin dashboard
  if (session.user.role === Role.ORG_ADMIN) {
    if (!session.user.organizationId) {
      redirect(Router.UNAUTHORIZED);
    }

    const organization = await getOrganizationById(session.user.organizationId);
    if (!organization) {
      redirect(Router.UNAUTHORIZED);
    }

    return null;
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

  const leaderboardData = await getOrganizationLeaderboardWithSort({
    organizationId: orgId,
    sortBy,
    sortOrder: sortOrder as "asc" | "desc",
    forecastIds,
    categoryIds,
    forecastTypes,
    recentCount: recentCount ? parseInt(recentCount, 10) : undefined,
    minForecasts: minForecasts ? parseInt(minForecasts, 10) : undefined,
    dateFrom,
    dateTo,
  });

  // Strip email addresses for regular users (privacy)
  const sanitizedLeaderboardData = leaderboardData.map((entry) => ({
    ...entry,
    userEmail: "", // Remove email from response
  }));

  // Fetch forecasts and categories for filter options
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
          data={sanitizedLeaderboardData}
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
