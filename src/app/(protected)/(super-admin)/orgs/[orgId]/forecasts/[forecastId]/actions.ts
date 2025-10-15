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
import { updateForecastSchema } from "@/schemas/forecasts";
import {
  deleteForecast,
  updateForecast,
  validateForecastUpdate,
} from "@/services/forecasts";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type ForecastFormData = {
  title: string;
  description: string | null;
  type: string;
  dueDate: string;
  options: string[];
};

export async function updateForecastAction(
  orgId: string,
  forecastId: string,
  prevState: ActionState<ForecastFormData> | undefined,
  formData: FormData
): Promise<ActionState<ForecastFormData>> {
  // 1. Verify permissions
  await requireRole([Role.SUPER_ADMIN, Role.ORG_ADMIN]);

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
    id: forecastId,
    ...rawData,
    options,
  };

  // 3. Validate schema
  const validation = validateFormData(updateForecastSchema, dataToValidate);
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
  const businessValidation = await validateForecastUpdate(validation.data);
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
  await updateForecast(validation.data);

  // 6. Revalidate cache
  revalidatePath(Router.forecastDetail(orgId, forecastId));
  revalidatePath(Router.organizationForecasts(orgId));

  // 7. Redirect
  redirect(Router.forecastDetail(orgId, forecastId));
}

export async function deleteForecastAction(
  orgId: string,
  forecastId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Verify permissions
    await requireRole([Role.SUPER_ADMIN, Role.ORG_ADMIN]);

    // 2. Delete forecast
    await deleteForecast(forecastId);

    // 3. Revalidate cache
    revalidatePath(Router.organizationForecasts(orgId));

    // 4. Redirect
    redirect(Router.organizationForecasts(orgId));
  } catch (error) {
    console.error("Error deleting forecast:", error);
    return { success: false, error: "Failed to delete forecast" };
  }
}
