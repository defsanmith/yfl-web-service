# Organization Layout Refactoring

## Overview

Refactored the organization detail page structure to separate layout-level concerns (org details, tabs) from page-specific content (breadcrumbs, user table).

## Changes Made

### New View Components

#### 1. `OrganizationLayoutView.tsx`
**Location**: `src/views/organizations/OrganizationLayoutView.tsx`

**Purpose**: Layout-level component that wraps all pages under `/orgs/[orgId]`

**Contents**:
- Organization details card (name, description, user count, edit button)
- Tabs structure (currently just "Overview" tab)
- Edit organization dialog
- Accepts `children` prop for page-specific content

**Benefits**:
- Persistent across all pages within an organization
- Shared state for organization details
- Future tabs can be added here

#### 2. `OrganizationOverviewView.tsx`
**Location**: `src/views/organizations/OrganizationOverviewView.tsx`

**Purpose**: Page-specific content for the overview tab

**Contents**:
- Breadcrumb navigation
- Members card with user table
- Create user dialog

**Benefits**:
- Page-specific content separated from layout
- Can have different search params per page
- Easier to add new tab pages in the future

### Updated Files

#### 3. `layout.tsx`
**Location**: `src/app/(protected)/(super-admin)/orgs/[orgId]/layout.tsx`

**Changes**:
- Now fetches organization details
- Wraps children with `OrganizationLayoutView`
- Passes organization data and user count to layout view

**Code**:
```tsx
export default async function OrgLayout({ children, params }: OrgLayoutProps) {
  await requireRole([Role.SUPER_ADMIN]);
  
  const { orgId } = await params;
  const organization = await getOrganizationById(orgId);
  
  if (!organization) {
    notFound();
  }
  
  return (
    <OrganizationLayoutView
      organization={{...}}
      userCount={organization.users.length}
    >
      {children}
    </OrganizationLayoutView>
  );
}
```

#### 4. `page.tsx`
**Location**: `src/app/(protected)/(super-admin)/orgs/[orgId]/page.tsx`

**Changes**:
- Now uses `OrganizationOverviewView` instead of `OrganizationDetailView`
- Still fetches organization (for breadcrumb name)
- Fetches paginated users based on search params

**Code**:
```tsx
return (
  <OrganizationOverviewView
    organizationId={organization.id}
    organizationName={organization.name}
    initialUsers={users}
    searchParams={resolvedSearchParams}
  />
);
```

### Deprecated Component

#### `OrganizationDetailView.tsx`
**Status**: Can be deleted (no longer used)

This component combined layout and page concerns. It has been split into:
- `OrganizationLayoutView` (layout concerns)
- `OrganizationOverviewView` (page concerns)

## Architecture Benefits

### 1. **Separation of Concerns**
- Layout-level UI (org details, tabs) is separate from page content
- Each has its own data fetching and state management

### 2. **Scalability**
- Easy to add new tabs (e.g., Settings, Analytics, Billing)
- Each tab can be its own page with unique search params
- Layout persists across all tabs

### 3. **Performance**
- Layout fetches once per organization
- Page content can refetch without re-rendering layout
- Search params only affect page content, not layout

### 4. **Code Organization**
- Clear hierarchy: Layout wraps pages
- Follows Next.js App Router patterns
- Server/client components properly separated

## Visual Hierarchy

```
Layout (OrganizationLayoutView)
├── Organization Details Card
├── Tabs
│   └── Overview Tab (selected)
│       └── Page Content (OrganizationOverviewView)
│           ├── Breadcrumb
│           └── Members Card
│               └── Users Table
```

## Future Enhancements

With this structure, adding new tabs is straightforward:

1. Create new page: `src/app/(protected)/(super-admin)/orgs/[orgId]/settings/page.tsx`
2. Add tab trigger in `OrganizationLayoutView.tsx`
3. The layout (org details) persists automatically

Example:
```tsx
// In OrganizationLayoutView.tsx
<TabsList>
  <TabsTrigger value="overview">Overview</TabsTrigger>
  <TabsTrigger value="settings">Settings</TabsTrigger>
</TabsList>
```

## Migration Notes

- Old `OrganizationDetailView.tsx` component is no longer used
- Can be safely deleted after verifying everything works
- All functionality preserved, just reorganized
