# NavTabs Component

## Overview

A reusable navigation tabs component that uses the button group pattern with Link components and automatic active state detection based on the current pathname.

## Location

`src/components/nav-tabs.tsx`

## Features

- ✅ Styled as button groups with active/inactive states
- ✅ Uses Next.js Link for client-side navigation
- ✅ Automatic active tab detection via `usePathname()`
- ✅ Custom active state checking support
- ✅ Fully typed with TypeScript
- ✅ Consistent with shadcn/ui design system

## Props

### `NavTabsProps`

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `items` | `NavTabItem[]` | Yes | Array of navigation items |
| `className` | `string` | No | Additional CSS classes for the ButtonGroup |

### `NavTabItem`

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `label` | `string` | Yes | Display text for the tab |
| `href` | `string` | Yes | URL path for the tab |
| `isActive` | `(pathname: string) => boolean` | No | Custom function to determine if tab is active |

## Usage

### Basic Example

```tsx
import { NavTabs } from "@/components/nav-tabs";
import Router from "@/constants/router";

export default function MyLayout({ orgId }: { orgId: string }) {
  return (
    <NavTabs
      items={[
        { label: "Overview", href: Router.organizationDetail(orgId) },
        { label: "Settings", href: Router.organizationSettings(orgId) },
        { label: "Billing", href: `/orgs/${orgId}/billing` },
      ]}
    />
  );
}
```

### With Custom Active Check

By default, a tab is considered active if `pathname.startsWith(href)`. For more precise control:

```tsx
<NavTabs
  items={[
    { 
      label: "Overview", 
      href: "/orgs/123",
      // Only active on exact match or /overview route
      isActive: (pathname) => 
        pathname === "/orgs/123" || pathname.endsWith("/overview")
    },
    { 
      label: "Settings", 
      href: "/orgs/123/settings",
      // Active for any settings sub-route
      isActive: (pathname) => pathname.includes("/settings")
    },
  ]}
/>
```

### With Additional Styling

```tsx
<NavTabs
  className="mt-4"
  items={[
    { label: "Dashboard", href: "/dashboard" },
    { label: "Analytics", href: "/analytics" },
  ]}
/>
```

## Active State Logic

### Default Behavior

```typescript
pathname.startsWith(item.href)
```

**Example:**
- Current URL: `/orgs/123/settings`
- Tab href: `/orgs/123`
- Result: ✅ Active (because `/orgs/123/settings` starts with `/orgs/123`)

### Custom Behavior

Provide an `isActive` function for precise control:

```typescript
isActive: (pathname) => pathname === item.href
```

**Example:**
- Current URL: `/orgs/123/settings`
- Tab href: `/orgs/123`
- Custom check: `pathname === "/orgs/123"`
- Result: ❌ Not active (exact match only)

## Styling

The component uses:
- `buttonVariants()` from shadcn/ui Button component
- `ButtonGroup` component for layout
- Active tabs: `variant="default"`
- Inactive tabs: `variant="outline"`

## Real-World Example

From `OrganizationLayoutView.tsx`:

```tsx
<NavTabs
  items={[
    {
      label: "Overview",
      href: Router.organizationDetail(organization.id),
    },
    // Future tabs can be added here:
    // {
    //   label: "Settings",
    //   href: Router.organizationSettings(organization.id),
    // },
  ]}
/>
```

## Benefits

### 1. **Consistency**
- All navigation tabs across the app use the same pattern
- Consistent active state logic
- Uniform styling via shadcn/ui

### 2. **Reusability**
- Single source of truth for navigation tab logic
- Easy to use across different layouts and pages
- Reduces code duplication

### 3. **Maintainability**
- Changes to tab styling apply everywhere
- Active state logic centralized
- Type-safe with TypeScript

### 4. **Developer Experience**
- Simple API with sensible defaults
- Full customization when needed
- Clear documentation and examples

## Accessibility

- Uses semantic `<a>` tags (via Next.js Link)
- ButtonGroup has `role="group"`
- Focus states handled by button variants
- Keyboard navigation supported

## Migration Guide

### Before (Manual Implementation)

```tsx
<ButtonGroup>
  <Link
    className={buttonVariants({
      variant: pathname.startsWith("/orgs/123") ? "default" : "outline",
    })}
    href="/orgs/123"
  >
    Overview
  </Link>
  <Link
    className={buttonVariants({
      variant: pathname.startsWith("/orgs/123/settings") ? "default" : "outline",
    })}
    href="/orgs/123/settings"
  >
    Settings
  </Link>
</ButtonGroup>
```

### After (Using NavTabs)

```tsx
<NavTabs
  items={[
    { label: "Overview", href: "/orgs/123" },
    { label: "Settings", href: "/orgs/123/settings" },
  ]}
/>
```

**Lines of code reduced:** 20+ → 6 ✨

## Future Enhancements

Potential additions to the component:

- [ ] Badge/count support on tabs
- [ ] Icon support (leading/trailing)
- [ ] Disabled state for tabs
- [ ] Loading state indicator
- [ ] Keyboard shortcuts (e.g., `Cmd+1`, `Cmd+2`)
- [ ] Tab analytics/tracking
- [ ] Animation on active state change

## Related Components

- `ButtonGroup` - Layout container for the tabs
- `Button` / `buttonVariants` - Styling for individual tabs
- Next.js `Link` - Client-side navigation
- `usePathname` - Active state detection
