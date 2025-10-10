# JWT Session - Quick Reference

## 🎯 Key Changes

- ✅ **10-100x faster** session access
- ✅ **No database queries** for session reads
- ✅ Role stored in **encrypted JWT token**
- ⚠️ Role changes need **session refresh**

## 📖 Usage

### Read Session (Server)
```tsx
import { auth } from "@/lib/auth";

const session = await auth();
console.log(session?.user.role); // Fast! No DB query
```

### Read Session (Client)
```tsx
"use client";
import { useSession } from "next-auth/react";

const { data: session } = useSession();
console.log(session?.user.role);
```

### Refresh Session (Client)
```tsx
"use client";
import { useRefreshSession } from "@/hooks/useRefreshSession";

const refreshSession = useRefreshSession();
await refreshSession(); // Updates role from DB
```

### Update User Role (Server)
```tsx
import { updateUserRole } from "@/lib/roles";
import { Role } from "@/generated/prisma";

await updateUserRole(userId, Role.ORG_ADMIN);
// User needs to refresh session to see change
```

### Protect Routes
```tsx
import { requireAdmin } from "@/lib/guards";

export default async function AdminPage() {
  await requireAdmin(); // Redirects if not admin
  return <div>Admin Content</div>;
}
```

## 📁 Files to Know

| File | Purpose |
|------|---------|
| `src/auth/index.ts` | NextAuth config with JWT strategy |
| `src/lib/auth.ts` | `auth()` helper function |
| `src/lib/guards.ts` | Role-based route guards |
| `src/lib/roles.ts` | Role management functions |
| `src/hooks/useRefreshSession.ts` | Client-side session refresh |

## 🔄 Role Update Flow

1. **Update role in database**
   ```tsx
   await updateUserRole(userId, Role.ORG_ADMIN);
   ```

2. **User refreshes session** (choose one):
   - Call `refreshSession()` in client component
   - Sign out and sign in again
   - Wait for token to expire (30 days)

3. **User sees new role**
   ```tsx
   session.user.role // Now reflects new role
   ```

## 🚨 Important Reminders

- ⚠️ **Always validate roles server-side** (never trust client)
- ⚠️ **Session refresh needed** after role changes
- ⚠️ **Token expires in 30 days** (configurable)
- ✅ **No performance cost** for session access

## 📚 Full Documentation

- **[JWT Strategy Details](./jwt-strategy.md)** - Technical deep dive
- **[Session & Roles Guide](./session-and-roles.md)** - Complete usage guide
- **[Migration Summary](./JWT-MIGRATION-SUMMARY.md)** - What changed and why
