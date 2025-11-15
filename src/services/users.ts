/**
 * User service - handles all user-related database operations
 */
import { Role } from "@/generated/prisma";
import prisma from "@/lib/prisma";
import { CreateUserInput, UpdateUserInput } from "@/schemas/users";

export async function getUsers() {
  return await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function getUserById(id: string) {
  return await prisma.user.findUnique({
    where: { id },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

export async function getUserByEmail(email: string) {
  return await prisma.user.findUnique({
    where: { email },
  });
}

/**
 * Create a new user
 *
 * @param data - User data to create
 * @returns The created user
 *
 * @throws {Error} If database operation fails
 *
 * @example
 * ```typescript
 * // In a server action
 * const user = await createUser({
 *   name: "John Doe",
 *   email: "john@example.com",
 *   role: "USER",
 *   organizationId: "org123"
 * });
 * ```
 */
export async function createUser(data: CreateUserInput) {
  return await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      role: data.role,
      organizationId: data.organizationId,
    },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

/**
 * Update an existing user
 *
 * @param id - User ID to update
 * @param data - User data to update
 * @returns The updated user
 *
 * @throws {Error} If database operation fails
 *
 * @example
 * ```typescript
 * // In a server action
 * const user = await updateUser(userId, {
 *   name: "Updated Name",
 *   role: "ORG_ADMIN"
 * });
 * ```
 */
export async function updateUser(id: string, data: UpdateUserInput) {
  return await prisma.user.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.role && { role: data.role }),
      ...(data.organizationId !== undefined && {
        organizationId: data.organizationId,
      }),
    },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

/**
 * Check if user email already exists (case-insensitive)
 *
 * @param email - Email to check
 * @param excludeId - Optional user ID to exclude from check (for updates)
 * @returns True if email exists, false otherwise
 *
 * @example
 * ```typescript
 * // Before creating a new user
 * const exists = await userEmailExists("john@example.com");
 * if (exists) {
 *   return createErrorState({ email: ["Email already exists"] });
 * }
 * ```
 */
export async function userEmailExists(email: string, excludeId?: string) {
  const user = await prisma.user.findFirst({
    where: {
      email: {
        equals: email,
        mode: "insensitive",
      },
      ...(excludeId && { id: { not: excludeId } }),
    },
  });
  return !!user;
}

/**
 * Validate user creation business rules
 *
 * Checks:
 * - Email uniqueness
 *
 * @param data - User data to validate
 * @returns Validation result with field errors if any
 *
 * @example
 * ```typescript
 * // In a server action after schema validation
 * const businessValidation = await validateUserCreation(data);
 * if (!businessValidation.valid) {
 *   return createErrorState(businessValidation.errors, data);
 * }
 * ```
 */
export async function validateUserCreation(
  data: CreateUserInput
): Promise<
  { valid: true } | { valid: false; errors: Record<string, string[]> }
> {
  const emailExists = await userEmailExists(data.email);

  if (emailExists) {
    return {
      valid: false,
      errors: {
        email: ["A user with this email already exists"],
      },
    };
  }

  return { valid: true };
}

/**
 * Validate user update business rules
 *
 * Currently no additional business rules beyond schema validation
 *
 * @param id - User ID being updated
 * @param data - User data to validate
 * @returns Validation result with field errors if any
 */
export async function validateUserUpdate(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _id: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _data: UpdateUserInput
): Promise<
  { valid: true } | { valid: false; errors: Record<string, string[]> }
> {
  // No additional business rules for now
  // Email cannot be updated, so no need to check uniqueness
  return { valid: true };
}

/**
 * Create multiple users in bulk
 *
 * @param users - Array of user data to create
 * @param organizationId - Organization ID to assign all users to
 * @returns Object with successful users, failed users with errors, and summary
 *
 * @example
 * ```typescript
 * const result = await bulkCreateUsers(
 *   [
 *     { name: "John Doe", email: "john@example.com", role: "USER" },
 *     { name: "Jane Smith", email: "jane@example.com", role: "ORG_ADMIN" }
 *   ],
 *   "org123"
 * );
 * ```
 */
export async function bulkCreateUsers(
  users: Array<{ name: string; email: string; role: string }>,
  organizationId: string
): Promise<{
  successful: Array<{ row: number; user: { name: string; email: string } }>;
  failed: Array<{ row: number; email: string; errors: string[] }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}> {
  const successful: Array<{
    row: number;
    user: { name: string; email: string };
  }> = [];
  const failed: Array<{ row: number; email: string; errors: string[] }> = [];

  for (let i = 0; i < users.length; i++) {
    const userData = users[i];
    const rowNumber = i + 1; // 1-indexed for user display

    try {
      // Check if email already exists
      const emailExists = await userEmailExists(userData.email);
      if (emailExists) {
        failed.push({
          row: rowNumber,
          email: userData.email,
          errors: ["Email already exists"],
        });
        continue;
      }

      // Create the user
      const createdUser = await prisma.user.create({
        data: {
          name: userData.name,
          email: userData.email,
          role: userData.role as Role,
          organizationId,
        },
        select: {
          name: true,
          email: true,
        },
      });

      successful.push({
        row: rowNumber,
        user: {
          name: createdUser.name!,
          email: createdUser.email,
        },
      });
    } catch (error) {
      failed.push({
        row: rowNumber,
        email: userData.email,
        errors: [
          error instanceof Error ? error.message : "Unknown error occurred",
        ],
      });
    }
  }

  return {
    successful,
    failed,
    summary: {
      total: users.length,
      successful: successful.length,
      failed: failed.length,
    },
  };
}
