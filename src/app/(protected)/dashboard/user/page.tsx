// src/app/(protected)/(user)/dashboard/page.tsx
import { auth } from "@/auth";
import Router from "@/constants/router";
import { redirect } from "next/navigation";

import { getForecasts } from "@/services/forecasts";
import type { UpcomingForecast } from "@/views/forecasts/UpcomingForecastView";
import UpcomingForecastsTable from "@/views/forecasts/UpcomingForecastView";
import UserDashboardView from "@/views/home/UserDashboardView";

export default async function UserDashboardPage() {
  const session = await auth();
  if (!session) redirect(Router.SIGN_IN);

  const userId = session.user.id!;
  const orgId = session.user.organizationId ?? null;

  const displayName =
    session.user.name ??
    (session.user.email ? session.user.email.split("@")[0] : "Player");

  const forecastBundle = orgId
    ? await getForecasts({
        organizationId: orgId,
        userId,
        page: 1,
        limit: 20,
        sortBy: "createdAt",
        sortOrder: "desc",
      })
    : { forecasts: [], total: 0, page: 1, limit: 20, totalPages: 0 };

  const { forecasts, total, page, totalPages } = forecastBundle;

  type ForecastRow = {
    id: string;
    title: string;
    type?: string | null;
    forecastType?: string | null;
    status?: string | null;
    organization?: { name?: string | null; admin?: { name?: string | null } | null } | null;
    prediction?: number | null;
    predictionAmount?: number | null;
    amount?: number | null;
    reviewer?: { name?: string | null } | null;
    reviewerName?: string | null;
    orgName?: string | null;
  };

  const list = (forecasts ?? []) as ForecastRow[];

  const upcoming: UpcomingForecast[] = list.map((f) => ({
    id: f.id,
    title: f.title,
    type: f.type ?? f.forecastType ?? null,
    status: f.status ?? "In Progress",
    org: f.organization?.name ?? f.orgName ?? null,
    prediction: f.prediction ?? f.predictionAmount ?? f.amount ?? null,
    reviewer: f.reviewer?.name ?? f.reviewerName ?? f.organization?.admin?.name ?? null,
  }));

  return (
    <div className="p-6 space-y-6">
      <UserDashboardView userName={displayName} />

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Your Forecasts</h2>

        <UpcomingForecastsTable
          data={upcoming}
          pageSize={10}
          hrefBase="/forecasts"
          newHref="/forecasts/new"
        />

        <p className="text-sm text-muted-foreground">
          Showing page {page} of {totalPages} · {total.toLocaleString()} total
        </p>
      </section>
    </div>
  );
}
