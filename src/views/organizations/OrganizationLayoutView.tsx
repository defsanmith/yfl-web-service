"use client";

import { NavTabs } from "@/components/nav-tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Router from "@/constants/router";
import { useState } from "react";
import EditOrganizationDialog from "./EditOrganizationDialog";

type Organization = {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type OrganizationLayoutViewProps = {
  organization: Organization;
  userCount: number;
  children: React.ReactNode;
};

export default function OrganizationLayoutView({
  organization,
  userCount,
  children,
}: OrganizationLayoutViewProps) {
  const [isEditOrgOpen, setIsEditOrgOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Organization Details Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl">{organization.name}</CardTitle>
              <CardDescription className="mt-2">
                {organization.description || "No description provided"}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                {userCount} {userCount === 1 ? "User" : "Users"}
              </Badge>
              <Button onClick={() => setIsEditOrgOpen(true)} variant="outline">
                Edit Organization
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Navigation Tabs */}
      <NavTabs
        items={[
          {
            label: "Overview",
            href: Router.organizationDetail(organization.id),
            isActive: (pathname) =>
              pathname === Router.organizationDetail(organization.id),
          },
          {
            label: "Forecasts",
            href: Router.organizationForecasts(organization.id),
          },
        ]}
      />

      {/* Page Content */}
      <div className="space-y-4">{children}</div>

      {/* Edit Organization Dialog */}
      <EditOrganizationDialog
        organization={organization}
        open={isEditOrgOpen}
        onOpenChange={setIsEditOrgOpen}
      />
    </div>
  );
}
