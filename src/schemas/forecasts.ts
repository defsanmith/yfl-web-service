import { ForecastType } from "@/generated/prisma";
import { z } from "zod";

/**
 * Schema for creating a forecast
 */
export const createForecastSchema = z
  .object({
    title: z
      .string()
      .min(1, "Title is required")
      .max(200, "Title must be less than 200 characters"),
    description: z
      .string()
      .max(1000, "Description must be less than 1000 characters")
      .optional()
      .nullable(),
    type: z.nativeEnum(ForecastType, {
      message: "Invalid forecast type",
    }),
    dueDate: z.string().min(1, "Due date is required"),
    releaseDate: z.string().min(1, "Release date is required"),
    organizationId: z.string().cuid("Invalid organization ID"),
    // For categorical forecasts only
    options: z
      .array(z.string().min(1, "Option cannot be empty"))
      .min(2, "Categorical forecasts require at least 2 options")
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      // If type is CATEGORICAL, options must be provided
      if (data.type === ForecastType.CATEGORICAL) {
        return data.options && data.options.length >= 2;
      }
      return true;
    },
    {
      message: "Categorical forecasts require at least 2 options",
      path: ["options"],
    }
  )
  .refine(
    (data) => {
      // If type is not CATEGORICAL, options should not be provided
      if (data.type !== ForecastType.CATEGORICAL) {
        return !data.options || data.options.length === 0;
      }
      return true;
    },
    {
      message: "Options are only allowed for categorical forecasts",
      path: ["options"],
    }
  )
  .refine(
    (data) => {
      // Due date must be before or equal to release date
      const releaseDate = new Date(data.releaseDate);
      const dueDate = new Date(data.dueDate);
      return dueDate <= releaseDate;
    },
    {
      message: "Due date must be before or equal to release date",
      path: ["dueDate"],
    }
  );

/**
 * Schema for updating a forecast
 */
export const updateForecastSchema = z
  .object({
    id: z.string().cuid("Invalid forecast ID"),
    title: z
      .string()
      .min(1, "Title is required")
      .max(200, "Title must be less than 200 characters"),
    description: z
      .string()
      .max(1000, "Description must be less than 1000 characters")
      .optional()
      .nullable(),
    type: z.nativeEnum(ForecastType, {
      message: "Invalid forecast type",
    }),
    dueDate: z.string().min(1, "Due date is required"),
    releaseDate: z.string().min(1, "Release date is required"),
    options: z
      .array(z.string().min(1, "Option cannot be empty"))
      .min(2, "Categorical forecasts require at least 2 options")
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      if (data.type === ForecastType.CATEGORICAL) {
        return data.options && data.options.length >= 2;
      }
      return true;
    },
    {
      message: "Categorical forecasts require at least 2 options",
      path: ["options"],
    }
  )
  .refine(
    (data) => {
      if (data.type !== ForecastType.CATEGORICAL) {
        return !data.options || data.options.length === 0;
      }
      return true;
    },
    {
      message: "Options are only allowed for categorical forecasts",
      path: ["options"],
    }
  )
  .refine(
    (data) => {
      // Due date must be before or equal to release date
      const releaseDate = new Date(data.releaseDate);
      const dueDate = new Date(data.dueDate);
      return dueDate <= releaseDate;
    },
    {
      message: "Due date must be before or equal to release date",
      path: ["dueDate"],
    }
  );

/**
 * Schema for forecast list filtering
 */
export const forecastFilterSchema = z.object({
  type: z.nativeEnum(ForecastType).optional(),
  search: z.string().optional(),
});

export type CreateForecastInput = z.infer<typeof createForecastSchema>;
export type UpdateForecastInput = z.infer<typeof updateForecastSchema>;
export type ForecastFilterInput = z.infer<typeof forecastFilterSchema>;
