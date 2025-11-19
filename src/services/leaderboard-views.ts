import prisma from "@/lib/prisma";
import type {
  CreateLeaderboardViewInput,
  LeaderboardViewType,
  UpdateLeaderboardViewInput,
} from "@/schemas/leaderboard-views";

// Maximum number of views per user per view type
const MAX_VIEWS_PER_TYPE = 3;

/**
 * Get all leaderboard views for a user, optionally filtered by viewType
 */
export async function getLeaderboardViewsForUser(
  userId: string,
  viewType?: LeaderboardViewType
) {
  return await prisma.leaderboardView.findMany({
    where: {
      userId,
      ...(viewType && { viewType }),
    },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Get a specific leaderboard view by id
 */
export async function getLeaderboardViewById(id: string, userId: string) {
  return await prisma.leaderboardView.findFirst({
    where: { id, userId },
  });
}

/**
 * Check if a view name already exists for a user within a specific view type
 * @param name - View name to check
 * @param userId - User ID
 * @param viewType - View type (USER, PREDICTION, or CATEGORY)
 * @param excludeId - Optional view ID to exclude (for updates)
 */
export async function viewNameExists(
  name: string,
  userId: string,
  viewType: LeaderboardViewType,
  excludeId?: string
) {
  const view = await prisma.leaderboardView.findFirst({
    where: {
      name: { equals: name, mode: "insensitive" },
      userId,
      viewType,
      ...(excludeId && { id: { not: excludeId } }),
    },
  });
  return !!view;
}

/**
 * Validate view creation business rules
 */
export async function validateViewCreation(
  data: CreateLeaderboardViewInput,
  userId: string
): Promise<
  { valid: true } | { valid: false; errors: Record<string, string[]> }
> {
  // Check view limit per view type
  const viewCount = await prisma.leaderboardView.count({
    where: { userId, viewType: data.viewType },
  });

  if (viewCount >= MAX_VIEWS_PER_TYPE) {
    return {
      valid: false,
      errors: {
        _form: [
          `You can only save up to ${MAX_VIEWS_PER_TYPE} views per type. Please delete an existing view first.`,
        ],
      },
    };
  }

  // Check for duplicate name within the same view type
  const nameExists = await viewNameExists(data.name, userId, data.viewType);
  if (nameExists) {
    return {
      valid: false,
      errors: { name: ["A view with this name already exists"] },
    };
  }

  return { valid: true };
}

/**
 * Validate view update business rules
 */
export async function validateViewUpdate(
  data: UpdateLeaderboardViewInput,
  userId: string
): Promise<
  { valid: true } | { valid: false; errors: Record<string, string[]> }
> {
  // Check if view exists and belongs to user
  const view = await prisma.leaderboardView.findFirst({
    where: { id: data.id, userId },
  });

  if (!view) {
    return {
      valid: false,
      errors: { _form: ["View not found or you don't have permission"] },
    };
  }

  // Check for duplicate name within the same view type (excluding current view)
  const nameExists = await viewNameExists(
    data.name,
    userId,
    view.viewType as LeaderboardViewType,
    data.id
  );
  if (nameExists) {
    return {
      valid: false,
      errors: { name: ["A view with this name already exists"] },
    };
  }

  return { valid: true };
}

/**
 * Create a new leaderboard view
 */
export async function createLeaderboardView(
  data: CreateLeaderboardViewInput,
  userId: string
) {
  return await prisma.leaderboardView.create({
    data: {
      name: data.name,
      viewType: data.viewType,
      userId,
      filters: data.filters,
      sortBy: data.sortBy,
      sortOrder: data.sortOrder,
      columnVisibility: data.columnVisibility,
    },
  });
}

/**
 * Update a leaderboard view (rename only)
 */
export async function updateLeaderboardView(
  data: UpdateLeaderboardViewInput,
  userId: string
) {
  return await prisma.leaderboardView.update({
    where: { id: data.id, userId },
    data: {
      name: data.name,
    },
  });
}

/**
 * Delete a leaderboard view
 */
export async function deleteLeaderboardView(id: string, userId: string) {
  return await prisma.leaderboardView.delete({
    where: { id, userId },
  });
}
