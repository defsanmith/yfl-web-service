// Forecast details for a specific organization for Super Admin

import { getForecastById } from "@/services/forecasts";
import ForecastDetailView from "@/views/forecasts/ForecastDetailView";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ orgId: string; forecastId: string }>;
};

export default async function OrgsForecastDetailPage({ params }: PageProps) {
  const { forecastId } = await params;

  const forecast = await getForecastById(forecastId);

  if (!forecast) {
    notFound();
  }

  return <ForecastDetailView forecast={forecast} />;
}
