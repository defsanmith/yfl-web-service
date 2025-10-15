"use client";

import { PaginationControls } from "@/components/pagination-controls";
import { SearchBar } from "@/components/search-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Role } from "@/generated/prisma";
import { PaginatedResult } from "@/lib/pagination";
import { OrganizationUser } from "@/services/organizations";
import { ChevronDown, ChevronsUpDown, ChevronUp } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import EditUserDialog from "./EditUserDialog";

type UsersTableProps = {
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

export default function UsersTable({
  initialUsers,
  searchParams,
}: UsersTableProps) {
  const router = useRouter();
  const currentSearchParams = useSearchParams();
  const [editingUser, setEditingUser] = useState<OrganizationUser | null>(null);

  const currentQuery = searchParams.query || "";
  const currentRole = searchParams.role || "all";
  const currentSortBy = searchParams.sortBy || "role";
  const currentSortOrder = searchParams.sortOrder || "desc";

  const handleSort = useCallback(
    (field: string) => {
      const params = new URLSearchParams(currentSearchParams.toString());

      // If clicking the same field, toggle order; otherwise set to desc (admins first for role)
      if (currentSortBy === field) {
        const newOrder = currentSortOrder === "asc" ? "desc" : "asc";
        params.set("sortOrder", newOrder);
      } else {
        params.set("sortBy", field);
        params.set("sortOrder", field === "role" ? "desc" : "asc");
      }

      params.delete("page"); // Reset to page 1 on sort
      router.push(`?${params.toString()}`);
    },
    [currentSearchParams, currentSortBy, currentSortOrder, router]
  );

  const getSortIcon = (field: string) => {
    if (currentSortBy !== field) {
      return <ChevronsUpDown className="ml-2 h-4 w-4" />;
    }
    return currentSortOrder === "asc" ? (
      <ChevronUp className="ml-2 h-4 w-4" />
    ) : (
      <ChevronDown className="ml-2 h-4 w-4" />
    );
  };

  const handleSearch = useCallback(
    (query: string) => {
      const params = new URLSearchParams(currentSearchParams.toString());
      if (query) {
        params.set("query", query);
      } else {
        params.delete("query");
      }
      params.delete("page"); // Reset to page 1 on search
      router.push(`?${params.toString()}`);
    },
    [currentSearchParams, router]
  );

  const handleRoleFilter = useCallback(
    (role: string) => {
      const params = new URLSearchParams(currentSearchParams.toString());
      if (role && role !== "all") {
        params.set("role", role);
      } else {
        params.delete("role");
      }
      params.delete("page"); // Reset to page 1 on filter
      router.push(`?${params.toString()}`);
    },
    [currentSearchParams, router]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      const params = new URLSearchParams(currentSearchParams.toString());
      params.set("page", page.toString());
      router.push(`?${params.toString()}`);
    },
    [currentSearchParams, router]
  );

  const handlePageSizeChange = useCallback(
    (pageSize: number) => {
      const params = new URLSearchParams(currentSearchParams.toString());
      params.set("pageSize", pageSize.toString());
      params.delete("page"); // Reset to page 1 on page size change
      router.push(`?${params.toString()}`);
    },
    [currentSearchParams, router]
  );

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case Role.SUPER_ADMIN:
        return "destructive";
      case Role.ORG_ADMIN:
        return "default";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchBar
            placeholder="Search by name, email, or ID..."
            defaultValue={currentQuery}
            onSearch={handleSearch}
          />
        </div>
        <div className="w-full sm:w-[200px]">
          <Select value={currentRole} onValueChange={handleRoleFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value={Role.USER}>User</SelectItem>
              <SelectItem value={Role.ORG_ADMIN}>Org Admin</SelectItem>
              <SelectItem value={Role.SUPER_ADMIN}>Super Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      {initialUsers.data.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No users found.
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-3 h-8 data-[state=open]:bg-accent"
                      onClick={() => handleSort("name")}
                    >
                      Name
                      {getSortIcon("name")}
                    </Button>
                  </TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-3 h-8 data-[state=open]:bg-accent"
                      onClick={() => handleSort("role")}
                    >
                      Role
                      {getSortIcon("role")}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-3 h-8 data-[state=open]:bg-accent"
                      onClick={() => handleSort("createdAt")}
                    >
                      Created
                      {getSortIcon("createdAt")}
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialUsers.data.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.name || "No name"}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingUser(user)}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <PaginationControls
            pagination={initialUsers.pagination}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </>
      )}

      {/* Edit User Dialog */}
      {editingUser && (
        <EditUserDialog
          user={editingUser}
          open={!!editingUser}
          onOpenChange={(open) => !open && setEditingUser(null)}
        />
      )}
    </div>
  );
}
