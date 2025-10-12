# Server Actions Best Practices Guide

This guide outlines the recommended patterns for creating server actions in the YFL Web Service application.

## Overview

Server actions should follow a consistent pattern that separates concerns and promotes code reusability:

1. **Server Actions** (`src/app/**/actions.ts`) - Orchestrate the flow
2. **Services** (`src/services/*.ts`) - Handle business logic and database operations
3. **Schemas** (`src/schemas/*.ts`) - Define validation rules
4. **Utilities** (`src/lib/server-action-utils.ts`) - Provide reusable helpers

## Standard Server Action Pattern

### 1. Basic Structure

```typescript
"use server";

import { requireRole } from "@/lib/guards";
import { Role } from "@/generated/prisma";
import {
  ActionState,
  createErrorState,
  extractFormData,
  formDataToString,
  validateFormData,
} from "@/lib/server-action-utils";
import { createEntitySchema } from "@/schemas/entities";
import {
  createEntity,
  validateEntityCreation,
} from "@/services/entities";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Router from "@/constants/router";

type EntityFormData = {
  name: string;
  description: string | null;
  // ... other fields
};

export async function createEntityAction(
  prevState: ActionState<EntityFormData> | undefined,
  formData: FormData
): Promise<ActionState<EntityFormData>> {
  // 1. Verify permissions
  await requireRole([Role.SUPER_ADMIN]);

  // 2. Extract form data
  const rawData = extractFormData(formData, ["name", "description"]);

  // 3. Validate schema
  const validation = validateFormData(createEntitySchema, rawData);
  if (!validation.success) {
    return createErrorState(validation.errors, {
      name: formDataToString(rawData.name),
      description: formDataToString(rawData.description) || null,
    });
  }

  // 4. Validate business rules
  const businessValidation = await validateEntityCreation(validation.data);
  if (!businessValidation.valid) {
    return createErrorState(businessValidation.errors, validation.data);
  }

  // 5. Perform operation
  const entity = await createEntity(validation.data);

  // 6. Revalidate cache
  revalidatePath(Router.ENTITIES);

  // 7. Redirect (throws NEXT_REDIRECT - this is normal!)
  redirect(Router.entityDetail(entity.id));
}
```

### 2. Error Handling Pattern

**DO NOT** wrap the create/redirect logic in try-catch:

```typescript
// ❌ DON'T DO THIS
try {
  const entity = await createEntity(data);
  redirect(`/entities/${entity.id}`);
} catch (error) {
  return createErrorState({ _form: ["Error"] });
}

// ✅ DO THIS
const entity = await createEntity(data);
revalidatePath("/entities");
redirect(`/entities/${entity.id}`); // Throws NEXT_REDIRECT - this is correct!
```

The `redirect()` function works by throwing a special error. If you catch it, the redirect won't work!

### 3. Form Data Preservation

Always return the submitted data on validation errors so users can see and fix their input:

```typescript
if (!validation.success) {
  return createErrorState(validation.errors, {
    name: formDataToString(rawData.name),
    email: formDataToString(rawData.email),
    description: formDataToString(rawData.description) || null,
  });
}
```

Then in your view component, use `defaultValue`:

```tsx
<Input
  name="name"
  defaultValue={state?.data?.name || ""}
  aria-invalid={!!state?.errors?.name}
/>
```

## Service Layer Patterns

### 1. CRUD Functions

Keep database operations simple and focused:

```typescript
/**
 * Create a new entity
 * @param data - Entity data to create
 * @returns The created entity
 * @throws {Error} If database operation fails
 */
export async function createEntity(data: CreateEntityInput) {
  return await prisma.entity.create({
    data: {
      name: data.name,
      description: data.description,
    },
  });
}
```

### 2. Business Validation Functions

Encapsulate business rules in reusable validation functions:

```typescript
/**
 * Validate entity creation business rules
 * @param data - Entity data to validate
 * @returns Validation result with field errors if any
 */
export async function validateEntityCreation(
  data: CreateEntityInput
): Promise<{ valid: true } | { valid: false; errors: Record<string, string[]> }> {
  // Check uniqueness
  const nameExists = await entityNameExists(data.name);
  if (nameExists) {
    return {
      valid: false,
      errors: {
        name: ["An entity with this name already exists"],
      },
    };
  }

  // Check other business rules
  if (data.startDate && data.endDate && data.startDate > data.endDate) {
    return {
      valid: false,
      errors: {
        endDate: ["End date must be after start date"],
      },
    };
  }

  return { valid: true };
}
```

### 3. Existence Check Functions

Make them reusable for both create and update operations:

```typescript
/**
 * Check if entity name already exists (case-insensitive)
 * @param name - Entity name to check
 * @param excludeId - Optional entity ID to exclude (for updates)
 * @returns True if name exists, false otherwise
 */
export async function entityNameExists(
  name: string,
  excludeId?: string
) {
  const entity = await prisma.entity.findFirst({
    where: {
      name: {
        equals: name,
        mode: "insensitive",
      },
      ...(excludeId && { id: { not: excludeId } }),
    },
  });
  return !!entity;
}
```

## Reusable Utilities

### extractFormData

Extract multiple form fields at once:

```typescript
const rawData = extractFormData(formData, ["name", "email", "phone", "description"]);
// Returns: { name: '...', email: '...', phone: '...', description: '...' }
```

### validateFormData

Validate with Zod and get properly formatted errors:

```typescript
const validation = validateFormData(createUserSchema, rawData);
if (!validation.success) {
  // validation.errors is Record<string, string[]>
  return createErrorState(validation.errors, rawData);
}
// validation.data is fully typed and validated
const user = await createUser(validation.data);
```

### createErrorState

Create consistent error responses:

```typescript
// Field-specific errors
return createErrorState(
  { email: ["Email already exists"] },
  { email: "test@example.com", name: "John" }
);

// General form error
return createErrorState(
  { _form: ["Something went wrong"] },
  formData
);
```

### formDataToString

Safely convert FormDataEntryValue to string:

```typescript
const name = formDataToString(formData.get("name")); // string
const description = formDataToString(formData.get("description")) || null; // string | null
```

## View Component Pattern

Use the standard form pattern with `useActionState`:

```tsx
"use client";

import { createEntityAction } from "./actions";
import { useActionState } from "react";

export default function CreateEntityView() {
  const [state, formAction, isPending] = useActionState(
    createEntityAction,
    undefined
  );

  return (
    <form action={formAction}>
      {/* General error */}
      {state?.errors?._form && (
        <div className="text-destructive">
          {state.errors._form.join(", ")}
        </div>
      )}

      {/* Field with error */}
      <div>
        <Input
          name="name"
          defaultValue={state?.data?.name || ""}
          aria-invalid={!!state?.errors?.name}
        />
        {state?.errors?.name && (
          <p className="text-destructive text-sm">
            {state.errors.name.join(", ")}
          </p>
        )}
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Creating..." : "Create Entity"}
      </Button>
    </form>
  );
}
```

## Complete Example

See the organization creation flow for a complete example:

- **Schema**: `src/schemas/organizations.ts`
- **Service**: `src/services/organizations.ts`
- **Action**: `src/app/(protected)/(super-admin)/orgs/create/actions.ts`
- **View**: `src/views/organizations/CreateOrganizationView.tsx`
- **Page**: `src/app/(protected)/(super-admin)/orgs/create/page.tsx`

## Benefits of This Pattern

1. **Reusability**: Business logic can be used in multiple actions/routes
2. **Testability**: Services can be tested independently
3. **Consistency**: All actions follow the same structure
4. **Type Safety**: Full TypeScript support throughout
5. **Maintainability**: Clear separation of concerns
6. **Error Handling**: Consistent error format across the app
7. **UX**: Form data is preserved on validation errors

## Migration Checklist

When creating a new feature:

- [ ] Create Zod schema in `src/schemas/`
- [ ] Create service functions in `src/services/`
- [ ] Add business validation function if needed
- [ ] Create server action using standard pattern
- [ ] Use reusable utilities from `server-action-utils.ts`
- [ ] Create view component with `useActionState`
- [ ] Add JSDoc comments with examples
- [ ] Test the complete flow
