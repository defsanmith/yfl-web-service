import { z } from "zod";

/**
 * Common reusable schemas
 */

/**
 * Pagination parameters schema
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

/**
 * Search parameters schema
 */
export const searchSchema = z.object({
  query: z.string().optional(),
  field: z.string().optional(),
});

export type SearchInput = z.infer<typeof searchSchema>;

/**
 * Combined pagination and search schema
 */
export const paginatedSearchSchema = paginationSchema.merge(searchSchema);

export type PaginatedSearchInput = z.infer<typeof paginatedSearchSchema>;
