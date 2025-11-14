// src/app/(protected)/(user)/my-forecast/page.tsx
import { auth } from "@/auth";
import Router from "@/constants/router";
import { redirect } from "next/navigation";

import { getUpcomingForecastsForUser } from "@/services/forecasts";
import UpcomingForecastsTable, {
  type UpcomingForecast,
} from "@/views/forecasts/UpcomingForecastView";

export default async function MyForecastPage() {
  const session = await auth();
  if (!session) {
    redirect(Router.SIGN_IN);
  }

  const userId = session.user.id!;
  const organizationId = session.user.organizationId;

  // If the user somehow has no org, show a friendly empty state
  if (!organizationId) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">My Forecasts</h1>
        <p className="text-sm text-muted-foreground">
          You&apos;re not currently assigned to an organization, so there are no forecasts to
          display. Please contact your administrator.
        </p>
      </div>
    );
  }

  // --- Fetch upcoming forecasts from Prisma ---
  const raw = await getUpcomingForecastsForUser({
    organizationId,
    userId,
    limit: 50, // or whatever makes sense
  });

  // Helper to convert DB row → UpcomingForecast
  const now = new Date();
  const data: UpcomingForecast[] = raw.map((f) => {
  const rawPrediction = f.predictions[0]?.value ?? null;
  const predictionNumber =
    rawPrediction != null && !Number.isNaN(Number(rawPrediction))
      ? Number(rawPrediction)
      : null;

  const daysUntil =
    (f.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

  let status: UpcomingForecast["status"] = "In Progress";
  if (daysUntil <= 3) status = "Due Soon";

    return {
      id: f.id,
      title: f.title,
      type: f.type ?? null,
      status,
      org: f.organization?.name ?? null,
      prediction: predictionNumber,
      reviewer: null,
    };
  });


  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">My Forecasts</h1>
      <p className="text-sm text-muted-foreground">
        Filter, sort, and review your upcoming forecasts.
      </p>

      <UpcomingForecastsTable
        data={data}
        pageSize={10}
        hrefBase="/forecasts" // where row click should go, e.g. /forecasts/:id
        // newHref="/forecasts/new" // if you later enable the + New Forecast button
      />
    </div>
  );
}
