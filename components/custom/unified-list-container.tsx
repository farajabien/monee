/**
 * UnifiedListContainer Component
 *
 * Main orchestrator for all list views
 * Handles view modes, filters, sorting, and rendering
 */

"use client";

import { useState, useMemo } from "react";
import type { ListConfig, FilterState, ViewMode } from "@/types/list-config";
import { useListData } from "@/hooks/use-list-data";
import { useListActions } from "@/hooks/use-list-actions";
import { ListMetrics } from "@/components/custom/list-metrics";
import { DataViewControls } from "@/components/ui/data-view-controls";
import { DataTable } from "@/components/ui/data-table";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { Button } from "../ui/button";

interface UnifiedListContainerProps<T> {
  config: ListConfig<T>;
  data: T[];
  editDialog?: React.ComponentType<{
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: T | null;
  }>;
  additionalFilters?: React.ReactNode; // For custom filters like month selector
  headerActions?: React.ReactNode; // For custom actions like import buttons
  editingItem?: T | null;
  onEditingChange?: (item: T | null) => void;
}

export function UnifiedListContainer<T extends Record<string, unknown>>({
  config,
  data,
  editDialog: EditDialog,
  additionalFilters,
  headerActions,
  editingItem: externalEditingItem,
  onEditingChange,
}: UnifiedListContainerProps<T>) {
  // View state - default to list view for better mobile experience
  const [viewMode, setViewMode] = useState<ViewMode>("list");
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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Data processing
  const { filteredData, metrics, hasActiveFilters } = useListData({
    data,
    config,
    searchQuery,
    sortBy,
    filters,
  });

  // Pagination logic - memoized to avoid unnecessary recalculations
  const { paginatedData, totalPages, displayedRange } = useMemo(() => {
    const totalItems = filteredData.length;
    const pages = Math.ceil(totalItems / pageSize) || 1;

    // Ensure currentPage doesn't exceed available pages
    const safePage = Math.min(currentPage, pages);

    const startIndex = (safePage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginated = filteredData.slice(startIndex, endIndex);

    return {
      paginatedData: paginated,
      totalPages: pages,
      displayedRange: {
        start: totalItems === 0 ? 0 : startIndex + 1,
        end: Math.min(endIndex, totalItems),
        total: totalItems,
      },
    };
  }, [filteredData, currentPage, pageSize]);

  // Action handlers
  const {
    editingItem: internalEditingItem,
    isEditDialogOpen,
    deletingItemId,
    isDeleteDialogOpen,
    handleEdit,
    handleDelete,
    confirmDelete,
    cancelDelete,
    setIsEditDialogOpen,
  } = useListActions<T>({
    actions: config.actions,
    itemName: config.title.toLowerCase(),
  });

  // Use external editing state if provided, otherwise use internal
  const editingItem = externalEditingItem ?? internalEditingItem;
  const effectiveIsEditDialogOpen = externalEditingItem
    ? !!externalEditingItem
    : isEditDialogOpen;

  const handleEditWrapper = (item: T) => {
    if (onEditingChange) {
      onEditingChange(item);
    } else {
      handleEdit(item);
    }
  };

  const handleEditDialogClose = (open: boolean) => {
    if (onEditingChange) {
      if (!open) {
        onEditingChange(null);
      }
    } else {
      setIsEditDialogOpen(open);
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
    setCurrentPage(1); // Reset to first page when filter changes
  };

  // Get primary filter for DataViewControls (if exists)
  const primaryFilter = config.filters?.[0];
  const primaryFilterValue = primaryFilter
    ? (filters[primaryFilter.key] as string) || "all"
    : "all";

  // Get the item being deleted for context-aware dialog
  const deletingItem = useMemo(() => {
    if (!deletingItemId) return null;
    return data.find((item) => config.getItemId(item) === deletingItemId);
  }, [deletingItemId, data, config]);

  // Get display name for the item being deleted
  const deletingItemName = useMemo(() => {
    if (!deletingItem) return "";
    // Try to get name from common properties
    const item = deletingItem as T & {
      name?: string;
      title?: string;
      handle?: string;
    };
    return item.name || item.title || item.handle || "";
  }, [deletingItem]);

  return (
    <div className="space-y-2 w-full overflow-hidden">
      {/* Row 1: Header Actions (if exist) + Pagination */}
      {headerActions && (
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Header Actions */}
          <div className="flex gap-2 shrink-0">{headerActions}</div>

          {/* Pagination Controls on same line as header actions */}
          {filteredData.length > 0 && (
            <div className="flex items-center gap-1 shrink-0 ml-auto">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 px-2 text-xs"
              >
                Prev
              </Button>
              <span className="text-xs px-2 whitespace-nowrap">
                {currentPage}/{totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage >= totalPages}
                className="h-8 px-2 text-xs"
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Row 2: Search, Sort, View Toggle */}
      <DataViewControls
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        availableViews={config.availableViews}
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
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        displayedRange={displayedRange}
      />

      {/* Row 3: Metrics (if exists) - combined with item count */}
      {config.metrics && config.metrics.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <ListMetrics metrics={config.metrics} values={metrics} />
          <span className="text-muted-foreground/50">•</span>
          <span className="text-sm text-muted-foreground">
            {filteredData.length}{" "}
            {filteredData.length === 1 ? "item" : "items"}
          </span>
        </div>
      )}

      {/* Additional filters if provided */}
      {additionalFilters && (
        <div className="flex items-center justify-end">
          <div className="flex-shrink-0">{additionalFilters}</div>
        </div>
      )}

      {/* Main container */}
      <div className="w-full">
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
                    <SelectTrigger className="w-[140px] h-9 text-sm">
                      <SelectValue placeholder={filter.label} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All {filter.label}</SelectItem>
                      {filter.options.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                          className="text-sm"
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
          <div className="flex items-center justify-center py-12 px-4">
            <div className="text-center space-y-1">
              <p className="text-sm text-muted-foreground">
                {hasActiveFilters
                  ? config.emptyMessageFiltered ||
                    "No items found matching your filters"
                  : config.emptyMessage}
              </p>
            </div>
          </div>
        )}

        {/* List/Grid/Table view - Prioritize list view with scroll area */}
        {filteredData.length > 0 && (
          <div className="w-full overflow-hidden">
            {viewMode === "table" && config.tableColumns ? (
              <ScrollArea className="h-[600px] w-full rounded-md border">
                <div className="w-full">
                  <DataTable
                    columns={config.tableColumns}
                    data={filteredData}
                    onEdit={
                      config.actions?.edit
                        ? (item) => handleEditWrapper(item)
                        : undefined
                    }
                    onDelete={
                      config.actions?.delete
                        ? (id) => handleDelete(id)
                        : undefined
                    }
                  />
                </div>
              </ScrollArea>
            ) : viewMode === "grid" && config.renderGridCard ? (
              <>
                <ScrollArea className="h-[600px] w-full">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-1">
                    {paginatedData.map((item, index) => (
                      <div key={config.getItemId(item)}>
                        {config.renderGridCard!(
                          item,
                          (currentPage - 1) * pageSize + index,
                          {
                            onEdit: config.actions?.edit
                              ? () => handleEditWrapper(item)
                              : undefined,
                            onDelete: config.actions?.delete
                              ? () => handleDelete(config.getItemId(item))
                              : undefined,
                            customActions: config.actions?.custom,
                          }
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                {/* Pagination for Grid View - Bottom */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 py-3 border-t">
                  <span className="text-sm text-muted-foreground">
                    {displayedRange.start}-{displayedRange.end} of{" "}
                    {displayedRange.total}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage >= totalPages}
                      className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <ScrollArea className="h-[600px] w-full">
                  <div className="space-y-1.5 p-1">
                    {paginatedData.map((item, index) => (
                      <div key={config.getItemId(item)}>
                        {config.renderListItem(
                          item,
                          (currentPage - 1) * pageSize + index,
                          {
                            onEdit: config.actions?.edit
                              ? () => handleEditWrapper(item)
                              : undefined,
                            onDelete: config.actions?.delete
                              ? () => handleDelete(config.getItemId(item))
                              : undefined,
                            customActions: config.actions?.custom,
                          }
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                {/* Pagination for List View - Bottom */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 py-3 border-t">
                  <span className="text-sm text-muted-foreground">
                    {displayedRange.start}-{displayedRange.end} of{" "}
                    {displayedRange.total}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage >= totalPages}
                      className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      {EditDialog && (
        <EditDialog
          open={effectiveIsEditDialogOpen}
          onOpenChange={handleEditDialogClose}
          item={editingItem}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={cancelDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete
              {deletingItemName ? (
                <>
                  {" "}
                  <span className="font-semibold">
                    &ldquo;{deletingItemName}&rdquo;
                  </span>
                </>
              ) : (
                <> this {config.title.toLowerCase()}</>
              )}
              .
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
