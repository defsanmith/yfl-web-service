import {
  getOrganizationById,
  getOrganizationUsers,
} from "@/services/organizations";
import OrganizationOverviewView from "@/views/organizations/OrganizationOverviewView";
import { notFound } from "next/navigation";

export interface OrgDetailsParams {
  orgId: string;
}

export interface OrgSearchParams {
  page?: string;
  pageSize?: string;
  query?: string;
  role?: string;
  sortBy?: string;
  sortOrder?: string;
}

export interface OrganizationDetailsPageProps {
  params: Promise<OrgDetailsParams>;
  searchParams: Promise<OrgSearchParams>;
}

export default async function OrganizationDetailPage({
  params,
  searchParams,
}: OrganizationDetailsPageProps) {
  const { orgId } = await params;
  const resolvedSearchParams = await searchParams;

  // Fetch organization details (for breadcrumb)
  const organization = await getOrganizationById(orgId);

  if (!organization) {
    notFound();
  }

  // Fetch users with pagination
  const users = await getOrganizationUsers(orgId, {
    page: resolvedSearchParams.page
      ? parseInt(resolvedSearchParams.page)
      : undefined,
    pageSize: resolvedSearchParams.pageSize
      ? parseInt(resolvedSearchParams.pageSize)
      : undefined,
    query: resolvedSearchParams.query,
    role: resolvedSearchParams.role,
    sortBy: resolvedSearchParams.sortBy as
      | "name"
      | "email"
      | "createdAt"
      | "role"
      | undefined,
    sortOrder: resolvedSearchParams.sortOrder as "asc" | "desc" | undefined,
  });

  return (
    <OrganizationOverviewView
      organizationId={organization.id}
      organizationName={organization.name}
      initialUsers={users}
      searchParams={resolvedSearchParams}
    />
  );
}
