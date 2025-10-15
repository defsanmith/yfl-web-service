"use client";

import { deleteForecastAction } from "@/app/(protected)/(super-admin)/orgs/[orgId]/forecasts/[forecastId]/actions";
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
import { Forecast, ForecastType } from "@/generated/prisma";
import { format } from "date-fns";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type ForecastWithOrg = Forecast & {
  organization: {
    id: string;
    name: string;
  };
};

type ForecastDetailViewProps = {
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

export default function ForecastDetailView({
  forecast,
}: ForecastDetailViewProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    await deleteForecastAction(forecast.organizationId, forecast.id);
    // Redirect happens in the action
  };

  const options =
    forecast.type === ForecastType.CATEGORICAL && forecast.options
      ? (forecast.options as string[])
      : [];

  return (
    <>
      <div className="space-y-6">
        {/* Breadcrumb Navigation */}
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

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link
                href={Router.organizationForecasts(forecast.organizationId)}
              >
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
                This forecast accepts numerical values.
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
      />
    </>
  );
}
