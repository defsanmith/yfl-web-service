# Prediction Metrics Service Implementation Summary

## Overview

Successfully implemented a comprehensive `PredictionMetricsService` that automatically calculates derived performance and financial metrics for predictions based on forecast actual values. The implementation follows the Excel-based leaderboard formulas exactly.

## Changes Made

### 1. Database Schema Updates (`prisma/schema.prisma`)

#### Forecast Model

Added `actualValue` field:

```prisma
actualValue String? // Actual outcome - for BINARY: "true"/"false", for CONTINUOUS: numeric string
```

#### Prediction Model

Added 19 derived metric fields:

```prisma
// Derived metrics (calculated by PredictionMetricsService)
totalInvestment            Float?
isCorrect                  Boolean? // for binary
highLow                    String? // for continuous: "HIGH" | "LOW" | "PERFECT"
ppVariance                 Float? // probability variance for binary
error                      Float? // for continuous
brierScore                 Float? // for binary
absoluteError              Float? // for continuous
absoluteActualErrorPct     Float?
absoluteForecastErrorPct   Float?
roiScore                   Float? // unified ROI score
roe                        Float? // profit from equity (amount)
roePct                     Float? // return on equity (decimal)
financingGrossProfit       Float? // profit from debt before repayment
debtRepayment              Float? // interest payment at -10% of debt
rof                        Float? // net profit from financing
rofPct                     Float? // ROI on net debt (decimal)
netProfitEquityPlusDebt    Float? // total net profit
roiEquityPlusDebtPct       Float? // ROI % on equity + debt
profitPerHour              Float?
```

Migration created: `20251112012725_add_prediction_metrics`

### 2. Validation Schemas (`src/schemas/forecasts.ts`)

Updated both `createForecastSchema` and `updateForecastSchema` to include:

```typescript
actualValue: z.string().optional().nullable()
```

### 3. Core Service Implementation (`src/services/prediction-metrics.ts`)

Created new service class with three main methods:

#### Main Method

```typescript
static async recalculateMetricsForForecast(forecastId: string): Promise<void>
```

- Fetches forecast and all its predictions
- Calculates metrics based on forecast type (BINARY or CONTINUOUS)
- Updates all prediction records with calculated metrics

#### Private Methods

**For Binary Predictions:**

```typescript
private static calculateBinaryMetrics(forecast, prediction)
```

Calculates:

- `isCorrect` - Prediction accuracy
- `ppVariance` - Probability variance
- `brierScore` - Brier score (0 = perfect, 1 = worst)
- `roiScore` - ROI based on Brier score (5 for perfect, -10 for worst)
- Financial metrics (roe, rof, net profit, profit per hour)

**For Continuous Predictions:**

```typescript
private static calculateContinuousMetrics(forecast, prediction)
```

Calculates:

- `error` - Forecast minus actual
- `highLow` - Classification ("HIGH", "LOW", "PERFECT")
- `absoluteError` & error percentages
- `roiScore` - ROI based on percentage error
- Financial metrics (same structure as binary)

### 4. Service Integration (`src/services/forecasts.ts`)

Updated forecast service methods:

#### createForecast

```typescript
// If actualValue is provided, recalculate metrics
if (data.actualValue) {
  await PredictionMetricsService.recalculateMetricsForForecast(forecast.id);
}
```

#### updateForecast

```typescript
// If actualValue changed, recalculate metrics
if (currentForecast?.actualValue !== data.actualValue) {
  await PredictionMetricsService.recalculateMetricsForForecast(data.id);
}
```

### 5. Comprehensive Testing (`tests/services/prediction-metrics.test.ts`)

Created 9 test cases covering:

**Binary Predictions:**

- Correct prediction with high confidence
- Incorrect prediction
- Null actualValue handling

**Continuous Predictions:**

- Perfect prediction (error = 0)
- High prediction (forecast > actual)
- Low prediction (forecast < actual)
- Null actualValue handling

**Financial Metrics:**

- Full investment scenario
- Zero investment edge case

**Test Results:** ✅ All 9 tests passing

### 6. Documentation

Created comprehensive documentation:

- **`docs/PREDICTION-METRICS.md`** - Full technical documentation with:
  - Architecture overview
  - Complete formula reference for both prediction types
  - Usage examples and integration points
  - Example scenarios with calculated values
  - Null handling strategy

- **Updated `src/services/README.md`** - Added section on PredictionMetricsService

## Key Features

### Automatic Recalculation

Metrics are automatically recalculated whenever:

1. A forecast is created with an `actualValue`
2. A forecast's `actualValue` is updated or changed

### Formula Accuracy

The implementation exactly mirrors the Excel formulas:

**Binary ROI Score:**

- Perfect (Brier = 0): +5
- Worst (Brier = 1): -10
- Good (Brier < 0.25): Scaled positive
- Poor (Brier ≥ 0.25): Scaled negative

**Continuous ROI Score:**

- Perfect (error = 0%): +5
- Excellent (< 3%): 0.51 to 3
- Good (3-20%): Logarithmic decay
- Acceptable (20-25%): 0
- Poor (25-55%): Exponential penalty
- Worst (≥ 55%): -1

### Financial Metrics

Unified financial calculations for both types:

- **Equity**: Direct profit from equity investment × ROI score
- **Debt**: Profit from debt × ROI score, minus 10% interest
- **Combined**: Total net profit and percentage returns
- **Efficiency**: Profit per hour based on estimated time

### Robust Null Handling

All metrics gracefully handle:

- Missing actual values (all metrics remain null)
- Missing confidence/probability (binary metrics remain null)
- Zero investments (percentage returns remain null)
- Zero time (profit per hour remains null)

## Testing & Verification

### Unit Tests

```bash
npm test -- prediction-metrics.test.ts
```

Result: ✅ 9/9 tests passing

### Build Verification

```bash
npm run build
```

Result: ✅ No compilation errors in service code

## Usage Example

```typescript
import { PredictionMetricsService } from "@/services/prediction-metrics";

// Manually trigger recalculation (usually automatic)
await PredictionMetricsService.recalculateMetricsForForecast(forecastId);
```

## Files Changed/Created

### Modified

1. `prisma/schema.prisma` - Added actualValue to Forecast, 19 metric fields to Prediction
2. `src/schemas/forecasts.ts` - Added actualValue to validation schemas
3. `src/services/forecasts.ts` - Integrated automatic metrics recalculation
4. `src/services/README.md` - Added PredictionMetricsService documentation

### Created

1. `src/services/prediction-metrics.ts` - Core service implementation (328 lines)
2. `tests/services/prediction-metrics.test.ts` - Comprehensive test suite (425 lines)
3. `docs/PREDICTION-METRICS.md` - Complete technical documentation (397 lines)
4. `prisma/migrations/20251112012725_add_prediction_metrics/` - Database migration

## Next Steps

To use the metrics in a leaderboard:

1. Query predictions with metrics for a forecast:

```typescript
const predictions = await prisma.prediction.findMany({
  where: { forecastId },
  include: { user: { select: { name: true, email: true } } },
  orderBy: { roiScore: "desc" }, // or netProfitEquityPlusDebt, profitPerHour, etc.
});
```

2. Aggregate metrics for organization-wide leaderboards:

```typescript
const leaderboard = await prisma.prediction.groupBy({
  by: ["userId"],
  where: { forecast: { organizationId } },
  _avg: { roiScore: true, roiEquityPlusDebtPct: true },
  _sum: { netProfitEquityPlusDebt: true },
});
```

3. Filter by forecast type or category for specialized leaderboards
4. Add time-based filters (monthly, quarterly, yearly leaderboards)

## Migration Instructions

To apply these changes to your database:

```bash
# Already applied during implementation
npx prisma migrate dev --name add_prediction_metrics

# Generate Prisma client (if needed)
npx prisma generate

# Verify migration
npx prisma studio
```

To recalculate metrics for existing predictions:

```typescript
// For all forecasts with actualValue
const forecasts = await prisma.forecast.findMany({
  where: { actualValue: { not: null } },
  select: { id: true },
});

for (const forecast of forecasts) {
  await PredictionMetricsService.recalculateMetricsForForecast(forecast.id);
}
```

## Summary

✅ Complete implementation of prediction metrics calculation
✅ Exact replication of Excel formula logic
✅ Automatic integration with forecast updates
✅ Comprehensive test coverage
✅ Full documentation
✅ Database migration applied
✅ Type-safe TypeScript implementation
✅ Robust null handling and edge cases
✅ Ready for leaderboard integration
