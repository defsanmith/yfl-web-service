import { z } from "zod";

/**
 * Schema for leaderboard query parameters
 */
export const leaderboardQuerySchema = z.object({
  sortBy: z
    .enum([
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
    ])
    .optional()
    .default("accuracyRate"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  forecastIds: z.string().optional(), // Comma-separated forecast IDs
  categoryIds: z.string().optional(), // Comma-separated category IDs
  forecastTypes: z.string().optional(), // Comma-separated forecast types (BINARY, CONTINUOUS, CATEGORICAL)
  recentCount: z.coerce.number().optional(), // Recent N forecasts (5, 10, 20, or undefined for all)
  minForecasts: z.coerce.number().optional(), // Minimum completed forecasts (1, 25, 32, 64, 150, or undefined for all)
  dateFrom: z.string().optional(), // ISO date string for date range start
  dateTo: z.string().optional(), // ISO date string for date range end
});

export type LeaderboardQuery = z.infer<typeof leaderboardQuerySchema>;

/**
 * Column visibility configuration
 */
export const columnVisibilitySchema = z.object({
  userName: z.boolean().optional().default(true),
  userEmail: z.boolean().optional().default(true),
  totalPredictions: z.boolean().optional().default(true),
  correctPredictions: z.boolean().optional().default(true),
  accuracyRate: z.boolean().optional().default(true),
  avgBrierScore: z.boolean().optional().default(false),
  avgAbsoluteError: z.boolean().optional().default(false),
  avgAbsoluteActualErrorPct: z.boolean().optional().default(true),
  avgAbsoluteForecastErrorPct: z.boolean().optional().default(false),
  avgRoiScore: z.boolean().optional().default(true),
  totalRoe: z.boolean().optional().default(false),
  avgRoePct: z.boolean().optional().default(true),
  totalRof: z.boolean().optional().default(false),
  avgRofPct: z.boolean().optional().default(true),
  totalNetProfit: z.boolean().optional().default(true),
  avgRoiEquityPlusDebtPct: z.boolean().optional().default(true),
  avgProfitPerHour: z.boolean().optional().default(false),
  totalInvestment: z.boolean().optional().default(false),
  totalEquityInvestment: z.boolean().optional().default(false),
  totalDebtFinancing: z.boolean().optional().default(false),
});

export type ColumnVisibility = z.infer<typeof columnVisibilitySchema>;
