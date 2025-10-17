# Org Admin Forecasts Implementation

## Overview

This document describes the implementation of the forecasts feature for organization administrators. The implementation allows org admins to view, create, edit, and delete forecasts for their own organization only.

## Key Features

- **Organization Scoping**: Org admins can only access forecasts from their own organization
- **Full CRUD Operations**: Create, Read, Update, and Delete forecasts
- **Reusable Components**: Shares the same UI components with super admin, but with different actions and routing
- **Security**: Authorization checks ensure org admins can only access their own organization's data

## File Structure

### Pages

1. **`src/app/(protected)/(org-admin)/forecasts/page.tsx`**
   - Lists all forecasts for the org admin's organization
   - Supports pagination, search, filtering, and sorting
   - Uses `requireRole([Role.ORG_ADMIN])` to enforce authentication
   - Automatically gets `organizationId` from the session

2. **`src/app/(protected)/(org-admin)/forecasts/[forecastId]/page.tsx`**
   - Shows detailed view of a single forecast
   - Verifies the forecast belongs to the org admin's organization
   - Provides edit and delete functionality

### Actions

1. **`src/app/(protected)/(org-admin)/forecasts/actions.ts`**
   - `createForecastAction()`: Creates a new forecast for the org admin's organization

2. **`src/app/(protected)/(org-admin)/forecasts/[forecastId]/actions.ts`**
   - `updateForecastAction()`: Updates an existing forecast
   - `deleteForecastAction()`: Deletes a forecast
   - Both actions verify ownership before performing operations

### Router Updates

Added new routes to `src/constants/router.ts`:

```typescript
static ORG_ADMIN_FORECASTS = "/forecasts";
static orgAdminForecastDetail = (id: string) => 
  `${Router.ORG_ADMIN_FORECASTS}/${id}`;
```

### Component Updates

Made the following components flexible to work with both super admin and org admin contexts:

1. **`src/views/forecasts/ForecastListView.tsx`**
   - Added `basePath` prop to support different URL structures
   - Added `showBreadcrumbs` prop to hide breadcrumbs for org admins
   - Added `isOrgAdmin` prop to determine which action to use

2. **`src/views/forecasts/ForecastDetailView.tsx`**
   - Added `isOrgAdmin` prop to determine which delete action to use
   - Added `listPath` prop for the back button
   - Added `showBreadcrumbs` prop to hide breadcrumbs for org admins

3. **`src/components/forecasts/CreateForecastModal.tsx`**
   - Added `isOrgAdmin` prop
   - Uses org admin action when `isOrgAdmin=true`
   - Super admin action binds orgId, org admin action gets it from session

4. **`src/components/forecasts/EditForecastModal.tsx`**
   - Added `isOrgAdmin` prop
   - Uses org admin action when `isOrgAdmin=true`

## Security Model

### Authorization Layers

1. **Route Level**: `requireRole([Role.ORG_ADMIN])` enforces authentication
2. **Organization Check**: Verifies user has an `organizationId` in their session
3. **Data Scoping**: All queries filter by `organizationId`
4. **Action Validation**: Server actions verify forecast ownership before updates/deletes

### Access Control Flow

For org admin forecast list:
```typescript
1. Check role is ORG_ADMIN
2. Verify organizationId exists in session
3. Fetch organization data
4. Query forecasts WHERE organizationId = session.user.organizationId
```

For org admin forecast detail:
```typescript
1. Check role is ORG_ADMIN
2. Verify organizationId exists in session
3. Fetch forecast by ID
4. Verify forecast.organizationId === session.user.organizationId
5. Redirect to UNAUTHORIZED if mismatch
```

For create/update/delete actions:
```typescript
1. Check role is ORG_ADMIN
2. Verify organizationId exists in session
3. For updates/deletes: fetch and verify ownership
4. Perform operation with organizationId from session
```

## Differences from Super Admin Implementation

| Aspect | Super Admin | Org Admin |
|--------|-------------|-----------|
| URL Pattern | `/orgs/[orgId]/forecasts` | `/forecasts` |
| Organization ID | From URL parameter | From session |
| Breadcrumbs | Shows full org hierarchy | Hidden |
| Access Scope | All organizations | Only their organization |
| Action Binding | `action.bind(null, orgId)` | Action gets orgId from session |

## Usage Example

### For Org Admins

Navigate to `/forecasts` to see all forecasts for your organization.

- **List View**: Shows forecasts with search, filter, sort, and pagination
- **Create**: Click "Create Forecast" button to add a new forecast
- **Edit**: Click on a forecast to view details, then click "Edit"
- **Delete**: Click on a forecast to view details, then click "Delete"

### For Developers

To add a new org admin page that lists forecasts:

```tsx
import { requireRole } from "@/lib/guards";
import { Role } from "@/generated/prisma";
import { getForecasts } from "@/services/forecasts";
import ForecastListView from "@/views/forecasts/ForecastListView";
import Router from "@/constants/router";

export default async function MyForecastsPage({ searchParams }: PageProps) {
  const session = await requireRole([Role.ORG_ADMIN]);
  
  if (!session.user.organizationId) {
    redirect(Router.UNAUTHORIZED);
  }

  const result = await getForecasts({
    organizationId: session.user.organizationId,
    // ... other params
  });

  return (
    <ForecastListView
      forecasts={result.forecasts}
      pagination={/* ... */}
      orgId={session.user.organizationId}
      orgName={organization.name}
      basePath={Router.ORG_ADMIN_FORECASTS}
      showBreadcrumbs={false}
      isOrgAdmin={true}
    />
  );
}
```

## Testing Checklist

- [ ] Org admin can see only their organization's forecasts
- [ ] Org admin can create a new forecast
- [ ] Org admin can edit their organization's forecasts
- [ ] Org admin can delete their organization's forecasts
- [ ] Org admin cannot access other organizations' forecasts
- [ ] Pagination works correctly
- [ ] Search filters work correctly
- [ ] Type filter works correctly
- [ ] Sorting works correctly
- [ ] Breadcrumbs are hidden for org admin views
- [ ] Back button navigates to the correct list page

## Future Enhancements

1. **Forecast Submissions**: Allow users to submit predictions for forecasts
2. **Forecast Analytics**: Show statistics and charts for forecast performance
3. **Notifications**: Email notifications for due dates and submissions
4. **Bulk Operations**: Select multiple forecasts for batch actions
5. **Export**: Export forecast data to CSV or Excel
