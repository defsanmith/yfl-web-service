/**
 * User service - handles all user-related database operations
 */
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

/**
 * Get user with organization ID only (for dashboard pages)
 *
 * @param id - User ID
 * @returns User with organizationId, name, and email or null
 *
 * @example
 * ```typescript
 * // In a dashboard page
 * const user = await getUserWithOrganization(userId);
 * const orgId = user?.organizationId ?? null;
 * ```
 */
export async function getUserWithOrganization(id: string) {
  return await prisma.user.findUnique({
    where: { id },
    select: {
      organizationId: true,
      name: true,
      email: true,
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
 * Delete a user
 *
 * @param id - User ID to delete
 * @returns The deleted user
 *
 * @throws {Error} If database operation fails
 *
 * @example
 * ```typescript
 * // In a server action
 * await deleteUser(userId);
 * ```
 */
export async function deleteUser(id: string) {
  return await prisma.user.delete({
    where: { id },
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
  _id: string,
  _data: UpdateUserInput
): Promise<
  { valid: true } | { valid: false; errors: Record<string, string[]> }
> {
  // No additional business rules for now
  // Email cannot be updated, so no need to check uniqueness
  return { valid: true };
}
