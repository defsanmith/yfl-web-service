// Forecast details for end users
import { auth } from "@/auth";
import Router from "@/constants/router";
import { getForecastById } from "@/services/forecasts";
import { getUserPredictionForForecast } from "@/services/predictions";
import { notFound, redirect } from "next/navigation";

type PageProps = {
  params: { forecastId: string };
};

export default async function UserForecastDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session) {
    redirect(Router.SIGN_IN);
  }

  const { forecastId } = params;

  // Get the forecast
  const forecast = await getForecastById(forecastId);

  if (!forecast) {
    console.log("No forecast found for id", forecastId);
    notFound();
  }

  if (forecast.organizationId !== session.user.organizationId) {
    console.log("Org mismatch", {
      forecastOrg: forecast.organizationId,
      userOrg: session.user.organizationId,
    });
    notFound();
  }

  // Get the user's existing prediction (if any)
  const existingPrediction = await getUserPredictionForForecast(
    session.user.id!,   // non-null because we already checked session
    forecastId
  );

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Forecast detail debug</h1>
      <p>id: {forecastId}</p>
      <h2 className="font-semibold mt-4">Forecast</h2>
      <pre className="text-xs bg-muted p-2 rounded">
        {JSON.stringify(forecast, null, 2)}
      </pre>
      <h2 className="font-semibold mt-4">Existing prediction</h2>
      <pre className="text-xs bg-muted p-2 rounded">
        {JSON.stringify(existingPrediction, null, 2)}
      </pre>
    </div>
  );

  // return (
  //   <UserForecastDetailView
  //     forecast={forecast}
  //     existingPrediction={existingPrediction}
  //   />
  // );
}
