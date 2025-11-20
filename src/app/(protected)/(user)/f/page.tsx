// Forecasts page for users

import { auth } from "@/auth";
import Router from "@/constants/router";
import { getUpcomingForecastsForUser } from "@/services/forecasts";
import UpcomingForecastsView from "@/views/home/UpcomingForecastsView";
import { redirect } from "next/navigation";

export default async function UserForecastsPage() {
  const session = await auth();

  if (!session) {
    redirect(Router.SIGN_IN);
  }

  // Verify user has an organization
  if (!session.user.organizationId) {
    redirect(Router.UNAUTHORIZED);
  }

  // Get upcoming forecasts for the user's organization
  const forecasts = await getUpcomingForecastsForUser({
    organizationId: session.user.organizationId,
    userId: session.user.id,
  });

  return <UpcomingForecastsView forecasts={forecasts} />;
}
