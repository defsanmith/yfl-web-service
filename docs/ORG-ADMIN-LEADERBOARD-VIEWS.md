# Org Admin Leaderboard Views Implementation Guide

## Overview

This document outlines the implementation of two additional leaderboard views for organization admins:
1. **Prediction/Forecast View** - Aggregated by prediction (forecast)
2. **Category View** - Aggregated by category

Each view type allows org admins to save 3 custom filter sets, for a total of 9 saved views (3 per view type: USER, PREDICTION, CATEGORY).

## Completed Steps

### 1. Database Schema ✅
- Added `LeaderboardViewType` enum with values: USER, PREDICTION, CATEGORY
- Added `viewType` field to `LeaderboardView` model with default "USER"
- Updated unique constraint to include viewType: `@@unique([userId, name, viewType])`
- Added index on `[userId, viewType]`

### 2. Schemas & Validation ✅
- Updated `src/schemas/leaderboard-views.ts` with viewType support
- Modified validation to allow 3 views per type (MAX_VIEWS_PER_TYPE = 3)
- View name uniqueness is now scoped to viewType

### 3. Services ✅
- Updated `getLeaderboardViewsForUser()` to optionally filter by viewType
- Modified `viewNameExists()` to check within specific viewType
- Updated validation functions to enforce per-type limits

## Remaining Implementation

### 4. Service Functions for Aggregation

Add these functions to `src/services/leaderboard.ts`:

```typescript
/**
 * Prediction/Forecast leaderboard entry
 */
export interface PredictionLeaderboardEntry {
  forecastId: string;
  forecastTitle: string;
  forecastType: string;
  categoryName: string | null;
  
  // Participation metrics
  totalParticipants: number;
  participantsCompleted: number;
  
  // Accuracy metrics (for binary)
  correctPredictions: number;
  incorrectPredictions: number;
  accuracyRate: number | null;
  avgProbability: number | null;
  
  // Continuous performance
  highCount: number;
  lowCount: number;
  perfectCount: number;
  avgActualError: number | null;
  avgForecastError: number | null;
  
  // Financial aggregates
  totalInvestment: number | null;
  totalNetProfit: number | null;
  avgRoi: number | null;
  totalEquityInvestment: number | null;
  totalDebtFinancing: number | null;
  
  // Time metrics
  avgTimePerPrediction: number | null;
  totalTimeSpent: number | null;
}

/**
 * Get leaderboard aggregated by prediction/forecast
 */
export async function getOrganizationPredictionLeaderboard({
  organizationId,
  sortBy = "totalParticipants",
  sortOrder = "desc",
  forecastIds,
  categoryIds,
  forecastTypes,
  dateFrom,
  dateTo,
}: {
  organizationId: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  forecastIds?: string;
  categoryIds?: string;
  forecastTypes?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<PredictionLeaderboardEntry[]> {
  const validSortColumns = [
    "forecastTitle",
    "totalParticipants",
    "participantsCompleted",
    "accuracyRate",
    "avgRoi",
    "totalNetProfit",
    "avgTimePerPrediction",
  ];
  
  const sortColumn = validSortColumns.includes(sortBy) ? sortBy : "totalParticipants";
  const direction = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";
  const nullsPosition = direction === "DESC" ? "NULLS LAST" : "NULLS FIRST";
  
  const conditions = [
    'f."organizationId" = $1',
    'f."actualValue" IS NOT NULL',
  ];
  const params: (string | number)[] = [organizationId];
  
  // Add filters...
  if (forecastIds) {
    const ids = forecastIds.split(",").filter(Boolean);
    if (ids.length > 0) {
      const placeholders = ids.map((_, i) => `$${params.length + i + 1}`).join(", ");
      conditions.push(`f.id IN (${placeholders})`);
      params.push(...ids);
    }
  }
  
  if (categoryIds) {
    const ids = categoryIds.split(",").filter(Boolean);
    if (ids.length > 0) {
      const placeholders = ids.map((_, i) => `$${params.length + i + 1}`).join(", ");
      conditions.push(`f."categoryId" IN (${placeholders})`);
      params.push(...ids);
    }
  }
  
  if (forecastTypes) {
    const types = forecastTypes.split(",").filter(Boolean);
    if (types.length > 0) {
      const placeholders = types.map((_, i) => `$${params.length + i + 1}::"ForecastType"`).join(", ");
      conditions.push(`f.type IN (${placeholders})`);
      params.push(...types);
    }
  }
  
  if (dateFrom) {
    conditions.push(`f."dataReleaseDate" >= $${params.length + 1}::timestamp`);
    params.push(dateFrom);
  }
  
  if (dateTo) {
    conditions.push(`f."dataReleaseDate" <= $${params.length + 1}::timestamp`);
    params.push(dateTo);
  }
  
  const whereClause = conditions.join(" AND ");
  
  const query = `
    SELECT
      f.id as "forecastId",
      f.title as "forecastTitle",
      f.type::text as "forecastType",
      fc.name as "categoryName",
      
      COUNT(DISTINCT p."userId")::int as "totalParticipants",
      COUNT(DISTINCT p.id)::int as "participantsCompleted",
      
      COUNT(CASE WHEN p."isCorrect" = true THEN 1 END)::int as "correctPredictions",
      COUNT(CASE WHEN p."isCorrect" = false THEN 1 END)::int as "incorrectPredictions",
      CASE 
        WHEN COUNT(CASE WHEN f.type = 'BINARY' THEN 1 END) > 0 THEN
          (COUNT(CASE WHEN p."isCorrect" = true THEN 1 END)::numeric / COUNT(CASE WHEN f.type = 'BINARY' THEN 1 END)::numeric)
        ELSE NULL
      END as "accuracyRate",
      AVG(CASE WHEN f.type = 'BINARY' AND p.confidence IS NOT NULL THEN p.confidence::numeric / 100 END) as "avgProbability",
      
      COUNT(CASE WHEN p."highLow" = 'HIGH' THEN 1 END)::int as "highCount",
      COUNT(CASE WHEN p."highLow" = 'LOW' THEN 1 END)::int as "lowCount",
      COUNT(CASE WHEN p."highLow" = 'PERFECT' THEN 1 END)::int as "perfectCount",
      AVG(p."absoluteActualErrorPct") as "avgActualError",
      AVG(p."absoluteForecastErrorPct") as "avgForecastError",
      
      SUM(p."totalInvestment") as "totalInvestment",
      SUM(p."netProfitEquityPlusDebt") as "totalNetProfit",
      AVG(p."roiEquityPlusDebtPct") as "avgRoi",
      SUM(p."equityInvestment") as "totalEquityInvestment",
      SUM(p."debtFinancing") as "totalDebtFinancing",
      
      AVG(p."estimatedTime") as "avgTimePerPrediction",
      SUM(p."estimatedTime") as "totalTimeSpent"
      
    FROM "Forecast" f
    LEFT JOIN "ForecastCategory" fc ON fc.id = f."categoryId"
    LEFT JOIN "Prediction" p ON p."forecastId" = f.id
    LEFT JOIN "User" u ON u.id = p."userId" AND u.role = 'USER'
    WHERE ${whereClause}
    GROUP BY f.id, f.title, f.type, fc.name
    ORDER BY "${sortColumn}" ${direction} ${nullsPosition}
  `;
  
  const result = await prisma.$queryRawUnsafe<any[]>(query, ...params);
  
  return result.map((row) => ({
    ...row,
    accuracyRate: row.accuracyRate ? Number(row.accuracyRate) : null,
    avgProbability: row.avgProbability ? Number(row.avgProbability) : null,
    avgActualError: row.avgActualError ? Number(row.avgActualError) : null,
    avgForecastError: row.avgForecastError ? Number(row.avgForecastError) : null,
    totalInvestment: row.totalInvestment ? Number(row.totalInvestment) : null,
    totalNetProfit: row.totalNetProfit ? Number(row.totalNetProfit) : null,
    avgRoi: row.avgRoi ? Number(row.avgRoi) : null,
    totalEquityInvestment: row.totalEquityInvestment ? Number(row.totalEquityInvestment) : null,
    totalDebtFinancing: row.totalDebtFinancing ? Number(row.totalDebtFinancing) : null,
    avgTimePerPrediction: row.avgTimePerPrediction ? Number(row.avgTimePerPrediction) : null,
    totalTimeSpent: row.totalTimeSpent ? Number(row.totalTimeSpent) : null,
  }));
}

/**
 * Category leaderboard entry
 */
export interface CategoryLeaderboardEntry {
  categoryId: string;
  categoryName: string;
  categoryDescription: string | null;
  
  // Forecast metrics
  totalForecasts: number;
  completedForecasts: number;
  
  // Participation
  totalParticipants: number;
  totalPredictions: number;
  avgPredictionsPerForecast: number | null;
  
  // Accuracy
  correctPredictions: number;
  accuracyRate: number | null;
  
  // Financial
  totalInvestment: number | null;
  totalNetProfit: number | null;
  avgRoi: number | null;
  
  // Time
  totalTimeSpent: number | null;
  avgTimePerPrediction: number | null;
}

/**
 * Get leaderboard aggregated by category
 */
export async function getOrganizationCategoryLeaderboard({
  organizationId,
  sortBy = "totalForecasts",
  sortOrder = "desc",
  categoryIds,
  forecastTypes,
  dateFrom,
  dateTo,
}: {
  organizationId: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  categoryIds?: string;
  forecastTypes?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<CategoryLeaderboardEntry[]> {
  // Similar implementation as prediction leaderboard but GROUP BY category
  const validSortColumns = [
    "categoryName",
    "totalForecasts",
    "totalParticipants",
    "accuracyRate",
    "totalNetProfit",
    "avgRoi",
  ];
  
  const sortColumn = validSortColumns.includes(sortBy) ? sortBy : "totalForecasts";
  const direction = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";
  const nullsPosition = direction === "DESC" ? "NULLS LAST" : "NULLS FIRST";
  
  const conditions = [
    'fc."organizationId" = $1',
  ];
  const params: (string | number)[] = [organizationId];
  
  // Add filters...
  if (categoryIds) {
    const ids = categoryIds.split(",").filter(Boolean);
    if (ids.length > 0) {
      const placeholders = ids.map((_, i) => `$${params.length + i + 1}`).join(", ");
      conditions.push(`fc.id IN (${placeholders})`);
      params.push(...ids);
    }
  }
  
  const whereClause = conditions.join(" AND ");
  
  const query = `
    SELECT
      fc.id as "categoryId",
      fc.name as "categoryName",
      fc.description as "categoryDescription",
      
      COUNT(DISTINCT f.id)::int as "totalForecasts",
      COUNT(DISTINCT CASE WHEN f."actualValue" IS NOT NULL THEN f.id END)::int as "completedForecasts",
      
      COUNT(DISTINCT p."userId")::int as "totalParticipants",
      COUNT(p.id)::int as "totalPredictions",
      CASE 
        WHEN COUNT(DISTINCT f.id) > 0 THEN
          COUNT(p.id)::numeric / COUNT(DISTINCT f.id)::numeric
        ELSE NULL
      END as "avgPredictionsPerForecast",
      
      COUNT(CASE WHEN p."isCorrect" = true THEN 1 END)::int as "correctPredictions",
      CASE 
        WHEN COUNT(p.id) > 0 THEN
          (COUNT(CASE WHEN p."isCorrect" = true THEN 1 END)::numeric / COUNT(p.id)::numeric)
        ELSE NULL
      END as "accuracyRate",
      
      SUM(p."totalInvestment") as "totalInvestment",
      SUM(p."netProfitEquityPlusDebt") as "totalNetProfit",
      AVG(p."roiEquityPlusDebtPct") as "avgRoi",
      
      SUM(p."estimatedTime") as "totalTimeSpent",
      AVG(p."estimatedTime") as "avgTimePerPrediction"
      
    FROM "ForecastCategory" fc
    LEFT JOIN "Forecast" f ON f."categoryId" = fc.id
    LEFT JOIN "Prediction" p ON p."forecastId" = f.id
    LEFT JOIN "User" u ON u.id = p."userId" AND u.role = 'USER'
    WHERE ${whereClause}
    GROUP BY fc.id, fc.name, fc.description
    ORDER BY "${sortColumn}" ${direction} ${nullsPosition}
  `;
  
  const result = await prisma.$queryRawUnsafe<any[]>(query, ...params);
  
  return result.map((row) => ({
    ...row,
    avgPredictionsPerForecast: row.avgPredictionsPerForecast ? Number(row.avgPredictionsPerForecast) : null,
    accuracyRate: row.accuracyRate ? Number(row.accuracyRate) : null,
    totalInvestment: row.totalInvestment ? Number(row.totalInvestment) : null,
    totalNetProfit: row.totalNetProfit ? Number(row.totalNetProfit) : null,
    avgRoi: row.avgRoi ? Number(row.avgRoi) : null,
    totalTimeSpent: row.totalTimeSpent ? Number(row.totalTimeSpent) : null,
    avgTimePerPrediction: row.avgTimePerPrediction ? Number(row.avgTimePerPrediction) : null,
  }));
}
```

### 5. View Components

Create `src/views/leaderboard/PredictionLeaderboardView.tsx`:
- Similar structure to LeaderboardView but with forecast-specific columns
- Columns: Forecast Title, Category, Participants, Accuracy Rate, Avg ROI, Total Profit, etc.
- Reuse LeaderboardFilters component with viewType="PREDICTION"

Create `src/views/leaderboard/CategoryLeaderboardView.tsx`:
- Columns: Category Name, Total Forecasts, Participants, Avg Accuracy, Total Profit, etc.
- Reuse LeaderboardFilters component with viewType="CATEGORY"

### 6. Org Admin Routes

Create route structure:
```
src/app/(protected)/(org-admin)/leaderboard/
  layout.tsx - Navigation tabs (Users, Predictions, Categories)
  page.tsx - Redirect to /leaderboard/users
  users/
    page.tsx - User leaderboard (existing logic)
  predictions/
    page.tsx - Prediction leaderboard
  categories/
    page.tsx - Category leaderboard
```

### 7. Update ViewsManager Component

Modify `src/components/views-manager.tsx` to:
- Accept `viewType` prop
- Filter views by viewType when loading
- Pass viewType when creating new views
- Show appropriate labels per view type

## Testing Checklist

- [ ] Create USER view - should work as before
- [ ] Create PREDICTION view - should allow 3 separate saves
- [ ] Create CATEGORY view - should allow 3 separate saves
- [ ] Verify 9 total views possible (3 per type)
- [ ] Test name uniqueness within view types (same name OK across types)
- [ ] Test prediction leaderboard aggregation
- [ ] Test category leaderboard aggregation
- [ ] Test filters work for all view types
- [ ] Test column visibility persists per view type
- [ ] Test navigation between tabs maintains state

## Migration Notes

Existing USER views will continue to work with `viewType='USER'` as the default.

## Next Steps

1. Implement the service functions in `leaderboard.ts`
2. Create the two new view components
3. Set up the org admin route structure with tabs
4. Update ViewsManager to support view types
5. Test end-to-end functionality
