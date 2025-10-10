# Views Directory

This directory contains all presentation/UI components that are used by pages.

## Purpose
- Separate rendering logic from data fetching
- Create reusable, testable UI components
- Keep pages (`src/app/`) clean and focused on data orchestration
- Allow both server and client components as needed

## Conventions
- Organize by route/feature (e.g., `src/views/home/`, `src/views/dashboard/`)
- Receive data as props (no data fetching inside views)
- Can contain client components for interactivity (use `"use client"` directive)
- Export one main view component per file (e.g., `HomeView`, `DashboardView`)

## Example Structure
```typescript
// src/views/dashboard/DashboardView.tsx
import { User } from "@/generated/prisma";

interface DashboardViewProps {
  users: User[];
}

export default function DashboardView({ users }: DashboardViewProps) {
  return (
    <div>
      <h1>Dashboard</h1>
      <ul>
        {users.map((user) => (
          <li key={user.id}>{user.email}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Usage in Pages
Import view components in `page.tsx` and pass data as props:
```typescript
// src/app/dashboard/page.tsx
import { getUsers } from "@/services/users";
import DashboardView from "@/views/dashboard/DashboardView";

export default async function DashboardPage() {
  const users = await getUsers();
  return <DashboardView users={users} />;
}
```

## Client Components
If you need interactivity (state, effects, event handlers), add `"use client"` directive:
```typescript
// src/views/dashboard/UserList.tsx
"use client";

import { useState } from "react";

export default function UserList({ users }: { users: User[] }) {
  const [filter, setFilter] = useState("");
  // ... interactive logic
}
```
