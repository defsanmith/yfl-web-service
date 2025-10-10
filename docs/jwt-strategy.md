# JWT Strategy for NextAuth - Technical Details

## Overview

The application uses JWT (JSON Web Token) strategy for session management instead of database sessions. This provides better performance by eliminating database queries on every session access.

## How It Works

### 1. JWT Token Flow

```
User Login → JWT Created → Token Stored in Cookie → Session Read from Token
     ↓            ↓              ↓                        ↓
  Database    Add role to    Encrypted JWT           No DB query!
              token
```

### 2. Callbacks

#### JWT Callback (`jwt`)
Runs when:
- User signs in (token is created)
- Token is updated (via `update()` function)
- Token is refreshed

```typescript
async jwt({ token, user, trigger }) {
  // Initial sign in - add user data to token
  if (user) {
    token.id = user.id;
    token.role = user.role;
  }

  // Manual token update - refresh role from DB
  if (trigger === "update") {
    const dbUser = await prisma.user.findUnique({
      where: { id: token.id },
      select: { role: true },
    });
    if (dbUser) {
      token.role = dbUser.role;
    }
  }

  return token;
}
```

#### Session Callback (`session`)
Runs when:
- Session is accessed via `auth()` or `useSession()`
- Reads data from JWT token (no DB query)

```typescript
async session({ session, token }) {
  // Copy data from token to session
  session.user.id = token.id;
  session.user.role = token.role;
  return session;
}
```

## Performance Benefits

### Database Strategy (Old)
```
Every session access:
auth() → Query database → Return session
        ↑
    Slow! ~50-100ms per query
```

### JWT Strategy (New)
```
Every session access:
auth() → Read from cookie → Decrypt JWT → Return session
        ↑
    Fast! ~1-5ms
```

### Performance Comparison

| Operation | Database Strategy | JWT Strategy | Improvement |
|-----------|------------------|--------------|-------------|
| Session access | ~50-100ms | ~1-5ms | **10-100x faster** |
| Database load | High | Minimal | **Significantly reduced** |
| Scalability | Limited | Excellent | **Better horizontal scaling** |

## Role Updates

### Important: Role changes require session refresh

When a user's role is updated in the database, their JWT token still contains the old role. There are two ways to handle this:

### 1. Server-Side Update (Recommended for Admin Actions)

```typescript
// src/app/api/admin/update-role/route.ts
import { updateUserRole } from "@/lib/roles";
import { Role } from "@/generated/prisma";

export async function POST(req: Request) {
  const { userId, role } = await req.json();
  
  // Update role in database
  await updateUserRole(userId, role);
  
  // User will see new role after their next sign in
  // Or they can manually refresh their session
  
  return Response.json({ success: true });
}
```

### 2. Client-Side Session Refresh

```tsx
"use client";

import { useRefreshSession } from "@/hooks/useRefreshSession";
import { useSession } from "next-auth/react";

export default function UserProfile() {
  const { data: session } = useSession();
  const refreshSession = useRefreshSession();
  
  const handleUpdateRole = async () => {
    // Update role in database
    await fetch("/api/user/update-role", {
      method: "POST",
      body: JSON.stringify({ role: "ORG_ADMIN" }),
    });
    
    // Refresh session to get updated role
    await refreshSession();
    
    // session.user.role now reflects the new role
  };
  
  return (
    <div>
      <p>Current Role: {session?.user.role}</p>
      <button onClick={handleUpdateRole}>Update Role</button>
    </div>
  );
}
```

## Security Considerations

### 1. Token Expiration
JWT tokens expire after a set time (default: 30 days). After expiration, user must sign in again.

```typescript
// Configure in src/auth/index.ts
session: {
  strategy: "jwt",
  maxAge: 30 * 24 * 60 * 60, // 30 days
}
```

### 2. Token Storage
Tokens are stored in HTTP-only cookies, making them inaccessible to JavaScript and protecting against XSS attacks.

### 3. Token Encryption
NextAuth automatically encrypts JWT tokens using the `NEXTAUTH_SECRET` environment variable.

### 4. Role Validation
Always validate roles server-side, never trust client-side session data alone:

```typescript
import { auth } from "@/lib/auth";
import { requireAdmin } from "@/lib/guards";

// ✅ Good: Server-side validation
export async function GET() {
  const session = await requireAdmin();
  // Role is validated on server
}

// ❌ Bad: Client-side only
"use client";
export default function Component() {
  const { data: session } = useSession();
  if (session?.user.role === "SUPER_ADMIN") {
    // This can be manipulated in browser dev tools!
  }
}
```

## Troubleshooting

### Issue: Role doesn't update after database change

**Cause**: JWT token still contains old role

**Solution**: 
1. User signs out and signs back in
2. Call `refreshSession()` from client
3. Wait for token to expire (based on `maxAge`)

### Issue: Session seems "stale"

**Cause**: Token is cached and not refreshed

**Solution**: 
```tsx
import { useRefreshSession } from "@/hooks/useRefreshSession";

const refreshSession = useRefreshSession();
await refreshSession();
```

## Files Modified for JWT Strategy

- ✅ `src/auth/index.ts` - Added `session: { strategy: "jwt" }` and JWT callbacks
- ✅ `src/types/next-auth.d.ts` - Added JWT type extensions
- ✅ `src/hooks/useRefreshSession.ts` - Hook for refreshing session
- ✅ `src/lib/roles.ts` - Helper functions for role management

## Comparison: Database vs JWT Strategy

### Database Strategy
**Pros:**
- Always has fresh data from database
- Role changes reflected immediately

**Cons:**
- Database query on every session access
- Higher latency
- More database load
- Harder to scale

### JWT Strategy ✅ (Current)
**Pros:**
- No database queries for session access
- Very fast (~1-5ms)
- Better scalability
- Lower database load
- Works well with edge computing

**Cons:**
- Role changes require session refresh
- Token size increases with data
- Can't "force logout" users (until token expires)

## Best Practices

1. **Keep JWT tokens small** - Only store essential data (id, role, email)
2. **Set reasonable expiration** - 30 days is a good default
3. **Implement session refresh** - Provide UI for users to refresh their session
4. **Validate server-side** - Always check roles on server, not just client
5. **Monitor token size** - Large tokens can impact performance

## References

- NextAuth.js JWT Strategy: https://next-auth.js.org/configuration/options#session
- JWT Best Practices: https://tools.ietf.org/html/rfc8725
