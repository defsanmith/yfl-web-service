"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { useMemo } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------

type Stat = {
  id: string;
  label: string;
  value: string | number;
  subLabel?: string;
  up?: boolean;
  delta?: string;
};

type PredictionMetric = {
  id: string;
  // Stored as a ratio in DB (e.g. 0.12 === 12%); may be null if not yet computed
  absoluteActualErrorPct: number | null;
};

type UserDashboardViewProps = {
  userName?: string;
  stats?: Stat[];
  predictionMetrics?: PredictionMetric[];
  // forecasts?: Forecast[]  // keep/add if you actually use it
};

// ------------------------------------------------------------------
// Component
// ------------------------------------------------------------------


export default function UserDashboardView({
  userName = "",
  stats = [],
  predictionMetrics = [],
}: UserDashboardViewProps) {
  const timeframeTabs = useMemo(
    () => ["Last 5 Predictions", "Last 10 Predictions", "All Predictions"],
    []
  );

  const kpiStats = stats || [];
  // ----------------------------------------------------------------
  // Chart data: Prediction 1, 2, 3... vs MAPE (%)
  // ----------------------------------------------------------------
  const predictionSeries = useMemo(
    () =>
      predictionMetrics
        .map((p, index) => {
          if (p.absoluteActualErrorPct == null) return null;

          return {
            // X-axis label
            label: `Prediction ${index + 1}`,
            // Convert ratio (0.12) to percent (12)
            mape: p.absoluteActualErrorPct * 100,
          };
        })
        .filter(
          (d): d is { label: string; mape: number } => d !== null
        ),
    [predictionMetrics]
  );

  const hasPredictionData = predictionSeries.length > 0;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">
          Welcome{userName ? `, ${userName}` : ""}
        </h1>
        <p className="text-muted-foreground">
          Track your forecasts, deadlines, and progress here.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiStats.length === 0 ? (
          <p className="text-sm text-muted-foreground col-span-full">
            No KPI data available yet.
          </p>
        ) : (
          kpiStats.map((kpi: Stat) => (
            <Card key={kpi.id} className="shadow-sm">
              <CardHeader className="pb-2">
                <div className="text-sm text-muted-foreground flex items-center justify-between">
                  <span>{kpi.label}</span>
                  {(kpi.delta !== undefined || kpi.up !== undefined) && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium">
                      {kpi.up ? (
                        <ArrowUpRight className="h-4 w-4 text-green-500" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-red-500" />
                      )}
                      {kpi.delta}
                    </span>
                  )}
                </div>
                <CardTitle className="text-3xl font-semibold tracking-tight">
                  {kpi.value}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {kpi.subLabel && (
                  <p className="text-xs text-muted-foreground">
                    {kpi.subLabel}
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Prediction Error Chart */}
      <Card className="shadow-sm">
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">
                Prediction Error (MAPE)
              </div>
              <div className="text-xs text-muted-foreground">
                Mean absolute percentage error per prediction
              </div>
            </div>

            <div className="flex gap-2">
              {timeframeTabs.map((t) => (
                <Button
                  key={t}
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                >
                  {t}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="h-[260px]">
          {hasPredictionData ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={predictionSeries}
                margin={{ left: 0, right: 0, top: 20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="mapeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="currentColor" stopOpacity={0.4} />
                    <stop
                      offset="95%"
                      stopColor="currentColor"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                {/* X axis: Prediction 1, 2, 3... */}
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                {/* Y axis: percentage */}
                <YAxis
                  tickFormatter={(v: number) => `${v.toFixed(0)}%`}
                  width={40}
                />
                <Tooltip
                  cursor={{ strokeOpacity: 0.1 }}
                  formatter={(value: number) => `${value.toFixed(2)}%`}
                  labelFormatter={(label) => label}
                />
                <Area
                  type="monotone"
                  dataKey="mape"
                  stroke="currentColor"
                  fillOpacity={1}
                  fill="url(#mapeGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-muted-foreground mt-6">
              No prediction metrics available yet. Once forecasts have actual
              values and metrics are recalculated, you’ll see mean absolute
              percentage error per prediction here.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
