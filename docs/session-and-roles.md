# NextAuth Session with Roles

## Overview

The NextAuth session has been extended to include the user's `role` and `id` fields. This allows you to access role information throughout your application.

**Performance Note**: This implementation uses **JWT strategy** instead of database sessions. This means:
- ✅ No database query on every session access (10-100x faster)
- ✅ Better scalability and performance
- ⚠️ Role changes require session refresh (see [JWT Strategy docs](./jwt-strategy.md))

## Type Definitions

The session types are defined in `src/types/next-auth.d.ts`:

```typescript
interface Session {
  user: {
    id: string;
    role: Role; // SUPER_ADMIN | ORG_ADMIN | USER
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}
```

## Usage

### Server Components

Use the `auth()` helper from `@/lib/auth`:

```tsx
import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth();
  
  if (!session) {
    redirect("/api/auth/signin");
  }

  return (
    <div>
      <h1>Welcome {session.user.name}</h1>
      <p>Email: {session.user.email}</p>
      <p>Role: {session.user.role}</p>
      <p>User ID: {session.user.id}</p>
    </div>
  );
}
```

### Role-based Access Control

```tsx
import { auth } from "@/lib/auth";
import { Role } from "@/generated/prisma";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const session = await auth();
  
  // Check if user is authenticated
  if (!session) {
    redirect("/api/auth/signin");
  }

  // Check if user has admin role
  if (session.user.role !== Role.SUPER_ADMIN && session.user.role !== Role.ORG_ADMIN) {
    redirect("/unauthorized");
  }

  return <div>Admin Content</div>;
}
```

### Client Components

Use the `useSession()` hook from `next-auth/react`:

```tsx
"use client";

import { useSession } from "next-auth/react";
import { Role } from "@/generated/prisma";

export default function UserProfile() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (status === "unauthenticated") {
    return <div>Please sign in</div>;
  }

  return (
    <div>
      <p>Email: {session.user.email}</p>
      <p>Role: {session.user.role}</p>
      
      {session.user.role === Role.SUPER_ADMIN && (
        <p>🔥 You have super admin privileges!</p>
      )}
    </div>
  );
}
```

### API Routes

```typescript
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { Role } from "@/generated/prisma";

export async function GET() {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check role
  if (session.user.role !== Role.SUPER_ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ 
    message: "Admin only data",
    userId: session.user.id 
  });
}
```

## Role Hierarchy

```typescript
SUPER_ADMIN  // Full system access
ORG_ADMIN    // Organization-level admin
USER         // Standard user (default)
```

## How It Works

1. **Session Callback**: When a session is created/refreshed, the `session` callback in `src/auth/index.ts` fetches the user's role from the database and adds it to the session object.

2. **Type Safety**: TypeScript definitions ensure that `session.user.role` and `session.user.id` are properly typed throughout your application.

3. **JWT Strategy**: Role is stored in the JWT token for fast access. When role changes in database, user should refresh their session using `useRefreshSession()` hook or sign in again. See [JWT Strategy documentation](./jwt-strategy.md) for details.

## Refreshing Session After Role Changes

Since we use JWT strategy, role changes in the database require a session refresh:

### Client-Side Refresh

```tsx
"use client";

import { useRefreshSession } from "@/hooks/useRefreshSession";
import { useSession } from "next-auth/react";

export default function UserProfile() {
  const { data: session } = useSession();
  const refreshSession = useRefreshSession();
  
  const handleRefresh = async () => {
    await refreshSession();
    // session.user.role now contains the latest value from database
  };
  
  return (
    <div>
      <p>Role: {session?.user.role}</p>
      <button onClick={handleRefresh}>Refresh Session</button>
    </div>
  );
}
```

### Automatic Refresh After Role Update

```tsx
"use client";

import { useRefreshSession } from "@/hooks/useRefreshSession";

export default function AdminPanel() {
  const refreshSession = useRefreshSession();
  
  const updateUserRole = async (userId: string, newRole: string) => {
    // Update role via API
    await fetch("/api/admin/update-role", {
      method: "POST",
      body: JSON.stringify({ userId, role: newRole }),
    });
    
    // Refresh session to reflect changes
    await refreshSession();
  };
  
  return <div>Admin Panel</div>;
}
```

## Security Notes

- The admin email (from `ADMIN_EMAIL` env var) is automatically assigned `SUPER_ADMIN` role
- Roles are stored in JWT tokens for fast access (no database query)
- Always validate roles on the server side for security-critical operations
- Client-side role checks are for UI purposes only

## Example: Creating a Role Guard

Create a reusable guard for protecting pages:

```typescript
// src/lib/guards.ts
import { auth } from "@/lib/auth";
import { Role } from "@/generated/prisma";
import { redirect } from "next/navigation";

export async function requireAuth() {
  const session = await auth();
  if (!session) {
    redirect("/api/auth/signin");
  }
  return session;
}

export async function requireRole(allowedRoles: Role[]) {
  const session = await requireAuth();
  
  if (!allowedRoles.includes(session.user.role)) {
    redirect("/unauthorized");
  }
  
  return session;
}

// Usage in a page
export default async function AdminPage() {
  await requireRole([Role.SUPER_ADMIN, Role.ORG_ADMIN]);
  
  return <div>Admin Content</div>;
}
```
