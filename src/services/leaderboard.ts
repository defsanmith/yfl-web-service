import prisma from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

/**
 * Leaderboard entry representing a user's aggregated prediction performance
 */
export interface LeaderboardEntry {
  userId: string;
  userName: string | null;
  userEmail: string;
  totalPredictions: number;
  correctPredictions: number;
  accuracyRate: number | null;
  avgBrierScore: number | null;
  avgAbsoluteError: number | null;
  avgAbsoluteActualErrorPct: number | null;
  avgAbsoluteForecastErrorPct: number | null;
  avgRoiScore: number | null;
  totalRoe: number | null;
  avgRoePct: number | null;
  totalRof: number | null;
  avgRofPct: number | null;
  totalNetProfit: number | null;
  avgRoiEquityPlusDebtPct: number | null;
  avgProfitPerHour: number | null;
  totalInvestment: number | null;
  totalEquityInvestment: number | null;
  totalDebtFinancing: number | null;
}

/**
 * Raw database result type (before conversion)
 */
type RawLeaderboardEntry = Omit<
  LeaderboardEntry,
  | "accuracyRate"
  | "avgBrierScore"
  | "avgAbsoluteError"
  | "avgAbsoluteActualErrorPct"
  | "avgAbsoluteForecastErrorPct"
  | "avgRoiScore"
  | "totalRoe"
  | "avgRoePct"
  | "totalRof"
  | "avgRofPct"
  | "totalNetProfit"
  | "avgRoiEquityPlusDebtPct"
  | "avgProfitPerHour"
  | "totalInvestment"
  | "totalEquityInvestment"
  | "totalDebtFinancing"
> & {
  accuracyRate: Decimal | null;
  avgBrierScore: Decimal | null;
  avgAbsoluteError: Decimal | null;
  avgAbsoluteActualErrorPct: Decimal | null;
  avgAbsoluteForecastErrorPct: Decimal | null;
  avgRoiScore: Decimal | null;
  totalRoe: Decimal | null;
  avgRoePct: Decimal | null;
  totalRof: Decimal | null;
  avgRofPct: Decimal | null;
  totalNetProfit: Decimal | null;
  avgRoiEquityPlusDebtPct: Decimal | null;
  avgProfitPerHour: Decimal | null;
  totalInvestment: Decimal | null;
  totalEquityInvestment: Decimal | null;
  totalDebtFinancing: Decimal | null;
};

/**
 * Convert Decimal objects to numbers for Client Component compatibility
 */
function convertDecimalsToNumbers(raw: RawLeaderboardEntry): LeaderboardEntry {
  return {
    ...raw,
    accuracyRate: raw.accuracyRate ? Number(raw.accuracyRate) : null,
    avgBrierScore: raw.avgBrierScore ? Number(raw.avgBrierScore) : null,
    avgAbsoluteError: raw.avgAbsoluteError
      ? Number(raw.avgAbsoluteError)
      : null,
    avgAbsoluteActualErrorPct: raw.avgAbsoluteActualErrorPct
      ? Number(raw.avgAbsoluteActualErrorPct)
      : null,
    avgAbsoluteForecastErrorPct: raw.avgAbsoluteForecastErrorPct
      ? Number(raw.avgAbsoluteForecastErrorPct)
      : null,
    avgRoiScore: raw.avgRoiScore ? Number(raw.avgRoiScore) : null,
    totalRoe: raw.totalRoe ? Number(raw.totalRoe) : null,
    avgRoePct: raw.avgRoePct ? Number(raw.avgRoePct) : null,
    totalRof: raw.totalRof ? Number(raw.totalRof) : null,
    avgRofPct: raw.avgRofPct ? Number(raw.avgRofPct) : null,
    totalNetProfit: raw.totalNetProfit ? Number(raw.totalNetProfit) : null,
    avgRoiEquityPlusDebtPct: raw.avgRoiEquityPlusDebtPct
      ? Number(raw.avgRoiEquityPlusDebtPct)
      : null,
    avgProfitPerHour: raw.avgProfitPerHour
      ? Number(raw.avgProfitPerHour)
      : null,
    totalInvestment: raw.totalInvestment ? Number(raw.totalInvestment) : null,
    totalEquityInvestment: raw.totalEquityInvestment
      ? Number(raw.totalEquityInvestment)
      : null,
    totalDebtFinancing: raw.totalDebtFinancing
      ? Number(raw.totalDebtFinancing)
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
    SELECT 
      u.id as "userId",
      u.name as "userName",
      u.email as "userEmail",
      COUNT(p.id)::int as "totalPredictions",
      COUNT(CASE WHEN p."isCorrect" = true THEN 1 END)::int as "correctPredictions",
      CASE 
        WHEN COUNT(p.id) > 0 THEN 
          (COUNT(CASE WHEN p."isCorrect" = true THEN 1 END)::numeric / COUNT(p.id)::numeric)
        ELSE NULL 
      END as "accuracyRate",
      AVG(p."brierScore") as "avgBrierScore",
      AVG(p."absoluteError") as "avgAbsoluteError",
      AVG(p."absoluteActualErrorPct") as "avgAbsoluteActualErrorPct",
      AVG(p."absoluteForecastErrorPct") as "avgAbsoluteForecastErrorPct",
      AVG(p."roiScore") as "avgRoiScore",
      SUM(p.roe) as "totalRoe",
      AVG(p."roePct") as "avgRoePct",
      SUM(p.rof) as "totalRof",
      AVG(p."rofPct") as "avgRofPct",
      SUM(p."netProfitEquityPlusDebt") as "totalNetProfit",
      AVG(p."roiEquityPlusDebtPct") as "avgRoiEquityPlusDebtPct",
      AVG(p."profitPerHour") as "avgProfitPerHour",
      SUM(p."totalInvestment") as "totalInvestment",
      SUM(p."equityInvestment") as "totalEquityInvestment",
      SUM(p."debtFinancing") as "totalDebtFinancing"
    FROM "User" u
    INNER JOIN "Prediction" p ON p."userId" = u.id
    INNER JOIN "Forecast" f ON f.id = p."forecastId"
    WHERE 
      u."organizationId" = ${organizationId}
      AND f."actualValue" IS NOT NULL
      AND u.role = 'USER'
    GROUP BY u.id, u.name, u.email
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
    "totalPredictions",
    "correctPredictions",
    "accuracyRate",
    "avgBrierScore",
    "avgAbsoluteError",
    "avgAbsoluteActualErrorPct",
    "avgAbsoluteForecastErrorPct",
    "avgRoiScore",
    "totalRoe",
    "avgRoePct",
    "totalRof",
    "avgRofPct",
    "totalNetProfit",
    "avgRoiEquityPlusDebtPct",
    "avgProfitPerHour",
    "totalInvestment",
    "totalEquityInvestment",
    "totalDebtFinancing",
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
    SELECT 
      u.id as "userId",
      u.name as "userName",
      u.email as "userEmail",
      COUNT(p.id)::int as "totalPredictions",
      COUNT(CASE WHEN p."isCorrect" = true THEN 1 END)::int as "correctPredictions",
      CASE 
        WHEN COUNT(p.id) > 0 THEN 
          (COUNT(CASE WHEN p."isCorrect" = true THEN 1 END)::numeric / COUNT(p.id)::numeric)
        ELSE NULL 
      END as "accuracyRate",
      AVG(p."brierScore") as "avgBrierScore",
      AVG(p."absoluteError") as "avgAbsoluteError",
      AVG(p."absoluteActualErrorPct") as "avgAbsoluteActualErrorPct",
      AVG(p."absoluteForecastErrorPct") as "avgAbsoluteForecastErrorPct",
      AVG(p."roiScore") as "avgRoiScore",
      SUM(p.roe) as "totalRoe",
      AVG(p."roePct") as "avgRoePct",
      SUM(p.rof) as "totalRof",
      AVG(p."rofPct") as "avgRofPct",
      SUM(p."netProfitEquityPlusDebt") as "totalNetProfit",
      AVG(p."roiEquityPlusDebtPct") as "avgRoiEquityPlusDebtPct",
      AVG(p."profitPerHour") as "avgProfitPerHour",
      SUM(p."totalInvestment") as "totalInvestment",
      SUM(p."equityInvestment") as "totalEquityInvestment",
      SUM(p."debtFinancing") as "totalDebtFinancing"
    FROM "User" u
    INNER JOIN "Prediction" p ON p."userId" = u.id
    INNER JOIN "Forecast" f ON f.id = p."forecastId"
    WHERE ${whereClause}
    GROUP BY u.id, u.name, u.email
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
    SELECT 
      u.id as "userId",
      u.name as "userName",
      u.email as "userEmail",
      COUNT(p.id)::int as "totalPredictions",
      COUNT(CASE WHEN p."isCorrect" = true THEN 1 END)::int as "correctPredictions",
      CASE 
        WHEN COUNT(p.id) > 0 THEN 
          (COUNT(CASE WHEN p."isCorrect" = true THEN 1 END)::numeric / COUNT(p.id)::numeric)
        ELSE NULL 
      END as "accuracyRate",
      AVG(p."brierScore") as "avgBrierScore",
      AVG(p."absoluteError") as "avgAbsoluteError",
      AVG(p."absoluteActualErrorPct") as "avgAbsoluteActualErrorPct",
      AVG(p."absoluteForecastErrorPct") as "avgAbsoluteForecastErrorPct",
      AVG(p."roiScore") as "avgRoiScore",
      SUM(p.roe) as "totalRoe",
      AVG(p."roePct") as "avgRoePct",
      SUM(p.rof) as "totalRof",
      AVG(p."rofPct") as "avgRofPct",
      SUM(p."netProfitEquityPlusDebt") as "totalNetProfit",
      AVG(p."roiEquityPlusDebtPct") as "avgRoiEquityPlusDebtPct",
      AVG(p."profitPerHour") as "avgProfitPerHour",
      SUM(p."totalInvestment") as "totalInvestment",
      SUM(p."equityInvestment") as "totalEquityInvestment",
      SUM(p."debtFinancing") as "totalDebtFinancing"
    FROM "User" u
    INNER JOIN "Prediction" p ON p."userId" = u.id
    INNER JOIN "Forecast" f ON f.id = p."forecastId"
    WHERE 
      u.id = ${userId}
      AND u."organizationId" = ${organizationId}
      AND f."actualValue" IS NOT NULL
    GROUP BY u.id, u.name, u.email
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
