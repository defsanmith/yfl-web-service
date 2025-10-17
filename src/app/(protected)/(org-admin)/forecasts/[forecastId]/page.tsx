// Forecast details for org admin's organization

import Router from "@/constants/router";
import { Role } from "@/generated/prisma";
import { requireRole } from "@/lib/guards";
import { getForecastById } from "@/services/forecasts";
import ForecastDetailView from "@/views/forecasts/ForecastDetailView";
import { notFound, redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ forecastId: string }>;
};

export default async function ForecastDetailPage({ params }: PageProps) {
  // Verify user is an org admin
  const session = await requireRole([Role.ORG_ADMIN]);

  // Org admins must have an organizationId
  if (!session.user.organizationId) {
    redirect(Router.UNAUTHORIZED);
  }

  const { forecastId } = await params;

  const forecast = await getForecastById(forecastId);

  if (!forecast) {
    notFound();
  }

  // Ensure the forecast belongs to the org admin's organization
  if (forecast.organizationId !== session.user.organizationId) {
    redirect(Router.UNAUTHORIZED);
  }

  return (
    <ForecastDetailView
      forecast={forecast}
      isOrgAdmin={true}
      listPath={Router.ORG_ADMIN_FORECASTS}
      showBreadcrumbs={false}
    />
  );
}
