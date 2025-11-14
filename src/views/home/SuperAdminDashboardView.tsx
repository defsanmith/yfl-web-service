"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  displayName: string;
  totalForecasts: number;
  leader: { name: string; score: number; handle?: string };
  activeForecasts: number;
  completionRatePct: number; // 0-100
};

export default function SuperAdminDashboard({
  displayName,
  totalForecasts,
  leader,
  activeForecasts,
  completionRatePct,
}: Props) {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">
        Welcome to the Super Admin Dashboard,{" "}
        <span className="text-primary">{displayName}!</span>
      </h1>

      {/* KPI grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Forecasts"
          value={Intl.NumberFormat("en-US").format(totalForecasts)}
          subLabel="All-time"
        />

        <KpiCard
          title="Active Forecasts"
          value={Intl.NumberFormat("en-US").format(activeForecasts)}
          subLabel="Due in the future"
        />

        <KpiCard
          title="Completion Rate"
          value={`${completionRatePct}%`}
          subLabel="Completed / Total"
        />

        {/* Current Leader card */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Current Leader</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full border text-sm font-semibold">
                {leader.name
                  .split(" ")
                  .map((s) => s[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div>
                <div className="font-medium leading-tight">{leader.name}</div>
                {leader.handle && (
                  <div className="text-sm text-muted-foreground">{leader.handle}</div>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{leader.score}</div>
              <div className="text-xs text-muted-foreground">Leaderboard score</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({
  title,
  value,
  subLabel,
}: {
  title: string;
  value: string | number;
  subLabel?: string;
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold leading-tight">{value}</div>
        {subLabel && (
          <div className="mt-1 text-xs text-muted-foreground">{subLabel}</div>
        )}
      </CardContent>
    </Card>
  );
}
