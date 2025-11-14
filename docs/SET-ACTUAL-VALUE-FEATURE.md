# Set Actual Value Feature Implementation

## Overview

This feature allows organization admins and super admins to set the actual value for forecasts. When the actual value is set before the due date or data release date, both dates are automatically updated to the current time. Setting the actual value triggers automatic recalculation of all prediction metrics.

## Changes Made

### 1. Schema Updates (`src/schemas/forecasts.ts`)

Added a new Zod schema for validating actual value input:

```typescript
export const setActualValueSchema = z
  .object({
    id: z.string().cuid("Invalid forecast ID"),
    actualValue: z.string().min(1, "Actual value is required"),
    type: z.nativeEnum(ForecastType),
  })
  .refine(
    (data) => {
      // For BINARY forecasts, actualValue must be "true" or "false"
      if (data.type === ForecastType.BINARY) {
        return data.actualValue === "true" || data.actualValue === "false";
      }
      return true;
    },
    {
      message: "Binary forecast actual value must be 'true' or 'false'",
      path: ["actualValue"],
    }
  )
  .refine(
    (data) => {
      // For CONTINUOUS forecasts, actualValue must be a valid number
      if (data.type === ForecastType.CONTINUOUS) {
        const num = parseFloat(data.actualValue);
        return !isNaN(num) && isFinite(num);
      }
      return true;
    },
    {
      message: "Continuous forecast actual value must be a valid number",
      path: ["actualValue"],
    }
  );
```

**Type exported:** `SetActualValueInput`

### 2. Service Layer (`src/services/forecasts.ts`)

Added a new service method `setActualValue()`:

```typescript
/**
 * Set the actual value for a forecast
 * If the actual value is set before the due date or data release date,
 * both dates are automatically updated to the current time
 */
export async function setActualValue(data: SetActualValueInput) {
  const now = new Date();

  // Get the current forecast
  const currentForecast = await prisma.forecast.findUnique({
    where: { id: data.id },
    select: { dueDate: true, dataReleaseDate: true },
  });

  if (!currentForecast) {
    throw new Error("Forecast not found");
  }

  // Check if we need to update dates
  const needsDateUpdate =
    now < currentForecast.dueDate ||
    (currentForecast.dataReleaseDate && now < currentForecast.dataReleaseDate);

  const forecast = await prisma.forecast.update({
    where: { id: data.id },
    data: {
      actualValue: data.actualValue,
      // Update dates if actual value is set before due date or data release date
      ...(needsDateUpdate && {
        dueDate: now,
        dataReleaseDate: now,
      }),
    },
    include: {
      organization: { select: { id: true, name: true } },
      category: { select: { id: true, name: true, color: true } },
    },
  });

  // Recalculate metrics for all predictions
  await PredictionMetricsService.recalculateMetricsForForecast(data.id);

  return forecast;
}
```

**Key Features:**
- Checks if current time is before due date or data release date
- Automatically updates both dates to current time if needed
- Triggers prediction metrics recalculation
- Returns updated forecast with relationships

### 3. Server Actions

#### Org Admin Action (`src/app/(protected)/(org-admin)/forecasts/[forecastId]/actions.ts`)

```typescript
export async function setActualValueAction(
  forecastId: string,
  prevState: ActionState<ActualValueFormData> | undefined,
  formData: FormData
): Promise<ActionState<ActualValueFormData>>
```

**Features:**
- Verifies org admin has permission (must own the forecast's organization)
- Validates actual value based on forecast type
- Calls `setActualValue()` service method
- Revalidates cache and redirects to forecast detail page

#### Super Admin Action (`src/app/(protected)/(super-admin)/orgs/[orgId]/forecasts/[forecastId]/actions.ts`)

```typescript
export async function setActualValueAction(
  orgId: string,
  forecastId: string,
  prevState: ActionState<ActualValueFormData> | undefined,
  formData: FormData
): Promise<ActionState<ActualValueFormData>>
```

**Features:**
- Similar to org admin action but for super admin context
- Accepts orgId as parameter for routing

### 4. UI Component (`src/components/forecasts/SetActualValueDialog.tsx`)

Created a new dialog component for setting actual values:

**Props:**
```typescript
type SetActualValueDialogProps = {
  forecastId: string;
  organizationId: string;
  forecastType: ForecastType;
  forecastTitle: string;
  currentActualValue?: string | null;
  dueDate: Date;
  dataReleaseDate?: Date | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isOrgAdmin?: boolean;
};
```

**Features:**
- **Different input types based on forecast type:**
  - **BINARY:** Radio buttons (True/False)
  - **CONTINUOUS:** Number input with step="any"
  - **CATEGORICAL:** Text input with helper text
  
- **Smart date update warning:**
  - Displays warning if setting actual value before due date or data release date
  - Explains that dates will be automatically updated

- **Form validation:**
  - Uses `useActionState` hook for server-side validation
  - Displays field-level and form-level errors
  - Shows loading state during submission

- **Auto-close on success:**
  - Closes dialog when action completes successfully

### 5. View Updates (`src/views/forecasts/ForecastDetailView.tsx`)

Updated the forecast detail view to:

1. **Import new components:**
   ```typescript
   import SetActualValueDialog from "@/components/forecasts/SetActualValueDialog";
   import { CheckCircle2 } from "lucide-react";
   ```

2. **Add state for dialog:**
   ```typescript
   const [showActualValueDialog, setShowActualValueDialog] = useState(false);
   ```

3. **Add "Set/Update Actual Value" button:**
   ```typescript
   <Button
     variant="outline"
     onClick={() => setShowActualValueDialog(true)}
   >
     <CheckCircle2 className="mr-2 h-4 w-4" />
     {forecast.actualValue ? "Update" : "Set"} Actual Value
   </Button>
   ```

4. **Display actual value when set:**
   ```typescript
   {forecast.actualValue && (
     <div>
       <dt className="text-sm font-medium text-muted-foreground">
         Actual Value
       </dt>
       <dd className="mt-1">
         <Badge variant="default" className="text-base">
           {forecast.type === ForecastType.BINARY
             ? forecast.actualValue === "true"
               ? "True"
               : "False"
             : forecast.actualValue}
         </Badge>
       </dd>
     </div>
   )}
   ```

5. **Render dialog component:**
   ```typescript
   <SetActualValueDialog
     forecastId={forecast.id}
     organizationId={forecast.organizationId}
     forecastType={forecast.type}
     forecastTitle={forecast.title}
     currentActualValue={forecast.actualValue}
     dueDate={forecast.dueDate}
     dataReleaseDate={forecast.dataReleaseDate}
     open={showActualValueDialog}
     onOpenChange={setShowActualValueDialog}
     isOrgAdmin={isOrgAdmin}
   />
   ```

### 6. shadcn/ui Component Installation

Installed the radio-group component:
```bash
npx shadcn@latest add radio-group
```

**File created:** `src/components/ui/radio-group.tsx`

## User Flow

### Setting Actual Value (First Time)

1. User navigates to forecast detail page
2. Clicks "Set Actual Value" button
3. Dialog opens with appropriate input based on forecast type:
   - **Binary:** Radio buttons for True/False
   - **Continuous:** Number input field
   - **Categorical:** Text input field
4. If setting before due date/data release date, warning is displayed
5. User enters actual value and submits
6. Server validates input based on forecast type
7. If valid:
   - Actual value is saved
   - Due date and data release date updated to current time (if needed)
   - All prediction metrics are recalculated
   - User redirected to forecast detail page
   - Actual value displayed in details card

### Updating Actual Value

1. User clicks "Update Actual Value" button (button text changes if value exists)
2. Dialog opens with current value pre-filled
3. User modifies value and submits
4. Same validation and update process as above

## Automatic Date Updates

The system automatically updates dates when:

**Condition:**
```typescript
now < currentForecast.dueDate || 
(currentForecast.dataReleaseDate && now < currentForecast.dataReleaseDate)
```

**Action:**
- Both `dueDate` and `dataReleaseDate` are set to current timestamp
- This ensures predictions are "closed" when actual value becomes known early

**Example Scenario:**
- Forecast due date: December 1, 2025
- Data release date: December 5, 2025
- Actual value set on: November 11, 2025
- **Result:** Both dates updated to November 11, 2025

## Validation Rules

### Binary Forecasts
- Actual value must be exactly "true" or "false" (string)
- Case-sensitive validation

### Continuous Forecasts
- Actual value must be a valid number
- Parsed using `parseFloat()`
- Must pass `!isNaN()` and `isFinite()` checks
- Supports decimals, negative numbers, scientific notation

### Categorical Forecasts
- Actual value must be non-empty string
- No specific validation against predefined options (flexibility for admin)
- Helper text suggests using predefined options

## Integration with Prediction Metrics

Setting the actual value automatically triggers:

```typescript
await PredictionMetricsService.recalculateMetricsForForecast(data.id);
```

This recalculates all derived metrics for all predictions:
- Accuracy metrics (isCorrect, error, brierScore, etc.)
- ROI scores
- Financial metrics (roe, rof, net profit, profit per hour)

See `docs/PREDICTION-METRICS.md` for detailed formula documentation.

## Security & Permissions

### Org Admin
- Can only set actual value for forecasts in their organization
- Must have `organizationId` set on their user record
- Action verifies forecast belongs to their organization

### Super Admin
- Can set actual value for any forecast
- No organization restriction

### User (Regular)
- No access to set actual value
- Only view actual value if set

## Files Modified

1. ✅ `src/schemas/forecasts.ts` - Added setActualValueSchema
2. ✅ `src/services/forecasts.ts` - Added setActualValue method
3. ✅ `src/app/(protected)/(org-admin)/forecasts/[forecastId]/actions.ts` - Added setActualValueAction
4. ✅ `src/app/(protected)/(super-admin)/orgs/[orgId]/forecasts/[forecastId]/actions.ts` - Added setActualValueAction
5. ✅ `src/views/forecasts/ForecastDetailView.tsx` - Added UI for setting actual value

## Files Created

1. ✅ `src/components/forecasts/SetActualValueDialog.tsx` - Dialog component
2. ✅ `src/components/ui/radio-group.tsx` - shadcn radio group component (via CLI)

## Testing Checklist

### Manual Testing

- [ ] **Binary Forecast - Set actual value:**
  - [ ] Select "True" and submit
  - [ ] Select "False" and submit
  - [ ] Verify actual value displays correctly
  - [ ] Verify dates updated if set early

- [ ] **Continuous Forecast - Set actual value:**
  - [ ] Enter positive number
  - [ ] Enter negative number
  - [ ] Enter decimal number
  - [ ] Try entering invalid text (should show error)
  - [ ] Verify actual value displays correctly

- [ ] **Categorical Forecast - Set actual value:**
  - [ ] Enter one of the predefined options
  - [ ] Verify actual value displays correctly

- [ ] **Date Update Logic:**
  - [ ] Set actual value before due date → verify both dates updated
  - [ ] Set actual value after due date but before data release → verify both dates updated
  - [ ] Set actual value after both dates → verify dates unchanged

- [ ] **Metrics Recalculation:**
  - [ ] Create predictions for a forecast
  - [ ] Set actual value
  - [ ] Verify prediction metrics are calculated
  - [ ] Check database for populated metric fields

- [ ] **Permissions:**
  - [ ] Org admin can set value for their org's forecasts
  - [ ] Org admin cannot set value for other org's forecasts
  - [ ] Super admin can set value for any forecast

- [ ] **Update Actual Value:**
  - [ ] Set initial value
  - [ ] Click "Update Actual Value"
  - [ ] Verify current value is pre-filled
  - [ ] Update and verify new value displays

## Future Enhancements

1. **Audit Trail:**
   - Track who set/updated actual value and when
   - Store history of actual value changes

2. **Bulk Set Actual Values:**
   - Allow setting actual values for multiple forecasts at once
   - CSV import for bulk updates

3. **Auto-resolution:**
   - Integrate with external data sources
   - Automatically set actual value when data becomes available

4. **Notifications:**
   - Notify users when actual value is set
   - Alert prediction makers about metric calculations

5. **Categorical Validation:**
   - Validate categorical actual value against predefined options
   - Dropdown instead of text input for better UX

6. **Confidence Intervals:**
   - For continuous forecasts, allow setting confidence ranges
   - Track partial correctness for range predictions

## Summary

✅ Complete implementation of set actual value feature
✅ Automatic date adjustment when set early
✅ Type-specific validation (binary, continuous, categorical)
✅ Integrated with prediction metrics recalculation
✅ Separate dialog component for clean UX
✅ Warning message for early date updates
✅ Permission checks for org admin and super admin
✅ Full support for both admin contexts
✅ Pre-filled values for updates
✅ Clean error handling and validation feedback
