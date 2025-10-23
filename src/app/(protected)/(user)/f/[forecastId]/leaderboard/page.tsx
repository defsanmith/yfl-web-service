import { auth } from "@/auth";
import Router from "@/constants/router";
import { getForecastById } from "@/services/forecasts";
import { getForecastLeaderboard } from "@/services/predictions";
import ForecastLeaderboardView from "@/views/forecasts/ForecastLeaderboardView";
import { notFound, redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ forecastId: string }>;
};

export default async function ForecastLeaderboardPage({ params }: PageProps) {
  const session = await auth();
  const { forecastId } = await params;

  if (!session) {
    redirect(Router.SIGN_IN);
  }

  // Get the forecast
  const forecast = await getForecastById(forecastId);

  if (!forecast) {
    notFound();
  }

  // Verify the forecast belongs to the user's organization
  if (forecast.organizationId !== session.user.organizationId) {
    notFound();
  }

  // Get leaderboard data
  const predictions = await getForecastLeaderboard(forecastId);

  return (
    <ForecastLeaderboardView
      forecast={forecast}
      predictions={predictions}
      currentUserId={session.user.id}
    />
  );
}
