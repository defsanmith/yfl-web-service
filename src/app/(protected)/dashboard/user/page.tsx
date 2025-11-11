// src/app/(protected)/(user)/dashboard/page.tsx
import { auth } from "@/auth";
import Router from "@/constants/router";
import { getForecasts } from "@/services/forecasts";
import UserDashboardView from "@/views/home/UserDashboardView";
import UserForecastTable from "@/views/home/UserForecastTable";
import { redirect } from "next/navigation";

export default async function UserDashboardPage() {
  // 1) Authenticate user (server-side)
  const session = await auth();
  if (!session) redirect(Router.SIGN_IN);

  const userId = session.user.id!;
  const orgId = session.user.organizationId ?? null;

  // 2) Fallback display name
  const displayName =
    session.user.name ??
    (session.user.email ? session.user.email.split("@")[0] : "Player");

  // 3) Fetch only forecasts for this user (no KPIs)
  const forecastBundle = orgId
    ? await getForecasts({
        organizationId: orgId,
        userId, // filter to this user
        page: 1,
        limit: 20,
        sortBy: "createdAt",
        sortOrder: "desc",
      })
    : { forecasts: [], total: 0, page: 1, limit: 20, totalPages: 0 };

  const { forecasts, total, page, totalPages } = forecastBundle;

  // 4) Render dashboard header + forecasts table (no KPI prop)
  return (
    <div className="p-6 space-y-6">
      <UserDashboardView userName={displayName} />

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Your Forecasts</h2>
        <UserForecastTable
          forecasts={forecasts}
          total={total}
          page={page}
          totalPages={totalPages}
        />
      </section>
    </div>
  );
}
