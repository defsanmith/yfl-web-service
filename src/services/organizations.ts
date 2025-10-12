import prisma from "@/lib/prisma";
import { CreateOrganizationInput } from "@/schemas/organizations";

/**
 * Create a new organization
 *
 * @param data - Organization data to create
 * @returns The created organization
 *
 * @throws {Error} If database operation fails
 *
 * @example
 * ```typescript
 * // In a server action
 * const organization = await createOrganization({
 *   name: "Acme Corp",
 *   description: "A great company"
 * });
 * ```
 */
export async function createOrganization(data: CreateOrganizationInput) {
  return await prisma.organization.create({
    data: {
      name: data.name,
      description: data.description,
    },
  });
}

/**
 * Get all organizations with user counts
 *
 * @returns Array of all organizations with user count metadata
 *
 * @example
 * ```typescript
 * // In a page component
 * const organizations = await getOrganizations();
 * // Returns: [{ id, name, description, _count: { users: 5 }, ... }]
 * ```
 */
export async function getOrganizations() {
  return await prisma.organization.findMany({
    include: {
      _count: {
        select: { users: true },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * Get organization by ID with full user details
 *
 * @param id - Organization ID
 * @returns Organization with users or null if not found
 *
 * @example
 * ```typescript
 * // In a detail page
 * const organization = await getOrganizationById(params.orgId);
 * if (!organization) {
 *   notFound();
 * }
 * // Use organization.users to display members
 * ```
 */
export async function getOrganizationById(id: string) {
  return await prisma.organization.findUnique({
    where: { id },
    include: {
      users: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });
}

/**
 * Check if organization name already exists (case-insensitive)
 *
 * @param name - Organization name to check
 * @param excludeId - Optional organization ID to exclude from check (for updates)
 * @returns True if name exists, false otherwise
 *
 * @example
 * ```typescript
 * // Before creating a new organization
 * const exists = await organizationNameExists("Acme Corp");
 * if (exists) {
 *   return createErrorState({ name: ["Name already exists"] });
 * }
 *
 * // When updating an organization (exclude current ID)
 * const exists = await organizationNameExists("New Name", currentOrgId);
 * ```
 */
export async function organizationNameExists(name: string, excludeId?: string) {
  const org = await prisma.organization.findFirst({
    where: {
      name: {
        equals: name,
        mode: "insensitive",
      },
      ...(excludeId && { id: { not: excludeId } }),
    },
  });
  return !!org;
}

/**
 * Validate organization creation business rules
 *
 * Checks:
 * - Organization name uniqueness
 *
 * @param data - Organization data to validate
 * @returns Validation result with field errors if any
 *
 * @example
 * ```typescript
 * // In a server action after schema validation
 * const businessValidation = await validateOrganizationCreation(data);
 * if (!businessValidation.valid) {
 *   return createErrorState(businessValidation.errors, data);
 * }
 * ```
 */
export async function validateOrganizationCreation(
  data: CreateOrganizationInput
): Promise<
  { valid: true } | { valid: false; errors: Record<string, string[]> }
> {
  const nameExists = await organizationNameExists(data.name);

  if (nameExists) {
    return {
      valid: false,
      errors: {
        name: ["An organization with this name already exists"],
      },
    };
  }

  return { valid: true };
}
