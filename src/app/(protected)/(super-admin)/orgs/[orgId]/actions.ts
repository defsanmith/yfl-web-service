"use server";

import Router from "@/constants/router";
import { Role } from "@/generated/prisma";
import { requireRole } from "@/lib/guards";
import {
  ActionState,
  createErrorState,
  extractFormData,
  formDataToString,
  validateFormData,
} from "@/lib/server-action-utils";
import { updateOrganizationSchema } from "@/schemas/organizations";
import { createUserSchema, updateUserSchema } from "@/schemas/users";
import {
  updateOrganization,
  validateOrganizationUpdate,
} from "@/services/organizations";
import {
  createUser,
  updateUser,
  validateUserCreation,
  validateUserUpdate,
} from "@/services/users";
import { revalidatePath } from "next/cache";

// Type definitions for form data
type CreateUserFormData = {
  name: string;
  email: string;
  role: Role;
  organizationId: string;
};

type UpdateUserFormData = {
  name?: string;
  role?: Role;
};

type UpdateOrganizationFormData = {
  name?: string;
  description?: string | null;
};

/**
 * Create a new user in the organization
 */
export async function createUserAction(
  prevState: ActionState<CreateUserFormData> | undefined,
  formData: FormData
): Promise<ActionState<CreateUserFormData>> {
  // 1. Verify permissions
  await requireRole([Role.SUPER_ADMIN]);

  // 2. Extract form data
  const rawData = extractFormData(formData, [
    "name",
    "email",
    "role",
    "organizationId",
  ]);

  // 3. Validate schema
  const validation = validateFormData(createUserSchema, rawData);
  if (!validation.success) {
    return createErrorState(validation.errors, {
      name: formDataToString(rawData.name),
      email: formDataToString(rawData.email),
      role: formDataToString(rawData.role) as Role,
      organizationId: formDataToString(rawData.organizationId),
    });
  }

  // 4. Validate business rules
  const businessValidation = await validateUserCreation(validation.data);
  if (!businessValidation.valid) {
    return createErrorState(businessValidation.errors, validation.data);
  }

  // 5. Perform operation
  await createUser(validation.data);

  // 6. Revalidate cache
  revalidatePath(Router.organizationDetail(validation.data.organizationId));

  // 7. Return success state
  return {
    success: true,
    errors: {},
    data: validation.data,
  };
}

/**
 * Update an existing user
 */
export async function updateUserAction(
  userId: string,
  prevState: ActionState<UpdateUserFormData> | undefined,
  formData: FormData
): Promise<ActionState<UpdateUserFormData>> {
  // 1. Verify permissions
  await requireRole([Role.SUPER_ADMIN]);

  // 2. Extract form data
  const rawData = extractFormData(formData, ["name", "role"]);

  // 3. Validate schema
  const validation = validateFormData(updateUserSchema, rawData);
  if (!validation.success) {
    return createErrorState(validation.errors, {
      name: formDataToString(rawData.name),
      role: formDataToString(rawData.role) as Role | undefined,
    });
  }

  // 4. Validate business rules
  const businessValidation = await validateUserUpdate(userId, validation.data);
  if (!businessValidation.valid) {
    return createErrorState(businessValidation.errors, validation.data);
  }

  // 5. Perform operation
  const user = await updateUser(userId, validation.data);

  // 6. Revalidate cache
  if (user.organizationId) {
    revalidatePath(Router.organizationDetail(user.organizationId));
  }

  // 7. Return success state
  return {
    success: true,
    errors: {},
    data: validation.data,
  };
}

/**
 * Update organization details
 */
export async function updateOrganizationAction(
  orgId: string,
  prevState: ActionState<UpdateOrganizationFormData> | undefined,
  formData: FormData
): Promise<ActionState<UpdateOrganizationFormData>> {
  // 1. Verify permissions
  await requireRole([Role.SUPER_ADMIN]);

  // 2. Extract form data
  const rawData = extractFormData(formData, ["name", "description"]);

  // 3. Validate schema
  const validation = validateFormData(updateOrganizationSchema, rawData);
  if (!validation.success) {
    return createErrorState(validation.errors, {
      name: formDataToString(rawData.name),
      description: formDataToString(rawData.description) || null,
    });
  }

  // 4. Validate business rules
  const businessValidation = await validateOrganizationUpdate(
    orgId,
    validation.data
  );
  if (!businessValidation.valid) {
    return createErrorState(businessValidation.errors, validation.data);
  }

  // 5. Perform operation
  await updateOrganization(orgId, validation.data);

  // 6. Revalidate cache
  revalidatePath(Router.organizationDetail(orgId));
  revalidatePath(Router.ORGANIZATIONS);

  // 7. Return success state
  return {
    success: true,
    errors: {},
    data: validation.data,
  };
}

/**
 * Delete a user from any organization (super admin only)
 */
export async function deleteUserAction(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Verify permissions
    await requireRole([Role.SUPER_ADMIN]);

    // 2. Get the user to find their organization for cache revalidation
    const { getUserById, deleteUser } = await import("@/services/users");
    const existingUser = await getUserById(userId);

    if (!existingUser) {
      return {
        success: false,
        error: "User not found",
      };
    }

    // 3. Delete the user
    await deleteUser(userId);

    // 4. Revalidate cache
    if (existingUser.organizationId) {
      revalidatePath(Router.organizationDetail(existingUser.organizationId));
    }

    return { success: true };
  } catch (error) {
    console.error("Delete user error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An error occurred while deleting the user",
    };
  }
}
