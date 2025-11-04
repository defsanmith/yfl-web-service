import { z } from "zod";

/**
 * Schema for creating a forecast category
 */
export const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional()
    .nullable(),
  color: z
    .string()
    .regex(
      /^#[0-9A-F]{6}$/i,
      "Color must be a valid hex color code (e.g., #FF5733)"
    )
    .optional()
    .nullable(),
  organizationId: z.string().cuid("Invalid organization ID"),
});

/**
 * Schema for updating a forecast category
 */
export const updateCategorySchema = z.object({
  id: z.string().cuid("Invalid category ID"),
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional()
    .nullable(),
  color: z
    .string()
    .regex(
      /^#[0-9A-F]{6}$/i,
      "Color must be a valid hex color code (e.g., #FF5733)"
    )
    .optional()
    .nullable(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
