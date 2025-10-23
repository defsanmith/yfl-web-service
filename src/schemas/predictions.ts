import { ForecastType } from "@/generated/prisma";
import { z } from "zod";

/**
 * Schema for creating a prediction
 */
export const createPredictionSchema = z
  .object({
    forecastId: z.string().min(1, "Forecast ID is required"),
    forecastType: z.nativeEnum(ForecastType),
    value: z.string().min(1, "Prediction value is required"),
    confidence: z.coerce
      .number()
      .int()
      .min(0, "Confidence must be at least 0")
      .max(100, "Confidence must be at most 100")
      .optional(),
    reasoning: z
      .string()
      .max(1000, "Reasoning must be 1000 characters or less")
      .optional(),
  })
  .refine(
    (data) => {
      if (data.forecastType === ForecastType.BINARY) {
        return data.value === "true" || data.value === "false";
      }
      return true;
    },
    {
      message: "Binary prediction must be 'true' or 'false'",
      path: ["value"],
    }
  )
  .refine(
    (data) => {
      if (data.forecastType === ForecastType.CONTINUOUS) {
        const num = parseFloat(data.value);
        return !isNaN(num) && isFinite(num);
      }
      return true;
    },
    {
      message: "Continuous prediction must be a valid number",
      path: ["value"],
    }
  );

export type CreatePredictionInput = z.infer<typeof createPredictionSchema>;

/**
 * Schema for updating a prediction
 */
export const updatePredictionSchema = z
  .object({
    id: z.string().min(1, "Prediction ID is required"),
    forecastType: z.nativeEnum(ForecastType),
    value: z.string().min(1, "Prediction value is required"),
    confidence: z.coerce
      .number()
      .int()
      .min(0, "Confidence must be at least 0")
      .max(100, "Confidence must be at most 100")
      .optional(),
    reasoning: z
      .string()
      .max(1000, "Reasoning must be 1000 characters or less")
      .optional(),
  })
  .refine(
    (data) => {
      if (data.forecastType === ForecastType.BINARY) {
        return data.value === "true" || data.value === "false";
      }
      return true;
    },
    {
      message: "Binary prediction must be 'true' or 'false'",
      path: ["value"],
    }
  )
  .refine(
    (data) => {
      if (data.forecastType === ForecastType.CONTINUOUS) {
        const num = parseFloat(data.value);
        return !isNaN(num) && isFinite(num);
      }
      return true;
    },
    {
      message: "Continuous prediction must be a valid number",
      path: ["value"],
    }
  );

export type UpdatePredictionInput = z.infer<typeof updatePredictionSchema>;
