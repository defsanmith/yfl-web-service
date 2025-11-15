import { Role } from "@/generated/prisma";
import { z } from "zod";

/**
 * Schema for creating a new user
 */
export const createUserSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters"),
  email: z
    .string()
    .email("Invalid email address")
    .max(255, "Email must not exceed 255 characters"),
  role: z.nativeEnum(Role, {
    message: "Invalid role selected",
  }),
  organizationId: z.string().cuid("Invalid organization ID"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

/**
 * Schema for updating an existing user
 */
export const updateUserSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters")
    .optional(),
  role: z
    .nativeEnum(Role, {
      message: "Invalid role selected",
    })
    .optional(),
  organizationId: z
    .string()
    .cuid("Invalid organization ID")
    .nullable()
    .optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

/**
 * Schema for a single user row in bulk CSV upload
 */
export const bulkUserRowSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters"),
  email: z
    .string()
    .email("Invalid email address")
    .max(255, "Email must not exceed 255 characters"),
  role: z
    .enum(["USER"], {
      message: "Role must be USER (ORG_ADMIN cannot be added in bulk)",
    })
    .transform((val) => val as Role),
});

export type BulkUserRow = z.infer<typeof bulkUserRowSchema>;

/**
 * Schema for validating bulk user upload CSV data
 */
export const bulkUserUploadSchema = z.object({
  users: z
    .array(bulkUserRowSchema)
    .min(1, "At least one user is required")
    .max(100, "Maximum 100 users can be uploaded at once"),
});

export type BulkUserUpload = z.infer<typeof bulkUserUploadSchema>;
