"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PaginatedResult } from "@/lib/pagination";
import { OrganizationUser } from "@/services/organizations";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import OrgAdminCreateUserDialog from "./OrgAdminCreateUserDialog";
import OrgAdminUsersTable from "./OrgAdminUsersTable";

type OrgAdminUsersViewProps = {
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
    create?: string;
  };
};

export default function OrgAdminUsersView({
  organizationId,
  organizationName,
  initialUsers,
  searchParams,
}: OrgAdminUsersViewProps) {
  const router = useRouter();
  const currentSearchParams = useSearchParams();
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);

  // Open dialog if create=true in URL
  useEffect(() => {
    if (searchParams.create === "true") {
      setIsCreateUserOpen(true);
    }
  }, [searchParams.create]);

  // Close dialog and remove create param from URL
  const handleOpenChange = (open: boolean) => {
    setIsCreateUserOpen(open);
    if (!open && searchParams.create === "true") {
      const params = new URLSearchParams(currentSearchParams.toString());
      params.delete("create");
      router.replace(`?${params.toString()}`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground">
          Manage users in {organizationName}
        </p>
      </div>

      {/* Users Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Members</CardTitle>
              <CardDescription>
                Manage users in your organization
              </CardDescription>
            </div>
            <Button onClick={() => setIsCreateUserOpen(true)}>
              Create User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <OrgAdminUsersTable
            initialUsers={initialUsers}
            searchParams={searchParams}
          />
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <OrgAdminCreateUserDialog
        organizationId={organizationId}
        open={isCreateUserOpen}
        onOpenChange={handleOpenChange}
      />
    </div>
  );
}
