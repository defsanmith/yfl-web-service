import prisma from "@/lib/prisma";
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@/schemas/categories";

/**
 * Get a category by ID
 */
export async function getCategoryById(id: string) {
  return await prisma.forecastCategory.findUnique({
    where: { id },
    include: {
      organization: {
        select: { id: true, name: true },
      },
      _count: {
        select: { forecasts: true },
      },
    },
  });
}

/**
 * Get all categories for an organization
 */
export async function getCategories({
  organizationId,
  page = 1,
  limit = 50,
}: {
  organizationId: string;
  page?: number;
  limit?: number;
}) {
  const skip = (page - 1) * limit;

  const [categories, total] = await Promise.all([
    prisma.forecastCategory.findMany({
      where: { organizationId },
      orderBy: { name: "asc" },
      skip,
      take: limit,
      include: {
        _count: {
          select: { forecasts: true },
        },
      },
    }),
    prisma.forecastCategory.count({ where: { organizationId } }),
  ]);

  return {
    categories,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Create a new category
 */
export async function createCategory(data: CreateCategoryInput) {
  return await prisma.forecastCategory.create({
    data: {
      name: data.name,
      description: data.description,
      color: data.color,
      organizationId: data.organizationId,
    },
    include: {
      organization: {
        select: { id: true, name: true },
      },
    },
  });
}

/**
 * Update a category
 */
export async function updateCategory(data: UpdateCategoryInput) {
  return await prisma.forecastCategory.update({
    where: { id: data.id },
    data: {
      name: data.name,
      description: data.description,
      color: data.color,
    },
    include: {
      organization: {
        select: { id: true, name: true },
      },
    },
  });
}

/**
 * Delete a category
 */
export async function deleteCategory(id: string) {
  return await prisma.forecastCategory.delete({
    where: { id },
  });
}

/**
 * Check if a category name exists within an organization (case-insensitive)
 * @param name - Category name to check
 * @param organizationId - Organization ID
 * @param excludeId - Optional category ID to exclude (for updates)
 */
export async function categoryNameExists(
  name: string,
  organizationId: string,
  excludeId?: string
) {
  const category = await prisma.forecastCategory.findFirst({
    where: {
      name: { equals: name, mode: "insensitive" },
      organizationId,
      ...(excludeId && { id: { not: excludeId } }),
    },
  });
  return !!category;
}

/**
 * Validate category creation business rules
 */
export async function validateCategoryCreation(
  data: CreateCategoryInput
): Promise<
  { valid: true } | { valid: false; errors: Record<string, string[]> }
> {
  const nameExists = await categoryNameExists(data.name, data.organizationId);
  if (nameExists) {
    return {
      valid: false,
      errors: {
        name: ["A category with this name already exists in this organization"],
      },
    };
  }
  return { valid: true };
}

/**
 * Validate category update business rules
 */
export async function validateCategoryUpdate(
  data: UpdateCategoryInput
): Promise<
  { valid: true } | { valid: false; errors: Record<string, string[]> }
> {
  const errors: Record<string, string[]> = {};

  // Get current category
  const currentCategory = await getCategoryById(data.id);
  if (!currentCategory) {
    errors._form = ["Category not found"];
    return { valid: false, errors };
  }

  // Check if name already exists (excluding current category)
  const nameExists = await categoryNameExists(
    data.name,
    currentCategory.organizationId,
    data.id
  );
  if (nameExists) {
    errors.name = [
      "A category with this name already exists in this organization",
    ];
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return { valid: true };
}
