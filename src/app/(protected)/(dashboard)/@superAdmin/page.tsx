import { auth } from "@/auth";
import Router from "@/constants/router";
import { getForecastCounts } from "@/services/forecasts";
import SuperAdminDashboard from "@/views/home/SuperAdminDashboardView";
import { redirect } from "next/navigation";

export const revalidate = 0;

export default async function SuperAdminPage() {
  const session = await auth();
  if (!session) redirect(Router.SIGN_IN);
  if (session.user.role !== "SUPER_ADMIN") redirect(Router.UNAUTHORIZED);

  const {
    total: totalForecasts,
    active: activeForecasts,
    completed: completedForecasts,
  } = await getForecastCounts();

  const completionRate =
    totalForecasts > 0
      ? Math.round((completedForecasts / totalForecasts) * 100)
      : 0;

  // Fake leaderboard leader for now
  const leader = {
    name: "Edwin Miyatake",
    score: 121280,
    handle: "@edmiyatake",
  };

  const displayName =
    session.user.name ??
    (session.user.email ? session.user.email.split("@")[0] : "Admin");

  return (
    <SuperAdminDashboard
      displayName={displayName}
      totalForecasts={totalForecasts}
      leader={leader}
      activeForecasts={activeForecasts}
      completionRatePct={completionRate}
    />
  );
}
