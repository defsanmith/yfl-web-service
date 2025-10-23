"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Router from "@/constants/router";
import { Forecast, ForecastType } from "@/generated/prisma";
import { format, formatDistanceToNow } from "date-fns";
import { Calendar, TrendingUp } from "lucide-react";
import Link from "next/link";

type ForecastWithOrg = Forecast & {
  organization: {
    id: string;
    name: string;
  };
};

type UpcomingForecastsViewProps = {
  forecasts: ForecastWithOrg[];
};

const FORECAST_TYPE_LABELS: Record<ForecastType, string> = {
  BINARY: "Binary",
  CONTINUOUS: "Continuous",
  CATEGORICAL: "Categorical",
};

const FORECAST_TYPE_COLORS: Record<
  ForecastType,
  "default" | "secondary" | "destructive" | "outline"
> = {
  BINARY: "default",
  CONTINUOUS: "secondary",
  CATEGORICAL: "outline",
};

export default function UpcomingForecastsView({
  forecasts,
}: UpcomingForecastsViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <TrendingUp className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Upcoming Forecasts</h1>
      </div>

      {forecasts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              No upcoming forecasts
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Check back later for new forecasts to participate in.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {forecasts.map((forecast) => {
            const dueDate = new Date(forecast.dueDate);
            const timeUntilDue = formatDistanceToNow(dueDate, {
              addSuffix: true,
            });

            return (
              <Link
                key={forecast.id}
                href={Router.USER_FORECAST_DETAIL(forecast.id)}
              >
                <Card className="h-full transition-shadow hover:shadow-lg cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg line-clamp-2">
                        {forecast.title}
                      </CardTitle>
                      <Badge variant={FORECAST_TYPE_COLORS[forecast.type]}>
                        {FORECAST_TYPE_LABELS[forecast.type]}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {forecast.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {forecast.description}
                      </p>
                    )}

                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Due {format(dueDate, "MMM d, yyyy")}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-xs text-muted-foreground">
                        {timeUntilDue}
                      </span>
                      <span className="text-xs font-medium text-primary">
                        View Details →
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {forecasts.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Showing {forecasts.length} upcoming forecast
          {forecasts.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
