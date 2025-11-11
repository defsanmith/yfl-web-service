import prisma from "@/lib/prisma";
import type {
  CreatePredictionInput,
  UpdatePredictionInput,
} from "@/schemas/predictions";

/**
 * Get a prediction by ID
 */
export async function getPredictionById(id: string) {
  console.log("🔍 Fetching forecasts for:", { id});

  return await prisma.prediction.findUnique({
    where: { id },
    include: {
      forecast: {
        select: { id: true, title: true, type: true },
      },
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });
}

/**
 * Get a user's prediction for a specific forecast
 */
export async function getUserPredictionForForecast(
  userId: string,
  forecastId: string
) {
  return await prisma.prediction.findUnique({
    where: {
      forecastId_userId: {
        forecastId,
        userId,
      },
    },
    include: {
      forecast: {
        select: { id: true, title: true, type: true, dueDate: true },
      },
    },
  });
}

/**
 * Get all predictions for a forecast
 */
export async function getPredictionsForForecast(forecastId: string) {
  return await prisma.prediction.findMany({
    where: { forecastId },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * Get all predictions by a user
 */
export async function getUserPredictions(userId: string) {
  return await prisma.prediction.findMany({
    where: { userId },
    include: {
      forecast: {
        select: {
          id: true,
          title: true,
          type: true,
          dueDate: true,
          organization: {
            select: { id: true, name: true },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * Get leaderboard data for a forecast
 * Returns all predictions for a forecast with user information
 */
export async function getForecastLeaderboard(forecastId: string) {
  const predictions = await prisma.prediction.findMany({
    where: { forecastId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: [
      {
        confidence: "desc",
      },
      {
        createdAt: "asc",
      },
    ],
  });

  return predictions;
}

/**
 * Create a new prediction
 */
export async function createPrediction(
  data: CreatePredictionInput & { userId: string }
) {
  return await prisma.prediction.create({
    data: {
      forecastId: data.forecastId,
      userId: data.userId,
      value: data.value,
      confidence: data.confidence,
      reasoning: data.reasoning,
      method: data.method,
      estimatedTime: data.estimatedTime,
      equityInvestment: data.equityInvestment,
      debtFinancing: data.debtFinancing,
    },
    include: {
      forecast: {
        select: { id: true, title: true, type: true },
      },
    },
  });
}

/**
 * Update an existing prediction
 */
export async function updatePrediction(data: UpdatePredictionInput) {
  return await prisma.prediction.update({
    where: { id: data.id },
    data: {
      value: data.value,
      confidence: data.confidence,
      reasoning: data.reasoning,
      method: data.method,
      estimatedTime: data.estimatedTime,
      equityInvestment: data.equityInvestment,
      debtFinancing: data.debtFinancing,
    },
    include: {
      forecast: {
        select: { id: true, title: true, type: true },
      },
    },
  });
}

/**
 * Delete a prediction
 */
export async function deletePrediction(id: string) {
  return await prisma.prediction.delete({
    where: { id },
  });
}

/**
 * Validate prediction creation business rules
 */
export async function validatePredictionCreation(
  data: CreatePredictionInput & { userId: string }
): Promise<
  { valid: true } | { valid: false; errors: Record<string, string[]> }
> {
  const errors: Record<string, string[]> = {};

  // Check if user already has a prediction for this forecast
  const existingPrediction = await getUserPredictionForForecast(
    data.userId,
    data.forecastId
  );
  if (existingPrediction) {
    errors._form = [
      "You have already submitted a prediction for this forecast. Please update your existing prediction instead.",
    ];
  }

  // Get the forecast to validate due date
  const forecast = await prisma.forecast.findUnique({
    where: { id: data.forecastId },
  });

  if (!forecast) {
    errors._form = ["Forecast not found"];
    return { valid: false, errors };
  }

  // Check if forecast is still open (due date hasn't passed)
  if (new Date(forecast.dueDate) <= new Date()) {
    errors._form = [
      "This forecast has already closed. Predictions can no longer be submitted.",
    ];
  }

  // For categorical forecasts, validate the value is one of the options
  if (
    data.forecastType === "CATEGORICAL" &&
    forecast.options &&
    Array.isArray(forecast.options)
  ) {
    const options = forecast.options as string[];
    if (!options.includes(data.value)) {
      errors.value = ["Selected option is not valid for this forecast"];
    }
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return { valid: true };
}

/**
 * Validate prediction update business rules
 */
export async function validatePredictionUpdate(
  data: UpdatePredictionInput
): Promise<
  { valid: true } | { valid: false; errors: Record<string, string[]> }
> {
  const errors: Record<string, string[]> = {};

  // Get the prediction
  const prediction = await getPredictionById(data.id);
  if (!prediction) {
    errors._form = ["Prediction not found"];
    return { valid: false, errors };
  }

  // Get the forecast to validate due date
  const forecast = await prisma.forecast.findUnique({
    where: { id: prediction.forecastId },
  });

  if (!forecast) {
    errors._form = ["Forecast not found"];
    return { valid: false, errors };
  }

  // Check if forecast is still open
  if (new Date(forecast.dueDate) <= new Date()) {
    errors._form = [
      "This forecast has already closed. Predictions can no longer be updated.",
    ];
  }

  // For categorical forecasts, validate the value is one of the options
  if (
    data.forecastType === "CATEGORICAL" &&
    forecast.options &&
    Array.isArray(forecast.options)
  ) {
    const options = forecast.options as string[];
    if (!options.includes(data.value)) {
      errors.value = ["Selected option is not valid for this forecast"];
    }
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return { valid: true };
}
