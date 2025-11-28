/**
 * UnifiedListContainer Component
 *
 * Main orchestrator for all list views
 * Handles view modes, filters, sorting, and rendering
 */

"use client";

import { useState, useMemo } from "react";
import type { ListConfig, ViewMode, FilterState } from "@/types/list-config";
import { useListData } from "@/hooks/use-list-data";
import { useListActions } from "@/hooks/use-list-actions";
import { ListMetrics } from "@/components/ui/list-metrics";
import { DataViewControls } from "@/components/ui/data-view-controls";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UnifiedListContainerProps<T> {
  config: ListConfig<T>;
  data: T[];
  editDialog?: React.ComponentType<{
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: T | null;
  }>;
  additionalFilters?: React.ReactNode; // For custom filters like month selector
}

export function UnifiedListContainer<T>({
  config,
  data,
  editDialog: EditDialog,
  additionalFilters,
}: UnifiedListContainerProps<T>) {
  // View state
  const [viewMode, setViewMode] = useState<ViewMode>(
    config.defaultView || config.availableViews[0] || "list"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState(config.defaultSort);
  const [filters, setFilters] = useState<FilterState>(() => {
    // Initialize filters with default values
    const initialFilters: FilterState = {};
    config.filters?.forEach((filter) => {
      if (filter.defaultValue !== undefined) {
        initialFilters[filter.key] = filter.defaultValue;
      }
    });
    return initialFilters;
  });

  // Data processing
  const { filteredData, metrics, hasActiveFilters } = useListData({
    data,
    config,
    searchQuery,
    sortBy,
    filters,
  });

  // Action handlers
  const {
    editingItem,
    isEditDialogOpen,
    deletingItemId,
    isDeleteDialogOpen,
    handleEdit,
    handleDelete,
    confirmDelete,
    cancelEdit,
    cancelDelete,
    setIsEditDialogOpen,
  } = useListActions<T>({
    actions: config.actions,
    itemName: config.title.toLowerCase(),
  });

  // Handle view mode change
  const handleViewModeChange = (mode: ViewMode) => {
    if (config.availableViews.includes(mode)) {
      setViewMode(mode);
    }
  };

  // Handle filter changes
  const handleFilterChange = (
    key: string,
    value: string | number | boolean
  ) => {
    setFilters((prev: FilterState) => ({
      ...prev,
      [key]: value as string | boolean | string[] | [Date, Date],
    }));
  };

  // Get primary filter for DataViewControls (if exists)
  const primaryFilter = config.filters?.[0];
  const primaryFilterValue = primaryFilter
    ? (filters[primaryFilter.key] as string) || "all"
    : "all";

  return (
    <div className="space-y-3">
      {/* Metrics */}
      {config.metrics && config.metrics.length > 0 && (
        <ListMetrics metrics={config.metrics} values={metrics} />
      )}

      {/* Main container */}
      <div className="space-y-3">
        {/* Header with title and additional filters */}
        <div className="flex items-center justify-between">
          <div className="font-semibold text-lg">{config.title}</div>
          {additionalFilters}
        </div>

        {/* Controls */}
        <DataViewControls
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder={config.searchPlaceholder}
          sortValue={sortBy}
          onSortChange={setSortBy}
          sortOptions={config.sortOptions}
          filterValue={primaryFilterValue}
          onFilterChange={
            primaryFilter
              ? (value) => handleFilterChange(primaryFilter.key, value)
              : undefined
          }
          filterOptions={
            primaryFilter?.options
              ? [{ value: "all", label: "All" }, ...primaryFilter.options]
              : undefined
          }
          filterLabel={primaryFilter?.label}
          totalCount={data.length}
          filteredCount={filteredData.length}
          availableViews={config.availableViews}
        />

        {/* Additional filters (if any) */}
        {config.filters && config.filters.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {config.filters.slice(1).map((filter) => {
              if (filter.type === "select" && filter.options) {
                return (
                  <Select
                    key={filter.key}
                    value={(filters[filter.key] as string) || "all"}
                    onValueChange={(value) =>
                      handleFilterChange(filter.key, value)
                    }
                  >
                    <SelectTrigger className="w-[160px] h-8 text-xs">
                      <SelectValue placeholder={filter.label} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All {filter.label}</SelectItem>
                      {filter.options.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                          className="text-xs"
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                );
              }
              // Add support for other filter types here (multi-select, date-range, etc.)
              return null;
            })}
          </div>
        )}

        {/* Empty state */}
        {filteredData.length === 0 && (
          <div className="text-center text-muted-foreground py-12">
            {hasActiveFilters ? (
              <p className="text-sm">
                {config.emptyMessageFiltered ||
                  "No items found matching your filters"}
              </p>
            ) : (
              <p className="text-sm">{config.emptyMessage}</p>
            )}
          </div>
        )}

        {/* Table view */}
        {filteredData.length > 0 &&
          viewMode === "table" &&
          config.tableColumns && (
            <DataTable
              columns={config.tableColumns}
              data={filteredData}
              onEdit={
                config.actions?.edit ? (item: T) => handleEdit(item) : undefined
              }
              onDelete={
                config.actions?.delete
                  ? (id: string) => handleDelete(id)
                  : undefined
              }
            />
          )}

        {/* List view */}
        {filteredData.length > 0 && viewMode === "list" && (
          <div className="space-y-2">
            {filteredData.map((item, index) =>
              config.renderListItem(item, index, {
                onEdit: config.actions?.edit
                  ? () => handleEdit(item)
                  : undefined,
                onDelete: config.actions?.delete
                  ? () => handleDelete(config.getItemId(item))
                  : undefined,
                customActions: config.actions?.custom,
              })
            )}
          </div>
        )}

        {/* Grid view */}
        {filteredData.length > 0 && viewMode === "grid" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredData.map((item, index) =>
              config.renderGridCard(item, index, {
                onEdit: config.actions?.edit
                  ? () => handleEdit(item)
                  : undefined,
                onDelete: config.actions?.delete
                  ? () => handleDelete(config.getItemId(item))
                  : undefined,
                customActions: config.actions?.custom,
              })
            )}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      {EditDialog && (
        <EditDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          item={editingItem}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={cancelDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this{" "}
              {config.title.toLowerCase()}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
