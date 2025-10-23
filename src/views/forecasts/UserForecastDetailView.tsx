"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Router from "@/constants/router";
import { Forecast, ForecastType } from "@/generated/prisma";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

type ForecastWithOrg = Forecast & {
  organization: {
    id: string;
    name: string;
  };
};

type UserForecastDetailViewProps = {
  forecast: ForecastWithOrg;
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

export default function UserForecastDetailView({
  forecast,
}: UserForecastDetailViewProps) {
  const options =
    forecast.type === ForecastType.CATEGORICAL && forecast.options
      ? (forecast.options as string[])
      : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={Router.HOME}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">{forecast.title}</h1>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Type
              </dt>
              <dd className="mt-1">
                <Badge variant={FORECAST_TYPE_COLORS[forecast.type]}>
                  {FORECAST_TYPE_LABELS[forecast.type]}
                </Badge>
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Due Date
              </dt>
              <dd className="mt-1 text-lg font-semibold">
                {format(new Date(forecast.dueDate), "MMMM d, yyyy")}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Organization
              </dt>
              <dd className="mt-1">{forecast.organization.name}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Created
              </dt>
              <dd className="mt-1 text-sm">
                {format(
                  new Date(forecast.createdAt),
                  "MMM d, yyyy 'at' h:mm a"
                )}
              </dd>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            {forecast.description ? (
              <p className="text-sm">{forecast.description}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                No description provided
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {forecast.type === ForecastType.CATEGORICAL && options.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Categorical Options</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {options.map((option, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  {option}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {forecast.type === ForecastType.BINARY && (
        <Card>
          <CardHeader>
            <CardTitle>Binary Options</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                True
              </li>
              <li className="flex items-center gap-2 text-sm">
                <div className="h-2 w-2 rounded-full bg-red-500" />
                False
              </li>
            </ul>
          </CardContent>
        </Card>
      )}

      {forecast.type === ForecastType.CONTINUOUS && (
        <Card>
          <CardHeader>
            <CardTitle>Continuous Values</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This forecast accepts numerical values.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Placeholder for future forecast submission form */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Submit Your Forecast</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Forecast submission functionality will be available soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
