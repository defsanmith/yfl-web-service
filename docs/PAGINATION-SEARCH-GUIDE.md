# Pagination and Search Pattern

This document describes the reusable pagination and search implementation that can be applied to any entity in the application.

## Architecture

The pagination and search system consists of four layers:

1. **Utilities** (`src/lib/pagination.ts`) - Core pagination logic
2. **Schemas** (`src/schemas/common.ts`) - Validation schemas
3. **Services** (`src/services/*.ts`) - Data access with pagination
4. **Components** (`src/components/pagination-controls.tsx`, `src/components/search-bar.tsx`) - UI components
5. **Views** (`src/views/*/`) - Page-specific presentation

## Implementation Guide

### 1. Service Layer

Add pagination and search to any service:

```typescript
// src/services/entities.ts
import {
  calculatePagination,
  getPaginationValues,
  PaginatedResult,
  validatePaginationParams,
} from "@/lib/pagination";
import { Prisma } from "@/generated/prisma";

export interface EntitySearchParams {
  query?: string; // Search query
  page?: number;
  pageSize?: number;
  sortBy?: "name" | "createdAt"; // Entity-specific sort fields
  sortOrder?: "asc" | "desc";
}

export async function getEntitiesPaginated(
  params: EntitySearchParams = {}
): Promise<PaginatedResult<EntityListItem>> {
  // Validate and normalize pagination params
  const { page, pageSize } = validatePaginationParams(params, {
    page: 1,
    pageSize: 10,
  });

  const { sortBy = "createdAt", sortOrder = "desc", query } = params;

  // Build where clause for search
  const where: Prisma.EntityWhereInput = query
    ? {
        OR: [
          {
            name: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            id: {
              contains: query,
              mode: "insensitive",
            },
          },
          // Add more searchable fields as needed
        ],
      }
    : {};

  // Get total count
  const totalItems = await prisma.entity.count({ where });

  // Calculate pagination values
  const { skip, take } = getPaginationValues(page, pageSize);

  // Build orderBy clause
  const orderBy: Prisma.EntityOrderByWithRelationInput = {
    [sortBy]: sortOrder,
  };

  // Fetch paginated data
  const entities = await prisma.entity.findMany({
    where,
    orderBy,
    skip,
    take,
    // Add includes/selects as needed
  });

  // Calculate pagination metadata
  const pagination = calculatePagination(totalItems, page, pageSize);

  return {
    data: entities,
    pagination,
  };
}

export type EntityListItem = Prisma.EntityGetPayload<{
  // Define the shape of your list items
}>;
```

### 2. Page Component (Server)

Parse search params and fetch data:

```typescript
// src/app/(protected)/entities/page.tsx
import { getEntitiesPaginated } from "@/services/entities";
import EntitiesListView from "@/views/entities/EntitiesListView";

interface EntitiesPageProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    query?: string;
  }>;
}

export default async function EntitiesPage({
  searchParams,
}: EntitiesPageProps) {
  const params = await searchParams;
  
  const page = params.page ? parseInt(params.page, 10) : 1;
  const pageSize = params.pageSize ? parseInt(params.pageSize, 10) : 10;
  const query = params.query;

  const result = await getEntitiesPaginated({
    page,
    pageSize,
    query,
  });

  return <EntitiesListView entities={result.data} pagination={result.pagination} />;
}
```

### 3. View Component (Client)

Use the reusable components:

```tsx
// src/views/entities/EntitiesListView.tsx
"use client";

import { PaginationControls } from "@/components/pagination-controls";
import { SearchBar } from "@/components/search-bar";
import type { PaginationInfo } from "@/components/pagination-controls";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface EntitiesListViewProps {
  entities: EntityListItem[];
  pagination: PaginationInfo;
}

export default function EntitiesListView({
  entities,
  pagination,
}: EntitiesListViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSearch = useCallback(
    (query: string) => {
      const params = new URLSearchParams(searchParams);
      if (query) {
        params.set("query", query);
      } else {
        params.delete("query");
      }
      params.delete("page"); // Reset to first page
      router.push(`/entities?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams);
      if (page > 1) {
        params.set("page", page.toString());
      } else {
        params.delete("page");
      }
      router.push(`/entities?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handlePageSizeChange = useCallback(
    (pageSize: number) => {
      const params = new URLSearchParams(searchParams);
      if (pageSize !== 10) {
        params.set("pageSize", pageSize.toString());
      } else {
        params.delete("pageSize");
      }
      params.delete("page");
      router.push(`/entities?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <SearchBar
        defaultValue={searchParams.get("query") || ""}
        onSearch={handleSearch}
        placeholder="Search entities..."
      />

      {/* Your table/grid component */}
      <div>
        {entities.map((entity) => (
          <div key={entity.id}>{/* Render entity */}</div>
        ))}
      </div>

      {/* Pagination controls */}
      <PaginationControls
        pagination={pagination}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  );
}
```

## Features

### Search
- **Debounced**: 300ms delay to avoid excessive API calls
- **URL-based**: Search query persists in URL
- **Multiple fields**: Search across name, ID, or any field
- **Case-insensitive**: Uses Prisma's `mode: "insensitive"`

### Pagination
- **Configurable page sizes**: Default 10, options 10/25/50/100
- **URL parameters**: `?page=2&pageSize=25`
- **Metadata**: Total items, total pages, navigation info
- **Validation**: Page size capped at 100, minimum 1

### Reusable Components

#### `<SearchBar />`
```tsx
<SearchBar
  defaultValue={searchParams.get("query") || ""}
  onSearch={(query) => handleSearch(query)}
  placeholder="Search..."
  debounceMs={300} // Optional, default 300ms
/>
```

#### `<PaginationControls />`
```tsx
<PaginationControls
  pagination={result.pagination}
  onPageChange={(page) => handlePageChange(page)}
  onPageSizeChange={(size) => handlePageSizeChange(size)}
  pageSizeOptions={[10, 25, 50, 100]} // Optional
  showPageSizeSelector={true} // Optional
/>
```

## Advanced Features

### Custom Sort Fields

For entity-specific sorting (like user counts), customize the `orderBy` logic:

```typescript
// Handle special sort fields
let orderBy: Prisma.OrganizationOrderByWithRelationInput;
if (sortBy === "userCount") {
  orderBy = {
    users: {
      _count: sortOrder,
    },
  };
} else {
  orderBy = {
    [sortBy]: sortOrder,
  };
}
```

### Multiple Search Fields

Add more fields to the `OR` array:

```typescript
const where: Prisma.EntityWhereInput = query
  ? {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { id: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
      ],
    }
  : {};
```

### Filtering

Add additional filters alongside search:

```typescript
export interface EntitySearchParams {
  query?: string;
  status?: "active" | "inactive";
  category?: string;
  page?: number;
  pageSize?: number;
}

// In service function
const where: Prisma.EntityWhereInput = {
  ...(query && {
    OR: [
      { name: { contains: query, mode: "insensitive" } },
      { id: { contains: query, mode: "insensitive" } },
    ],
  }),
  ...(params.status && { status: params.status }),
  ...(params.category && { categoryId: params.category }),
};
```

## Reference Implementation

See the complete implementation in:
- **Service**: `src/services/organizations.ts` - `getOrganizationsPaginated()`
- **Page**: `src/app/(protected)/(super-admin)/orgs/page.tsx`
- **View**: `src/views/organizations/OrganizationsListView.tsx`

## Best Practices

1. **Always reset page to 1** when search/filters change
2. **Use URL search params** for persistence and shareability
3. **Validate pagination params** to prevent invalid values
4. **Include total count** in pagination metadata
5. **Debounce search input** to reduce API calls
6. **Show empty states** with helpful messages
7. **Preserve other search params** when updating pagination
8. **Use type-safe Prisma queries** with `Prisma.EntityWhereInput`

## URL Structure

Standard URL pattern for paginated lists:

```
/entities?query=search&page=2&pageSize=25
```

- `query` - Search query (optional)
- `page` - Current page, 1-indexed (default: 1)
- `pageSize` - Items per page (default: 10, max: 100)
- Additional filters can be added as needed
