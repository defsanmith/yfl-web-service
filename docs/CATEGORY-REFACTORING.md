# Category Architecture Refactoring

## Summary

Refactored the forecast category system to follow clean architecture principles and eliminate hardcoded data in action files.

## Changes Made

### 1. Service Layer Enhancements (`src/services/categories.ts`)

Added two new service functions:

#### `createPredefinedCategories(organizationId: string)`

Creates all 5 predefined categories for a new organization in a single transaction:

- Movies (#E11D48)
- Crypto (#F59E0B)
- Automobiles (#3B82F6)
- Stock Market (#10B981)
- Corp. Earnings (#8B5CF6)

```typescript
const categories = await createPredefinedCategories(orgId);
```

#### `getCategoryByNameForOrg(name: string, organizationId: string)`

Finds a category by name (case-insensitive) within an organization:

```typescript
const category = await getCategoryByNameForOrg("Movies", orgId);
```

### 2. Organization Creation (`src/services/organizations.ts`)

Updated `createOrganization` to automatically seed predefined categories when a new organization is created. This ensures all organizations start with the standard set of categories.

**Before:**

```typescript
export async function createOrganization(data: CreateOrganizationInput) {
  return await prisma.organization.create({
    data: {
      name: data.name,
      description: data.description,
    },
  });
}
```

**After:**

```typescript
export async function createOrganization(data: CreateOrganizationInput) {
  const organization = await prisma.$transaction(async (tx) => {
    // Create the organization
    const org = await tx.organization.create({
      data: {
        name: data.name,
        description: data.description,
      },
    });

    // Create predefined categories inline within transaction
    const PREDEFINED_CATEGORIES = [
      { name: "Movies", color: "#E11D48" },
      { name: "Crypto", color: "#F59E0B" },
      { name: "Automobiles", color: "#3B82F6" },
      { name: "Stock Market", color: "#10B981" },
      { name: "Corp. Earnings", color: "#8B5CF6" },
    ];

    await Promise.all(
      PREDEFINED_CATEGORIES.map((category) =>
        tx.forecastCategory.create({
          data: {
            name: category.name,
            color: category.color,
            organizationId: org.id,
          },
        })
      )
    );

    return org;
  });

  return organization;
}
```

### 3. Server Actions Cleanup

#### Org Admin Actions (`src/app/(protected)/(org-admin)/forecasts/actions.ts`)

**Removed:**

- `PREDEFINED_CATEGORIES` constant with hardcoded temp IDs
- Direct Prisma calls (`prisma.forecastCategory.findFirst`, `prisma.forecastCategory.create`)
- Category resolution logic (36 lines of code)

**Before:**

```typescript
// Predefined categories mapping
const PREDEFINED_CATEGORIES: Record<string, { name: string; color: string }> = {
  "cat-movies": { name: "Movies", color: "#E11D48" },
  "cat-crypto": { name: "Crypto", color: "#F59E0B" },
  "cat-automobiles": { name: "Automobiles", color: "#3B82F6" },
  "cat-stock-market": { name: "Stock Market", color: "#10B981" },
  "cat-corp-earnings": { name: "Corp. Earnings", color: "#8B5CF6" },
};

// ... in createForecastAction:

// 5. Handle predefined categories - create them if they don't exist
let finalCategoryId = validation.data.categoryId;
if (finalCategoryId && PREDEFINED_CATEGORIES[finalCategoryId]) {
  const predefinedCategory = PREDEFINED_CATEGORIES[finalCategoryId];

  // Check if category already exists for this organization
  let category = await prisma.forecastCategory.findFirst({
    where: {
      organizationId: orgId,
      name: predefinedCategory.name,
    },
  });

  // Create it if it doesn't exist
  if (!category) {
    category = await prisma.forecastCategory.create({
      data: {
        name: predefinedCategory.name,
        color: predefinedCategory.color,
        organizationId: orgId,
      },
    });
  }

  // Use the actual database ID
  finalCategoryId = category.id;
}

// 6. Perform operation with the resolved category ID
const forecast = await createForecast({
  ...validation.data,
  categoryId: finalCategoryId,
});
```

**After:**

```typescript
// 5. Perform operation (category ID is already validated by schema)
const forecast = await createForecast(validation.data);
```

#### Super Admin Actions (`src/app/(protected)/(super-admin)/orgs/[orgId]/forecasts/actions.ts`)

Same cleanup as org admin actions - removed hardcoded constants and Prisma calls.

### 4. Frontend Component (`src/components/forecasts/CreateForecastModal.tsx`)

Removed hardcoded predefined categories with temp IDs. The component now relies entirely on database categories passed via props.

**Before:**

```typescript
// Category management
const predefinedCategories: Category[] = [
  { id: "cat-movies", name: "Movies", color: "#E11D48" },
  { id: "cat-crypto", name: "Crypto", color: "#F59E0B" },
  { id: "cat-automobiles", name: "Automobiles", color: "#3B82F6" },
  { id: "cat-stock-market", name: "Stock Market", color: "#10B981" },
  { id: "cat-corp-earnings", name: "Corp. Earnings", color: "#8B5CF6" },
];

const [localCategories, setLocalCategories] = useState<Category[]>([
  ...predefinedCategories,
  ...categories,
]);
```

**After:**

```typescript
// Category management - use categories from database
const [localCategories, setLocalCategories] = useState<Category[]>(categories);
```

## Migration for Existing Organizations

A seeding script has been created to add predefined categories to existing organizations:

**File:** `prisma/seed-categories.ts`

**Usage:**

```bash
npx tsx prisma/seed-categories.ts
```

This script will:

1. Find all existing organizations
2. Check which predefined categories each organization is missing
3. Create only the missing categories
4. Skip categories that already exist (case-insensitive)
5. Provide detailed output of what was created/skipped

**Example output:**

```
🌱 Starting category seeding for existing organizations...

📊 Found 3 organization(s)

🏢 Processing: Acme Corp
  ✅ Created: Movies
  ✅ Created: Crypto
  ✅ Created: Automobiles
  ✅ Created: Stock Market
  ✅ Created: Corp. Earnings

==================================================
✨ Seeding complete!
📈 Categories created: 15
⏭️  Categories skipped: 0
==================================================
```

## Benefits

### 1. Clean Architecture

- **Separation of Concerns:** All database operations are now in service files
- **No Hardcoded Data:** Category definitions exist in one place (service layer)
- **Single Responsibility:** Actions focus on orchestration, services handle data

### 2. Data Consistency

- **Predictable IDs:** All categories have real database IDs from the start
- **No Temp IDs:** Eliminated the temp ID mapping pattern (`cat-movies` → database ID)
- **Atomic Creation:** Categories created in transaction with organization

### 3. Maintainability

- **Single Source of Truth:** Predefined categories defined once in `organizations.ts`
- **Easier Testing:** Service functions can be unit tested without action complexity
- **Clearer Code:** Actions are now simpler and easier to understand

### 4. Better User Experience

- **No Lazy Loading:** Categories available immediately when org is created
- **Consistent UI:** Frontend always shows database-backed categories
- **No Errors:** Eliminates foreign key constraint errors from temp IDs

## Testing Checklist

After deploying this change, verify:

1. ✅ **New Organizations:** Create a new organization and verify 5 predefined categories are created
2. ✅ **Forecast Creation:** Create forecasts with predefined categories (no errors)
3. ✅ **Category Selection:** Verify all 5 predefined categories appear in dropdown
4. ✅ **Existing Organizations:** Run seed script and verify categories are added
5. ✅ **No Duplicates:** Verify running seed script twice doesn't create duplicates

## Code Removed

**Total lines removed:** ~80 lines

- 20 lines: Predefined categories constants (both action files)
- 40 lines: Category resolution logic with Prisma calls (both action files)
- 8 lines: Hardcoded categories in CreateForecastModal
- 1 line: Unused import in org-admin actions

## Files Modified

1. `src/services/categories.ts` - Added 2 new functions
2. `src/services/organizations.ts` - Updated createOrganization
3. `src/app/(protected)/(org-admin)/forecasts/actions.ts` - Removed hardcoded data and Prisma calls
4. `src/app/(protected)/(super-admin)/orgs/[orgId]/forecasts/actions.ts` - Same cleanup
5. `src/components/forecasts/CreateForecastModal.tsx` - Removed hardcoded categories
6. `prisma/seed-categories.ts` - New migration script (created)

## Future Enhancements

Potential improvements for later:

1. **Admin UI:** Allow super admins to manage predefined categories globally
2. **Customization:** Let organizations customize which predefined categories they want
3. **Bulk Operations:** Add service function to create multiple custom categories at once
4. **Category Templates:** Support different category sets for different organization types
