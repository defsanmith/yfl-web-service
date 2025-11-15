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
import BulkUploadUsersModal from "./BulkUploadUsersModal";

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
    bulkUpload?: string;
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
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);

  // Open dialogs based on URL params
  useEffect(() => {
    if (searchParams.create === "true") {
      setIsCreateUserOpen(true);
    }
    if (searchParams.bulkUpload === "true") {
      setIsBulkUploadOpen(true);
    }
  }, [searchParams.create, searchParams.bulkUpload]);

  // Close dialog and remove param from URL
  const handleCreateUserOpenChange = (open: boolean) => {
    setIsCreateUserOpen(open);
    if (!open && searchParams.create === "true") {
      const params = new URLSearchParams(currentSearchParams.toString());
      params.delete("create");
      router.replace(`?${params.toString()}`);
    }
  };

  // Close bulk upload dialog and remove param from URL
  const handleBulkUploadOpenChange = (open: boolean) => {
    setIsBulkUploadOpen(open);
    if (!open && searchParams.bulkUpload === "true") {
      const params = new URLSearchParams(currentSearchParams.toString());
      params.delete("bulkUpload");
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
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsBulkUploadOpen(true)}
              >
                Bulk Upload
              </Button>
              <Button onClick={() => setIsCreateUserOpen(true)}>
                Create User
              </Button>
            </div>
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
        onOpenChange={handleCreateUserOpenChange}
      />

      {/* Bulk Upload Modal */}
      <BulkUploadUsersModal
        open={isBulkUploadOpen}
        onOpenChange={handleBulkUploadOpenChange}
      />
    </div>
  );
}
