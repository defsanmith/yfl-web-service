# Example: Using Roles in Your App

This example shows how to add role-based content to your home page.

## Step 1: Update Home Page (Server Component)

```tsx
// src/app/page.tsx
import HomeView from "@/views/home/HomeView";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth();

  return <HomeView session={session} />;
}
```

## Step 2: Update HomeView to Show Role

```tsx
// src/views/home/HomeView.tsx
import { Session } from "next-auth";
import { Role } from "@/generated/prisma";

interface HomeViewProps {
  session: Session | null;
}

export default function HomeView({ session }: HomeViewProps) {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Welcome!</h1>
      
      {session ? (
        <div className="space-y-4">
          <p>Email: {session.user.email}</p>
          <p>Role: {session.user.role}</p>
          
          {session.user.role === Role.SUPER_ADMIN && (
            <div className="bg-purple-100 border border-purple-400 p-4 rounded">
              🔥 You are a Super Admin
            </div>
          )}
          
          {session.user.role === Role.ORG_ADMIN && (
            <div className="bg-blue-100 border border-blue-400 p-4 rounded">
              👑 You are an Organization Admin
            </div>
          )}
          
          {session.user.role === Role.USER && (
            <div className="bg-green-100 border border-green-400 p-4 rounded">
              👤 You are a User
            </div>
          )}
        </div>
      ) : (
        <p>Not authenticated</p>
      )}
    </div>
  );
}
```

## Step 3: Protected Admin Page Example

```tsx
// src/app/admin/page.tsx
import { requireAdmin } from "@/lib/guards";

export default async function AdminPage() {
  // This will redirect to /unauthorized if user is not an admin
  const session = await requireAdmin();

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
      <p>Welcome, {session.user.email}</p>
      <p>Your role: {session.user.role}</p>
    </div>
  );
}
```

## Step 4: Client Component with Role Check

```tsx
// src/components/RoleIndicator.tsx
"use client";

import { useSession } from "next-auth/react";
import { Role } from "@/generated/prisma";

export default function RoleIndicator() {
  const { data: session } = useSession();

  if (!session) return null;

  const roleColors = {
    [Role.SUPER_ADMIN]: "bg-purple-500",
    [Role.ORG_ADMIN]: "bg-blue-500",
    [Role.USER]: "bg-green-500",
  };

  return (
    <span className={`${roleColors[session.user.role]} text-white px-3 py-1 rounded-full text-sm`}>
      {session.user.role}
    </span>
  );
}
```
