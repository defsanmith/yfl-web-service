# Import Scripts

## Import Forecasts and Predictions

This script imports forecasts and predictions from CSV files into the database.

### Prerequisites

1. PostgreSQL database running (via Docker)
2. Organization created in the database
3. CSV files in the `data/` directory:
   - `test_forecasts.csv` - Forecast definitions
   - `predictions.csv` - Predictions for the test user

### Usage

```bash
# Set the test user email
export TEST_USER_EMAIL="your-email@example.com"

# Run the import script
npm run import:forecasts
```

Or directly:

```bash
TEST_USER_EMAIL="your-email@example.com" npx tsx scripts/import-forecasts.ts
```

### What It Does

1. **Finds/Creates Test User**: Looks up the user by `TEST_USER_EMAIL`, creates if not exists
2. **Imports Forecasts**: Creates all forecasts from `test_forecasts.csv` for the first organization
3. **Creates Categories**: Automatically creates forecast categories as needed
4. **Creates Test Users**: Generates 20 test users with names like `alice.smith@test.com`
5. **Imports Predictions**: 
   - Creates predictions for the test user using exact values from `predictions.csv`
   - Creates randomized predictions for all 20 test users (±25% variation for continuous, slight variation for binary)
   - Randomizes investment amounts (±40% variation)
   - Randomizes estimated time (50%-150% of base value)

### Result

- ~50 forecasts created
- ~1050 predictions created (50 forecasts × 21 users)
- 20 test users for leaderboard testing

### Example

```bash
# Using your actual email
export TEST_USER_EMAIL="sanmith@example.com"
npm run import:forecasts
```

This will:
- Create/find user `sanmith@example.com`
- Import all forecasts and predictions
- Create 20 additional test users with randomized predictions around your values
