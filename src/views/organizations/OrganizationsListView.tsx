"use client";

import type { PaginationInfo } from "@/components/pagination-controls";
import { PaginationControls } from "@/components/pagination-controls";
import { SearchBar } from "@/components/search-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Router from "@/constants/router";
import type { OrganizationListItem } from "@/services/organizations";
import { Building2, Plus, Users } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface OrganizationsListViewProps {
  organizations: OrganizationListItem[];
  pagination: PaginationInfo;
}

/**
 * Organizations list view with pagination and search
 */
export default function OrganizationsListView({
  organizations,
  pagination,
}: OrganizationsListViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Handle search
  const handleSearch = useCallback(
    (query: string) => {
      const params = new URLSearchParams(searchParams);
      if (query) {
        params.set("query", query);
      } else {
        params.delete("query");
      }
      params.delete("page"); // Reset to first page on search
      router.push(`${Router.ORGANIZATIONS}?${params.toString()}`);
    },
    [router, searchParams]
  );

  // Handle page change
  const handlePageChange = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams);
      if (page > 1) {
        params.set("page", page.toString());
      } else {
        params.delete("page");
      }
      router.push(`${Router.ORGANIZATIONS}?${params.toString()}`);
    },
    [router, searchParams]
  );

  // Handle page size change
  const handlePageSizeChange = useCallback(
    (pageSize: number) => {
      const params = new URLSearchParams(searchParams);
      if (pageSize !== 10) {
        params.set("pageSize", pageSize.toString());
      } else {
        params.delete("pageSize");
      }
      params.delete("page"); // Reset to first page on page size change
      router.push(`${Router.ORGANIZATIONS}?${params.toString()}`);
    },
    [router, searchParams]
  );

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(date));
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Organizations
              </CardTitle>
              <CardDescription>
                Manage and view all organizations in the system
              </CardDescription>
            </div>
            <Button asChild>
              <Link href={Router.CREATE_ORGANIZATION}>
                <Plus className="mr-2 h-4 w-4" />
                Create Organization
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search bar */}
          <div className="mb-4">
            <SearchBar
              defaultValue={searchParams.get("query") || ""}
              onSearch={handleSearch}
              placeholder="Search by name or ID..."
            />
          </div>

          {/* Organizations table */}
          {organizations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchParams.get("query")
                  ? "No organizations found"
                  : "No organizations yet"}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchParams.get("query")
                  ? "Try adjusting your search query"
                  : "Create your first organization to get started"}
              </p>
              {!searchParams.get("query") && (
                <Button asChild>
                  <Link href={Router.CREATE_ORGANIZATION}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Organization
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-center">Users</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {organizations.map((org) => (
                      <TableRow key={org.id}>
                        <TableCell className="font-medium">
                          {org.name}
                        </TableCell>
                        <TableCell className="max-w-md truncate">
                          {org.description || (
                            <span className="text-muted-foreground italic">
                              No description
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="gap-1">
                            <Users className="h-3 w-3" />
                            {org._count.users}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(org.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button asChild variant="ghost" size="sm">
                            <Link href={Router.organizationDetail(org.id)}>
                              View Details
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination controls */}
              <div className="mt-4">
                <PaginationControls
                  pagination={pagination}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
