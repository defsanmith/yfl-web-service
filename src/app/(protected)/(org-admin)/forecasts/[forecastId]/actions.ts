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
  getForecastById,
  updateForecast,
  validateForecastUpdate,
} from "@/services/forecasts";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type ForecastFormData = {
  title: string;
  description: string | null;
  type: string;
  dataType: string | null;
  dueDate: string;
  dataReleaseDate: string | null;
  categoryId: string | null;
  options: string[];
};

export async function updateForecastAction(
  forecastId: string,
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

  // 2. Verify forecast belongs to org admin's organization
  const existingForecast = await getForecastById(forecastId);
  if (!existingForecast) {
    return createErrorState({
      _form: ["Forecast not found"],
    });
  }

  if (existingForecast.organizationId !== session.user.organizationId) {
    return createErrorState({
      _form: ["You do not have permission to update this forecast"],
    });
  }

  // 3. Extract form data
  const rawData = extractFormData(formData, [
    "title",
    "description",
    "type",
    "dataType",
    "dueDate",
    "dataReleaseDate",
    "categoryId",
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

  // 4. Validate schema
  const validation = validateFormData(updateForecastSchema, dataToValidate);
  if (!validation.success) {
    return createErrorState(validation.errors, {
      title: formDataToString(rawData.title),
      description: formDataToString(rawData.description) || null,
      type: formDataToString(rawData.type),
      dataType: formDataToString(rawData.dataType) || null,
      dueDate: formDataToString(rawData.dueDate),
      dataReleaseDate: formDataToString(rawData.dataReleaseDate) || null,
      categoryId: formDataToString(rawData.categoryId) || null,
      options: options || [],
    });
  }

  // 5. Validate business rules
  const businessValidation = await validateForecastUpdate(validation.data);
  if (!businessValidation.valid) {
    return createErrorState(businessValidation.errors, {
      title: validation.data.title,
      description: validation.data.description || null,
      type: validation.data.type,
      dataType: validation.data.dataType || null,
      dueDate: validation.data.dueDate,
      dataReleaseDate: validation.data.dataReleaseDate || null,
      categoryId: validation.data.categoryId || null,
      options: validation.data.options || [],
    });
  }

  // 6. Perform operation
  await updateForecast(validation.data);

  // 7. Revalidate cache
  revalidatePath(Router.orgAdminForecastDetail(forecastId));
  revalidatePath(Router.ORG_ADMIN_FORECASTS);

  // 8. Redirect
  redirect(Router.orgAdminForecastDetail(forecastId));
}

export async function deleteForecastAction(
  forecastId: string
): Promise<{ success: boolean; error?: string }> {
  // 1. Verify permissions and get org admin's organization
  const session = await requireRole([Role.ORG_ADMIN]);

  // Org admins must have an organizationId
  if (!session.user.organizationId) {
    return {
      success: false,
      error: "Organization not found for your account",
    };
  }

  // 2. Verify forecast belongs to org admin's organization
  const existingForecast = await getForecastById(forecastId);
  if (!existingForecast) {
    return { success: false, error: "Forecast not found" };
  }

  if (existingForecast.organizationId !== session.user.organizationId) {
    return {
      success: false,
      error: "You do not have permission to delete this forecast",
    };
  }

  // 3. Delete forecast
  await deleteForecast(forecastId);

  // 4. Revalidate cache
  revalidatePath(Router.ORG_ADMIN_FORECASTS);

  // 5. Redirect (throws NEXT_REDIRECT - this is normal!)
  redirect(Router.ORG_ADMIN_FORECASTS);
}
