# Router-Based Tab Navigation Update

## Overview

Updated the organization layout to use router-based tab navigation instead of component-based tabs. This allows each tab to be a separate page route with proper URL navigation.

## Changes Made

### 1. **Router Constants** (`src/constants/router.ts`)

Added organization-specific routes:

```typescript
static organizationOverview = (id: string) => `${Router.ORGANIZATIONS}/${id}`;
static organizationSettings = (id: string) => `${Router.ORGANIZATIONS}/${id}/settings`;
```

### 2. **OrganizationLayoutView** (`src/views/organizations/OrganizationLayoutView.tsx`)

**Before:**
- Used `<TabsContent>` to wrap children
- Hardcoded `defaultValue="overview"`
- Content was nested inside Tabs component

**After:**
- Removed `<TabsContent>` wrapper
- Uses `usePathname()` to determine active tab
- Uses `useRouter()` to navigate between tabs
- Children render outside of Tabs component
- Tab values use Router constants

**Key Changes:**

```tsx
// Determine active tab from URL
const getCurrentTab = () => {
  if (pathname.endsWith("/settings")) {
    return "settings";
  }
  return "overview";
};

// Navigate on tab click
const handleTabChange = (value: string) => {
  if (value === "overview") {
    router.push(Router.organizationOverview(organization.id));
  } else if (value === "settings") {
    router.push(Router.organizationSettings(organization.id));
  }
};

// Tab component uses controlled value
<Tabs value={getCurrentTab()} onValueChange={handleTabChange}>
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
  </TabsList>
</Tabs>

// Children render separately
<div className="space-y-4">{children}</div>
```

## Benefits

### 1. **Proper URL Routing**
- Each tab has its own URL
- Direct navigation to specific tabs
- Browser back/forward works correctly
- Bookmarkable tab states

### 2. **Separation of Concerns**
- Layout only handles UI chrome (org details, tabs)
- Each tab is its own page route
- Pages can have independent data fetching
- Search params isolated per page

### 3. **Scalability**
- Easy to add new tabs as new routes
- Each tab can have nested routes
- Independent loading states per tab
- Better code splitting

### 4. **Developer Experience**
- Clear file structure (one page per tab)
- Standard Next.js routing patterns
- Easy to test individual pages
- Better TypeScript support

## Future Tab Implementation

Adding a new tab is now straightforward:

### Step 1: Create the page file
```bash
src/app/(protected)/(super-admin)/orgs/[orgId]/settings/page.tsx
```

### Step 2: Add tab trigger to layout
```tsx
<TabsList>
  <TabsTrigger value="overview">Overview</TabsTrigger>
  <TabsTrigger value="settings">Settings</TabsTrigger>
</TabsList>
```

### Step 3: Update route handler
```tsx
const handleTabChange = (value: string) => {
  if (value === "overview") {
    router.push(Router.organizationOverview(organization.id));
  } else if (value === "settings") {
    router.push(Router.organizationSettings(organization.id));
  }
};
```

That's it! The new page will automatically render in the layout.

## URL Structure

- **Overview**: `/orgs/[orgId]` or `/orgs/[orgId]/overview`
- **Settings**: `/orgs/[orgId]/settings`
- **Future tabs**: `/orgs/[orgId]/[tab-name]`

## Migration Notes

- No breaking changes to existing functionality
- Overview page still works at base `/orgs/[orgId]` route
- Can add settings page in the future without touching existing code
- All existing components remain compatible
