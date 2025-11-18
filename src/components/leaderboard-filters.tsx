"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Table } from "@tanstack/react-table";
import { CalendarIcon, ChevronDown, FilterX, Settings2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { type DateRange } from "react-day-picker";

type Forecast = {
  id: string;
  title: string;
};

type Category = {
  id: string;
  name: string;
};

type LeaderboardFiltersProps = {
  forecasts: Forecast[];
  categories: Category[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: Table<any>;
  isOrgAdmin?: boolean;
  participantCount: number;
};

const FORECAST_TYPES = [
  { value: "BINARY", label: "Binary" },
  { value: "CONTINUOUS", label: "Continuous" },
  { value: "CATEGORICAL", label: "Categorical" },
];

const RECENT_OPTIONS = [
  { value: "5", label: "Past 5" },
  { value: "10", label: "Past 10" },
  { value: "20", label: "Past 20" },
  { value: "all", label: "All" },
];

const MIN_FORECASTS_OPTIONS = [
  { value: "1", label: "1+" },
  { value: "25", label: "25+" },
  { value: "32", label: "32+" },
  { value: "64", label: "64+" },
  { value: "150", label: "150+" },
  { value: "all", label: "All" },
];

export default function LeaderboardFilters({
  forecasts,
  categories,
  table,
  isOrgAdmin = false,
  participantCount,
}: LeaderboardFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parse current filters from URL
  const selectedForecastIds =
    searchParams.get("forecastIds")?.split(",").filter(Boolean) || [];
  const selectedCategoryIds =
    searchParams.get("categoryIds")?.split(",").filter(Boolean) || [];
  const selectedForecastTypes =
    searchParams.get("forecastTypes")?.split(",").filter(Boolean) || [];
  const recentCount = searchParams.get("recentCount") || "all";
  const minForecasts = searchParams.get("minForecasts") || "all";
  const dateFromStr = searchParams.get("dateFrom");
  const dateToStr = searchParams.get("dateTo");

  // Local state for date range picker
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: dateFromStr ? new Date(dateFromStr) : undefined,
    to: dateToStr ? new Date(dateToStr) : undefined,
  });

  // Update URL with new filter values
  const updateFilters = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== "all") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    router.push(`?${params.toString()}`);
  };

  // Toggle forecast selection
  const toggleForecast = (forecastId: string) => {
    const newSelection = selectedForecastIds.includes(forecastId)
      ? selectedForecastIds.filter((id) => id !== forecastId)
      : [...selectedForecastIds, forecastId];
    updateFilters({
      forecastIds: newSelection.length > 0 ? newSelection.join(",") : undefined,
    });
  };

  // Toggle category selection
  const toggleCategory = (categoryId: string) => {
    const newSelection = selectedCategoryIds.includes(categoryId)
      ? selectedCategoryIds.filter((id) => id !== categoryId)
      : [...selectedCategoryIds, categoryId];
    updateFilters({
      categoryIds: newSelection.length > 0 ? newSelection.join(",") : undefined,
    });
  };

  // Toggle forecast type selection
  const toggleForecastType = (type: string) => {
    const newSelection = selectedForecastTypes.includes(type)
      ? selectedForecastTypes.filter((t) => t !== type)
      : [...selectedForecastTypes, type];
    updateFilters({
      forecastTypes:
        newSelection.length > 0 ? newSelection.join(",") : undefined,
    });
  };

  // Select all forecasts
  const selectAllForecasts = () => {
    updateFilters({
      forecastIds: forecasts.map((f) => f.id).join(","),
    });
  };

  // Clear all forecasts
  const clearAllForecasts = () => {
    updateFilters({ forecastIds: undefined });
  };

  // Select all categories
  const selectAllCategories = () => {
    updateFilters({
      categoryIds: categories.map((c) => c.id).join(","),
    });
  };

  // Clear all categories
  const clearAllCategories = () => {
    updateFilters({ categoryIds: undefined });
  };

  // Select all forecast types
  const selectAllForecastTypes = () => {
    updateFilters({
      forecastTypes: FORECAST_TYPES.map((t) => t.value).join(","),
    });
  };

  // Clear all forecast types
  const clearAllForecastTypes = () => {
    updateFilters({ forecastTypes: undefined });
  };

  // Clear all filters
  const clearAllFilters = () => {
    setDateRange({ from: undefined, to: undefined });
    router.push(`?`);
  };

  // Handle date range changes
  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    // Only update URL filters if both from and to are selected
    if (range?.from && range?.to) {
      updateFilters({
        dateFrom: range.from.toISOString().split("T")[0],
        dateTo: range.to.toISOString().split("T")[0],
      });
    } else {
      // Clear date filters if range is incomplete
      updateFilters({
        dateFrom: undefined,
        dateTo: undefined,
      });
    }
  };

  // Format date range display
  const formatDateRange = () => {
    if (!dateRange?.from) return "Pick a date range";
    if (dateRange.to) {
      return `${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`;
    }
    return dateRange.from.toLocaleDateString();
  };

  const hasActiveFilters =
    selectedForecastIds.length > 0 ||
    selectedCategoryIds.length > 0 ||
    selectedForecastTypes.length > 0 ||
    recentCount !== "all" ||
    minForecasts !== "all" ||
    dateRange?.from ||
    dateRange?.to;

  return (
    <div className="space-y-4">
      {/* Filters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Forecast Multi-Select */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Filter by Forecast
          </label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                {selectedForecastIds.length === 0
                  ? "All forecasts"
                  : selectedForecastIds.length === 1
                  ? forecasts.find((f) => f.id === selectedForecastIds[0])
                      ?.title || "1 forecast"
                  : `${selectedForecastIds.length} forecasts`}
                <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64">
              <DropdownMenuLabel>Select Forecasts</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="flex gap-2 px-2 py-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 flex-1"
                  onClick={selectAllForecasts}
                >
                  Select All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 flex-1"
                  onClick={clearAllForecasts}
                >
                  Clear All
                </Button>
              </div>
              <DropdownMenuSeparator />
              <div className="max-h-64 overflow-y-auto">
                {forecasts.map((forecast) => (
                  <DropdownMenuCheckboxItem
                    key={forecast.id}
                    checked={selectedForecastIds.includes(forecast.id)}
                    onCheckedChange={() => toggleForecast(forecast.id)}
                  >
                    {forecast.title}
                  </DropdownMenuCheckboxItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Category Multi-Select */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Filter by Category
          </label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                {selectedCategoryIds.length === 0
                  ? "All categories"
                  : selectedCategoryIds.length === 1
                  ? categories.find((c) => c.id === selectedCategoryIds[0])
                      ?.name || "1 category"
                  : `${selectedCategoryIds.length} categories`}
                <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64">
              <DropdownMenuLabel>Select Categories</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="flex gap-2 px-2 py-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 flex-1"
                  onClick={selectAllCategories}
                >
                  Select All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 flex-1"
                  onClick={clearAllCategories}
                >
                  Clear All
                </Button>
              </div>
              <DropdownMenuSeparator />
              <div className="max-h-64 overflow-y-auto">
                {categories.map((category) => (
                  <DropdownMenuCheckboxItem
                    key={category.id}
                    checked={selectedCategoryIds.includes(category.id)}
                    onCheckedChange={() => toggleCategory(category.id)}
                  >
                    {category.name}
                  </DropdownMenuCheckboxItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Prediction Type Multi-Select */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Prediction Type
          </label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                {selectedForecastTypes.length === 0
                  ? "All types"
                  : selectedForecastTypes.length === 1
                  ? FORECAST_TYPES.find(
                      (t) => t.value === selectedForecastTypes[0]
                    )?.label || "1 type"
                  : `${selectedForecastTypes.length} types`}
                <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64">
              <DropdownMenuLabel>Select Types</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="flex gap-2 px-2 py-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 flex-1"
                  onClick={selectAllForecastTypes}
                >
                  Select All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 flex-1"
                  onClick={clearAllForecastTypes}
                >
                  Clear All
                </Button>
              </div>
              <DropdownMenuSeparator />
              {FORECAST_TYPES.map((type) => (
                <DropdownMenuCheckboxItem
                  key={type.value}
                  checked={selectedForecastTypes.includes(type.value)}
                  onCheckedChange={() => toggleForecastType(type.value)}
                >
                  {type.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Recent Filter */}
        <div>
          <label className="text-sm font-medium mb-2 block">Recent</label>
          <Select
            value={recentCount}
            onValueChange={(value) => updateFilters({ recentCount: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              {RECENT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Minimum Forecasts Filter */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Minimum Forecasts
          </label>
          <Select
            value={minForecasts}
            onValueChange={(value) => updateFilters({ minForecasts: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              {MIN_FORECASTS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Range Filter */}
        <div>
          <label className="text-sm font-medium mb-2 block">Date Range</label>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 justify-start text-left font-normal",
                    !dateRange?.from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formatDateRange()}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={handleDateRangeChange}
                  numberOfMonths={2}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {(dateRange?.from || dateRange?.to) && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleDateRangeChange(undefined)}
                className="flex-shrink-0"
              >
                <FilterX className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Actions Row: Clear Filters, Participant Count, Column Selector */}
      <div className="flex items-center justify-between gap-4">
        <div>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
              className="gap-2"
            >
              <FilterX className="h-4 w-4" />
              Clear All Filters
            </Button>
          )}
        </div>
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground">
            Showing {participantCount} participant(s)
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
                .filter((column) => isOrgAdmin || column.id !== "userEmail")
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
      </div>
    </div>
  );
}
