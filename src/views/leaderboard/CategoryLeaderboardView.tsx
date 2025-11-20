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
import type { CategoryLeaderboardEntry } from "@/services/leaderboard";

type Forecast = {
  id: string;
  title: string;
};

type Category = {
  id: string;
  name: string;
};

type CategoryLeaderboardViewProps = {
  data: CategoryLeaderboardEntry[];
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

export default function CategoryLeaderboardView({
  data,
  organizationName,
  forecasts = [],
  categories = [],
}: CategoryLeaderboardViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    categoryName: true,
    categoryDescription: false,
    totalForecasts: true,
    completedForecasts: true,
    totalParticipants: true,
    totalPredictions: true,
    avgPredictionsPerForecast: true,
    correctPredictions: false,
    accuracyRate: true,
    totalInvestment: true,
    totalNetProfit: true,
    avgRoi: true,
    totalTimeSpent: false,
    avgTimePerPrediction: true,
  });

  const columns = useMemo<ColumnDef<CategoryLeaderboardEntry>[]>(
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
        accessorKey: "categoryName",
        header: ({ column }) => (
          <button
            className="flex"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Category
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("categoryName")}</div>
        ),
      },
      {
        accessorKey: "categoryDescription",
        header: "Description",
        cell: ({ row }) => (
          <div className="max-w-xs truncate">
            {row.getValue("categoryDescription") || "—"}
          </div>
        ),
      },
      {
        accessorKey: "totalForecasts",
        header: ({ column }) => (
          <button
            className="flex justify-end w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Total Forecasts
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-right">
            {formatInteger(row.getValue("totalForecasts"))}
          </div>
        ),
      },
      {
        accessorKey: "completedForecasts",
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
            {formatInteger(row.getValue("completedForecasts"))}
          </div>
        ),
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
        accessorKey: "avgPredictionsPerForecast",
        header: ({ column }) => (
          <button
            className="flex justify-end w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Avg per Forecast
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-right">
            {formatDecimal(row.getValue("avgPredictionsPerForecast"))}
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
          <h1 className="text-3xl font-bold">Leaderboard by Category</h1>
          <p className="text-muted-foreground">
            Aggregated performance metrics by category for {organizationName}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border p-4">
          <div className="text-sm font-medium text-muted-foreground">
            Total Categories
          </div>
          <div className="text-2xl font-bold">{data.length}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm font-medium text-muted-foreground">
            Total Forecasts
          </div>
          <div className="text-2xl font-bold">
            {data.reduce((sum, entry) => sum + entry.totalForecasts, 0)}
          </div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm font-medium text-muted-foreground">
            Total Predictions
          </div>
          <div className="text-2xl font-bold">
            {data.reduce((sum, entry) => sum + entry.totalPredictions, 0)}
          </div>
        </div>
      </div>

      <LeaderboardFilters
        forecasts={forecasts}
        categories={categories}
        table={table}
        isOrgAdmin={true}
        participantCount={data.length}
        viewType="CATEGORY"
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
          <strong>Note:</strong> The leaderboard shows categories with their
          aggregated metrics across all forecasts and predictions within each
          category.
        </p>
      </div>
    </div>
  );
}
