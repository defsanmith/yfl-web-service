"use client";

import {
  PaginationControls,
  PaginationInfo,
} from "@/components/pagination-controls";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Router from "@/constants/router";
import { Forecast, ForecastType } from "@/generated/prisma";
import { format, formatDistanceToNow } from "date-fns";
import { Calendar, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

type ForecastWithOrgAndPredictions = Forecast & {
  organization: {
    id: string;
    name: string;
  };
  predictions: {
    id: string;
    userId: string;
    value: string;
  }[];
};

type UpcomingForecastsTableViewProps = {
  forecasts: ForecastWithOrgAndPredictions[];
  pagination: PaginationInfo;
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

export default function UpcomingForecastsTableView({
  forecasts,
  pagination,
}: UpcomingForecastsTableViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(page));
    router.push(`${Router.USER_FORECASTS}?${params.toString()}`);
  };

  const handlePageSizeChange = (pageSize: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("pageSize", String(pageSize));
    params.set("page", "1"); // Reset to first page
    router.push(`${Router.USER_FORECASTS}?${params.toString()}`);
  };

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
        <>
          <Card className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Time Remaining</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {forecasts.map((forecast) => {
                  const dueDate = new Date(forecast.dueDate);
                  const timeUntilDue = formatDistanceToNow(dueDate, {
                    addSuffix: true,
                  });
                  const hasSubmitted = forecast.predictions.length > 0;

                  return (
                    <TableRow
                      key={forecast.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() =>
                        (window.location.href = Router.USER_FORECAST_DETAIL(
                          forecast.id
                        ))
                      }
                    >
                      <TableCell className="font-medium">
                        <Link
                          href={Router.USER_FORECAST_DETAIL(forecast.id)}
                          className="hover:underline"
                        >
                          {forecast.title}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant={FORECAST_TYPE_COLORS[forecast.type]}>
                          {FORECAST_TYPE_LABELS[forecast.type]}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-md">
                        {forecast.description ? (
                          <span className="line-clamp-2 text-sm text-muted-foreground">
                            {forecast.description}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground italic">
                            No description
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{format(dueDate, "MMM d, yyyy")}</span>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {timeUntilDue}
                      </TableCell>
                      <TableCell>
                        {hasSubmitted ? (
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="text-sm font-medium">
                              Submitted
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-amber-600">
                            <Clock className="h-4 w-4" />
                            <span className="text-sm font-medium">Pending</span>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>

          {pagination.totalPages > 1 && (
            <PaginationControls
              pagination={pagination}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          )}
        </>
      )}
    </div>
  );
}
