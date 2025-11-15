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
import {
  bulkUserRowSchema,
  createUserSchema,
  updateUserSchema,
} from "@/schemas/users";
import {
  bulkCreateUsers,
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
 * Bulk upload users from CSV data
 */
export async function bulkUploadUsersAction(
  prevState:
    | {
        success?: boolean;
        errors?: Record<string, string[]>;
        results?: {
          successful: Array<{
            row: number;
            user: { name: string; email: string };
          }>;
          failed: Array<{ row: number; email: string; errors: string[] }>;
          summary: { total: number; successful: number; failed: number };
        };
      }
    | undefined,
  formData: FormData
): Promise<{
  success: boolean;
  errors?: Record<string, string[]>;
  results?: {
    successful: Array<{ row: number; user: { name: string; email: string } }>;
    failed: Array<{ row: number; email: string; errors: string[] }>;
    summary: { total: number; successful: number; failed: number };
  };
}> {
  // 1. Verify permissions and get org admin's organization
  const session = await requireOrgAdmin();
  const orgId = session.user.organizationId!;

  // 2. Get CSV file from form data
  const file = formData.get("csvFile") as File | null;

  if (!file) {
    return {
      success: false,
      errors: { _form: ["No file provided"] },
    };
  }

  if (!file.name.endsWith(".csv")) {
    return {
      success: false,
      errors: { _form: ["File must be a CSV file"] },
    };
  }

  try {
    // 3. Read and parse CSV file
    const text = await file.text();
    const lines = text.split("\n").filter((line) => line.trim() !== "");

    if (lines.length < 2) {
      return {
        success: false,
        errors: {
          _form: ["CSV file must contain a header row and at least one user"],
        },
      };
    }

    // Parse header
    const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const nameIndex = header.indexOf("name");
    const emailIndex = header.indexOf("email");
    const roleIndex = header.indexOf("role");

    if (nameIndex === -1 || emailIndex === -1 || roleIndex === -1) {
      return {
        success: false,
        errors: {
          _form: [
            "CSV must contain 'name', 'email', and 'role' columns in the header",
          ],
        },
      };
    }

    // Parse data rows
    const users: Array<{ name: string; email: string; role: string }> = [];
    const parseErrors: Array<{ row: number; errors: string[] }> = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const values = line.split(",").map((v) => v.trim());

      // Skip empty rows
      if (values.every((v) => !v)) continue;

      const rowNumber = i + 1; // 1-indexed including header

      const name = values[nameIndex] || "";
      const email = values[emailIndex] || "";
      const role = values[roleIndex] || "";

      // Validate row using Zod schema
      const validation = bulkUserRowSchema.safeParse({ name, email, role });

      if (!validation.success) {
        const errors = validation.error.issues.map((e) => e.message);
        parseErrors.push({ row: rowNumber, errors });
        continue;
      }

      users.push(validation.data);
    }

    if (parseErrors.length > 0) {
      return {
        success: false,
        errors: {
          _form: [
            `CSV contains ${parseErrors.length} invalid row(s). Please fix the errors and try again.`,
          ],
          parseErrors: parseErrors.map(
            (e) => `Row ${e.row}: ${e.errors.join(", ")}`
          ),
        },
      };
    }

    if (users.length === 0) {
      return {
        success: false,
        errors: { _form: ["No valid users found in CSV file"] },
      };
    }

    if (users.length > 100) {
      return {
        success: false,
        errors: { _form: ["Maximum 100 users can be uploaded at once"] },
      };
    }

    // 4. Bulk create users
    const results = await bulkCreateUsers(users, orgId);

    // 5. Revalidate cache
    revalidatePath(Router.ORG_ADMIN_USERS);

    // 6. Return results
    return {
      success: true,
      results,
    };
  } catch (error) {
    console.error("Bulk upload error:", error);
    return {
      success: false,
      errors: {
        _form: [
          error instanceof Error
            ? error.message
            : "An error occurred while processing the CSV file",
        ],
      },
    };
  }
}
