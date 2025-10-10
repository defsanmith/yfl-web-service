# Services Directory

This directory contains all business logic and data access layer code.

## Purpose
- Encapsulate all Prisma database queries
- Handle data transformation and business rules
- Provide reusable functions for data operations
- Keep database logic separate from UI components

## Conventions
- One file per model/domain (e.g., `users.ts`, `posts.ts`)
- Export async functions that perform database operations
- Always import Prisma from `@/lib/prisma` (singleton instance)
- Return typed data (use Prisma types or custom types)

## Example Structure
```typescript
// src/services/users.ts
import prisma from "@/lib/prisma";

export async function getUsers() {
  return await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function getUserById(id: string) {
  return await prisma.user.findUnique({
    where: { id },
  });
}
```

## Usage in Pages
Import and call service functions in `page.tsx` or `layout.tsx`:
```typescript
// src/app/dashboard/page.tsx
import { getUsers } from "@/services/users";
import DashboardView from "@/views/dashboard/DashboardView";

export default async function DashboardPage() {
  const users = await getUsers();
  return <DashboardView users={users} />;
}
```
