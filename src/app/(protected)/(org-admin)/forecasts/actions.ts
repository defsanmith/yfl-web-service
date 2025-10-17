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
import { createForecastSchema } from "@/schemas/forecasts";
import { createForecast, validateForecastCreation } from "@/services/forecasts";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type ForecastFormData = {
  title: string;
  description: string | null;
  type: string;
  dueDate: string;
  options: string[];
};

export async function createForecastAction(
  prevState: ActionState<ForecastFormData> | undefined,
  formData: FormData
): Promise<ActionState<ForecastFormData>> {
  // 1. Verify permissions and get org admin's organization
  const session = await requireRole([Role.ORG_ADMIN]);

  // Org admins must have an organizationId
  if (!session.user.organizationId) {
    return createErrorState({
      _form: ["Organization not found for your account"],
    });
  }

  const orgId = session.user.organizationId;

  // 2. Extract form data
  const rawData = extractFormData(formData, [
    "title",
    "description",
    "type",
    "dueDate",
  ]);

  // Handle options array for categorical forecasts
  const optionsData = formData.getAll("options");
  const options =
    optionsData.length > 0
      ? optionsData.map((opt) => opt.toString()).filter((opt) => opt.trim())
      : undefined;

  const dataToValidate = {
    ...rawData,
    organizationId: orgId,
    options,
  };

  // 3. Validate schema
  const validation = validateFormData(createForecastSchema, dataToValidate);
  if (!validation.success) {
    return createErrorState(validation.errors, {
      title: formDataToString(rawData.title),
      description: formDataToString(rawData.description) || null,
      type: formDataToString(rawData.type),
      dueDate: formDataToString(rawData.dueDate),
      options: options || [],
    });
  }

  // 4. Validate business rules
  const businessValidation = await validateForecastCreation(validation.data);
  if (!businessValidation.valid) {
    return createErrorState(businessValidation.errors, {
      title: validation.data.title,
      description: validation.data.description || null,
      type: validation.data.type,
      dueDate: validation.data.dueDate,
      options: validation.data.options || [],
    });
  }

  // 5. Perform operation
  const forecast = await createForecast(validation.data);

  // 6. Revalidate cache
  revalidatePath(Router.ORG_ADMIN_FORECASTS);

  // 7. Redirect (throws NEXT_REDIRECT - this is normal!)
  redirect(Router.orgAdminForecastDetail(forecast.id));
}
