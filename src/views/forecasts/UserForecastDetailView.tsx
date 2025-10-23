"use client";

import PredictionDialog from "@/components/forecasts/PredictionDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Router from "@/constants/router";
import { Forecast, ForecastType } from "@/generated/prisma";
import { format } from "date-fns";
import { ArrowLeft, CheckCircle2, Trophy } from "lucide-react";
import Link from "next/link";

type ForecastWithOrg = Forecast & {
  organization: {
    id: string;
    name: string;
  };
};

type UserForecastDetailViewProps = {
  forecast: ForecastWithOrg;
  existingPrediction?: {
    id: string;
    value: string;
    confidence: number | null;
    reasoning: string | null;
    createdAt: Date;
    updatedAt: Date;
  } | null;
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
  existingPrediction,
}: UserForecastDetailViewProps) {
  const options =
    forecast.type === ForecastType.CATEGORICAL && forecast.options
      ? (forecast.options as string[])
      : [];

  const isExpired = new Date(forecast.dueDate) <= new Date();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={Router.HOME}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">{forecast.title}</h1>
        </div>
        <Button variant="outline" asChild>
          <Link href={Router.FORECAST_LEADERBOARD(forecast.id)}>
            <Trophy className="mr-2 h-4 w-4" />
            View Leaderboard
          </Link>
        </Button>
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

      {/* Prediction Submission */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {existingPrediction
                ? "Your Prediction"
                : "Submit Your Prediction"}
            </CardTitle>
            {existingPrediction && (
              <Badge variant="outline" className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Submitted
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isExpired ? (
            <div className="rounded-lg border border-muted bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">
                This forecast has closed. Predictions can no longer be submitted
                or updated.
              </p>
            </div>
          ) : existingPrediction ? (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">
                    Your prediction:{" "}
                  </span>
                  <span className="text-sm font-semibold">
                    {existingPrediction.value}
                  </span>
                </div>
                {existingPrediction.confidence !== null && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">
                      Confidence:{" "}
                    </span>
                    <span className="text-sm font-semibold">
                      {existingPrediction.confidence}%
                    </span>
                  </div>
                )}
                {existingPrediction.reasoning && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground block mb-1">
                      Reasoning:
                    </span>
                    <p className="text-sm">{existingPrediction.reasoning}</p>
                  </div>
                )}
              </div>
              <PredictionDialog
                forecastId={forecast.id}
                forecastTitle={forecast.title}
                forecastType={forecast.type}
                categoricalOptions={options}
                existingPrediction={existingPrediction}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                You haven&apos;t submitted a prediction for this forecast yet.
                Click the button below to submit your prediction.
              </p>
              <PredictionDialog
                forecastId={forecast.id}
                forecastTitle={forecast.title}
                forecastType={forecast.type}
                categoricalOptions={options}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Show existing prediction details if available */}
      {existingPrediction && (
        <Card className="border-muted">
          <CardHeader>
            <CardTitle className="text-base">Submission Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">First submitted: </span>
              <span className="font-medium">
                {format(
                  new Date(existingPrediction.createdAt),
                  "MMM d, yyyy 'at' h:mm a"
                )}
              </span>
            </div>
            {existingPrediction.updatedAt.getTime() !==
              existingPrediction.createdAt.getTime() && (
              <div>
                <span className="text-muted-foreground">Last updated: </span>
                <span className="font-medium">
                  {format(
                    new Date(existingPrediction.updatedAt),
                    "MMM d, yyyy 'at' h:mm a"
                  )}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
