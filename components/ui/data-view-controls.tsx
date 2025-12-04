"use client";

import { Search, Grid3x3, List, SlidersHorizontal } from "lucide-react";
import { Button } from "./button";
import { Input } from "./input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

export type ViewMode = "list" | "grid" | "table";

export interface DataViewControlsProps {
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  availableViews?: ViewMode[];
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  sortValue: string;
  onSortChange: (value: string) => void;
  sortOptions: Array<{ value: string; label: string }>;
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  filterOptions?: Array<{ value: string; label: string }>;
  filterLabel?: string;
  children?: React.ReactNode;
  totalCount?: number;
  filteredCount?: number;
}

export function DataViewControls({
  viewMode,
  onViewModeChange,
  availableViews = ["list", "grid", "table"],
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  sortValue,
  onSortChange,
  sortOptions,
  filterValue,
  onFilterChange,
  filterOptions,
  filterLabel = "Filter",
  children,
  totalCount,
  filteredCount,
}: DataViewControlsProps) {
  const showCount = totalCount !== undefined && filteredCount !== undefined;
  const hasAdvancedFilters = !!children;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[140px] max-w-full sm:min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8"
          />
        </div>

        {/* Sort */}
        <Select value={sortValue} onValueChange={onSortChange}>
          <SelectTrigger className="w-[140px] sm:w-[160px]">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Basic Filter */}
        {filterOptions && onFilterChange && (
          <Select value={filterValue || "all"} onValueChange={onFilterChange}>
            <SelectTrigger className="w-[120px] sm:w-[140px]">
              <SelectValue placeholder={filterLabel} />
            </SelectTrigger>
            <SelectContent>
              {filterOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Advanced Filters Popover */}
        {hasAdvancedFilters && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0">
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <h4 className="font-medium text-sm">Filters</h4>
                {children}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* View Mode Toggle */}
        {viewMode && onViewModeChange && (
          <div className="flex gap-1 border rounded-md p-1 shrink-0">
            {availableViews && availableViews.includes("list") && (
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => onViewModeChange("list")}
                className="h-8 px-2"
              >
                <List className="h-4 w-4" />
              </Button>
            )}
            {availableViews && availableViews.includes("grid") && (
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => onViewModeChange("grid")}
                className="h-8 px-2"
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Count */}
      {showCount && (
        <div className="text-sm text-muted-foreground">
          {filteredCount === totalCount ? (
            <span>{totalCount} items</span>
          ) : (
            <span>
              {filteredCount} of {totalCount} items
            </span>
          )}
        </div>
      )}
    </div>
  );
}
