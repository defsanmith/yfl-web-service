"use client";

import { deleteUserAction } from "@/app/(protected)/(org-admin)/users/actions";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Router from "@/constants/router";
import { PaginatedResult } from "@/lib/pagination";
import { OrganizationUser } from "@/services/organizations";
import { useState } from "react";
import CreateUserDialog from "./CreateUserDialog";
import UsersTable from "./UsersTable";

type OrganizationOverviewViewProps = {
  organizationId: string;
  organizationName: string;
  initialUsers: PaginatedResult<OrganizationUser>;
  searchParams: {
    page?: string;
    pageSize?: string;
    query?: string;
    role?: string;
    sortBy?: string;
    sortOrder?: string;
  };
};

export default function OrganizationOverviewView({
  organizationId,
  organizationName,
  initialUsers,
  searchParams,
}: OrganizationOverviewViewProps) {
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);

  const handleDeleteUser = async (userId: string) => {
    return await deleteUserAction(userId);
  };

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href={Router.ORGANIZATIONS}>
              Organizations
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{organizationName}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Users Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Members</CardTitle>
              <CardDescription>
                Manage users in this organization
              </CardDescription>
            </div>
            <Button onClick={() => setIsCreateUserOpen(true)}>
              Create User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <UsersTable
            initialUsers={initialUsers}
            searchParams={searchParams}
            organizationId={organizationId}
            onDeleteUser={handleDeleteUser}
          />
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <CreateUserDialog
        organizationId={organizationId}
        open={isCreateUserOpen}
        onOpenChange={setIsCreateUserOpen}
      />
    </div>
  );
}
