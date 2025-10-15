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
