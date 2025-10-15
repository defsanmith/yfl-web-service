# Adding New Tab Pages - Example

## Overview

This guide shows how to add new tab pages to the organization layout using the NavTabs component.

## Example: Adding a Settings Tab

### Step 1: Update Router Constants

Add the route to `src/constants/router.ts`:

```typescript
// Already exists:
static organizationSettings = (id: string) => `${Router.ORGANIZATIONS}/${id}/settings`;
```

### Step 2: Create the Settings Page

Create `src/app/(protected)/(super-admin)/orgs/[orgId]/settings/page.tsx`:

```typescript
import { Role } from "@/generated/prisma";
import { requireRole } from "@/lib/guards";
import { getOrganizationById } from "@/services/organizations";
import OrganizationSettingsView from "@/views/organizations/OrganizationSettingsView";
import { notFound } from "next/navigation";

export default async function OrganizationSettingsPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  await requireRole([Role.SUPER_ADMIN]);

  const { orgId } = await params;
  const organization = await getOrganizationById(orgId);

  if (!organization) {
    notFound();
  }

  return (
    <OrganizationSettingsView
      organizationId={organization.id}
      organizationName={organization.name}
    />
  );
}
```

### Step 3: Create the Settings View Component

Create `src/views/organizations/OrganizationSettingsView.tsx`:

```tsx
"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Router from "@/constants/router";

type OrganizationSettingsViewProps = {
  organizationId: string;
  organizationName: string;
};

export default function OrganizationSettingsView({
  organizationId,
  organizationName,
}: OrganizationSettingsViewProps) {
  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href={Router.ORGANIZATIONS}>
              Organizations
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={Router.organizationDetail(organizationId)}>
              {organizationName}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Settings</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Settings Content */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Settings</CardTitle>
          <CardDescription>
            Configure organization preferences and options
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Your settings form/content here */}
          <p className="text-muted-foreground">Settings coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Step 4: Add Tab to Layout

Update `src/views/organizations/OrganizationLayoutView.tsx`:

```tsx
<NavTabs
  items={[
    {
      label: "Overview",
      href: Router.organizationDetail(organization.id),
    },
    {
      label: "Settings",
      href: Router.organizationSettings(organization.id),
    },
  ]}
/>
```

### Done! 🎉

The settings tab will now:
- ✅ Appear in the navigation
- ✅ Highlight when active
- ✅ Navigate to the settings page
- ✅ Share the same layout (org details card)
- ✅ Have its own breadcrumb path

## File Structure

```
src/
├── app/(protected)/(super-admin)/orgs/[orgId]/
│   ├── layout.tsx              # Shared layout (org details + NavTabs)
│   ├── page.tsx                # Overview tab
│   └── settings/
│       └── page.tsx            # Settings tab
├── views/organizations/
│   ├── OrganizationLayoutView.tsx     # Layout wrapper
│   ├── OrganizationOverviewView.tsx   # Overview content
│   └── OrganizationSettingsView.tsx   # Settings content
└── constants/
    └── router.ts               # Route constants
```

## Quick Checklist

When adding a new tab:

- [ ] Add route constant to `router.ts`
- [ ] Create page file in `src/app/(protected)/(super-admin)/orgs/[orgId]/[tab-name]/page.tsx`
- [ ] Create view component in `src/views/organizations/`
- [ ] Add tab item to `NavTabs` in `OrganizationLayoutView.tsx`
- [ ] Update breadcrumbs in the view component
- [ ] Test navigation and active states

That's it! The architecture makes it very easy to add new tabs.
