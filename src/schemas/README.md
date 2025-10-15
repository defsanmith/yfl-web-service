# Schemas

This directory contains Zod validation schemas for runtime validation of user inputs, API requests, and data structures.

## Organization

Schemas are organized by domain:

- `organizations.ts` - Organization-related schemas
- `users.ts` - User-related schemas (to be created as needed)
- `forecasts.ts` - Forecast-related schemas (to be created as needed)
- `common.ts` - **Reusable common schemas** (pagination, search, etc.)

## Usage Patterns

### API Route Validation

```typescript
import { createUserSchema } from "@/schemas/users";

export async function POST(request: Request) {
  const body = await request.json();
  const result = createUserSchema.safeParse(body);

  if (!result.success) {
    return Response.json({ error: result.error.issues }, { status: 400 });
  }

  // result.data is now type-safe
  const user = await createUser(result.data);
  return Response.json(user);
}
```

### Server Action Validation

```typescript
"use server";

import { createOrganizationSchema } from "@/schemas/organizations";

export async function createOrganizationAction(
  prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  const rawData = {
    name: formData.get("name"),
    description: formData.get("description"),
  };

  const result = createOrganizationSchema.safeParse(rawData);

  if (!result.success) {
    return {
      success: false,
      errors: result.error.flatten().fieldErrors,
    };
  }

  // Process validated data
  await createOrganization(result.data);
}
```

### Type Inference

Export inferred types from schemas for use in components and services:

```typescript
import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
});

// Export inferred type
export type CreateUserInput = z.infer<typeof createUserSchema>;
```

## Best Practices

1. **Co-locate schemas with their domain** - Group related schemas together
2. **Export inferred types** - Always export `z.infer<typeof schema>` types
3. **Use descriptive error messages** - Provide clear validation messages for users
4. **Validate early** - Validate at the entry point (API routes, server actions)
5. **Reuse schemas** - Create base schemas and extend them as needed
6. **Document complex validations** - Add comments for non-obvious validation rules
