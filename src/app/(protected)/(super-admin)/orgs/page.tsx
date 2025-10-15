import { getOrganizationsPaginated } from "@/services/organizations";
import OrganizationsListView from "@/views/organizations/OrganizationsListView";

interface OrganizationsPageProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    query?: string;
  }>;
}

/**
 * Organizations list page with pagination and search
 */
export default async function OrganizationsPage({
  searchParams,
}: OrganizationsPageProps) {
  const params = await searchParams;

  // Parse search params
  const page = params.page ? parseInt(params.page, 10) : 1;
  const pageSize = params.pageSize ? parseInt(params.pageSize, 10) : 10;
  const query = params.query;

  // Fetch paginated organizations
  const result = await getOrganizationsPaginated({
    page,
    pageSize,
    query,
  });

  return (
    <OrganizationsListView
      organizations={result.data}
      pagination={result.pagination}
    />
  );
}
