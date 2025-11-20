"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Router from "@/constants/router";
import { Forecast, ForecastType, Prediction } from "@/generated/prisma";
import { format } from "date-fns";
import { ArrowLeft, Award, Medal, Trophy } from "lucide-react";
import Link from "next/link";

type ForecastWithOrg = Forecast & {
  organization: {
    id: string;
    name: string;
  };
};

type PredictionWithUser = Prediction & {
  user: {
    id: string;
    name: string | null;
    email: string;
  };
};

type ForecastLeaderboardViewProps = {
  forecast: ForecastWithOrg;
  predictions: PredictionWithUser[];
  currentUserId: string;
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

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Trophy className="h-5 w-5 text-yellow-500" />;
    case 2:
      return <Medal className="h-5 w-5 text-gray-400" />;
    case 3:
      return <Award className="h-5 w-5 text-amber-700" />;
    default:
      return null;
  }
};

export default function ForecastLeaderboardView({
  forecast,
  predictions,
  currentUserId,
}: ForecastLeaderboardViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={Router.USER_FORECAST_DETAIL(forecast.id)}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Leaderboard</h1>
            <p className="text-muted-foreground mt-1">{forecast.title}</p>
          </div>
        </div>
      </div>

      {/* Forecast Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Forecast Details</CardTitle>
            <Badge variant={FORECAST_TYPE_COLORS[forecast.type]}>
              {FORECAST_TYPE_LABELS[forecast.type]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div>
            <dt className="text-sm font-medium text-muted-foreground">
              Total Predictions
            </dt>
            <dd className="mt-1 text-2xl font-bold">{predictions.length}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">
              Due Date
            </dt>
            <dd className="mt-1 text-lg font-semibold">
              {format(new Date(forecast.dueDate), "MMM d, yyyy")}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">
              Organization
            </dt>
            <dd className="mt-1 text-lg font-semibold">
              {forecast.organization.name}
            </dd>
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard Table */}
      <Card>
        <CardHeader>
          <CardTitle>Participant Rankings</CardTitle>
        </CardHeader>
        <CardContent>
          {predictions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No predictions have been submitted yet.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Rank</TableHead>
                    <TableHead>Participant</TableHead>
                    <TableHead>Prediction</TableHead>
                    <TableHead className="text-center">Confidence</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Time (min)</TableHead>
                    <TableHead>Submitted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {predictions.map((prediction, index) => {
                    const rank = index + 1;
                    const isCurrentUser = prediction.userId === currentUserId;

                    return (
                      <TableRow
                        key={prediction.id}
                        className={isCurrentUser ? "bg-muted/50" : ""}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getRankIcon(rank)}
                            <span className="font-semibold">{rank}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span
                              className={isCurrentUser ? "font-semibold" : ""}
                            >
                              {prediction.user.name || "Anonymous"}
                            </span>
                            {isCurrentUser && (
                              <Badge variant="outline" className="text-xs">
                                You
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {prediction.user.email}
                          </p>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            {prediction.value}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {prediction.confidence !== null ? (
                            <Badge variant="secondary">
                              {prediction.confidence}%
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              N/A
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {prediction.method ? (
                            <span className="text-sm truncate max-w-[150px] block">
                              {prediction.method}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              N/A
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {prediction.estimatedTime !== null ? (
                            <span className="text-sm">
                              {prediction.estimatedTime}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              N/A
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(
                            new Date(prediction.createdAt),
                            "MMM d, yyyy"
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <Card className="border-muted">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <span>1st Place</span>
            </div>
            <div className="flex items-center gap-2">
              <Medal className="h-4 w-4 text-gray-400" />
              <span>2nd Place</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-700" />
              <span>3rd Place</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-muted/50" />
              <span>Your prediction is highlighted</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Rankings are sorted by confidence level (highest first), then by
            submission time (earliest first).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
