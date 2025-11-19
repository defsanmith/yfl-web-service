// src/app/(protected)/(org-admin)/dashboard/page.tsx
import Router from "@/constants/router";
import { Role } from "@/generated/prisma";
import { requireRole } from "@/lib/guards";
import { getOrganizationLeaderboardWithSort } from "@/services/leaderboard";
import { getOrganizationById } from "@/services/organizations";
import OrgAdminDashboardView from "@/views/home/OrgAdminDashboardView";
import LeaderboardView from "@/views/leaderboard/LeaderboardView";
import { redirect } from "next/navigation";

type PageProps = {
  searchParams: Promise<{
    sortBy?: string;
    sortOrder?: string;
  }>;
};

export default async function OrgAdminDashboardPage({
  searchParams,
}: PageProps) {
  const session = await requireRole([Role.ORG_ADMIN]);

  if (!session.user.organizationId) {
    redirect(Router.UNAUTHORIZED);
  }

  const { sortBy = "accuracyRate", sortOrder = "desc" } = await searchParams;

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
      <OrgAdminDashboardView />
      <LeaderboardView
        data={leaderboardData}
        organizationName={organization.name}
        isOrgAdmin={true}
      />
    </div>
  );
}
