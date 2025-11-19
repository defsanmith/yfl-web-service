"use client";

import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { ChevronsUpDown } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import LeaderboardFilters from "@/components/leaderboard-filters";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { LeaderboardEntry } from "@/services/leaderboard";

type Forecast = {
  id: string;
  title: string;
};

type Category = {
  id: string;
  name: string;
};

type LeaderboardViewProps = {
  data: LeaderboardEntry[];
  organizationName: string;
  isOrgAdmin?: boolean;
  currentUserId?: string;
  forecasts: Forecast[];
  categories: Category[];
};

// Format percentage values
const formatPercent = (value: number | null) => {
  if (value === null) return "—";
  return `${(value * 100).toFixed(2)}%`;
};

// Format currency values
const formatCurrency = (value: number | null) => {
  if (value === null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

// Format decimal values
const formatDecimal = (value: number | null, decimals: number = 4) => {
  if (value === null) return "—";
  return value.toFixed(decimals);
};

// Format integer values
const formatInteger = (value: number | null) => {
  if (value === null) return "—";
  return value.toString();
};

export default function LeaderboardView({
  data,
  organizationName,
  isOrgAdmin = false,
  currentUserId,
  forecasts = [],
  categories = [],
}: LeaderboardViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    // Default visible columns
    userName: true,
    userEmail: isOrgAdmin, // Only show email for org admins

    // Counts & accuracy - NEW FIELDS VISIBLE
    totalCompletedPredictions: false,
    completedBinaryPredictions: false,
    completedContinuousPredictions: false,
    correctPredictions: false,
    incorrectPredictions: false,
    accuracyRate: true,
    incorrectRate: true,
    avgProbabilityBinary: true,
    highPercentContinuous: true,
    lowPercentContinuous: true,
    perfectPercentContinuous: true,

    // Capital & profit - NEW FIELDS VISIBLE
    totalEquityInvestment: true,
    totalDebtFinancing: true,
    totalInvestment: true,
    totalNetProfit: true,
    fundBalance: true,
    profitFromEquity: true,
    profitFromFinancing: true,

    // Overall ROI - NEW FIELDS VISIBLE
    roiReal: true,
    roiAverage: true,
    roiMedian: true,

    // Equity returns - NEW FIELDS VISIBLE
    roeReal: true,
    roeAverage: true,
    roeMedian: true,

    // Financing returns - NEW FIELDS VISIBLE
    interestPaymentOnDebt: true,
    rofReal: true,
    rofAverage: true,
    rofMedian: true,

    // Error metrics - NEW FIELDS VISIBLE
    avgActualError: true,
    medianActualError: true,
    avgForecastError: true,
    medianForecastError: true,

    // Time & productivity - NEW FIELDS VISIBLE
    totalForecastTimeMinutes: true,
    avgTimePerForecastMinutes: true,
    weightedAvgHourlyProfit: true,
    simpleAvgHourlyProfit: true,

    // Legacy fields - HIDDEN
    totalPredictions: false,
    highCountContinuous: false,
    lowCountContinuous: false,
    perfectCountContinuous: false,
    avgRoiEquityPlusDebtPct: false,
    totalRoe: false,
    avgRoePct: false,
    totalRof: false,
    avgRofPct: false,
    avgAbsoluteError: false,
    avgAbsoluteActualErrorPct: false,
    avgAbsoluteForecastErrorPct: false,
    avgProfitPerHour: false,
    avgBrierScore: false,
    avgRoiScore: false,
  });

  // Define columns
  const columns = useMemo<ColumnDef<LeaderboardEntry>[]>(
    () => [
      {
        id: "rank",
        header: () => <div className="text-center font-medium">Rank</div>,
        cell: ({ row }) => (
          <div className="text-center font-medium">{row.index + 1}</div>
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "userName",
        header: ({ column }) => (
          <button
            className="flex"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Name
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="font-medium">
            {row.getValue("userName") || "Anonymous"}
          </div>
        ),
      },
      {
        accessorKey: "userEmail",
        header: ({ column }) => (
          <button
            className="flex"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Email
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => <div>{row.getValue("userEmail")}</div>,
      },
      {
        accessorKey: "totalPredictions",
        header: ({ column }) => (
          <button
            className="flex justify-end w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Total Predictions
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-right">
            {formatInteger(row.getValue("totalPredictions"))}
          </div>
        ),
      },
      {
        accessorKey: "correctPredictions",
        header: ({ column }) => (
          <button
            className="flex justify-end w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Correct
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-right">
            {formatInteger(row.getValue("correctPredictions"))}
          </div>
        ),
      },
      {
        accessorKey: "accuracyRate",
        header: ({ column }) => (
          <button
            className="flex justify-end w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Accuracy Rate
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-right font-medium">
            {formatPercent(row.getValue("accuracyRate"))}
          </div>
        ),
      },
      {
        accessorKey: "avgBrierScore",
        header: ({ column }) => (
          <button
            className="flex justify-end w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Avg Brier Score
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-right">
            {formatDecimal(row.getValue("avgBrierScore"))}
          </div>
        ),
      },
      {
        accessorKey: "avgAbsoluteError",
        header: ({ column }) => (
          <button
            className="flex justify-end w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Avg Absolute Error
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-right">
            {formatDecimal(row.getValue("avgAbsoluteError"))}
          </div>
        ),
      },
      {
        accessorKey: "avgAbsoluteActualErrorPct",
        header: ({ column }) => (
          <button
            className="flex justify-end w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Avg Absolute Actual Error %
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-right">
            {formatPercent(row.getValue("avgAbsoluteActualErrorPct"))}
          </div>
        ),
      },
      {
        accessorKey: "avgAbsoluteForecastErrorPct",
        header: ({ column }) => (
          <button
            className="flex justify-end w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Avg Absolute Forecast Error %
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-right">
            {formatPercent(row.getValue("avgAbsoluteForecastErrorPct"))}
          </div>
        ),
      },
      {
        accessorKey: "avgRoiScore",
        header: ({ column }) => (
          <button
            className="flex justify-end w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Avg ROI Score
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-right">
            {formatDecimal(row.getValue("avgRoiScore"))}
          </div>
        ),
      },
      {
        accessorKey: "totalRoe",
        header: ({ column }) => (
          <button
            className="flex justify-end w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Total ROE
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-right">
            {formatCurrency(row.getValue("totalRoe"))}
          </div>
        ),
      },
      {
        accessorKey: "avgRoePct",
        header: ({ column }) => (
          <button
            className="flex justify-end w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Avg ROE %
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-right">
            {formatPercent(row.getValue("avgRoePct"))}
          </div>
        ),
      },
      {
        accessorKey: "totalRof",
        header: ({ column }) => (
          <button
            className="flex justify-end w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Total ROF
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-right">
            {formatCurrency(row.getValue("totalRof"))}
          </div>
        ),
      },
      {
        accessorKey: "avgRofPct",
        header: ({ column }) => (
          <button
            className="flex justify-end w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Avg ROF %
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-right">
            {formatPercent(row.getValue("avgRofPct"))}
          </div>
        ),
      },
      {
        accessorKey: "totalNetProfit",
        header: ({ column }) => (
          <button
            className="flex justify-end w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Total Net Profit
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-right font-medium">
            {formatCurrency(row.getValue("totalNetProfit"))}
          </div>
        ),
      },
      {
        accessorKey: "avgRoiEquityPlusDebtPct",
        header: ({ column }) => (
          <button
            className="flex justify-end w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Avg ROI (Equity + Debt) %
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-right font-medium">
            {formatPercent(row.getValue("avgRoiEquityPlusDebtPct"))}
          </div>
        ),
      },
      {
        accessorKey: "avgProfitPerHour",
        header: ({ column }) => (
          <button
            className="flex justify-end w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Avg Profit Per Hour
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-right">
            {formatCurrency(row.getValue("avgProfitPerHour"))}
          </div>
        ),
      },
      {
        accessorKey: "totalInvestment",
        header: ({ column }) => (
          <button
            className="flex justify-end w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Total Investment
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-right">
            {formatCurrency(row.getValue("totalInvestment"))}
          </div>
        ),
      },
      {
        accessorKey: "totalEquityInvestment",
        header: ({ column }) => (
          <button
            className="flex justify-end w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Total Equity Investment
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-right">
            {formatCurrency(row.getValue("totalEquityInvestment"))}
          </div>
        ),
      },
      {
        accessorKey: "totalDebtFinancing",
        header: ({ column }) => (
          <button
            className="flex justify-end w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Total Debt Financing
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-right">
            {formatCurrency(row.getValue("totalDebtFinancing"))}
          </div>
        ),
      },
      // NEW COLUMNS BELOW
      {
        accessorKey: "totalCompletedPredictions",
        header: ({ column }) => (
          <button
            className="flex justify-end w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Total Completed
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-right">
            {formatInteger(row.getValue("totalCompletedPredictions"))}
          </div>
        ),
      },
      {
        accessorKey: "completedBinaryPredictions",
        header: ({ column }) => (
          <button
            className="flex justify-end w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Binary Completed
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-right">
            {formatInteger(row.getValue("completedBinaryPredictions"))}
          </div>
        ),
      },
      {
        accessorKey: "completedContinuousPredictions",
        header: ({ column }) => (
          <button
            className="flex justify-end w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Continuous Completed
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-right">
            {formatInteger(row.getValue("completedContinuousPredictions"))}
          </div>
        ),
      },
      {
        accessorKey: "incorrectPredictions",
        header: ({ column }) => (
          <button
            className="flex justify-end w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Incorrect
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-right">
            {formatInteger(row.getValue("incorrectPredictions"))}
          </div>
        ),
      },
      {
        accessorKey: "incorrectRate",
        header: ({ column }) => (
          <button
            className="flex justify-end w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Incorrect Rate %
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-right">
            {formatPercent(row.getValue("incorrectRate"))}
          </div>
        ),
      },
      {
        accessorKey: "avgProbabilityBinary",
        header: ({ column }) => (
          <button
            className="flex justify-end w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Avg Probability (Binary)
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-right">
            {formatPercent(row.getValue("avgProbabilityBinary"))}
          </div>
        ),
      },
      {
        accessorKey: "highCountContinuous",
        header: ({ column }) => (
          <button
            className="flex justify-end w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            HIGH Count
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-right">
            {formatInteger(row.getValue("highCountContinuous"))}
          </div>
        ),
      },
      {
        accessorKey: "lowCountContinuous",
        header: ({ column }) => (
          <button
            className="flex justify-end w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            LOW Count
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-right">
            {formatInteger(row.getValue("lowCountContinuous"))}
          </div>
        ),
      },
      {
        accessorKey: "perfectCountContinuous",
        header: ({ column }) => (
          <button
            className="flex justify-end w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            PERFECT Count
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-right">
            {formatInteger(row.getValue("perfectCountContinuous"))}
          </div>
        ),
      },
      {
        accessorKey: "highPercentContinuous",
        header: ({ column }) => (
          <button
            className="flex justify-end w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            % HIGH
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-right">
            {formatPercent(row.getValue("highPercentContinuous"))}
          </div>
        ),
      },
      {
        accessorKey: "lowPercentContinuous",
        header: ({ column }) => (
          <button
            className="flex justify-end w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            % LOW
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-right">
            {formatPercent(row.getValue("lowPercentContinuous"))}
          </div>
        ),
      },
      {
        accessorKey: "perfectPercentContinuous",
        header: ({ column }) => (
          <button
            className="flex justify-end w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            % PERFECT
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-right">
            {formatPercent(row.getValue("perfectPercentContinuous"))}
          </div>
        ),
      },
      {
        accessorKey: "fundBalance",
        header: ({ column }) => (
          <button
            className="flex justify-end w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Fund Balance
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-right font-medium">
            {formatCurrency(row.getValue("fundBalance"))}
          </div>
        ),
      },
      {
        accessorKey: "profitFromEquity",
        header: ({ column }) => (
          <button
            className="flex justify-end w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Profit from Equity
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-right">
            {formatCurrency(row.getValue("profitFromEquity"))}
          </div>
        ),
      },
      {
        accessorKey: "profitFromFinancing",
        header: ({ column }) => (
          <button
            className="flex justify-end w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Profit from Financing
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-right">
            {formatCurrency(row.getValue("profitFromFinancing"))}
          </div>
        ),
      },
      {
        accessorKey: "roiReal",
        header: ({ column }) => (
          <button
            className="flex justify-end w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            ROI (Real) %
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-right font-medium">
            {formatPercent(row.getValue("roiReal"))}
          </div>
        ),
      },
      {
        accessorKey: "roiAverage",
        header: ({ column }) => (
          <button
            className="flex justify-end w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            ROI (Average) %
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-right">
            {formatPercent(row.getValue("roiAverage"))}
          </div>
        ),
      },
      {
        accessorKey: "roiMedian",
        header: ({ column }) => (
          <button
            className="flex justify-end w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            ROI (Median) %
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-right">
            {formatPercent(row.getValue("roiMedian"))}
          </div>
        ),
      },
      {
        accessorKey: "roeReal",
        header: ({ column }) => (
          <button
            className="flex justify-end w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            ROE (Real) %
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-right">
            {formatPercent(row.getValue("roeReal"))}
          </div>
        ),
      },
      {
        accessorKey: "roeAverage",
        header: ({ column }) => (
          <button
            className="flex justify-end w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            ROE (Average) %
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-right">
            {formatPercent(row.getValue("roeAverage"))}
          </div>
        ),
      },
      {
        accessorKey: "roeMedian",
        header: ({ column }) => (
          <button
            className="flex justify-end w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            ROE (Median) %
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-right">
            {formatPercent(row.getValue("roeMedian"))}
          </div>
        ),
      },
      {
        accessorKey: "interestPaymentOnDebt",
        header: ({ column }) => (
          <button
            className="flex justify-end w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Interest Payment on Debt
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-right">
            {formatCurrency(row.getValue("interestPaymentOnDebt"))}
          </div>
        ),
      },
      {
        accessorKey: "rofReal",
        header: ({ column }) => (
          <button
            className="flex justify-end w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            ROF (Real) %
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-right">
            {formatPercent(row.getValue("rofReal"))}
          </div>
        ),
      },
      {
        accessorKey: "rofAverage",
        header: ({ column }) => (
          <button
            className="flex justify-end w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            ROF (Average) %
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-right">
            {formatPercent(row.getValue("rofAverage"))}
          </div>
        ),
      },
      {
        accessorKey: "rofMedian",
        header: ({ column }) => (
          <button
            className="flex justify-end w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            ROF (Median) %
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-right">
            {formatPercent(row.getValue("rofMedian"))}
          </div>
        ),
      },
      {
        accessorKey: "avgActualError",
        header: ({ column }) => (
          <button
            className="flex justify-end w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Avg Actual Error %
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-right">
            {formatPercent(row.getValue("avgActualError"))}
          </div>
        ),
      },
      {
        accessorKey: "medianActualError",
        header: ({ column }) => (
          <button
            className="flex justify-end w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Median Actual Error %
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-right">
            {formatPercent(row.getValue("medianActualError"))}
          </div>
        ),
      },
      {
        accessorKey: "avgForecastError",
        header: ({ column }) => (
          <button
            className="flex justify-end w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Avg Forecast Error %
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-right">
            {formatPercent(row.getValue("avgForecastError"))}
          </div>
        ),
      },
      {
        accessorKey: "medianForecastError",
        header: ({ column }) => (
          <button
            className="flex justify-end w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Median Forecast Error %
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-right">
            {formatPercent(row.getValue("medianForecastError"))}
          </div>
        ),
      },
      {
        accessorKey: "totalForecastTimeMinutes",
        header: ({ column }) => (
          <button
            className="flex justify-end w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Total Time (min)
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-right">
            {formatDecimal(row.getValue("totalForecastTimeMinutes"), 0)}
          </div>
        ),
      },
      {
        accessorKey: "avgTimePerForecastMinutes",
        header: ({ column }) => (
          <button
            className="flex justify-end w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Avg Time per Forecast (min)
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-right">
            {formatDecimal(row.getValue("avgTimePerForecastMinutes"), 1)}
          </div>
        ),
      },
      {
        accessorKey: "weightedAvgHourlyProfit",
        header: ({ column }) => (
          <button
            className="flex justify-end w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Weighted Avg Hourly Profit
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-right">
            {formatCurrency(row.getValue("weightedAvgHourlyProfit"))}
          </div>
        ),
      },
      {
        accessorKey: "simpleAvgHourlyProfit",
        header: ({ column }) => (
          <button
            className="flex justify-end w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Simple Avg Hourly Profit
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-right">
            {formatCurrency(row.getValue("simpleAvgHourlyProfit"))}
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnVisibility,
    },
  });

  // Sync sorting with URL
  useEffect(() => {
    if (sorting.length > 0) {
      const params = new URLSearchParams(searchParams);
      params.set("sortBy", sorting[0].id);
      params.set("sortOrder", sorting[0].desc ? "desc" : "asc");
      router.push(`?${params.toString()}`);
    }
  }, [sorting, router, searchParams]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leaderboard</h1>
          <p className="text-muted-foreground">
            Aggregated prediction performance for {organizationName}
          </p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border p-4">
          <div className="text-sm font-medium text-muted-foreground">
            Total Participants
          </div>
          <div className="text-2xl font-bold">{data.length}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm font-medium text-muted-foreground">
            Total Predictions
          </div>
          <div className="text-2xl font-bold">
            {data.reduce((sum, entry) => sum + entry.totalPredictions, 0)}
          </div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm font-medium text-muted-foreground">
            Avg Accuracy Rate
          </div>
          <div className="text-2xl font-bold">
            {data.length > 0
              ? formatPercent(
                  data.reduce(
                    (sum, entry) => sum + (entry.accuracyRate || 0),
                    0
                  ) / data.length
                )
              : "—"}
          </div>
        </div>
      </div>

      {/* Filters and Column Visibility Controls */}
      <LeaderboardFilters
        forecasts={forecasts}
        categories={categories}
        table={table}
        isOrgAdmin={isOrgAdmin}
        participantCount={table.getFilteredRowModel().rows.length}
      />

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const isCurrentUser =
                  currentUserId && row.original.userId === currentUserId;
                return (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className={
                      isCurrentUser ? "bg-muted/50 font-medium" : undefined
                    }
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Info Message */}
      <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
        <p>
          <strong>Note:</strong> The leaderboard only includes predictions for
          forecasts that have actual values set. Metrics are calculated based on
          prediction accuracy, investment returns, and other performance
          indicators.
        </p>
      </div>
    </div>
  );
}
