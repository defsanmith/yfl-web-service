import { auth } from "@/auth";
import Router from "@/constants/router";
import { getUpcomingForecastsForUser } from "@/services/forecasts";
import UpcomingForecastsView from "@/views/home/UpcomingForecastsView";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await auth();

  if (!session) {
    redirect(Router.SIGN_IN);
  }

  // If user doesn't belong to an organization, show a message
  if (!session.user.organizationId) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          You are not currently assigned to an organization. Please contact your
          administrator.
        </p>
      </div>
    );
  }

  // Get upcoming forecasts for the user's organization
  const forecasts = await getUpcomingForecastsForUser({
    organizationId: session.user.organizationId,
    limit: 10,
  });

  return <UpcomingForecastsView forecasts={forecasts} />;
}
