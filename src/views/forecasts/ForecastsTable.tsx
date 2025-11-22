"use client";

import {
  PaginationControls,
  PaginationInfo,
} from "@/components/pagination-controls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { formatForecastValue } from "@/lib/format-metrics";
import { format } from "date-fns";
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Filter,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

type ForecastWithDetails = Forecast & {
  organization: {
    id: string;
    name: string;
  };
  category: {
    id: string;
    name: string;
    color: string | null;
  } | null;
  predictions: {
    id: string;
    userId: string;
    value: string;
  }[];
};

type ForecastsTableProps = {
  forecasts: ForecastWithDetails[];
  pagination: PaginationInfo;
  categories: Array<{ id: string; name: string; color: string | null }>;
  currentPath: string;
  emptyMessage?: string;
  emptyDescription?: string;
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

export default function ForecastsTable({
  forecasts,
  pagination,
  categories,
  currentPath,
  emptyMessage = "No forecasts found",
  emptyDescription = "No forecasts match your current filters.",
}: ForecastsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentCategoryId = searchParams.get("categoryId") || "all";
  const currentType = searchParams.get("type") || "all";
  const currentSortBy = searchParams.get("sortBy") || "dueDate";
  const currentSortOrder = searchParams.get("sortOrder") || "asc";

  const updateFilters = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== "all") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    // Reset to first page when filters change
    params.set("page", "1");
    router.push(`${currentPath}?${params.toString()}`);
  };

  const handleSort = (column: string) => {
    const newSortOrder =
      currentSortBy === column && currentSortOrder === "asc" ? "desc" : "asc";
    updateFilters({ sortBy: column, sortOrder: newSortOrder });
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(page));
    router.push(`${currentPath}?${params.toString()}`);
  };

  const handlePageSizeChange = (pageSize: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("pageSize", String(pageSize));
    params.set("page", "1"); // Reset to first page
    router.push(`${currentPath}?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push(currentPath);
  };

  const hasActiveFilters =
    (currentCategoryId && currentCategoryId !== "all") ||
    (currentType && currentType !== "all");

  return (
    <div className="space-y-6">
      {/* Filters */}

      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filters</span>
        </div>

        <Select
          value={currentCategoryId}
          onValueChange={(value) => updateFilters({ categoryId: value })}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                <div className="flex items-center gap-2">
                  {category.color && (
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                  )}
                  {category.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={currentType}
          onValueChange={(value) => updateFilters({ type: value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="BINARY">Binary</SelectItem>
            <SelectItem value="CONTINUOUS">Continuous</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="ml-auto"
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Table */}
      {forecasts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              {emptyMessage}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {emptyDescription}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30%]">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("title")}
                      className="hover:bg-transparent"
                    >
                      Prediction
                      {currentSortBy === "title" ? (
                        currentSortOrder === "asc" ? (
                          <ChevronUp className="ml-2 h-4 w-4" />
                        ) : (
                          <ChevronDown className="ml-2 h-4 w-4" />
                        )
                      ) : (
                        <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead className="w-[15%]">Category</TableHead>
                  <TableHead className="w-[12%]">Type</TableHead>
                  <TableHead className="w-[13%]">Prediction</TableHead>
                  <TableHead className="w-[15%]">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("dueDate")}
                      className="hover:bg-transparent"
                    >
                      Due Date
                      {currentSortBy === "dueDate" ? (
                        currentSortOrder === "asc" ? (
                          <ChevronUp className="ml-2 h-4 w-4" />
                        ) : (
                          <ChevronDown className="ml-2 h-4 w-4" />
                        )
                      ) : (
                        <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead className="w-[15%]">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("dataReleaseDate")}
                      className="hover:bg-transparent"
                    >
                      Release Date
                      {currentSortBy === "dataReleaseDate" ? (
                        currentSortOrder === "asc" ? (
                          <ChevronUp className="ml-2 h-4 w-4" />
                        ) : (
                          <ChevronDown className="ml-2 h-4 w-4" />
                        )
                      ) : (
                        <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                      )}
                    </Button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {forecasts.map((forecast) => {
                  const prediction = forecast.predictions[0]; // User's prediction
                  const hasSubmitted = !!prediction;

                  return (
                    <TableRow
                      key={forecast.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() =>
                        router.push(Router.USER_FORECAST_DETAIL(
                          forecast.id
                        ))
                      }
                    >
                      <TableCell className="font-medium max-w-0">
                        <Link
                          href={Router.USER_FORECAST_DETAIL(forecast.id)}
                          className="hover:underline block truncate"
                          title={forecast.title}
                        >
                          {forecast.title}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {forecast.category ? (
                          <div className="flex items-center gap-2">
                            {forecast.category.color && (
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{
                                  backgroundColor: forecast.category.color,
                                }}
                              />
                            )}
                            <span className="text-sm">
                              {forecast.category.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground italic">
                            Uncategorized
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={FORECAST_TYPE_COLORS[forecast.type]}>
                          {FORECAST_TYPE_LABELS[forecast.type]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {hasSubmitted ? (
                          <span className="text-sm font-medium">
                            {forecast.type === "BINARY"
                              ? prediction.value === "true"
                                ? "Yes"
                                : "No"
                              : forecast.type === "CONTINUOUS" &&
                                forecast.dataType
                              ? formatForecastValue(
                                  prediction.value,
                                  forecast.dataType
                                )
                              : prediction.value}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground italic">
                            Not submitted
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {format(
                              new Date(forecast.dueDate),
                              "MMM d, yyyy h:mm a"
                            )}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {forecast.dataReleaseDate ? (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {format(
                                new Date(forecast.dataReleaseDate),
                                "MMM d, yyyy h:mm a"
                              )}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground italic">
                            Not set
                          </span>
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
