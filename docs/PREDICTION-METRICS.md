# Prediction Metrics Service

## Overview

The `PredictionMetricsService` automatically calculates derived performance and financial metrics for predictions when a forecast's actual value is set. This service implements the formulas from the Excel-based leaderboard system.

## Architecture

### Database Schema

**Forecast Model:**

- `actualValue: string | null` - The actual outcome (for BINARY: "true"/"false", for CONTINUOUS: numeric string)
- `type: ForecastType` - Either "BINARY" or "CONTINUOUS"

**Prediction Model - Input Fields:**

- `value: string` - The predicted value
- `confidence: number | null` - Confidence level 0-100 (used as probability for binary)
- `equityInvestment: number | null` - Equity investment amount
- `debtFinancing: number | null` - Debt financing amount
- `estimatedTime: number | null` - Time spent in minutes

**Prediction Model - Derived Metric Fields:**

All metrics are nullable and automatically calculated:

- `totalInvestment: number` - Sum of equity and debt
- `isCorrect: boolean` - For binary: whether prediction matches actual
- `highLow: string` - For continuous: "HIGH" | "LOW" | "PERFECT"
- `ppVariance: number` - Probability variance (binary only)
- `error: number` - Forecast value minus actual (continuous only)
- `brierScore: number` - Brier score (binary only)
- `absoluteError: number` - Absolute error (continuous only)
- `absoluteActualErrorPct: number` - Error as % of actual
- `absoluteForecastErrorPct: number` - Error as % of forecast
- `roiScore: number` - Unified ROI score (different formula per type)
- `roe: number` - Profit from equity (amount)
- `roePct: number` - Return on equity (decimal)
- `financingGrossProfit: number` - Profit from debt before repayment
- `debtRepayment: number` - Interest payment at -10% of debt
- `rof: number` - Net profit from financing (debt)
- `rofPct: number` - ROI on net debt (decimal)
- `netProfitEquityPlusDebt: number` - Total net profit (equity + debt)
- `roiEquityPlusDebtPct: number` - ROI % on equity + debt
- `profitPerHour: number` - Net profit divided by time hours

## Usage

### Automatic Recalculation

Metrics are automatically recalculated when:

1. A forecast is created with an `actualValue`
2. A forecast's `actualValue` is updated

```typescript
// In forecasts service
import { PredictionMetricsService } from "./prediction-metrics";

export async function updateForecast(data: UpdateForecastInput) {
  const currentForecast = await prisma.forecast.findUnique({
    where: { id: data.id },
    select: { actualValue: true },
  });

  const forecast = await prisma.forecast.update({
    where: { id: data.id },
    data: { ...data },
  });

  // Recalculate metrics if actualValue changed
  if (currentForecast?.actualValue !== data.actualValue) {
    await PredictionMetricsService.recalculateMetricsForForecast(data.id);
  }

  return forecast;
}
```

### Manual Recalculation

You can manually trigger recalculation for a forecast:

```typescript
import { PredictionMetricsService } from "@/services/prediction-metrics";

// Recalculate all predictions for a forecast
await PredictionMetricsService.recalculateMetricsForForecast(forecastId);
```

## Formulas

### Binary Predictions

For forecasts with `type === "BINARY"`:

**Input Interpretation:**

- `predictedOutcome = prediction.value === "true"`
- `actualOutcome = forecast.actualValue === "true"`
- `probability = prediction.confidence / 100`

**Accuracy Metrics:**

1. **isCorrect**: `predictedOutcome === actualOutcome` (if actual is not null)

2. **ppVariance** (probability variance):
   - If correct: `|1 - probability|`
   - If incorrect: `|probability|`

3. **brierScore**:
   - If correct: `(1 - probability)²`
   - If incorrect: `probability²`

4. **roiScore** (from Brier):
   - If `brierScore === 0`: `5`
   - If `brierScore === 1`: `-10`
   - If `brierScore < 0.25`: `((0.25 - brierScore) × (0.5 / ppVariance)) / 3`
   - Else: `(0.25 - brierScore) × (ppVariance × 6)`

### Continuous Predictions

For forecasts with `type === "CONTINUOUS"`:

**Input Interpretation:**

- `forecastValue = Number(prediction.value)`
- `actual = Number(forecast.actualValue)`

**Accuracy Metrics:**

1. **error**: `forecastValue - actual`

2. **highLow**:
   - If `error === 0`: `"PERFECT"`
   - If `error > 0`: `"HIGH"` (forecast higher than actual)
   - If `error < 0`: `"LOW"` (forecast lower than actual)

3. **absoluteError**: `|error|`

4. **absoluteActualErrorPct**: `absoluteError / actual` (if actual ≠ 0)

5. **absoluteForecastErrorPct**: `absoluteError / forecastValue` (if forecast ≠ 0)

6. **roiScore** (from % error, let `e = absoluteActualErrorPct`):
   - If `e === 0`: `5`
   - If `e < 0.03`: `0.51 + ((0.03 - e) / 0.03) × 2.49`
   - If `e < 0.2`: `-log₁₀(e) / (e × 100)`
   - If `e < 0.25`: `0`
   - If `e < 0.55`: `-(eᵉ)⁵ × (e / 9)`
   - Else: `-1`

### Financial Metrics (Both Types)

Applied the same way for both BINARY and CONTINUOUS predictions:

**Shared Helpers:**

- `totalInvestment = equityInvestment + debtFinancing`
- `timeHours = estimatedTimeMinutes / 60`

**Equity Metrics:**

- `roe = equityInvestment × roiScore` (profit from equity)
- `roePct = roe / equityInvestment` (if equity > 0)

**Debt Metrics:**

- `financingGrossProfit = debtFinancing × roiScore`
- `debtRepayment = debtFinancing × -0.1` (fixed -10% interest)
- `rof = financingGrossProfit + debtRepayment` (net profit from debt)
- `rofPct = rof / debtFinancing` (if debt > 0, else -1 if rof is null or 0)

**Combined Metrics:**

- `netProfitEquityPlusDebt = roe + rof`
- `roiEquityPlusDebtPct = netProfitEquityPlusDebt / equityInvestment` (if equity > 0)
- `profitPerHour = netProfitEquityPlusDebt / timeHours` (if time > 0)

## Null Handling

All metrics gracefully handle null values:

- If `forecast.actualValue` is null, all accuracy and ROI metrics remain null
- If `prediction.confidence` is null (for binary), probability-based metrics remain null
- If investments are 0, percentage returns are null (to avoid division by zero)
- If time is 0, `profitPerHour` is null

## Testing

Comprehensive test suite in `tests/services/prediction-metrics.test.ts` covers:

- Binary predictions (correct/incorrect, with/without actual value)
- Continuous predictions (perfect/high/low, with/without actual value)
- Financial metrics calculation
- Edge cases (zero investments, null values)

Run tests:

```bash
npm test -- prediction-metrics.test.ts
```

## Example Scenarios

### Binary Prediction Example

```typescript
// Forecast
{
  type: "BINARY",
  actualValue: "true"
}

// Prediction
{
  value: "true",
  confidence: 90,  // 0.9 probability
  equityInvestment: 100,
  debtFinancing: 50,
  estimatedTime: 60  // 1 hour
}

// Calculated Metrics
{
  isCorrect: true,
  ppVariance: 0.1,  // |1 - 0.9|
  brierScore: 0.01,  // (1 - 0.9)²
  roiScore: ~1.67,  // Good score for low Brier
  roe: 167,  // 100 × 1.67
  rof: 78.5,  // (50 × 1.67) + (50 × -0.1)
  netProfitEquityPlusDebt: 245.5,
  profitPerHour: 245.5
}
```

### Continuous Prediction Example

```typescript
// Forecast
{
  type: "CONTINUOUS",
  actualValue: "100"
}

// Prediction
{
  value: "110",  // 10% high
  equityInvestment: 100,
  debtFinancing: 50,
  estimatedTime: 60
}

// Calculated Metrics
{
  error: 10,
  highLow: "HIGH",
  absoluteError: 10,
  absoluteActualErrorPct: 0.1,  // 10/100
  roiScore: ~0.2,  // Modest positive score
  roe: 20,
  rof: 5,
  netProfitEquityPlusDebt: 25,
  profitPerHour: 25
}
```

## Integration Points

The service is integrated at:

1. **Forecast Creation** (`src/services/forecasts.ts::createForecast`)
2. **Forecast Update** (`src/services/forecasts.ts::updateForecast`)

Both functions check if `actualValue` is set/changed and trigger recalculation.

## Future Enhancements

Potential improvements:

1. Batch recalculation for multiple forecasts
2. Real-time metrics updates via WebSockets
3. Metrics history tracking (snapshot on each recalculation)
4. Configurable ROI formulas per organization
5. Leaderboard aggregation service using these metrics
