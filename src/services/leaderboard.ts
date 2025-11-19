import prisma from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

/**
 * Leaderboard entry representing a user's aggregated prediction performance
 */
export interface LeaderboardEntry {
  userId: string;
  userName: string | null;
  userEmail: string;

  // Counts & accuracy
  totalCompletedPredictions: number;
  completedBinaryPredictions: number;
  completedContinuousPredictions: number;
  totalPredictions: number; // Legacy field - same as totalCompletedPredictions
  correctPredictions: number;
  incorrectPredictions: number;
  accuracyRate: number | null; // Binary: % correct
  incorrectRate: number | null; // Binary: % incorrect
  avgProbabilityBinary: number | null; // Binary: average confidence/probability
  highCountContinuous: number;
  lowCountContinuous: number;
  perfectCountContinuous: number;
  highPercentContinuous: number | null; // % HIGH
  lowPercentContinuous: number | null; // % LOW
  perfectPercentContinuous: number | null; // % PERFECT

  // Capital & profit roll-ups
  totalEquityInvestment: number | null;
  totalDebtFinancing: number | null;
  totalInvestment: number | null;
  totalNetProfit: number | null;
  fundBalance: number | null; // Starting fund + net profit
  profitFromEquity: number | null;
  profitFromFinancing: number | null;

  // Overall ROI (equity + debt)
  roiReal: number | null; // Net profit / Total investment
  roiAverage: number | null; // Average of per-question ROI %
  roiMedian: number | null; // Median of per-question ROI %
  avgRoiEquityPlusDebtPct: number | null; // Legacy - same as roiAverage

  // Equity returns (ROE)
  roeReal: number | null; // Profit from equity / Total equity invested
  roeAverage: number | null; // Average of per-question ROE %
  roeMedian: number | null; // Median of per-question ROE %
  totalRoe: number | null; // Legacy - same as profitFromEquity
  avgRoePct: number | null; // Legacy - same as roeAverage

  // Financing returns (ROF)
  interestPaymentOnDebt: number | null; // Sum of (-10% × Debt Financing)
  rofReal: number | null; // Profit from financing / Total debt financed
  rofAverage: number | null; // Average of per-question ROF %
  rofMedian: number | null; // Median of per-question ROF %
  totalRof: number | null; // Legacy - same as profitFromFinancing
  avgRofPct: number | null; // Legacy - same as rofAverage

  // Error metrics (continuous only)
  avgActualError: number | null; // Average of absolute actual error %
  medianActualError: number | null; // Median of absolute actual error %
  avgForecastError: number | null; // Average of absolute forecast error %
  medianForecastError: number | null; // Median of absolute forecast error %
  avgAbsoluteError: number | null; // Legacy
  avgAbsoluteActualErrorPct: number | null; // Legacy - same as avgActualError
  avgAbsoluteForecastErrorPct: number | null; // Legacy - same as avgForecastError

  // Time & productivity
  totalForecastTimeMinutes: number | null;
  avgTimePerForecastMinutes: number | null;
  weightedAvgHourlyProfit: number | null; // Net profit / (total time / 60)
  simpleAvgHourlyProfit: number | null; // Average of per-question profit per hour
  avgProfitPerHour: number | null; // Legacy - same as simpleAvgHourlyProfit

  // Legacy fields
  avgBrierScore: number | null;
  avgRoiScore: number | null;
}

/**
 * Raw database result type (before conversion)
 */
type RawLeaderboardEntry = Omit<
  LeaderboardEntry,
  | "accuracyRate"
  | "incorrectRate"
  | "avgProbabilityBinary"
  | "highPercentContinuous"
  | "lowPercentContinuous"
  | "perfectPercentContinuous"
  | "fundBalance"
  | "roiReal"
  | "roiAverage"
  | "roiMedian"
  | "avgRoiEquityPlusDebtPct"
  | "roeReal"
  | "roeAverage"
  | "roeMedian"
  | "avgRoePct"
  | "interestPaymentOnDebt"
  | "rofReal"
  | "rofAverage"
  | "rofMedian"
  | "avgRofPct"
  | "avgActualError"
  | "medianActualError"
  | "avgForecastError"
  | "medianForecastError"
  | "avgAbsoluteActualErrorPct"
  | "avgAbsoluteForecastErrorPct"
  | "weightedAvgHourlyProfit"
  | "simpleAvgHourlyProfit"
  | "avgProfitPerHour"
  | "avgBrierScore"
  | "avgRoiScore"
  | "totalRoe"
  | "totalRof"
  | "totalNetProfit"
  | "totalInvestment"
  | "totalEquityInvestment"
  | "totalDebtFinancing"
  | "profitFromEquity"
  | "profitFromFinancing"
  | "avgAbsoluteError"
  | "totalForecastTimeMinutes"
  | "avgTimePerForecastMinutes"
> & {
  accuracyRate: Decimal | null;
  incorrectRate: Decimal | null;
  avgProbabilityBinary: Decimal | null;
  highPercentContinuous: Decimal | null;
  lowPercentContinuous: Decimal | null;
  perfectPercentContinuous: Decimal | null;
  fundBalance: Decimal | null;
  roiReal: Decimal | null;
  roiAverage: Decimal | null;
  roiMedian: Decimal | null;
  avgRoiEquityPlusDebtPct: Decimal | null;
  roeReal: Decimal | null;
  roeAverage: Decimal | null;
  roeMedian: Decimal | null;
  avgRoePct: Decimal | null;
  interestPaymentOnDebt: Decimal | null;
  rofReal: Decimal | null;
  rofAverage: Decimal | null;
  rofMedian: Decimal | null;
  avgRofPct: Decimal | null;
  avgActualError: Decimal | null;
  medianActualError: Decimal | null;
  avgForecastError: Decimal | null;
  medianForecastError: Decimal | null;
  avgAbsoluteActualErrorPct: Decimal | null;
  avgAbsoluteForecastErrorPct: Decimal | null;
  weightedAvgHourlyProfit: Decimal | null;
  simpleAvgHourlyProfit: Decimal | null;
  avgProfitPerHour: Decimal | null;
  avgBrierScore: Decimal | null;
  avgRoiScore: Decimal | null;
  totalRoe: Decimal | null;
  totalRof: Decimal | null;
  totalNetProfit: Decimal | null;
  totalInvestment: Decimal | null;
  totalEquityInvestment: Decimal | null;
  totalDebtFinancing: Decimal | null;
  profitFromEquity: Decimal | null;
  profitFromFinancing: Decimal | null;
  avgAbsoluteError: Decimal | null;
  totalForecastTimeMinutes: Decimal | null;
  avgTimePerForecastMinutes: Decimal | null;
};

/**
 * Convert Decimal objects to numbers for Client Component compatibility
 */
function convertDecimalsToNumbers(raw: RawLeaderboardEntry): LeaderboardEntry {
  return {
    ...raw,
    accuracyRate: raw.accuracyRate ? Number(raw.accuracyRate) : null,
    incorrectRate: raw.incorrectRate ? Number(raw.incorrectRate) : null,
    avgProbabilityBinary: raw.avgProbabilityBinary
      ? Number(raw.avgProbabilityBinary)
      : null,
    highPercentContinuous: raw.highPercentContinuous
      ? Number(raw.highPercentContinuous)
      : null,
    lowPercentContinuous: raw.lowPercentContinuous
      ? Number(raw.lowPercentContinuous)
      : null,
    perfectPercentContinuous: raw.perfectPercentContinuous
      ? Number(raw.perfectPercentContinuous)
      : null,
    fundBalance: raw.fundBalance ? Number(raw.fundBalance) : null,
    roiReal: raw.roiReal ? Number(raw.roiReal) : null,
    roiAverage: raw.roiAverage ? Number(raw.roiAverage) : null,
    roiMedian: raw.roiMedian ? Number(raw.roiMedian) : null,
    avgRoiEquityPlusDebtPct: raw.avgRoiEquityPlusDebtPct
      ? Number(raw.avgRoiEquityPlusDebtPct)
      : null,
    roeReal: raw.roeReal ? Number(raw.roeReal) : null,
    roeAverage: raw.roeAverage ? Number(raw.roeAverage) : null,
    roeMedian: raw.roeMedian ? Number(raw.roeMedian) : null,
    avgRoePct: raw.avgRoePct ? Number(raw.avgRoePct) : null,
    interestPaymentOnDebt: raw.interestPaymentOnDebt
      ? Number(raw.interestPaymentOnDebt)
      : null,
    rofReal: raw.rofReal ? Number(raw.rofReal) : null,
    rofAverage: raw.rofAverage ? Number(raw.rofAverage) : null,
    rofMedian: raw.rofMedian ? Number(raw.rofMedian) : null,
    avgRofPct: raw.avgRofPct ? Number(raw.avgRofPct) : null,
    avgActualError: raw.avgActualError ? Number(raw.avgActualError) : null,
    medianActualError: raw.medianActualError
      ? Number(raw.medianActualError)
      : null,
    avgForecastError: raw.avgForecastError
      ? Number(raw.avgForecastError)
      : null,
    medianForecastError: raw.medianForecastError
      ? Number(raw.medianForecastError)
      : null,
    avgAbsoluteActualErrorPct: raw.avgAbsoluteActualErrorPct
      ? Number(raw.avgAbsoluteActualErrorPct)
      : null,
    avgAbsoluteForecastErrorPct: raw.avgAbsoluteForecastErrorPct
      ? Number(raw.avgAbsoluteForecastErrorPct)
      : null,
    weightedAvgHourlyProfit: raw.weightedAvgHourlyProfit
      ? Number(raw.weightedAvgHourlyProfit)
      : null,
    simpleAvgHourlyProfit: raw.simpleAvgHourlyProfit
      ? Number(raw.simpleAvgHourlyProfit)
      : null,
    avgProfitPerHour: raw.avgProfitPerHour
      ? Number(raw.avgProfitPerHour)
      : null,
    avgBrierScore: raw.avgBrierScore ? Number(raw.avgBrierScore) : null,
    avgRoiScore: raw.avgRoiScore ? Number(raw.avgRoiScore) : null,
    totalRoe: raw.totalRoe ? Number(raw.totalRoe) : null,
    totalRof: raw.totalRof ? Number(raw.totalRof) : null,
    totalNetProfit: raw.totalNetProfit ? Number(raw.totalNetProfit) : null,
    totalInvestment: raw.totalInvestment ? Number(raw.totalInvestment) : null,
    totalEquityInvestment: raw.totalEquityInvestment
      ? Number(raw.totalEquityInvestment)
      : null,
    totalDebtFinancing: raw.totalDebtFinancing
      ? Number(raw.totalDebtFinancing)
      : null,
    profitFromEquity: raw.profitFromEquity
      ? Number(raw.profitFromEquity)
      : null,
    profitFromFinancing: raw.profitFromFinancing
      ? Number(raw.profitFromFinancing)
      : null,
    avgAbsoluteError: raw.avgAbsoluteError
      ? Number(raw.avgAbsoluteError)
      : null,
    totalForecastTimeMinutes: raw.totalForecastTimeMinutes
      ? Number(raw.totalForecastTimeMinutes)
      : null,
    avgTimePerForecastMinutes: raw.avgTimePerForecastMinutes
      ? Number(raw.avgTimePerForecastMinutes)
      : null,
  };
}

/**
 * Get aggregated leaderboard data for an organization
 * Only includes predictions for forecasts that have actual values set
 * Excludes ORG_ADMIN and SUPER_ADMIN users from leaderboard
 */
export async function getOrganizationLeaderboard(
  organizationId: string
): Promise<LeaderboardEntry[]> {
  // Use raw SQL for optimized aggregation
  const result = await prisma.$queryRaw<RawLeaderboardEntry[]>`
    WITH user_predictions AS (
      SELECT 
        u.id as user_id,
        u.name as user_name,
        u.email as user_email,
        f.type as forecast_type,
        p."isCorrect",
        p."highLow",
        p.confidence,
        p."equityInvestment",
        p."debtFinancing",
        p."totalInvestment",
        p.roe,
        p."roePct",
        p.rof,
        p."rofPct",
        p."debtRepayment",
        p."netProfitEquityPlusDebt",
        p."roiEquityPlusDebtPct",
        p."profitPerHour",
        p."estimatedTime",
        p."absoluteActualErrorPct",
        p."absoluteForecastErrorPct",
        p."absoluteError",
        p."brierScore",
        p."roiScore"
      FROM "User" u
      INNER JOIN "Prediction" p ON p."userId" = u.id
      INNER JOIN "Forecast" f ON f.id = p."forecastId"
      WHERE 
        u."organizationId" = ${organizationId}
        AND f."actualValue" IS NOT NULL
        AND u.role = 'USER'
    ),
    percentile_agg AS (
      SELECT
        user_id,
        percentile_cont(0.5) WITHIN GROUP (ORDER BY "roiEquityPlusDebtPct") as roi_median,
        percentile_cont(0.5) WITHIN GROUP (ORDER BY "roePct") as roe_median,
        percentile_cont(0.5) WITHIN GROUP (ORDER BY "rofPct") as rof_median,
        percentile_cont(0.5) WITHIN GROUP (ORDER BY "absoluteActualErrorPct") as actual_error_median,
        percentile_cont(0.5) WITHIN GROUP (ORDER BY "absoluteForecastErrorPct") as forecast_error_median
      FROM user_predictions
      WHERE "roiEquityPlusDebtPct" IS NOT NULL 
         OR "roePct" IS NOT NULL 
         OR "rofPct" IS NOT NULL
         OR "absoluteActualErrorPct" IS NOT NULL
         OR "absoluteForecastErrorPct" IS NOT NULL
      GROUP BY user_id
    )
    SELECT 
      up.user_id as "userId",
      up.user_name as "userName",
      up.user_email as "userEmail",
      
      -- Counts & accuracy
      COUNT(*)::int as "totalCompletedPredictions",
      COUNT(*)::int as "totalPredictions",
      COUNT(CASE WHEN forecast_type = 'BINARY' AND confidence IS NOT NULL THEN 1 END)::int as "completedBinaryPredictions",
      COUNT(CASE WHEN forecast_type = 'CONTINUOUS' THEN 1 END)::int as "completedContinuousPredictions",
      COUNT(CASE WHEN "isCorrect" = true THEN 1 END)::int as "correctPredictions",
      COUNT(CASE WHEN "isCorrect" = false THEN 1 END)::int as "incorrectPredictions",
      CASE 
        WHEN COUNT(CASE WHEN forecast_type = 'BINARY' THEN 1 END) > 0 THEN 
          (COUNT(CASE WHEN "isCorrect" = true THEN 1 END)::numeric / 
           COUNT(CASE WHEN forecast_type = 'BINARY' THEN 1 END)::numeric)
        ELSE NULL 
      END as "accuracyRate",
      CASE 
        WHEN COUNT(CASE WHEN forecast_type = 'BINARY' THEN 1 END) > 0 THEN 
          (COUNT(CASE WHEN "isCorrect" = false THEN 1 END)::numeric / 
           COUNT(CASE WHEN forecast_type = 'BINARY' THEN 1 END)::numeric)
        ELSE NULL 
      END as "incorrectRate",
      AVG(CASE WHEN forecast_type = 'BINARY' AND confidence IS NOT NULL THEN confidence::numeric / 100 END) as "avgProbabilityBinary",
      COUNT(CASE WHEN "highLow" = 'HIGH' THEN 1 END)::int as "highCountContinuous",
      COUNT(CASE WHEN "highLow" = 'LOW' THEN 1 END)::int as "lowCountContinuous",
      COUNT(CASE WHEN "highLow" = 'PERFECT' THEN 1 END)::int as "perfectCountContinuous",
      CASE 
        WHEN COUNT(CASE WHEN forecast_type = 'CONTINUOUS' THEN 1 END) > 0 THEN 
          (COUNT(CASE WHEN "highLow" = 'HIGH' THEN 1 END)::numeric / 
           COUNT(CASE WHEN forecast_type = 'CONTINUOUS' THEN 1 END)::numeric)
        ELSE NULL 
      END as "highPercentContinuous",
      CASE 
        WHEN COUNT(CASE WHEN forecast_type = 'CONTINUOUS' THEN 1 END) > 0 THEN 
          (COUNT(CASE WHEN "highLow" = 'LOW' THEN 1 END)::numeric / 
           COUNT(CASE WHEN forecast_type = 'CONTINUOUS' THEN 1 END)::numeric)
        ELSE NULL 
      END as "lowPercentContinuous",
      CASE 
        WHEN COUNT(CASE WHEN forecast_type = 'CONTINUOUS' THEN 1 END) > 0 THEN 
          (COUNT(CASE WHEN "highLow" = 'PERFECT' THEN 1 END)::numeric / 
           COUNT(CASE WHEN forecast_type = 'CONTINUOUS' THEN 1 END)::numeric)
        ELSE NULL 
      END as "perfectPercentContinuous",
      
      -- Capital & profit roll-ups
      SUM("equityInvestment") as "totalEquityInvestment",
      SUM("debtFinancing") as "totalDebtFinancing",
      SUM("totalInvestment") as "totalInvestment",
      SUM("netProfitEquityPlusDebt") as "totalNetProfit",
      (1000000000 + SUM("netProfitEquityPlusDebt")) as "fundBalance",
      SUM(roe) as "profitFromEquity",
      SUM(rof) as "profitFromFinancing",
      
      -- Overall ROI (equity + debt)
      CASE 
        WHEN SUM("totalInvestment") > 0 THEN 
          SUM("netProfitEquityPlusDebt") / SUM("totalInvestment")
        ELSE NULL 
      END as "roiReal",
      AVG("roiEquityPlusDebtPct") as "roiAverage",
      pa.roi_median as "roiMedian",
      AVG("roiEquityPlusDebtPct") as "avgRoiEquityPlusDebtPct",
      
      -- Equity returns (ROE)
      CASE 
        WHEN SUM("equityInvestment") > 0 THEN 
          SUM(roe) / SUM("equityInvestment")
        ELSE NULL 
      END as "roeReal",
      AVG("roePct") as "roeAverage",
      pa.roe_median as "roeMedian",
      SUM(roe) as "totalRoe",
      AVG("roePct") as "avgRoePct",
      
      -- Financing returns (ROF)
      SUM("debtRepayment") as "interestPaymentOnDebt",
      CASE 
        WHEN SUM("debtFinancing") > 0 THEN 
          SUM(rof) / SUM("debtFinancing")
        ELSE NULL 
      END as "rofReal",
      AVG("rofPct") as "rofAverage",
      pa.rof_median as "rofMedian",
      SUM(rof) as "totalRof",
      AVG("rofPct") as "avgRofPct",
      
      -- Error metrics (continuous only)
      AVG("absoluteActualErrorPct") as "avgActualError",
      pa.actual_error_median as "medianActualError",
      AVG("absoluteForecastErrorPct") as "avgForecastError",
      pa.forecast_error_median as "medianForecastError",
      AVG("absoluteError") as "avgAbsoluteError",
      AVG("absoluteActualErrorPct") as "avgAbsoluteActualErrorPct",
      AVG("absoluteForecastErrorPct") as "avgAbsoluteForecastErrorPct",
      
      -- Time & productivity
      SUM("estimatedTime") as "totalForecastTimeMinutes",
      AVG("estimatedTime") as "avgTimePerForecastMinutes",
      CASE 
        WHEN SUM("estimatedTime") > 0 THEN 
          SUM("netProfitEquityPlusDebt") / (SUM("estimatedTime") / 60.0)
        ELSE NULL 
      END as "weightedAvgHourlyProfit",
      AVG("profitPerHour") as "simpleAvgHourlyProfit",
      AVG("profitPerHour") as "avgProfitPerHour",
      
      -- Legacy fields
      AVG("brierScore") as "avgBrierScore",
      AVG("roiScore") as "avgRoiScore"
      
    FROM user_predictions up
    LEFT JOIN percentile_agg pa ON pa.user_id = up.user_id
    GROUP BY up.user_id, up.user_name, up.user_email, pa.roi_median, pa.roe_median, pa.rof_median, pa.actual_error_median, pa.forecast_error_median
    ORDER BY "accuracyRate" DESC NULLS LAST, "totalPredictions" DESC
  `;

  return result.map(convertDecimalsToNumbers);
}

/**
 * Get detailed leaderboard with sortable columns and filters
 * This version allows custom sorting and filtering by forecast/category
 */
export async function getOrganizationLeaderboardWithSort({
  organizationId,
  sortBy = "accuracyRate",
  sortOrder = "desc",
  forecastIds,
  categoryIds,
  forecastTypes,
  recentCount,
  minForecasts,
  dateFrom,
  dateTo,
}: {
  organizationId: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  forecastIds?: string; // Comma-separated IDs
  categoryIds?: string; // Comma-separated IDs
  forecastTypes?: string; // Comma-separated types
  recentCount?: number;
  minForecasts?: number;
  dateFrom?: string;
  dateTo?: string;
}): Promise<LeaderboardEntry[]> {
  // Map frontend column names to SQL column aliases (what we SELECT AS)
  const validSortColumns = [
    "userName",
    "userEmail",
    "totalCompletedPredictions",
    "completedBinaryPredictions",
    "completedContinuousPredictions",
    "totalPredictions",
    "correctPredictions",
    "incorrectPredictions",
    "accuracyRate",
    "incorrectRate",
    "avgProbabilityBinary",
    "highPercentContinuous",
    "lowPercentContinuous",
    "perfectPercentContinuous",
    "totalEquityInvestment",
    "totalDebtFinancing",
    "totalInvestment",
    "totalNetProfit",
    "fundBalance",
    "profitFromEquity",
    "profitFromFinancing",
    "roiReal",
    "roiAverage",
    "roiMedian",
    "avgRoiEquityPlusDebtPct",
    "roeReal",
    "roeAverage",
    "roeMedian",
    "totalRoe",
    "avgRoePct",
    "interestPaymentOnDebt",
    "rofReal",
    "rofAverage",
    "rofMedian",
    "totalRof",
    "avgRofPct",
    "avgActualError",
    "medianActualError",
    "avgForecastError",
    "medianForecastError",
    "avgAbsoluteError",
    "avgAbsoluteActualErrorPct",
    "avgAbsoluteForecastErrorPct",
    "totalForecastTimeMinutes",
    "avgTimePerForecastMinutes",
    "weightedAvgHourlyProfit",
    "simpleAvgHourlyProfit",
    "avgProfitPerHour",
    "avgBrierScore",
    "avgRoiScore",
  ];

  // Validate and sanitize sort column
  const sortColumn = validSortColumns.includes(sortBy)
    ? sortBy
    : "accuracyRate";
  const direction = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";
  const nullsPosition = direction === "DESC" ? "NULLS LAST" : "NULLS FIRST";

  // Build WHERE clause conditions
  const conditions = [
    'u."organizationId" = $1',
    'f."actualValue" IS NOT NULL',
    "u.role = 'USER'",
  ];
  const params: (string | number)[] = [organizationId];

  // Filter by forecast IDs
  if (forecastIds) {
    const ids = forecastIds.split(",").filter(Boolean);
    if (ids.length > 0) {
      const placeholders = ids
        .map((_, i) => `$${params.length + i + 1}`)
        .join(", ");
      conditions.push(`f.id IN (${placeholders})`);
      params.push(...ids);
    }
  }

  // Filter by category IDs
  if (categoryIds) {
    const ids = categoryIds.split(",").filter(Boolean);
    if (ids.length > 0) {
      const placeholders = ids
        .map((_, i) => `$${params.length + i + 1}`)
        .join(", ");
      conditions.push(`f."categoryId" IN (${placeholders})`);
      params.push(...ids);
    }
  }

  // Filter by forecast types
  if (forecastTypes) {
    const types = forecastTypes.split(",").filter(Boolean);
    if (types.length > 0) {
      const placeholders = types
        .map((_, i) => `$${params.length + i + 1}::"ForecastType"`)
        .join(", ");
      conditions.push(`f.type IN (${placeholders})`);
      params.push(...types);
    }
  }

  // Filter by date range (dataReleaseDate)
  if (dateFrom) {
    conditions.push(`f."dataReleaseDate" >= $${params.length + 1}::timestamp`);
    params.push(dateFrom);
  }
  if (dateTo) {
    conditions.push(`f."dataReleaseDate" <= $${params.length + 1}::timestamp`);
    params.push(dateTo);
  }

  // Build subquery for recent forecasts filter
  let forecastSubquery = "";
  if (recentCount) {
    forecastSubquery = `
      AND f.id IN (
        SELECT id FROM "Forecast"
        WHERE "organizationId" = $1
        AND "actualValue" IS NOT NULL
        ORDER BY "dataReleaseDate" DESC NULLS LAST
        LIMIT ${recentCount}
      )
    `;
  }

  const whereClause = conditions.join(" AND ") + forecastSubquery;

  // Build HAVING clause for minimum forecasts filter
  let havingClause = "";
  if (minForecasts) {
    havingClause = `HAVING COUNT(p.id) >= ${minForecasts}`;
  }

  // Use $queryRawUnsafe for dynamic ORDER BY
  const query = `
    WITH user_predictions AS (
      SELECT 
        u.id as user_id,
        u.name as user_name,
        u.email as user_email,
        f.type as forecast_type,
        p."isCorrect",
        p."highLow",
        p.confidence,
        p."equityInvestment",
        p."debtFinancing",
        p."totalInvestment",
        p.roe,
        p."roePct",
        p.rof,
        p."rofPct",
        p."debtRepayment",
        p."netProfitEquityPlusDebt",
        p."roiEquityPlusDebtPct",
        p."profitPerHour",
        p."estimatedTime",
        p."absoluteActualErrorPct",
        p."absoluteForecastErrorPct",
        p."absoluteError",
        p."brierScore",
        p."roiScore"
      FROM "User" u
      INNER JOIN "Prediction" p ON p."userId" = u.id
      INNER JOIN "Forecast" f ON f.id = p."forecastId"
      WHERE ${whereClause}
    ),
    percentile_agg AS (
      SELECT
        user_id,
        percentile_cont(0.5) WITHIN GROUP (ORDER BY "roiEquityPlusDebtPct") as roi_median,
        percentile_cont(0.5) WITHIN GROUP (ORDER BY "roePct") as roe_median,
        percentile_cont(0.5) WITHIN GROUP (ORDER BY "rofPct") as rof_median,
        percentile_cont(0.5) WITHIN GROUP (ORDER BY "absoluteActualErrorPct") as actual_error_median,
        percentile_cont(0.5) WITHIN GROUP (ORDER BY "absoluteForecastErrorPct") as forecast_error_median
      FROM user_predictions
      WHERE "roiEquityPlusDebtPct" IS NOT NULL 
         OR "roePct" IS NOT NULL 
         OR "rofPct" IS NOT NULL
         OR "absoluteActualErrorPct" IS NOT NULL
         OR "absoluteForecastErrorPct" IS NOT NULL
      GROUP BY user_id
    )
    SELECT 
      up.user_id as "userId",
      up.user_name as "userName",
      up.user_email as "userEmail",
      COUNT(*)::int as "totalCompletedPredictions",
      COUNT(*)::int as "totalPredictions",
      COUNT(CASE WHEN forecast_type = 'BINARY' AND confidence IS NOT NULL THEN 1 END)::int as "completedBinaryPredictions",
      COUNT(CASE WHEN forecast_type = 'CONTINUOUS' THEN 1 END)::int as "completedContinuousPredictions",
      COUNT(CASE WHEN "isCorrect" = true THEN 1 END)::int as "correctPredictions",
      COUNT(CASE WHEN "isCorrect" = false THEN 1 END)::int as "incorrectPredictions",
      CASE 
        WHEN COUNT(CASE WHEN forecast_type = 'BINARY' THEN 1 END) > 0 THEN 
          (COUNT(CASE WHEN "isCorrect" = true THEN 1 END)::numeric / COUNT(CASE WHEN forecast_type = 'BINARY' THEN 1 END)::numeric)
        ELSE NULL 
      END as "accuracyRate",
      CASE 
        WHEN COUNT(CASE WHEN forecast_type = 'BINARY' THEN 1 END) > 0 THEN 
          (COUNT(CASE WHEN "isCorrect" = false THEN 1 END)::numeric / COUNT(CASE WHEN forecast_type = 'BINARY' THEN 1 END)::numeric)
        ELSE NULL 
      END as "incorrectRate",
      AVG(CASE WHEN forecast_type = 'BINARY' AND confidence IS NOT NULL THEN confidence::numeric / 100 END) as "avgProbabilityBinary",
      COUNT(CASE WHEN "highLow" = 'HIGH' THEN 1 END)::int as "highCountContinuous",
      COUNT(CASE WHEN "highLow" = 'LOW' THEN 1 END)::int as "lowCountContinuous",
      COUNT(CASE WHEN "highLow" = 'PERFECT' THEN 1 END)::int as "perfectCountContinuous",
      CASE 
        WHEN COUNT(CASE WHEN forecast_type = 'CONTINUOUS' THEN 1 END) > 0 THEN 
          (COUNT(CASE WHEN "highLow" = 'HIGH' THEN 1 END)::numeric / COUNT(CASE WHEN forecast_type = 'CONTINUOUS' THEN 1 END)::numeric)
        ELSE NULL 
      END as "highPercentContinuous",
      CASE 
        WHEN COUNT(CASE WHEN forecast_type = 'CONTINUOUS' THEN 1 END) > 0 THEN 
          (COUNT(CASE WHEN "highLow" = 'LOW' THEN 1 END)::numeric / COUNT(CASE WHEN forecast_type = 'CONTINUOUS' THEN 1 END)::numeric)
        ELSE NULL 
      END as "lowPercentContinuous",
      CASE 
        WHEN COUNT(CASE WHEN forecast_type = 'CONTINUOUS' THEN 1 END) > 0 THEN 
          (COUNT(CASE WHEN "highLow" = 'PERFECT' THEN 1 END)::numeric / COUNT(CASE WHEN forecast_type = 'CONTINUOUS' THEN 1 END)::numeric)
        ELSE NULL 
      END as "perfectPercentContinuous",
      SUM("equityInvestment") as "totalEquityInvestment",
      SUM("debtFinancing") as "totalDebtFinancing",
      SUM("totalInvestment") as "totalInvestment",
      SUM("netProfitEquityPlusDebt") as "totalNetProfit",
      (1000000000 + SUM("netProfitEquityPlusDebt")) as "fundBalance",
      SUM(roe) as "profitFromEquity",
      SUM(rof) as "profitFromFinancing",
      CASE WHEN SUM("totalInvestment") > 0 THEN SUM("netProfitEquityPlusDebt") / SUM("totalInvestment") ELSE NULL END as "roiReal",
      AVG("roiEquityPlusDebtPct") as "roiAverage",
      pa.roi_median as "roiMedian",
      AVG("roiEquityPlusDebtPct") as "avgRoiEquityPlusDebtPct",
      CASE WHEN SUM("equityInvestment") > 0 THEN SUM(roe) / SUM("equityInvestment") ELSE NULL END as "roeReal",
      AVG("roePct") as "roeAverage",
      pa.roe_median as "roeMedian",
      SUM(roe) as "totalRoe",
      AVG("roePct") as "avgRoePct",
      SUM("debtRepayment") as "interestPaymentOnDebt",
      CASE WHEN SUM("debtFinancing") > 0 THEN SUM(rof) / SUM("debtFinancing") ELSE NULL END as "rofReal",
      AVG("rofPct") as "rofAverage",
      pa.rof_median as "rofMedian",
      SUM(rof) as "totalRof",
      AVG("rofPct") as "avgRofPct",
      AVG("absoluteActualErrorPct") as "avgActualError",
      pa.actual_error_median as "medianActualError",
      AVG("absoluteForecastErrorPct") as "avgForecastError",
      pa.forecast_error_median as "medianForecastError",
      AVG("absoluteError") as "avgAbsoluteError",
      AVG("absoluteActualErrorPct") as "avgAbsoluteActualErrorPct",
      AVG("absoluteForecastErrorPct") as "avgAbsoluteForecastErrorPct",
      SUM("estimatedTime") as "totalForecastTimeMinutes",
      AVG("estimatedTime") as "avgTimePerForecastMinutes",
      CASE WHEN SUM("estimatedTime") > 0 THEN SUM("netProfitEquityPlusDebt") / (SUM("estimatedTime") / 60.0) ELSE NULL END as "weightedAvgHourlyProfit",
      AVG("profitPerHour") as "simpleAvgHourlyProfit",
      AVG("profitPerHour") as "avgProfitPerHour",
      AVG("brierScore") as "avgBrierScore",
      AVG("roiScore") as "avgRoiScore"
    FROM user_predictions up
    LEFT JOIN percentile_agg pa ON pa.user_id = up.user_id
    GROUP BY up.user_id, up.user_name, up.user_email, pa.roi_median, pa.roe_median, pa.rof_median, pa.actual_error_median, pa.forecast_error_median
    ${havingClause}
    ORDER BY "${sortColumn}" ${direction} ${nullsPosition}
  `;

  const result = await prisma.$queryRawUnsafe<RawLeaderboardEntry[]>(
    query,
    ...params
  );

  return result.map(convertDecimalsToNumbers);
}

/**
 * Get leaderboard entry for a specific user
 */
export async function getUserLeaderboardEntry(
  userId: string,
  organizationId: string
): Promise<LeaderboardEntry | null> {
  const result = await prisma.$queryRaw<RawLeaderboardEntry[]>`
    WITH user_predictions AS (
      SELECT 
        u.id as user_id,
        u.name as user_name,
        u.email as user_email,
        f.type as forecast_type,
        p."isCorrect",
        p."highLow",
        p.confidence,
        p."equityInvestment",
        p."debtFinancing",
        p."totalInvestment",
        p.roe,
        p."roePct",
        p.rof,
        p."rofPct",
        p."debtRepayment",
        p."netProfitEquityPlusDebt",
        p."roiEquityPlusDebtPct",
        p."profitPerHour",
        p."estimatedTime",
        p."absoluteActualErrorPct",
        p."absoluteForecastErrorPct",
        p."absoluteError",
        p."brierScore",
        p."roiScore"
      FROM "User" u
      INNER JOIN "Prediction" p ON p."userId" = u.id
      INNER JOIN "Forecast" f ON f.id = p."forecastId"
      WHERE 
        u.id = ${userId}
        AND u."organizationId" = ${organizationId}
        AND f."actualValue" IS NOT NULL
    ),
    percentile_agg AS (
      SELECT
        user_id,
        percentile_cont(0.5) WITHIN GROUP (ORDER BY "roiEquityPlusDebtPct") as roi_median,
        percentile_cont(0.5) WITHIN GROUP (ORDER BY "roePct") as roe_median,
        percentile_cont(0.5) WITHIN GROUP (ORDER BY "rofPct") as rof_median,
        percentile_cont(0.5) WITHIN GROUP (ORDER BY "absoluteActualErrorPct") as actual_error_median,
        percentile_cont(0.5) WITHIN GROUP (ORDER BY "absoluteForecastErrorPct") as forecast_error_median
      FROM user_predictions
      WHERE "roiEquityPlusDebtPct" IS NOT NULL 
         OR "roePct" IS NOT NULL 
         OR "rofPct" IS NOT NULL
         OR "absoluteActualErrorPct" IS NOT NULL
         OR "absoluteForecastErrorPct" IS NOT NULL
      GROUP BY user_id
    )
    SELECT 
      up.user_id as "userId",
      up.user_name as "userName",
      up.user_email as "userEmail",
      COUNT(*)::int as "totalCompletedPredictions",
      COUNT(*)::int as "totalPredictions",
      COUNT(CASE WHEN forecast_type = 'BINARY' AND confidence IS NOT NULL THEN 1 END)::int as "completedBinaryPredictions",
      COUNT(CASE WHEN forecast_type = 'CONTINUOUS' THEN 1 END)::int as "completedContinuousPredictions",
      COUNT(CASE WHEN "isCorrect" = true THEN 1 END)::int as "correctPredictions",
      COUNT(CASE WHEN "isCorrect" = false THEN 1 END)::int as "incorrectPredictions",
      CASE 
        WHEN COUNT(CASE WHEN forecast_type = 'BINARY' THEN 1 END) > 0 THEN 
          (COUNT(CASE WHEN "isCorrect" = true THEN 1 END)::numeric / COUNT(CASE WHEN forecast_type = 'BINARY' THEN 1 END)::numeric)
        ELSE NULL 
      END as "accuracyRate",
      CASE 
        WHEN COUNT(CASE WHEN forecast_type = 'BINARY' THEN 1 END) > 0 THEN 
          (COUNT(CASE WHEN "isCorrect" = false THEN 1 END)::numeric / COUNT(CASE WHEN forecast_type = 'BINARY' THEN 1 END)::numeric)
        ELSE NULL 
      END as "incorrectRate",
      AVG(CASE WHEN forecast_type = 'BINARY' AND confidence IS NOT NULL THEN confidence::numeric / 100 END) as "avgProbabilityBinary",
      COUNT(CASE WHEN "highLow" = 'HIGH' THEN 1 END)::int as "highCountContinuous",
      COUNT(CASE WHEN "highLow" = 'LOW' THEN 1 END)::int as "lowCountContinuous",
      COUNT(CASE WHEN "highLow" = 'PERFECT' THEN 1 END)::int as "perfectCountContinuous",
      CASE 
        WHEN COUNT(CASE WHEN forecast_type = 'CONTINUOUS' THEN 1 END) > 0 THEN 
          (COUNT(CASE WHEN "highLow" = 'HIGH' THEN 1 END)::numeric / COUNT(CASE WHEN forecast_type = 'CONTINUOUS' THEN 1 END)::numeric)
        ELSE NULL 
      END as "highPercentContinuous",
      CASE 
        WHEN COUNT(CASE WHEN forecast_type = 'CONTINUOUS' THEN 1 END) > 0 THEN 
          (COUNT(CASE WHEN "highLow" = 'LOW' THEN 1 END)::numeric / COUNT(CASE WHEN forecast_type = 'CONTINUOUS' THEN 1 END)::numeric)
        ELSE NULL 
      END as "lowPercentContinuous",
      CASE 
        WHEN COUNT(CASE WHEN forecast_type = 'CONTINUOUS' THEN 1 END) > 0 THEN 
          (COUNT(CASE WHEN "highLow" = 'PERFECT' THEN 1 END)::numeric / COUNT(CASE WHEN forecast_type = 'CONTINUOUS' THEN 1 END)::numeric)
        ELSE NULL 
      END as "perfectPercentContinuous",
      SUM("equityInvestment") as "totalEquityInvestment",
      SUM("debtFinancing") as "totalDebtFinancing",
      SUM("totalInvestment") as "totalInvestment",
      SUM("netProfitEquityPlusDebt") as "totalNetProfit",
      (1000000000 + SUM("netProfitEquityPlusDebt")) as "fundBalance",
      SUM(roe) as "profitFromEquity",
      SUM(rof) as "profitFromFinancing",
      CASE WHEN SUM("totalInvestment") > 0 THEN SUM("netProfitEquityPlusDebt") / SUM("totalInvestment") ELSE NULL END as "roiReal",
      AVG("roiEquityPlusDebtPct") as "roiAverage",
      pa.roi_median as "roiMedian",
      AVG("roiEquityPlusDebtPct") as "avgRoiEquityPlusDebtPct",
      CASE WHEN SUM("equityInvestment") > 0 THEN SUM(roe) / SUM("equityInvestment") ELSE NULL END as "roeReal",
      AVG("roePct") as "roeAverage",
      pa.roe_median as "roeMedian",
      SUM(roe) as "totalRoe",
      AVG("roePct") as "avgRoePct",
      SUM("debtRepayment") as "interestPaymentOnDebt",
      CASE WHEN SUM("debtFinancing") > 0 THEN SUM(rof) / SUM("debtFinancing") ELSE NULL END as "rofReal",
      AVG("rofPct") as "rofAverage",
      pa.rof_median as "rofMedian",
      SUM(rof) as "totalRof",
      AVG("rofPct") as "avgRofPct",
      AVG("absoluteActualErrorPct") as "avgActualError",
      pa.actual_error_median as "medianActualError",
      AVG("absoluteForecastErrorPct") as "avgForecastError",
      pa.forecast_error_median as "medianForecastError",
      AVG("absoluteError") as "avgAbsoluteError",
      AVG("absoluteActualErrorPct") as "avgAbsoluteActualErrorPct",
      AVG("absoluteForecastErrorPct") as "avgAbsoluteForecastErrorPct",
      SUM("estimatedTime") as "totalForecastTimeMinutes",
      AVG("estimatedTime") as "avgTimePerForecastMinutes",
      CASE WHEN SUM("estimatedTime") > 0 THEN SUM("netProfitEquityPlusDebt") / (SUM("estimatedTime") / 60.0) ELSE NULL END as "weightedAvgHourlyProfit",
      AVG("profitPerHour") as "simpleAvgHourlyProfit",
      AVG("profitPerHour") as "avgProfitPerHour",
      AVG("brierScore") as "avgBrierScore",
      AVG("roiScore") as "avgRoiScore"
    FROM user_predictions up
    LEFT JOIN percentile_agg pa ON pa.user_id = up.user_id
    GROUP BY up.user_id, up.user_name, up.user_email, pa.roi_median, pa.roe_median, pa.rof_median, pa.actual_error_median, pa.forecast_error_median
  `;

  const rawEntry = result[0];
  return rawEntry ? convertDecimalsToNumbers(rawEntry) : null;
}

/**
 * Get count of users with predictions in the organization
 * Only counts USER role (excludes ORG_ADMIN and SUPER_ADMIN)
 */
export async function getLeaderboardParticipantCount(
  organizationId: string
): Promise<number> {
  const result = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(DISTINCT u.id) as count
    FROM "User" u
    INNER JOIN "Prediction" p ON p."userId" = u.id
    INNER JOIN "Forecast" f ON f.id = p."forecastId"
    WHERE 
      u."organizationId" = ${organizationId}
      AND f."actualValue" IS NOT NULL
      AND u.role = 'USER'
  `;

  return Number(result[0].count);
}
