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

## Key Files

- `prisma/schema.prisma` - Database schema with custom output path
- `src/auth/index.ts` - NextAuth configuration and handlers
- `src/lib/prisma.ts` - Prisma singleton instance
- `src/providers/index.tsx` - Root provider composition
- `src/services/` - Data access and business logic layer
- `src/views/` - Presentation components (UI logic only)
- `components.json` - shadcn/ui configuration
