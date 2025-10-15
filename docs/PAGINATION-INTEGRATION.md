# Pagination Component Integration

## Overview

Refactored the forecast list page to use the reusable `PaginationControls` component, providing a consistent pagination experience across the application with page size selection, navigation controls, and item count display.

## Changes Made

### 1. ForecastListView Component (`src/views/forecasts/ForecastListView.tsx`)

**Before:**
- Custom pagination UI with basic First/Previous/Next/Last buttons
- Fixed page size (10 items per page)
- Manual button handlers for each navigation action
- Simple "Page X of Y" display
- No page size selector

**After:**
- Uses shared `PaginationControls` component
- Dynamic page size selection (10, 25, 50, 100)
- Unified navigation with icon buttons
- Rich display: "1-10 of 50" + "Page 1 of 5"
- Consistent styling with other list pages

**Changes:**
```typescript
// Added imports
import { PaginationControls } from "@/components/pagination-controls";
import type { PaginationInfo } from "@/components/pagination-controls";

// Updated props interface
type ForecastListViewProps = {
  forecasts: ForecastWithOrg[];
  pagination: PaginationInfo; // Changed from total, page, totalPages
  orgId: string;
  orgName: string;
};

// Replaced custom pagination with PaginationControls
<PaginationControls
  pagination={pagination}
  onPageChange={(page) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(page));
    router.push(`${Router.organizationForecasts(orgId)}?${params.toString()}`);
  }}
  onPageSizeChange={(pageSize) => {
    const params = new URLSearchParams(searchParams);
    params.set("pageSize", String(pageSize));
    params.set("page", "1"); // Reset to first page
    router.push(`${Router.organizationForecasts(orgId)}?${params.toString()}`);
  }}
/>
```

### 2. Page Component (`src/app/(protected)/(super-admin)/orgs/[orgId]/forecasts/page.tsx`)

**Changes:**
- Added `pageSize` to searchParams type
- Extract pageSize from URL parameters (default: "10")
- Pass pageSize to service layer
- Transform service result into `PaginationInfo` structure
- Pass structured pagination object to view

**Before:**
```typescript
const { forecasts, total, totalPages } = await getForecasts({
  organizationId: orgId,
  page: pageNum,
  limit: 10, // Fixed
  // ...
});

return (
  <ForecastListView
    forecasts={forecasts}
    total={total}
    page={pageNum}
    totalPages={totalPages}
    // ...
  />
);
```

**After:**
```typescript
const result = await getForecasts({
  organizationId: orgId,
  page: pageNum,
  limit: pageSizeNum, // Dynamic
  // ...
});

return (
  <ForecastListView
    forecasts={result.forecasts}
    pagination={{
      page: result.page,
      pageSize: result.limit,
      totalItems: result.total,
      totalPages: result.totalPages,
      hasNextPage: result.page < result.totalPages,
      hasPreviousPage: result.page > 1,
    }}
    // ...
  />
);
```

### 3. Copilot Instructions (`.github/copilot-instructions.md`)

Added comprehensive documentation about reusable components:

**New Section: "Reusable Components"**
- Complete PaginationControls documentation
- Service layer pattern for pagination
- Page component pattern
- View component pattern with examples
- DatePicker component documentation
- Usage guidelines and best practices

**Updated Key Files Section:**
- Added `src/components/pagination-controls.tsx`
- Added `src/components/ui/date-picker.tsx`

## Benefits

### Consistency
- All list pages now use the same pagination UI
- Unified user experience across forecasts, organizations, users
- Shared component ensures consistent behavior

### Features
- **Page Size Selection:** Users can choose 10, 25, 50, or 100 items per page
- **Rich Navigation:** First/Previous/Next/Last buttons with icons
- **Item Range Display:** Shows "1-10 of 50" for better context
- **Page Info:** Displays "Page 1 of 5"
- **Responsive Design:** Adapts to mobile and desktop views

### Maintainability
- Single source of truth for pagination logic
- Future changes to pagination affect all pages simultaneously
- Easier to add features (e.g., jump to page, custom ranges)

### URL State Management
- Page number persisted in URL (`?page=2`)
- Page size persisted in URL (`?pageSize=25`)
- Works with browser back/forward buttons
- Shareable URLs with exact pagination state

## Testing Checklist

- [x] PaginationControls renders correctly
- [x] Page navigation (First/Previous/Next/Last) works
- [x] Page size selector changes items per page
- [x] URL updates correctly on page change
- [x] URL updates correctly on page size change
- [x] Page resets to 1 when page size changes
- [x] Item count displays correctly ("1-10 of 50")
- [x] Page info displays correctly ("Page 1 of 5")
- [x] Works with search filters
- [x] Works with type filters
- [x] Works with sorting
- [x] No TypeScript or lint errors
- [x] Consistent with other list pages (organizations, users)

## Pattern for Future List Pages

When creating new list pages with pagination, follow this pattern:

### 1. Service Layer
```typescript
export async function getItems(params: {
  page?: number;
  limit?: number;
  // ... filters
}) {
  const page = params.page || 1;
  const limit = params.limit || 10;
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.item.findMany({ skip, take: limit }),
    prisma.item.count(),
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

### 2. Page Component
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

### 3. View Component
```typescript
import { PaginationControls, PaginationInfo } from "@/components/pagination-controls";

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
      {/* ... table/list ... */}

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
            params.set("page", "1");
            router.push(`/path?${params.toString()}`);
          }}
        />
      )}
    </div>
  );
}
```

## Related Files

- `src/components/pagination-controls.tsx` - Reusable pagination component
- `src/views/forecasts/ForecastListView.tsx` - Updated forecast list view
- `src/app/(protected)/(super-admin)/orgs/[orgId]/forecasts/page.tsx` - Updated page component
- `.github/copilot-instructions.md` - Updated documentation
- `src/views/organizations/OrganizationsListView.tsx` - Reference implementation
- `src/views/organizations/UsersTable.tsx` - Reference implementation

## Related Documentation

- [Forecasts Implementation](./FORECASTS-IMPLEMENTATION.md)
- [Pagination & Search Guide](./PAGINATION-SEARCH-GUIDE.md)
