"use server";

import Router from "@/constants/router";
import { Role } from "@/generated/prisma";
import { requireOrgAdmin } from "@/lib/guards";
import {
  ActionState,
  createErrorState,
  extractFormData,
  formDataToString,
  validateFormData,
} from "@/lib/server-action-utils";
import { createUserSchema, updateUserSchema } from "@/schemas/users";
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

/**
 * Create a new user in the org admin's organization
 */
export async function createUserAction(
  prevState: ActionState<CreateUserFormData> | undefined,
  formData: FormData
): Promise<ActionState<CreateUserFormData>> {
  // 1. Verify permissions and get org admin's organization
  const session = await requireOrgAdmin();
  const orgId = session.user.organizationId!;

  // 2. Extract form data
  const rawData = extractFormData(formData, [
    "name",
    "email",
    "role",
    "organizationId",
  ]);

  // 3. Verify the organizationId matches the org admin's organization
  const submittedOrgId = formDataToString(rawData.organizationId);
  if (submittedOrgId !== orgId) {
    return createErrorState(
      {
        _form: ["You can only create users in your own organization"],
      },
      {
        name: formDataToString(rawData.name),
        email: formDataToString(rawData.email),
        role: formDataToString(rawData.role) as Role,
        organizationId: submittedOrgId,
      }
    );
  }

  // 4. Validate schema
  const validation = validateFormData(createUserSchema, rawData);
  if (!validation.success) {
    return createErrorState(validation.errors, {
      name: formDataToString(rawData.name),
      email: formDataToString(rawData.email),
      role: formDataToString(rawData.role) as Role,
      organizationId: formDataToString(rawData.organizationId),
    });
  }

  // 5. Validate business rules
  const businessValidation = await validateUserCreation(validation.data);
  if (!businessValidation.valid) {
    return createErrorState(businessValidation.errors, validation.data);
  }

  // 6. Perform operation
  await createUser(validation.data);

  // 7. Revalidate cache
  revalidatePath(Router.ORG_ADMIN_USERS);

  // 8. Return success state
  return {
    success: true,
    errors: {},
    data: validation.data,
  };
}

/**
 * Update an existing user in the org admin's organization
 */
export async function updateUserAction(
  userId: string,
  prevState: ActionState<UpdateUserFormData> | undefined,
  formData: FormData
): Promise<ActionState<UpdateUserFormData>> {
  // 1. Verify permissions and get org admin's organization
  const session = await requireOrgAdmin();
  const orgId = session.user.organizationId!;

  // 2. Verify the user belongs to the org admin's organization
  // This is done in the service layer, but we add an extra check here
  const { getUserById } = await import("@/services/users");
  const existingUser = await getUserById(userId);

  if (!existingUser || existingUser.organizationId !== orgId) {
    return createErrorState(
      {
        _form: ["You can only update users in your own organization"],
      },
      {}
    );
  }

  // 3. Extract form data
  const rawData = extractFormData(formData, ["name", "role"]);

  // 4. Validate schema
  const validation = validateFormData(updateUserSchema, rawData);
  if (!validation.success) {
    return createErrorState(validation.errors, {
      name: formDataToString(rawData.name),
      role: formDataToString(rawData.role) as Role | undefined,
    });
  }

  // 5. Validate business rules
  const businessValidation = await validateUserUpdate(userId, validation.data);
  if (!businessValidation.valid) {
    return createErrorState(businessValidation.errors, validation.data);
  }

  // 6. Perform operation
  await updateUser(userId, validation.data);

  // 7. Revalidate cache
  revalidatePath(Router.ORG_ADMIN_USERS);

  // 8. Return success state
  return {
    success: true,
    errors: {},
    data: validation.data,
  };
}

/**
 * Delete a user from the org admin's organization
 */
export async function deleteUserAction(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Verify permissions and get org admin's organization
    const session = await requireOrgAdmin();
    const orgId = session.user.organizationId!;

    // 2. Verify the user belongs to the org admin's organization
    const { getUserById, deleteUser } = await import("@/services/users");
    const existingUser = await getUserById(userId);

    if (!existingUser || existingUser.organizationId !== orgId) {
      return {
        success: false,
        error: "You can only delete users in your own organization",
      };
    }

    // 3. Prevent deleting yourself
    if (existingUser.id === session.user.id) {
      return {
        success: false,
        error: "You cannot delete your own account",
      };
    }

    // 4. Delete the user
    await deleteUser(userId);

    // 5. Revalidate cache
    revalidatePath(Router.ORG_ADMIN_USERS);

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
