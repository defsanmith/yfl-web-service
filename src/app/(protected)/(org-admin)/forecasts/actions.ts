"use server";

import Router from "@/constants/router";
import { Role } from "@/generated/prisma";
import { requireRole } from "@/lib/guards";
import prisma from "@/lib/prisma";
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

// Predefined categories mapping
const PREDEFINED_CATEGORIES: Record<string, { name: string; color: string }> = {
  "cat-movies": { name: "Movies", color: "#E11D48" },
  "cat-crypto": { name: "Crypto", color: "#F59E0B" },
  "cat-automobiles": { name: "Automobiles", color: "#3B82F6" },
  "cat-stock-market": { name: "Stock Market", color: "#10B981" },
  "cat-corp-earnings": { name: "Corp. Earnings", color: "#8B5CF6" },
};

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

  // Handle categoryId - convert 'none' to null
  const categoryIdValue = formDataToString(rawData.categoryId);
  const categoryId =
    categoryIdValue === "none" || !categoryIdValue ? null : categoryIdValue;

  const dataToValidate = {
    ...rawData,
    organizationId: orgId,
    categoryId,
    options,
  };

  // 3. Validate schema
  const validation = validateFormData(createForecastSchema, dataToValidate);
  if (!validation.success) {
    return createErrorState(validation.errors, {
      title: formDataToString(rawData.title),
      description: formDataToString(rawData.description) || null,
      type: formDataToString(rawData.type),
      dataType: formDataToString(rawData.dataType) || null,
      dueDate: formDataToString(rawData.dueDate),
      dataReleaseDate: formDataToString(rawData.dataReleaseDate) || null,
      categoryId,
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
      dataType: validation.data.dataType || null,
      dueDate: validation.data.dueDate,
      dataReleaseDate: validation.data.dataReleaseDate || null,
      categoryId: validation.data.categoryId || null,
      options: validation.data.options || [],
    });
  }

  // 5. Handle predefined categories - create them if they don't exist
  let finalCategoryId = validation.data.categoryId;
  if (finalCategoryId && PREDEFINED_CATEGORIES[finalCategoryId]) {
    const predefinedCategory = PREDEFINED_CATEGORIES[finalCategoryId];

    // Check if category already exists for this organization
    let category = await prisma.forecastCategory.findFirst({
      where: {
        organizationId: orgId,
        name: predefinedCategory.name,
      },
    });

    // Create it if it doesn't exist
    if (!category) {
      category = await prisma.forecastCategory.create({
        data: {
          name: predefinedCategory.name,
          color: predefinedCategory.color,
          organizationId: orgId,
        },
      });
    }

    // Use the actual database ID
    finalCategoryId = category.id;
  }

  // 6. Perform operation with the resolved category ID
  const forecast = await createForecast({
    ...validation.data,
    categoryId: finalCategoryId,
  });

  // 7. Revalidate cache
  revalidatePath(Router.ORG_ADMIN_FORECASTS);

  // 8. Redirect (throws NEXT_REDIRECT - this is normal!)
  redirect(Router.orgAdminForecastDetail(forecast.id));
}

/**
 * Delete a forecast from the org admin's organization
 */
export async function deleteForecastAction(forecastId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  // 1. Verify permissions and get org admin's organization
  const session = await requireRole([Role.ORG_ADMIN]);

  // Org admins must have an organizationId
  if (!session.user.organizationId) {
    return {
      success: false,
      error: "Organization not found for your account",
    };
  }

  const orgId = session.user.organizationId;

  // 2. Verify the forecast belongs to the org admin's organization
  const { getForecastById, deleteForecast } = await import(
    "@/services/forecasts"
  );
  const existingForecast = await getForecastById(forecastId);

  if (!existingForecast || existingForecast.organizationId !== orgId) {
    return {
      success: false,
      error: "You can only delete forecasts in your own organization",
    };
  }

  try {
    // 3. Delete the forecast (cascades to predictions via Prisma schema)
    await deleteForecast(forecastId);

    // 4. Revalidate cache
    revalidatePath(Router.ORG_ADMIN_FORECASTS);

    return { success: true };
  } catch (error) {
    console.error("Delete forecast error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An error occurred while deleting the forecast",
    };
  }
}
