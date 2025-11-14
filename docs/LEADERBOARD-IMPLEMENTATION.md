# Leaderboard Feature Implementation

## Overview

The leaderboard feature provides an aggregated view of user prediction performance across all forecasts in an organization. It displays comprehensive metrics including accuracy, ROI, and financial performance indicators.

## Features

### Key Capabilities

1. **Aggregated Metrics**: Displays user-level aggregated statistics from all predictions
2. **Configurable Columns**: Users can show/hide columns using the column visibility dropdown
3. **Sortable Columns**: Click any column header to sort ascending/descending
4. **Role-Based Access**: Both org admins and regular users can view their organization's leaderboard
5. **Optimized Queries**: Uses raw SQL for maximum performance with indexed queries

### Metrics Displayed

#### Basic Metrics
- **Total Predictions**: Count of all predictions submitted
- **Correct Predictions**: Count of accurate predictions
- **Accuracy Rate**: Percentage of correct predictions

#### Performance Metrics
- **Avg Brier Score**: Average probabilistic accuracy score
- **Avg Absolute Error**: Average magnitude of prediction errors
- **Avg Absolute Actual Error %**: Average percentage error relative to actual values
- **Avg Absolute Forecast Error %**: Average percentage error relative to forecast
- **Avg ROI Score**: Average return on investment score

#### Financial Metrics
- **Total ROE**: Total return on equity
- **Avg ROE %**: Average return on equity percentage
- **Total ROF**: Total return on financing
- **Avg ROF %**: Average return on financing percentage
- **Total Net Profit**: Total net profit (equity + debt)
- **Avg ROI (Equity + Debt) %**: Average combined ROI percentage
- **Avg Profit Per Hour**: Average hourly profit
- **Total Investment**: Sum of all investments
- **Total Equity Investment**: Sum of equity investments
- **Total Debt Financing**: Sum of debt financing

## Implementation Details

### Service Layer (`src/services/leaderboard.ts`)

The service provides optimized database queries using raw SQL:

```typescript
// Main leaderboard query with sorting
getOrganizationLeaderboardWithSort({
  organizationId: string,
  sortBy?: string,
  sortOrder?: "asc" | "desc"
})

// Get single user entry
getUserLeaderboardEntry(userId: string, organizationId: string)

// Get participant count
getLeaderboardParticipantCount(organizationId: string)
```

**Key Performance Optimizations:**
- Uses raw SQL with `$queryRaw` for efficient aggregation
- Single query with GROUP BY to aggregate all metrics at once
- Only includes forecasts with actual values set (`WHERE f."actualValue" IS NOT NULL`)
- Joins User → Prediction → Forecast tables efficiently

### Routes

#### Org Admin Dashboard
- URL: `/dashboard/org-admin`
- File: `src/app/(protected)/dashboard/org-admin/page.tsx`
- Access: Requires `ORG_ADMIN` role
- **Displays**: Dashboard header + Leaderboard table

#### User Dashboard
- URL: `/dashboard/user`
- File: `src/app/(protected)/dashboard/user/page.tsx`
- Access: Requires `USER` or `ORG_ADMIN` role
- **Displays**: Dashboard header + Upcoming forecasts + Leaderboard table
- Highlights current user's row in leaderboard

### View Component (`src/views/leaderboard/LeaderboardView.tsx`)

React Table-based implementation with:
- **Column Definitions**: 20+ configurable columns
- **Sorting**: Client-side and server-side sorting via URL params
- **Column Visibility**: Dropdown menu to show/hide columns
- **Default Visible Columns**: Shows most important metrics by default
- **Current User Highlight**: Highlights the logged-in user's row (for regular users)
- **Summary Stats**: Displays total participants, predictions, and average accuracy

### Schemas (`src/schemas/leaderboard.ts`)

Zod validation schemas for:
- `leaderboardQuerySchema`: Validates sortBy and sortOrder params
- `columnVisibilitySchema`: Validates column visibility configuration

### Navigation

Leaderboard added to sidebar for both roles:
- **Org Admin**: Between "Forecasts" and "Users"
- **Regular User**: After "My Forecasts"
- **Icon**: Trophy icon (`IconTrophy`)

### Router Updates (`src/constants/router.ts`)

```typescript
static ORG_ADMIN_LEADERBOARD = "/leaderboard";
static USER_LEADERBOARD = "/leaderboard";
```

## Usage

### For Org Admins

1. Navigate to "Leaderboard" in the sidebar
2. View all users in your organization with prediction metrics
3. Click column headers to sort by any metric
4. Use "Columns" dropdown to customize visible columns
5. All forecasts with actual values are included in calculations

### For Regular Users

1. Navigate to "Leaderboard" in the sidebar
2. View your organization's leaderboard
3. Your row is highlighted for easy identification
4. Same sorting and column customization capabilities

## Data Requirements

The leaderboard only displays data for:
- Users who have submitted predictions
- Forecasts that have `actualValue` set
- Users belonging to the organization

If no forecasts have actual values, the leaderboard will be empty.

## Performance Considerations

1. **Optimized Queries**: Uses raw SQL with aggregation functions
2. **Indexed Joins**: Leverages Prisma's automatic indexes on foreign keys
3. **Single Database Round-Trip**: All metrics calculated in one query
4. **Client-Side Caching**: React Table caches the data on the client
5. **URL-Based State**: Sorting preferences persist across page refreshes

## Future Enhancements

Possible improvements:
1. **Filtering**: Filter by date range, forecast type, or category
2. **Pagination**: Add pagination for organizations with many users
3. **Export**: Export leaderboard data to CSV/Excel
4. **Charts**: Add visualization charts for trends
5. **Historical Data**: Show leaderboard changes over time
6. **Per-Forecast Leaderboards**: Individual leaderboards for specific forecasts
7. **Badges/Achievements**: Award badges for top performers
8. **Real-time Updates**: WebSocket support for live leaderboard updates

## Testing Checklist

- [ ] Org admin can view organization leaderboard
- [ ] Regular user can view organization leaderboard
- [ ] Current user's row is highlighted for regular users
- [ ] Sorting works for all columns
- [ ] Column visibility toggle works
- [ ] Empty state displays when no data available
- [ ] Summary stats are calculated correctly
- [ ] Navigation links work from sidebar
- [ ] Only forecasts with actual values are included
- [ ] Users without predictions don't appear
- [ ] Performance is acceptable with 100+ users
