// Completed forecasts page for users (past forecasts)

import { auth } from "@/auth";
import Router from "@/constants/router";
import { getCategories } from "@/services/categories";
import { getUserForecasts } from "@/services/forecasts";
import ForecastsTable from "@/views/forecasts/ForecastsTable";
import { redirect } from "next/navigation";

type PageProps = {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    categoryId?: string;
    type?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
};

export default async function CompletedForecastsPage({
  searchParams,
}: PageProps) {
  const session = await auth();

  if (!session) {
    redirect(Router.SIGN_IN);
  }

  // Verify user has an organization
  if (!session.user.organizationId) {
    redirect(Router.UNAUTHORIZED);
  }

  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const pageSize = parseInt(params.pageSize || "10", 10);
  const categoryId = params.categoryId || undefined;
  const type = params.type as
    | "BINARY"
    | "CONTINUOUS"
    | "CATEGORICAL"
    | undefined;
  const sortBy = params.sortBy || "dueDate";
  const sortOrder = (params.sortOrder as "asc" | "desc") || "desc"; // Default desc for past

  // Get completed forecasts for the user
  const result = await getUserForecasts({
    organizationId: session.user.organizationId,
    userId: session.user.id,
    status: "completed",
    categoryId,
    type,
    page,
    limit: pageSize,
    sortBy,
    sortOrder,
  });

  // Get categories for filters
  const categoriesResult = await getCategories({
    organizationId: session.user.organizationId,
    limit: 100, // Get all categories
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Completed Forecasts</h1>
        <p className="text-muted-foreground mt-2">
          Past forecasts that have reached their due date
        </p>
      </div>

      <ForecastsTable
        forecasts={result.forecasts}
        pagination={{
          page: result.page,
          pageSize: result.limit,
          totalItems: result.total,
          totalPages: result.totalPages,
          hasNextPage: result.page < result.totalPages,
          hasPreviousPage: result.page > 1,
        }}
        categories={categoriesResult.categories}
        currentPath={Router.USER_FORECASTS_COMPLETED}
        emptyMessage="No completed forecasts"
        emptyDescription="Past forecasts will appear here after their due date."
      />
    </div>
  );
}
