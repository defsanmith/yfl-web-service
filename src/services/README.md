# Services Layer

This directory contains the business logic and data access layer for the application. Services handle all database operations, business rule validation, and data transformations.

## Architecture

```text
src/
├── app/              # Pages and API routes (data fetching only)
├── services/         # Business logic and database operations
├── schemas/          # Zod validation schemas
├── views/            # Presentation components
└── lib/
    ├── prisma.ts             # Prisma client singleton
    └── server-action-utils.ts # Reusable server action utilities
```

## Key Principles

1. **Single Responsibility**: Each service file handles one domain (e.g., users, organizations, forecasts)
2. **Reusability**: Business logic is encapsulated in pure functions that can be used across different contexts
3. **Type Safety**: All functions are fully typed with TypeScript
4. **Documentation**: Every function has JSDoc comments with examples
5. **Separation of Concerns**: Services don't handle HTTP concerns (that's for actions/API routes)

## Service Function Patterns

### 1. CRUD Operations

Standard database operations for creating, reading, updating, and deleting records.

```typescript
// services/organizations.ts

/**
 * Create a new organization
 * @param data - Organization data to create
 * @returns The created organization
 * @throws {Error} If database operation fails
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
 * @returns Array of all organizations with metadata
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
```

### 2. Business Rule Validation

Functions that check business constraints before performing operations.

```typescript
/**
 * Validate organization creation business rules
 * @param data - Organization data to validate
 * @returns Validation result with field errors if any
 */
export async function validateOrganizationCreation(
  data: CreateOrganizationInput
): Promise<{ valid: true } | { valid: false; errors: Record<string, string[]> }> {
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
```

## Using Services in Server Actions

Server actions orchestrate the flow by using service functions and utility helpers:

```typescript
// app/(protected)/(super-admin)/orgs/create/actions.ts
"use server";

import {
  extractFormData,
  validateFormData,
  createErrorState,
} from "@/lib/server-action-utils";
import { createOrganizationSchema } from "@/schemas/organizations";
import {
  createOrganization,
  validateOrganizationCreation,
} from "@/services/organizations";

export async function createOrganizationAction(prevState, formData) {
  // 1. Extract form data
  const rawData = extractFormData(formData, ["name", "description"]);

  // 2. Validate schema
  const validation = validateFormData(createOrganizationSchema, rawData);
  if (!validation.success) {
    return createErrorState(validation.errors, rawData);
  }

  // 3. Validate business rules
  const businessValidation = await validateOrganizationCreation(validation.data);
  if (!businessValidation.valid) {
    return createErrorState(businessValidation.errors, validation.data);
  }

  // 4. Perform operation
  const organization = await createOrganization(validation.data);

  // 5. Revalidate and redirect
  revalidatePath("/orgs");
  redirect(`/orgs/${organization.id}`);
}
```

## Server Action Utilities

The `lib/server-action-utils.ts` file provides reusable helpers:

- `ActionState<TData>` - Standard action state type
- `extractFormData(formData, fields)` - Extract form fields
- `validateFormData(schema, data)` - Validate with Zod
- `createErrorState(errors, data?)` - Create error response
- `formDataToString(value)` - Convert FormData to string

See `lib/server-action-utils.ts` for detailed documentation.

## Best Practices

### ✅ DO

- Keep service functions pure and focused on a single responsibility
- Use descriptive function names (e.g., `getUsersByOrganization`)
- Document all parameters and return types with JSDoc
- Include usage examples in JSDoc comments
- Return structured validation results from validation functions
- Use Prisma includes/selects to optimize queries

### ❌ DON'T

- Mix HTTP concerns (request/response) with business logic
- Call `redirect()` or `revalidatePath()` from services (that's for actions)
- Duplicate business logic across multiple services
- Return different error formats from different functions
- Perform operations without validation

## File Organization

```text
services/
├── README.md            # This file
├── users.ts            # User-related operations
├── organizations.ts    # Organization-related operations
└── forecasts.ts       # Forecast-related operations
```
