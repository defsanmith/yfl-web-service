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
  releaseDate: string;
  options: string[];
};

export async function createForecastAction(
  orgId: string,
  prevState: ActionState<ForecastFormData> | undefined,
  formData: FormData
): Promise<ActionState<ForecastFormData>> {
  // 1. Verify permissions (super admin or org admin)
  await requireRole([Role.SUPER_ADMIN, Role.ORG_ADMIN]);

  // 2. Extract form data
  const rawData = extractFormData(formData, [
    "title",
    "description",
    "type",
    "dueDate",
    "releaseDate",
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
      releaseDate: formDataToString(rawData.releaseDate),
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
      releaseDate: validation.data.releaseDate,
      options: validation.data.options || [],
    });
  }

  // 5. Perform operation
  const forecast = await createForecast(validation.data);

  // 6. Revalidate cache
  revalidatePath(Router.organizationForecasts(orgId));

  // 7. Redirect (throws NEXT_REDIRECT - this is normal!)
  redirect(Router.forecastDetail(orgId, forecast.id));
}
