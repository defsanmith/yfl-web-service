# Forecast Enhanced Fields Implementation

## Overview

This document describes the new fields and features added to the Forecast model to support enhanced data tracking and categorization.

## New Features

### 1. Data Release Date

- **Field**: `dataReleaseDate` (optional DateTime)
- **Purpose**: Tracks when the actual data for the forecast will be released/revealed
- **Validation**: Must be on or after the `dueDate` if provided
- **Use Case**: Allows forecasts where predictions are due before the actual data is available

### 2. Data Type for Continuous Forecasts

- **Field**: `dataType` (enum, required for CONTINUOUS forecasts)
- **Purpose**: Specifies the type of numerical data being forecasted
- **Enum Values**:
  - `NUMBER` - Generic numerical value
  - `CURRENCY` - Monetary values
  - `PERCENT` - Percentage values
  - `DECIMAL` - Decimal numbers
  - `INTEGER` - Whole numbers
- **Validation**: 
  - Required when `type` is `CONTINUOUS`
  - Not allowed for `BINARY` or `CATEGORICAL` types
- **Use Case**: Enables proper formatting, validation, and display of continuous forecast values

### 3. Forecast Categories

- **Model**: `ForecastCategory`
- **Purpose**: Organizes forecasts into custom categories at the organization level
- **Fields**:
  - `name` (required, unique per organization)
  - `description` (optional)
  - `color` (optional hex color code for UI display)
- **Features**:
  - Full CRUD operations
  - Organization-scoped (each org manages their own categories)
  - Case-insensitive unique name validation
  - Cascade delete protection (categories with forecasts need special handling)

## Database Schema Changes

### ForecastCategory Model
```prisma
model ForecastCategory {
  id             String       @id @default(cuid())
  name           String
  description    String?
  color          String?      // Hex color code for UI display
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  forecasts      Forecast[]
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  @@unique([organizationId, name])
  @@index([organizationId])
}
```

### Forecast Model Updates
- Added `dataType DataType?` - Data type enum for continuous forecasts
- Added `dataReleaseDate DateTime?` - When forecast data will be released
- Added `categoryId String?` - Optional link to ForecastCategory
- Added `category ForecastCategory?` - Relation to category

### DataType Enum
```prisma
enum DataType {
  NUMBER
  CURRENCY
  PERCENT
  DECIMAL
  INTEGER
}
```

## Implementation Files

### Schemas
- `src/schemas/categories.ts` - Category validation schemas
- `src/schemas/forecasts.ts` - Updated with new forecast fields

### Services
- `src/services/categories.ts` - Category CRUD operations
- `src/services/forecasts.ts` - Updated to handle new fields

### Key Validation Rules

#### Forecast Creation/Update
1. `dataType` is required for `CONTINUOUS` forecasts
2. `dataType` is not allowed for `BINARY` or `CATEGORICAL` forecasts
3. `dataReleaseDate` must be on or after `dueDate` if provided
4. All existing validation rules still apply (title uniqueness, due date in future, etc.)

#### Category Management
1. Category names must be unique within an organization (case-insensitive)
2. Category `color` must be a valid hex color code (e.g., `#FF5733`)
3. Categories are organization-scoped

## Usage Examples

### Creating a Continuous Forecast with Data Type
```typescript
const forecast = await createForecast({
  title: "Q4 Revenue Forecast",
  description: "Predict Q4 revenue in millions",
  type: ForecastType.CONTINUOUS,
  dataType: DataType.CURRENCY, // Required for continuous
  dueDate: "2025-12-31",
  dataReleaseDate: "2026-01-15", // Data released after due date
  organizationId: "org123",
  categoryId: "cat456", // Optional
});
```

### Creating a Category
```typescript
const category = await createCategory({
  name: "Financial Forecasts",
  description: "Revenue, expenses, and other financial metrics",
  color: "#3B82F6", // Blue color
  organizationId: "org123",
});
```

### Querying Forecasts with Categories
```typescript
const forecast = await getForecastById("forecast123");
// Returns forecast with organization and category details
console.log(forecast.category?.name); // "Financial Forecasts"
console.log(forecast.category?.color); // "#3B82F6"
console.log(forecast.dataType); // "CURRENCY"
console.log(forecast.dataReleaseDate); // Date object
```

## Migration

The migration `20251104001333_add_forecast_fields_and_categories` adds:
- `DataType` enum to database
- `ForecastCategory` table
- New fields to `Forecast` table: `dataType`, `dataReleaseDate`, `categoryId`
- Indexes for optimal query performance

## Next Steps

To complete the implementation, you'll need to:

1. **UI Components**:
   - Add data type selector to forecast creation/edit forms
   - Add data release date picker
   - Add category selector dropdown
   - Create category management UI (CRUD pages)

2. **Server Actions**:
   - Create actions for category CRUD operations
   - Update forecast actions to handle new fields

3. **Pages**:
   - Create category management pages for org admins
   - Update forecast forms to include new fields

4. **Display**:
   - Show category badges on forecast lists
   - Display data type and release date in forecast details
   - Add category filtering to forecast lists

## API Reference

### Category Service Functions
- `getCategoryById(id: string)` - Get single category with forecast count
- `getCategories({ organizationId, page, limit })` - List categories with pagination
- `createCategory(data: CreateCategoryInput)` - Create new category
- `updateCategory(data: UpdateCategoryInput)` - Update existing category
- `deleteCategory(id: string)` - Delete category
- `categoryNameExists(name, organizationId, excludeId?)` - Check name uniqueness
- `validateCategoryCreation(data)` - Validate business rules for creation
- `validateCategoryUpdate(data)` - Validate business rules for update

### Updated Forecast Service Functions
All forecast service functions now include:
- Category relation in includes
- Support for `dataType` and `dataReleaseDate` fields
- Category filtering capability (can be added to `getForecasts`)
