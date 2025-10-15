# YFL Web Service - Copilot Instructions

## Project Overview

Next.js 15 + TypeScript web app with NextAuth.js email authentication, Prisma ORM (PostgreSQL), and shadcn/ui components. This is a capstone project using the App Router pattern.

## Architecture

### Custom Prisma Client Location

Prisma generates client to `src/generated/prisma/` (not default `node_modules/.prisma/client`). Always import from:

```typescript
import { PrismaClient } from "@/generated/prisma";
```

### Authentication Flow

- NextAuth.js v4 with email magic link authentication (no passwords)
- Auth config in `src/auth/index.ts` exports `handlers` for API routes
- Route handler at `src/app/api/auth/[...nextauth]/route.ts` exports GET/POST from handlers
- Client-side: `SessionProvider` wraps app, `AuthProvider` enforces authentication globally
- Email config centralized in `src/constants/config.ts` using env vars

### Provider Pattern

Root layout uses `RootProvider` (`src/providers/index.tsx`) which composes:

1. `SessionProvider` (NextAuth context)
2. `AuthProvider` (enforces `required: true` on all pages)

When adding new providers, compose them in this file.

## Development Workflows

### Database Setup

```bash
# Start PostgreSQL via Docker
docker-compose up -d

# Run migrations
npx prisma migrate dev

# Generate Prisma client (outputs to src/generated/prisma/)
npx prisma generate

# Open Prisma Studio
npx prisma studio
```

### Environment Variables

Required in `.env`:

- `DATABASE_URL` - PostgreSQL connection string
- `EMAIL_SERVER_HOST`, `EMAIL_SERVER_PORT`, `EMAIL_SERVER_USER`, `EMAIL_SERVER_PASSWORD`
- `EMAIL_FROM` - Sender email address
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_PORT` (for docker-compose)

### Running the App

```bash
npm run dev      # Development server (localhost:3000)
npm run build    # Production build
npm run lint     # ESLint check
```

## Code Conventions

### Path Aliases

Uses `@/` prefix for all src/ imports (configured in tsconfig.json):

```typescript
import prisma from "@/lib/prisma";
import { cn } from "@/lib/utils";
```

### Styling

- Tailwind CSS v4 with PostCSS
- shadcn/ui components (new-york style, RSC, CSS variables)
- Use `cn()` utility from `@/lib/utils` to merge Tailwind classes
- Geist font family (sans + mono) via next/font

### Prisma Singleton

The `src/lib/prisma.ts` implements singleton pattern to prevent hot reload issues in dev:

```typescript
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

Never instantiate PrismaClient directly - always import from `@/lib/prisma`.

### Config Pattern

Environment-dependent config uses class-based pattern in `src/constants/config.ts`. Add new config sections to the `Config` class, export singleton instance.

### Validation with Zod

Use Zod for runtime validation of user inputs, API requests, and environment variables:

- **Schema Location**: Define schemas in `src/schemas/` directory, organized by domain (e.g., `src/schemas/users.ts`, `src/schemas/forecasts.ts`)
- **API Route Validation**: Validate request bodies in API routes before processing
- **Form Validation**: Integrate with react-hook-form for client-side form validation
- **Environment Variables**: Validate env vars in `src/constants/config.ts` using Zod schemas
- **Type Inference**: Use `z.infer<typeof schema>` to derive TypeScript types from Zod schemas

**Example Pattern:**

```typescript
// src/schemas/users.ts
import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  role: z.enum(["USER", "ORG_ADMIN", "SUPER_ADMIN"]),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

// src/app/api/users/route.ts
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

### Component Architecture (Separation of Concerns)

**Pages & Layouts (`src/app/`)**: Server components that handle data fetching only

- Use async/await to fetch data from services
- Pass data as props to view components
- Keep logic minimal (routing, data orchestration)

**View Components (`src/views/`)**: Presentation components that receive data as props

- Pure rendering logic, no data fetching
- Can contain client components for interactivity
- Organized by route/feature (e.g., `src/views/home/`, `src/views/dashboard/`)

**Services (`src/services/`)**: Business logic and data access layer

- All Prisma queries and database operations
- Data transformation and business rules
- Import from `@/services/` in page.tsx/layout.tsx files
- Example: `src/services/users.ts`, `src/services/posts.ts`

**Example Pattern:**

```typescript
// src/app/dashboard/page.tsx (data fetching only)
import { getUsers } from "@/services/users";
import DashboardView from "@/views/dashboard/DashboardView";

export default async function DashboardPage() {
  const users = await getUsers();
  return <DashboardView users={users} />;
}

// src/services/users.ts (database logic)
import prisma from "@/lib/prisma";

export async function getUsers() {
  return await prisma.user.findMany();
}

// src/views/dashboard/DashboardView.tsx (presentation)
export default function DashboardView({ users }: { users: User[] }) {
  return <div>{/* render users */}</div>;
}
```

## Server Actions Pattern

Server actions follow a consistent pattern that separates concerns and promotes code reusability:

### Standard Structure

1. **Server Actions** (`src/app/**/actions.ts`) - Orchestrate the flow
2. **Services** (`src/services/*.ts`) - Handle business logic and database operations
3. **Schemas** (`src/schemas/*.ts`) - Define validation rules
4. **Utilities** (`src/lib/server-action-utils.ts`) - Provide reusable helpers

### Server Action Template

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
import { createEntity, validateEntityCreation } from "@/services/entities";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Router from "@/constants/router";

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

### Critical Rules

**DO NOT** wrap redirect in try-catch - it works by throwing a special error:

```typescript
// ❌ WRONG - redirect won't work
try {
  const entity = await createEntity(data);
  redirect(`/entities/${entity.id}`);
} catch (error) {
  return createErrorState({ _form: ["Error"] });
}

// ✅ CORRECT - let redirect throw
const entity = await createEntity(data);
revalidatePath("/entities");
redirect(`/entities/${entity.id}`);
```

**ALWAYS** preserve form data on validation errors:

```typescript
if (!validation.success) {
  return createErrorState(validation.errors, {
    name: formDataToString(rawData.name),
    email: formDataToString(rawData.email),
    description: formDataToString(rawData.description) || null,
  });
}
```

### Service Layer Pattern

**Business Validation Functions** - Encapsulate business rules:

```typescript
/**
 * Validate entity creation business rules
 * @param data - Entity data to validate
 * @returns Validation result with field errors if any
 */
export async function validateEntityCreation(
  data: CreateEntityInput
): Promise<
  { valid: true } | { valid: false; errors: Record<string, string[]> }
> {
  const nameExists = await entityNameExists(data.name);
  if (nameExists) {
    return {
      valid: false,
      errors: { name: ["An entity with this name already exists"] },
    };
  }
  return { valid: true };
}
```

**Existence Check Functions** - Reusable for create and update:

```typescript
/**
 * Check if entity name exists (case-insensitive)
 * @param name - Entity name to check
 * @param excludeId - Optional entity ID to exclude (for updates)
 */
export async function entityNameExists(name: string, excludeId?: string) {
  const entity = await prisma.entity.findFirst({
    where: {
      name: { equals: name, mode: "insensitive" },
      ...(excludeId && { id: { not: excludeId } }),
    },
  });
  return !!entity;
}
```

### View Component Pattern

Use `useActionState` hook for form submissions:

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
      {state?.errors?._form && (
        <div className="text-destructive">{state.errors._form.join(", ")}</div>
      )}

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

      <Button type="submit" disabled={isPending}>
        {isPending ? "Creating..." : "Create Entity"}
      </Button>
    </form>
  );
}
```

### Reusable Utilities

- `extractFormData(formData, fields)` - Extract multiple fields at once
- `validateFormData(schema, data)` - Validate with Zod, get formatted errors
- `createErrorState(errors, data)` - Create consistent error responses
- `formDataToString(value)` - Safely convert FormDataEntryValue to string

### Complete Example Reference

See organization creation flow:

- Schema: `src/schemas/organizations.ts`
- Service: `src/services/organizations.ts`
- Action: `src/app/(protected)/(super-admin)/orgs/create/actions.ts`
- View: `src/views/organizations/CreateOrganizationView.tsx`
- Page: `src/app/(protected)/(super-admin)/orgs/create/page.tsx`

## Reusable Components

### PaginationControls

The project has a reusable pagination component at `src/components/pagination-controls.tsx` that should be used for all list pages with pagination.

**Features:**

- First/Previous/Next/Last page navigation
- Page size selector (10, 25, 50, 100)
- Shows item range (e.g., "1-10 of 50")
- Shows current page (e.g., "Page 1 of 5")
- Responsive design with icon buttons

**Required Props:**

```typescript
interface PaginationInfo {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

<PaginationControls
  pagination={paginationInfo}
  onPageChange={(page) => {
    /* update URL with new page */
  }}
  onPageSizeChange={(pageSize) => {
    /* update URL with new pageSize */
  }}
  pageSizeOptions={[10, 25, 50, 100]} // optional, default shown
  showPageSizeSelector={true} // optional, default true
/>;
```

**Service Layer Pattern:**
Services should return pagination data in a consistent format:

```typescript
export async function getItems(params: {
  page?: number;
  limit?: number;
  // ... other filters
}) {
  const page = params.page || 1;
  const limit = params.limit || 10;
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.item.findMany({ skip, take: limit /* ... */ }),
    prisma.item.count({
      /* same where clause */
    }),
  ]);

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
```

**Page Component Pattern:**
Convert service result to PaginationInfo:

```typescript
export default async function ItemsPage({ searchParams }: PageProps) {
  const page = parseInt(searchParams.page || "1", 10);
  const pageSize = parseInt(searchParams.pageSize || "10", 10);

  const result = await getItems({ page, limit: pageSize });

  return (
    <ItemsView
      items={result.items}
      pagination={{
        page: result.page,
        pageSize: result.limit,
        totalItems: result.total,
        totalPages: result.totalPages,
        hasNextPage: result.page < result.totalPages,
        hasPreviousPage: result.page > 1,
      }}
    />
  );
}
```

**View Component Pattern:**
Use PaginationControls with URL navigation:

```typescript
export default function ItemsView({
  items,
  pagination,
}: {
  items: Item[];
  pagination: PaginationInfo;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <div>
      {/* ... table/list content ... */}

      {pagination.totalPages > 1 && (
        <PaginationControls
          pagination={pagination}
          onPageChange={(page) => {
            const params = new URLSearchParams(searchParams);
            params.set("page", String(page));
            router.push(`/path?${params.toString()}`);
          }}
          onPageSizeChange={(pageSize) => {
            const params = new URLSearchParams(searchParams);
            params.set("pageSize", String(pageSize));
            params.set("page", "1"); // Reset to first page
            router.push(`/path?${params.toString()}`);
          }}
        />
      )}
    </div>
  );
}
```

**DO NOT** implement custom pagination controls when this component exists. Always use `PaginationControls` for consistency.

### DatePicker

A reusable date picker component at `src/components/ui/date-picker.tsx` built on shadcn/ui Calendar and Popover.

**Usage:**

```tsx
import { DatePicker } from "@/components/ui/date-picker";

const [date, setDate] = useState<Date | undefined>();

<DatePicker
  date={date}
  onSelect={setDate}
  placeholder="Select date"
  disabled={false}
/>;

{
  /* Hidden input for form submission */
}
<input
  type="hidden"
  name="dueDate"
  value={date ? date.toISOString().split("T")[0] : ""}
/>;
```

**DO NOT** use native `<input type="date">` - always use the DatePicker component for better UX and consistency.

## Key Files

- `prisma/schema.prisma` - Database schema with custom output path
- `src/auth/index.ts` - NextAuth configuration and handlers
- `src/lib/prisma.ts` - Prisma singleton instance
- `src/lib/server-action-utils.ts` - Reusable server action utilities
- `src/components/pagination-controls.tsx` - Reusable pagination component
- `src/components/ui/date-picker.tsx` - Reusable date picker component
- `src/providers/index.tsx` - Root provider composition
- `src/schemas/` - Zod validation schemas (organized by domain)
- `src/services/` - Data access and business logic layer
- `src/views/` - Presentation components (UI logic only)
- `components.json` - shadcn/ui configuration
- `docs/SERVER-ACTIONS-GUIDE.md` - Detailed server actions guide
