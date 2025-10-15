import { z } from "zod";

/**
 * Schema for creating a new organization
 */
export const createOrganizationSchema = z.object({
  name: z
    .string()
    .min(2, "Organization name must be at least 2 characters")
    .max(100, "Organization name must not exceed 100 characters"),
  description: z
    .string()
    .max(500, "Description must not exceed 500 characters")
    .optional()
    .or(z.literal(""))
    .transform((val) => (val === "" ? undefined : val))
    .pipe(
      z
        .string()
        .min(10, "Description must be at least 10 characters when provided")
        .optional()
    ),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;

/**
 * Schema for updating an existing organization
 */
export const updateOrganizationSchema = z.object({
  name: z
    .string()
    .min(2, "Organization name must be at least 2 characters")
    .max(100, "Organization name must not exceed 100 characters")
    .optional(),
  description: z
    .string()
    .max(500, "Description must not exceed 500 characters")
    .optional()
    .or(z.literal(""))
    .transform((val) => (val === "" ? undefined : val))
    .pipe(
      z
        .string()
        .min(10, "Description must be at least 10 characters when provided")
        .optional()
    ),
});

export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
