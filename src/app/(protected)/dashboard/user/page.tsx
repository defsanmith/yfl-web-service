// src/app/(protected)/(user)/dashboard/page.tsx
import { auth } from "@/auth";
import Router from "@/constants/router";
import { getUpcomingForecastsForUser } from "@/services/forecasts";
import UserDashboardView from "@/views/home/UserDashboardView";
import { redirect } from "next/navigation";

export default async function UserDashboardPage() {
  const session = await auth();
  if (!session) redirect(Router.SIGN_IN);

  if (!session.user.organizationId) {
    return (
      <div className="space-y-4 p-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="mb-4 rounded-md border p-3">🧪 You are on NEW /dashboard/user</div>
        <p className="text-muted-foreground">
          You are not currently assigned to an organization. Please contact your administrator.
        </p>
      </div>
    );
  }

  const forecasts = await getUpcomingForecastsForUser({
    organizationId: session.user.organizationId,
    limit: 10,
  });

  return <UserDashboardView forecasts={forecasts} />;
}
