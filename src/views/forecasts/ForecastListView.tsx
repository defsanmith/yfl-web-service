"use client";

import CreateForecastModal from "@/components/forecasts/CreateForecastModal";
import type { PaginationInfo } from "@/components/pagination-controls";
import { PaginationControls } from "@/components/pagination-controls";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { format } from "date-fns";
import {
  ChevronDown,
  ChevronsUpDown,
  ChevronUp,
  Plus,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

type ForecastWithOrg = Forecast & {
  organization: {
    id: string;
    name: string;
  };
};

type ForecastListViewProps = {
  forecasts: ForecastWithOrg[];
  pagination: PaginationInfo;
  orgId: string;
  orgName: string;
  /** Base path for this forecasts list (e.g., "/forecasts" for org admin or "/orgs/[id]/forecasts" for super admin) */
  basePath?: string;
  /** Whether to show breadcrumbs (default: true for super admin, false for org admin) */
  showBreadcrumbs?: boolean;
  /** Whether this is for org admin context */
  isOrgAdmin?: boolean;
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

export default function ForecastListView({
  forecasts,
  pagination,
  orgId,
  orgName,
  basePath,
  showBreadcrumbs = true,
  isOrgAdmin = false,
}: ForecastListViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || ""
  );
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Determine the base path for navigation
  const effectiveBasePath = basePath || Router.organizationForecasts(orgId);

  const currentType = searchParams.get("type") || "all";
  const currentSortBy = searchParams.get("sortBy") || "createdAt";
  const currentSortOrder = (searchParams.get("sortOrder") || "desc") as
    | "asc"
    | "desc";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchQuery) {
      params.set("search", searchQuery);
    } else {
      params.delete("search");
    }
    params.set("page", "1");
    router.push(`${effectiveBasePath}?${params.toString()}`);
  };

  const handleTypeFilter = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === "all") {
      params.delete("type");
    } else {
      params.set("type", value);
    }
    params.set("page", "1");
    router.push(`${effectiveBasePath}?${params.toString()}`);
  };

  const handleSort = (column: string) => {
    const params = new URLSearchParams(searchParams);
    if (currentSortBy === column) {
      params.set("sortOrder", currentSortOrder === "asc" ? "desc" : "asc");
    } else {
      params.set("sortBy", column);
      params.set("sortOrder", "asc");
    }
    router.push(`${effectiveBasePath}?${params.toString()}`);
  };

  const getSortIcon = (column: string) => {
    if (currentSortBy !== column)
      return <ChevronsUpDown className="ml-2 h-4 w-4" />;
    return currentSortOrder === "asc" ? <ChevronUp /> : <ChevronDown />;
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb - only show for super admin */}
      {showBreadcrumbs && (
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href={Router.ORGANIZATIONS}>
                Organizations
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={Router.organizationDetail(orgId)}>
                {orgName}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Forecasts</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Forecasts</h1>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Forecast
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </form>

        <Select value={currentType} onValueChange={handleTypeFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value={ForecastType.BINARY}>Binary</SelectItem>
            <SelectItem value={ForecastType.CONTINUOUS}>Continuous</SelectItem>
            <SelectItem value={ForecastType.CATEGORICAL}>
              Categorical
            </SelectItem>
          </SelectContent>
        </Select>

        <Button type="submit" onClick={handleSearch}>
          Search
        </Button>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {forecasts.length} of {pagination.totalItems} forecast
        {pagination.totalItems !== 1 ? "s" : ""}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("title")}
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                >
                  Title {getSortIcon("title")}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("type")}
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                >
                  Type {getSortIcon("type")}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("dueDate")}
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                >
                  Due Date {getSortIcon("dueDate")}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("createdAt")}
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                >
                  Created {getSortIcon("createdAt")}
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {forecasts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground"
                >
                  No forecasts found
                </TableCell>
              </TableRow>
            ) : (
              forecasts.map((forecast) => (
                <TableRow key={forecast.id}>
                  <TableCell>
                    <Link
                      href={`${effectiveBasePath}/${forecast.id}`}
                      className="font-medium hover:underline"
                    >
                      {forecast.title}
                    </Link>
                    {forecast.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {forecast.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={FORECAST_TYPE_COLORS[forecast.type]}>
                      {FORECAST_TYPE_LABELS[forecast.type]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(forecast.dueDate), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(forecast.createdAt), "MMM d, yyyy")}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-4">
          <PaginationControls
            pagination={pagination}
            onPageChange={(page) => {
              const params = new URLSearchParams(searchParams);
              params.set("page", String(page));
              router.push(`${effectiveBasePath}?${params.toString()}`);
            }}
            onPageSizeChange={(pageSize) => {
              const params = new URLSearchParams(searchParams);
              params.set("pageSize", String(pageSize));
              params.set("page", "1"); // Reset to first page
              router.push(`${effectiveBasePath}?${params.toString()}`);
            }}
          />
        </div>
      )}

      {/* Create Forecast Modal */}
      <CreateForecastModal
        orgId={orgId}
        orgName={orgName}
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        isOrgAdmin={isOrgAdmin}
      />
    </div>
  );
}
