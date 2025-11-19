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
import type { PredictionLeaderboardEntry } from "@/services/leaderboard";

type Forecast = {
  id: string;
  title: string;
};

type Category = {
  id: string;
  name: string;
};

type PredictionLeaderboardViewProps = {
  data: PredictionLeaderboardEntry[];
  organizationName: string;
  forecasts: Forecast[];
  categories: Category[];
};

const formatPercent = (value: number | null) => {
  if (value === null) return "—";
  return `${(value * 100).toFixed(2)}%`;
};

const formatCurrency = (value: number | null) => {
  if (value === null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatDecimal = (value: number | null, decimals: number = 1) => {
  if (value === null) return "—";
  return value.toFixed(decimals);
};

const formatInteger = (value: number | null) => {
  if (value === null) return "—";
  return value.toString();
};

export default function PredictionLeaderboardView({
  data,
  organizationName,
  forecasts = [],
  categories = [],
}: PredictionLeaderboardViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    forecastTitle: true,
    forecastType: true,
    categoryName: true,
    totalParticipants: true,
    participantsCompleted: true,
    correctPredictions: false,
    incorrectPredictions: false,
    accuracyRate: true,
    avgProbability: false,
    highCount: false,
    lowCount: false,
    perfectCount: false,
    avgActualError: true,
    avgForecastError: false,
    totalInvestment: true,
    totalNetProfit: true,
    avgRoi: true,
    totalEquityInvestment: false,
    totalDebtFinancing: false,
    avgTimePerPrediction: true,
    totalTimeSpent: false,
  });

  const columns = useMemo<ColumnDef<PredictionLeaderboardEntry>[]>(
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
        accessorKey: "forecastTitle",
        header: ({ column }) => (
          <button
            className="flex"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Forecast
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="font-medium max-w-xs truncate">
            {row.getValue("forecastTitle")}
          </div>
        ),
      },
      {
        accessorKey: "forecastType",
        header: "Type",
        cell: ({ row }) => (
          <div className="capitalize">{row.getValue("forecastType")}</div>
        ),
      },
      {
        accessorKey: "categoryName",
        header: "Category",
        cell: ({ row }) => <div>{row.getValue("categoryName") || "—"}</div>,
      },
      {
        accessorKey: "totalParticipants",
        header: ({ column }) => (
          <button
            className="flex justify-end w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Participants
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-right">
            {formatInteger(row.getValue("totalParticipants"))}
          </div>
        ),
      },
      {
        accessorKey: "participantsCompleted",
        header: ({ column }) => (
          <button
            className="flex justify-end w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Completed
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-right">
            {formatInteger(row.getValue("participantsCompleted"))}
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
        accessorKey: "avgProbability",
        header: ({ column }) => (
          <button
            className="flex justify-end w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Avg Probability
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-right">
            {formatPercent(row.getValue("avgProbability"))}
          </div>
        ),
      },
      {
        accessorKey: "highCount",
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
            {formatInteger(row.getValue("highCount"))}
          </div>
        ),
      },
      {
        accessorKey: "lowCount",
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
            {formatInteger(row.getValue("lowCount"))}
          </div>
        ),
      },
      {
        accessorKey: "perfectCount",
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
            {formatInteger(row.getValue("perfectCount"))}
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
        accessorKey: "avgRoi",
        header: ({ column }) => (
          <button
            className="flex justify-end w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Avg ROI %
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-right font-medium">
            {formatPercent(row.getValue("avgRoi"))}
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
            Total Equity
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
            Total Debt
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-right">
            {formatCurrency(row.getValue("totalDebtFinancing"))}
          </div>
        ),
      },
      {
        accessorKey: "avgTimePerPrediction",
        header: ({ column }) => (
          <button
            className="flex justify-end w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Avg Time (min)
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-right">
            {formatDecimal(row.getValue("avgTimePerPrediction"))}
          </div>
        ),
      },
      {
        accessorKey: "totalTimeSpent",
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
            {formatDecimal(row.getValue("totalTimeSpent"), 0)}
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leaderboard by Prediction</h1>
          <p className="text-muted-foreground">
            Aggregated performance metrics by forecast for {organizationName}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border p-4">
          <div className="text-sm font-medium text-muted-foreground">
            Total Forecasts
          </div>
          <div className="text-2xl font-bold">{data.length}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm font-medium text-muted-foreground">
            Total Predictions
          </div>
          <div className="text-2xl font-bold">
            {data.reduce((sum, entry) => sum + entry.participantsCompleted, 0)}
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

      <LeaderboardFilters
        forecasts={forecasts}
        categories={categories}
        table={table}
        isOrgAdmin={true}
        participantCount={data.length}
        viewType="PREDICTION"
      />

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
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
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

      <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
        <p>
          <strong>Note:</strong> The leaderboard shows forecasts that have
          actual values set, aggregating metrics across all user predictions for
          each forecast.
        </p>
      </div>
    </div>
  );
}
