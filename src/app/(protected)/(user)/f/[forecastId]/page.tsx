// Forecast details for end users

import { auth } from "@/auth";
import Router from "@/constants/router";
import { getForecastById } from "@/services/forecasts";
import { getUserPredictionForForecast } from "@/services/predictions";
import UserForecastDetailView from "@/views/forecasts/UserForecastDetailView";
import { notFound, redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ forecastId: string }>;
};

export default async function UserForecastDetailPage({ params }: PageProps) {
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

  // Get the user's existing prediction (if any)
  const existingPrediction = await getUserPredictionForForecast(
    session.user.id,
    forecastId
  );

  return (
    <UserForecastDetailView
      forecast={forecast}
      existingPrediction={existingPrediction}
    />
  );
}
