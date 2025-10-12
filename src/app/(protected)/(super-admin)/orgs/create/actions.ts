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
import { createOrganizationSchema } from "@/schemas/organizations";
import {
  createOrganization,
  validateOrganizationCreation,
} from "@/services/organizations";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type OrganizationFormData = {
  name: string;
  description: string | null;
};

/**
 * Server action to create a new organization
 *
 * This action:
 * 1. Validates user has SUPER_ADMIN role
 * 2. Extracts and validates form data
 * 3. Checks business rules (name uniqueness)
 * 4. Creates organization in database
 * 5. Revalidates cache and redirects to detail page
 *
 * @param prevState - Previous action state (unused, required by useActionState)
 * @param formData - Form data containing name and description
 * @returns Action state with success/error status and preserved data
 *
 * @example
 * ```typescript
 * // In a client component
 * const [state, formAction, isPending] = useActionState(
 *   createOrganizationAction,
 *   undefined
 * );
 *
 * return (
 *   <form action={formAction}>
 *     <input name="name" defaultValue={state?.data?.name} />
 *     {state?.errors?.name && <p>{state.errors.name.join(", ")}</p>}
 *     <button disabled={isPending}>Create</button>
 *   </form>
 * );
 * ```
 */
export async function createOrganizationAction(
  prevState: ActionState<OrganizationFormData> | undefined,
  formData: FormData
): Promise<ActionState<OrganizationFormData>> {
  // 1. Verify user is SUPER_ADMIN
  await requireRole([Role.SUPER_ADMIN]);

  // 2. Extract form data
  const rawData = extractFormData(formData, ["name", "description"]);

  // 3. Validate with schema
  const validation = validateFormData(createOrganizationSchema, rawData);

  if (!validation.success) {
    return createErrorState(validation.errors, {
      name: formDataToString(rawData.name),
      description: formDataToString(rawData.description) || null,
    });
  }

  // 4. Validate business rules
  const businessValidation = await validateOrganizationCreation(
    validation.data
  );

  if (!businessValidation.valid) {
    return createErrorState(businessValidation.errors, {
      name: validation.data.name,
      description: validation.data.description || null,
    });
  }

  // 5. Create organization
  const organization = await createOrganization(validation.data);

  // 6. Revalidate cache
  revalidatePath(Router.ORGANIZATIONS);

  // 7. Redirect to detail page (throws NEXT_REDIRECT)
  redirect(Router.organizationDetail(organization.id));
}
