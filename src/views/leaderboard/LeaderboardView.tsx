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
import { ChevronDown, ChevronsUpDown, Settings2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { LeaderboardEntry } from "@/services/leaderboard";

type LeaderboardViewProps = {
  data: LeaderboardEntry[];
  organizationName: string;
  isOrgAdmin?: boolean; // Reserved for future role-specific features
  currentUserId?: string;
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
}: LeaderboardViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    // Default visible columns
    userName: true,
    userEmail: isOrgAdmin, // Only show email for org admins
    totalPredictions: true,
    correctPredictions: true,
    accuracyRate: true,
    avgAbsoluteActualErrorPct: true,
    avgRoiScore: true,
    avgRoePct: true,
    avgRofPct: true,
    totalNetProfit: true,
    avgRoiEquityPlusDebtPct: true,
    // Default hidden columns
    avgBrierScore: false,
    avgAbsoluteError: false,
    avgAbsoluteForecastErrorPct: false,
    totalRoe: false,
    totalRof: false,
    avgProfitPerHour: false,
    totalInvestment: false,
    totalEquityInvestment: false,
    totalDebtFinancing: false,
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

      {/* Column Visibility Controls */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {table.getFilteredRowModel().rows.length} participant(s)
        </p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings2 className="mr-2 h-4 w-4" />
              Columns
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .filter((column) => isOrgAdmin || column.id !== "userEmail") // Hide email toggle for non-admins
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id
                      .replace(/([A-Z])/g, " $1")
                      .replace(/^./, (str) => str.toUpperCase())}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

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
