# User Sorting Feature

## Overview

Added sorting functionality to the organization users table, allowing users to be sorted by role (user type), name, and creation date.

## Default Behavior

- **Default Sort**: Users are sorted by **role in descending order** (admins first)
- **Secondary Sort**: When sorting by role, users are also sorted by name in ascending order
- This means ORG_ADMIN users appear before USER users, and within each role group, users are alphabetically sorted by name

## Available Sort Fields

1. **Name** - Alphabetical sorting by user name
2. **Role** - Sort by user role (SUPER_ADMIN → ORG_ADMIN → USER when desc)
3. **Created** - Sort by creation date

## User Interface

- Sortable columns display a sort icon button
- Icons indicate sort state:
  - **↕️ (ArrowUpDown)**: Column is not currently sorted
  - **↑ (ArrowUp)**: Column is sorted in ascending order
  - **↓ (ArrowDown)**: Column is sorted in descending order

## Implementation Details

### Service Layer (`src/services/organizations.ts`)

```typescript
// Default sort parameters
const { sortBy = "role", sortOrder = "desc", query, role } = params;

// Multi-column sorting for role
if (sortBy === "role") {
  orderBy = [
    { role: sortOrder },
    { name: "asc" }, // Secondary sort by name
  ];
}
```

### View Component (`src/views/organizations/UsersTable.tsx`)

- Added `handleSort` callback to manage sort state
- Added `getSortIcon` helper to display appropriate sort icons
- Table headers are now clickable buttons with sort indicators
- Clicking a sorted column toggles between asc/desc
- Clicking a new column sets it as the primary sort field

### URL Parameters

Sort state is preserved in URL search parameters:
- `sortBy`: Field to sort by (name, role, createdAt)
- `sortOrder`: Direction (asc, desc)

Example: `/orgs/123?sortBy=role&sortOrder=desc&page=1`

## Usage

1. Click on any sortable column header (Name, Role, or Created)
2. First click: Sorts by that column
   - Role: Descending (admins first)
   - Name/Created: Ascending
3. Second click: Reverses the sort order
4. Sorting resets pagination to page 1

## Benefits

- **Admin-first default**: Makes it easy to identify and manage admin users
- **URL-based state**: Sort preferences are preserved in bookmarks and browser history
- **Clear visual feedback**: Icons indicate current sort state
- **Secondary sorting**: Role sorting includes name as secondary sort for better organization
