"use client";

import { Search, Grid3x3, List, Table, SlidersHorizontal } from "lucide-react";
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
    <div className="space-y-3">
      {/* Row 1: Search + Sort (always together) */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-9 pl-8 pr-3 text-sm"
          />
        </div>
        <Select value={sortValue} onValueChange={onSortChange}>
          <SelectTrigger className="h-9 w-[120px] sm:w-[140px] text-sm shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value} className="text-sm">
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Row 2: Filters + View Toggle (stacked on very small screens) */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Quick Filters */}
        {filterOptions && onFilterChange && (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Select value={filterValue || "all"} onValueChange={onFilterChange}>
              <SelectTrigger className="h-9 w-[100px] sm:w-[120px] text-sm">
                <SelectValue placeholder={filterLabel} />
              </SelectTrigger>
              <SelectContent>
                {filterOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="text-sm">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Advanced Filters Button */}
        {hasAdvancedFilters && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 px-3 shrink-0">
                <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5" />
                <span className="text-sm">Filters</span>
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
          <div className="flex items-center gap-0.5 border rounded-md p-0.5 shrink-0 ml-auto">
            {availableViews && availableViews.includes("list") && (
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => onViewModeChange("list")}
                className="h-8 w-8 p-0"
              >
                <List className="h-3.5 w-3.5" />
              </Button>
            )}
            {availableViews && availableViews.includes("table") && (
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => onViewModeChange("table")}
                className="h-8 w-8 p-0"
              >
                <Table className="h-3.5 w-3.5" />
              </Button>
            )}
            {availableViews && availableViews.includes("grid") && (
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => onViewModeChange("grid")}
                className="h-8 w-8 p-0"
              >
                <Grid3x3 className="h-3.5 w-3.5" />
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
