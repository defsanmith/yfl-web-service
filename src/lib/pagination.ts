/**
 * Reusable pagination utilities for any entity
 */

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

/**
 * Pagination result wrapper
 */
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

/**
 * Calculate pagination metadata
 *
 * @param totalItems - Total number of items
 * @param page - Current page number (1-indexed)
 * @param pageSize - Number of items per page
 * @returns Pagination metadata
 */
export function calculatePagination(
  totalItems: number,
  page: number,
  pageSize: number
) {
  const totalPages = Math.ceil(totalItems / pageSize);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  return {
    page,
    pageSize,
    totalItems,
    totalPages,
    hasNextPage,
    hasPreviousPage,
  };
}

/**
 * Get skip and take values for Prisma queries
 *
 * @param page - Current page number (1-indexed)
 * @param pageSize - Number of items per page
 * @returns Object with skip and take values
 */
export function getPaginationValues(page: number, pageSize: number) {
  return {
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}

/**
 * Validate and normalize pagination parameters
 *
 * @param params - Raw pagination parameters
 * @param defaults - Default values
 * @returns Validated pagination parameters
 */
export function validatePaginationParams(
  params: PaginationParams,
  defaults: { page: number; pageSize: number } = { page: 1, pageSize: 10 }
): { page: number; pageSize: number } {
  const page = Math.max(1, params.page || defaults.page);
  const pageSize = Math.min(
    100,
    Math.max(1, params.pageSize || defaults.pageSize)
  );

  return { page, pageSize };
}

/**
 * Create URL search params for pagination
 *
 * @param page - Page number
 * @param pageSize - Page size
 * @param additionalParams - Additional search params
 * @returns URLSearchParams object
 */
export function createPaginationSearchParams(
  page: number,
  pageSize: number,
  additionalParams?: Record<string, string>
): URLSearchParams {
  const params = new URLSearchParams();

  if (page > 1) {
    params.set("page", page.toString());
  }

  if (pageSize !== 10) {
    params.set("pageSize", pageSize.toString());
  }

  if (additionalParams) {
    Object.entries(additionalParams).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });
  }

  return params;
}
