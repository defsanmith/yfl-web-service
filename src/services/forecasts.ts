import { ForecastType, Prisma } from "@/generated/prisma";
import prisma from "@/lib/prisma";
import type {
  CreateForecastInput,
  UpdateForecastInput,
} from "@/schemas/forecasts";

/**
 * Get a forecast by ID
 */
export async function getForecastById(id: string) {
  return await prisma.forecast.findUnique({
    where: { id },
    include: {
      organization: {
        select: { id: true, name: true },
      },
      category: {
        select: { id: true, name: true, color: true },
      },
    },
  });
}

/**
 * Get all forecasts for an organization with pagination, search, and filtering
 */
export async function getForecasts({
  organizationId,
  userId,
  page = 1,
  limit = 10,
  search,
  type,
  sortBy = "createdAt",
  sortOrder = "desc",
}: {
  organizationId: string;
  userId?: string;
  page?: number;
  limit?: number;
  search?: string;
  type?: ForecastType;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) {
  const skip = (page - 1) * limit;

  // Build where clause
  const where: Prisma.ForecastWhereInput = {
    organizationId,
    ...(userId && { userId }),
    ...(type && { type }),
    ...(search && {
      title: {
        contains: search,
        mode: "insensitive",
      },
    }),
  };

  // Build order by clause
  const orderBy: Prisma.ForecastOrderByWithRelationInput = {
    [sortBy]: sortOrder,
  };

  const [forecasts, total] = await Promise.all([
    prisma.forecast.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        organization: {
          select: { id: true, name: true },
        },
        category: {
          select: { id: true, name: true, color: true },
        },
      },
    }),
    prisma.forecast.count({ where }),
  ]);

  return {
    forecasts,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Create a new forecast
 */
export async function createForecast(data: CreateForecastInput) {
  return await prisma.forecast.create({
    data: {
      title: data.title,
      description: data.description,
      type: data.type,
      dataType: data.dataType,
      dueDate: new Date(data.dueDate),
      dataReleaseDate: data.dataReleaseDate
        ? new Date(data.dataReleaseDate)
        : null,
      organizationId: data.organizationId,
      categoryId: data.categoryId,
      options: data.options || undefined,
    },
    include: {
      organization: {
        select: { id: true, name: true },
      },
      category: {
        select: { id: true, name: true, color: true },
      },
    },
  });
}

/**
 * Update a forecast
 */
export async function updateForecast(data: UpdateForecastInput) {
  return await prisma.forecast.update({
    where: { id: data.id },
    data: {
      title: data.title,
      description: data.description,
      type: data.type,
      dataType: data.dataType,
      dueDate: new Date(data.dueDate),
      dataReleaseDate: data.dataReleaseDate
        ? new Date(data.dataReleaseDate)
        : null,
      categoryId: data.categoryId,
      options: data.options || undefined,
    },
    include: {
      organization: {
        select: { id: true, name: true },
      },
      category: {
        select: { id: true, name: true, color: true },
      },
    },
  });
}

/**
 * Delete a forecast
 */
export async function deleteForecast(id: string) {
  return await prisma.forecast.delete({
    where: { id },
  });
}

/**
 * Get upcoming forecasts for a user's organization
 * Returns forecasts with dueDate in the future, ordered by dueDate ascending
 */
export async function getUpcomingForecastsForUser({
  organizationId,
  userId,
  limit = 10,
}: {
  organizationId: string;
  userId: string;
  limit?: number;
}) {
  const now = new Date();

  return prisma.forecast.findMany({
    where: {
      organizationId,
      dueDate: { gte: now },
    },
    orderBy: { dueDate: "asc" },
    take: limit,
    include: {
      organization: { select: { id: true, name: true } },
      category: { select: { id: true, name: true, color: true } },
      predictions: {
        where: { userId }, // only this user's prediction
        select: { id: true, userId: true, value: true },
      },
    },
  });
}

/**
 * Check if a forecast title exists within an organization (case-insensitive)
 * @param title - Forecast title to check
 * @param organizationId - Organization ID
 * @param excludeId - Optional forecast ID to exclude (for updates)
 */
export async function forecastTitleExists(
  title: string,
  organizationId: string,
  excludeId?: string
) {
  const forecast = await prisma.forecast.findFirst({
    where: {
      title: { equals: title, mode: "insensitive" },
      organizationId,
      ...(excludeId && { id: { not: excludeId } }),
    },
  });
  return !!forecast;
}

/**
 * Validate forecast creation business rules
 */
export async function validateForecastCreation(
  data: CreateForecastInput
): Promise<
  { valid: true } | { valid: false; errors: Record<string, string[]> }
> {
  const errors: Record<string, string[]> = {};

  // Check if title already exists in organization
  const titleExists = await forecastTitleExists(
    data.title,
    data.organizationId
  );
  if (titleExists) {
    errors.title = [
      "A forecast with this title already exists in this organization",
    ];
  }

  // Validate due date is in the future
  const dueDate = new Date(data.dueDate);
  if (dueDate <= new Date()) {
    errors.dueDate = ["Due date must be in the future"];
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return { valid: true };
}

/**
 * Validate forecast update business rules
 */
export async function validateForecastUpdate(
  data: UpdateForecastInput
): Promise<
  { valid: true } | { valid: false; errors: Record<string, string[]> }
> {
  const errors: Record<string, string[]> = {};

  // Get current forecast
  const currentForecast = await getForecastById(data.id);
  if (!currentForecast) {
    errors._form = ["Forecast not found"];
    return { valid: false, errors };
  }

  // Check if title already exists (excluding current forecast)
  const titleExists = await forecastTitleExists(
    data.title,
    currentForecast.organizationId,
    data.id
  );
  if (titleExists) {
    errors.title = [
      "A forecast with this title already exists in this organization",
    ];
  }

  // Validate due date is in the future
  const dueDate = new Date(data.dueDate);
  if (dueDate <= new Date()) {
    errors.dueDate = ["Due date must be in the future"];
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return { valid: true };
}
