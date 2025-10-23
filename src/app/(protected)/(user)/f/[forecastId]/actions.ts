"use server";

import { auth } from "@/auth";
import Router from "@/constants/router";
import { ForecastType } from "@/generated/prisma";
import {
  ActionState,
  createErrorState,
  extractFormData,
  formDataToString,
  validateFormData,
} from "@/lib/server-action-utils";
import {
  createPredictionSchema,
  updatePredictionSchema,
} from "@/schemas/predictions";
import {
  createPrediction,
  updatePrediction,
  validatePredictionCreation,
  validatePredictionUpdate,
} from "@/services/predictions";
import { revalidatePath } from "next/cache";

type PredictionFormData = {
  value: string;
  confidence: string;
  reasoning: string | null;
};

export async function createPredictionAction(
  forecastId: string,
  forecastType: ForecastType,
  prevState: ActionState<PredictionFormData> | undefined,
  formData: FormData
): Promise<ActionState<PredictionFormData>> {
  // 1. Verify authentication
  const session = await auth();
  if (!session?.user?.id) {
    return createErrorState({
      _form: ["You must be logged in to submit a prediction"],
    });
  }

  // 2. Extract form data
  const rawData = extractFormData(formData, [
    "value",
    "confidence",
    "reasoning",
  ]);

  // 3. Validate schema
  const validation = validateFormData(createPredictionSchema, {
    forecastId,
    forecastType,
    value: formDataToString(rawData.value),
    confidence: rawData.confidence
      ? formDataToString(rawData.confidence)
      : undefined,
    reasoning: rawData.reasoning
      ? formDataToString(rawData.reasoning)
      : undefined,
  });

  if (!validation.success) {
    return createErrorState(validation.errors, {
      value: formDataToString(rawData.value),
      confidence: formDataToString(rawData.confidence) || "",
      reasoning: formDataToString(rawData.reasoning) || null,
    });
  }

  // 4. Validate business rules
  const businessValidation = await validatePredictionCreation({
    ...validation.data,
    userId: session.user.id,
  });

  if (!businessValidation.valid) {
    return createErrorState(businessValidation.errors, {
      value: validation.data.value,
      confidence: validation.data.confidence?.toString() || "",
      reasoning: validation.data.reasoning || null,
    });
  }

  // 5. Create prediction
  await createPrediction({
    ...validation.data,
    userId: session.user.id,
  });

  // 6. Revalidate cache
  revalidatePath(Router.USER_FORECAST_DETAIL(forecastId));

  return { success: true };
}

export async function updatePredictionAction(
  predictionId: string,
  forecastId: string,
  forecastType: ForecastType,
  prevState: ActionState<PredictionFormData> | undefined,
  formData: FormData
): Promise<ActionState<PredictionFormData>> {
  // 1. Verify authentication
  const session = await auth();
  if (!session?.user?.id) {
    return createErrorState({
      _form: ["You must be logged in to update a prediction"],
    });
  }

  // 2. Extract form data
  const rawData = extractFormData(formData, [
    "value",
    "confidence",
    "reasoning",
  ]);

  // 3. Validate schema
  const validation = validateFormData(updatePredictionSchema, {
    id: predictionId,
    forecastType,
    value: formDataToString(rawData.value),
    confidence: rawData.confidence
      ? formDataToString(rawData.confidence)
      : undefined,
    reasoning: rawData.reasoning
      ? formDataToString(rawData.reasoning)
      : undefined,
  });

  if (!validation.success) {
    return createErrorState(validation.errors, {
      value: formDataToString(rawData.value),
      confidence: formDataToString(rawData.confidence) || "",
      reasoning: formDataToString(rawData.reasoning) || null,
    });
  }

  // 4. Validate business rules
  const businessValidation = await validatePredictionUpdate(validation.data);

  if (!businessValidation.valid) {
    return createErrorState(businessValidation.errors, {
      value: validation.data.value,
      confidence: validation.data.confidence?.toString() || "",
      reasoning: validation.data.reasoning || null,
    });
  }

  // 5. Update prediction
  await updatePrediction(validation.data);

  // 6. Revalidate cache
  revalidatePath(Router.USER_FORECAST_DETAIL(forecastId));

  return { success: true };
}
