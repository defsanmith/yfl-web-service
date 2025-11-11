// src/app/(protected)/(user)/dashboard/page.tsx
import { auth } from "@/auth";
import Router from "@/constants/router";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

import { getUpcomingForecastsForUser } from "@/services/forecasts";
import type { UpcomingForecast } from "@/views/forecasts/UpcomingForecastView";
import UpcomingForecastsTable from "@/views/forecasts/UpcomingForecastView";
import UserDashboardView from "@/views/home/UserDashboardView";

export default async function UserDashboardPage() {
  const session = await auth();
  if (!session) redirect(Router.SIGN_IN);

  const userId = session.user.id!;

  // Always resolve org from DB; session may have null
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true, name: true, email: true },
  });
  const orgId = dbUser?.organizationId ?? null;

  if (!orgId) {
    return (
      <div className="space-y-4 p-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="rounded-md border p-3">
          You are not currently assigned to an organization.
        </div>
      </div>
    );
  }

  // Fetch upcoming forecasts + (optionally) user's prediction per forecast
  const forecasts = await getUpcomingForecastsForUser({
    organizationId: orgId,
    userId,
    limit: 20,
  });

  const displayName =
    session.user.name ??
    (session.user.email ? session.user.email.split("@")[0] : "Player");

  // ---- Shape data for UpcomingForecastsTable safely ----
  // We support two cases:
  // 1) Service already returns status/myPrediction
  // 2) Service returns plain Forecast with include { organization, predictions(where: { userId }) }
  const upcoming: UpcomingForecast[] = (forecasts ?? []).map((f: any) => {
    // Fallbacks if service didn't compute them:
    const myPredObj = Array.isArray(f.predictions) ? f.predictions[0] : undefined;
    const myPrediction = f.myPrediction ?? myPredObj?.value ?? null;
    const due = f.dueDate ? new Date(f.dueDate) : null;
    const computedStatus =
      due && due < new Date() ? "Completed" : myPrediction ? "In Progress" : "Open";

    return {
      id: f.id,
      title: f.title,
      // Your schema has `type`; some views may expect a string
      type: f.type ?? null,
      status: f.status ?? computedStatus,
      org: f.organization?.name ?? null,
      prediction: myPrediction,
      // Your schema doesn’t have reviewer/organization.admin; set null
      reviewer: null,
    };
  });

  console.log({
    email: session.user.email,
    userId,
    orgId,
  });

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
          Showing {upcoming.length.toLocaleString()} upcoming forecasts
        </p>
      </section>
    </div>
  );
}
