"use client";

import { deleteForecastAction as orgAdminDeleteAction } from "@/app/(protected)/(org-admin)/forecasts/[forecastId]/actions";
import { deleteForecastAction as superAdminDeleteAction } from "@/app/(protected)/(super-admin)/orgs/[orgId]/forecasts/[forecastId]/actions";
import EditForecastModal from "@/components/forecasts/EditForecastModal";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Router from "@/constants/router";
import { DataType, Forecast, ForecastType } from "@/generated/prisma";
import { format } from "date-fns";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type ForecastWithOrg = Forecast & {
  organization: {
    id: string;
    name: string;
  };
  category?: {
    id: string;
    name: string;
    color: string | null;
  } | null;
};

type ForecastDetailViewProps = {
  forecast: ForecastWithOrg;
  /** Whether this is for org admin context */
  isOrgAdmin?: boolean;
  /** Base path for forecast list (used for back button) */
  listPath?: string;
  /** Whether to show breadcrumbs (default: true for super admin, false for org admin) */
  showBreadcrumbs?: boolean;
  /** Available categories for the organization */
  categories?: Array<{
    id: string;
    name: string;
    color: string | null;
  }>;
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

const DATA_TYPE_LABELS: Record<DataType, string> = {
  NUMBER: "Number",
  CURRENCY: "Currency",
  PERCENT: "Percent",
  DECIMAL: "Decimal",
  INTEGER: "Integer",
};

export default function ForecastDetailView({
  forecast,
  isOrgAdmin = false,
  listPath,
  showBreadcrumbs = true,
  categories = [],
}: ForecastDetailViewProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Determine the list path for back button
  const effectiveListPath =
    listPath || Router.organizationForecasts(forecast.organizationId);

  const handleDelete = async () => {
    setIsDeleting(true);
    if (isOrgAdmin) {
      await orgAdminDeleteAction(forecast.id);
    } else {
      await superAdminDeleteAction(forecast.organizationId, forecast.id);
    }
    // Redirect happens in the action
  };

  const options =
    forecast.type === ForecastType.CATEGORICAL && forecast.options
      ? (forecast.options as string[])
      : [];

  return (
    <>
      <div className="space-y-6">
        {/* Breadcrumb Navigation - only show for super admin */}
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
                <BreadcrumbLink
                  href={Router.organizationDetail(forecast.organizationId)}
                >
                  {forecast.organization.name}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink
                  href={Router.organizationForecasts(forecast.organizationId)}
                >
                  Forecasts
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{forecast.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href={effectiveListPath}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">{forecast.title}</h1>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setShowEditModal(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
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

              {forecast.type === ForecastType.CONTINUOUS &&
                forecast.dataType && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Data Type
                    </dt>
                    <dd className="mt-1">
                      <Badge variant="outline">
                        {DATA_TYPE_LABELS[forecast.dataType]}
                      </Badge>
                    </dd>
                  </div>
                )}

              {forecast.category && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Category
                  </dt>
                  <dd className="mt-1 flex items-center gap-2">
                    {forecast.category.color && (
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: forecast.category.color }}
                      />
                    )}
                    <span>{forecast.category.name}</span>
                  </dd>
                </div>
              )}

              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Due Date
                </dt>
                <dd className="mt-1 text-lg font-semibold">
                  {format(
                    new Date(forecast.dueDate),
                    "MMMM d, yyyy 'at' h:mm a"
                  )}
                </dd>
              </div>

              {forecast.dataReleaseDate && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Data Release Date
                  </dt>
                  <dd className="mt-1 text-lg font-semibold">
                    {format(
                      new Date(forecast.dataReleaseDate),
                      "MMMM d, yyyy 'at' h:mm a"
                    )}
                  </dd>
                </div>
              )}

              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Organization
                </dt>
                <dd className="mt-1">
                  <Link
                    href={Router.organizationDetail(forecast.organization.id)}
                    className="text-primary hover:underline"
                  >
                    {forecast.organization.name}
                  </Link>
                </dd>
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

              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Last Updated
                </dt>
                <dd className="mt-1 text-sm">
                  {format(
                    new Date(forecast.updatedAt),
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
                This forecast accepts numerical values
                {forecast.dataType &&
                  ` (${DATA_TYPE_LABELS[forecast.dataType].toLowerCase()})`}
                .
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Forecast</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{forecast.title}&quot;? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Forecast Modal */}
      <EditForecastModal
        forecast={forecast}
        open={showEditModal}
        onOpenChange={setShowEditModal}
        isOrgAdmin={isOrgAdmin}
        categories={categories}
      />
    </>
  );
}
