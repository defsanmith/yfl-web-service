"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface SearchBarProps {
  defaultValue?: string;
  onSearch: (query: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

/**
 * Reusable search bar component with debouncing
 *
 * @example
 * ```tsx
 * <SearchBar
 *   defaultValue={searchParams.get("query") || ""}
 *   onSearch={(query) => router.push(`/path?query=${query}`)}
 *   placeholder="Search by name or ID..."
 * />
 * ```
 */
export function SearchBar({
  defaultValue = "",
  onSearch,
  placeholder = "Search...",
  debounceMs = 300,
}: SearchBarProps) {
  const [searchValue, setSearchValue] = useState(defaultValue);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchValue);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchValue, debounceMs, onSearch]);

  const handleClear = useCallback(() => {
    setSearchValue("");
  }, []);

  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder}
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        className="pl-8 pr-8"
      />
      {searchValue && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-2 hover:bg-transparent"
          onClick={handleClear}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Clear search</span>
        </Button>
      )}
    </div>
  );
}
