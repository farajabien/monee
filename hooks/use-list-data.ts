/**
 * useListData Hook
 *
 * Generic hook for filtering, sorting, and searching list data
 * Handles all common list operations in one place
 */

import { useMemo } from "react";
import type { ListConfig, FilterState, MetricValues } from "@/types/list-config";

interface UseListDataProps<T> {
  data: T[];
  config: ListConfig<T>;
  searchQuery: string;
  sortBy: string;
  filters: FilterState;
}

interface UseListDataReturn<T> {
  filteredData: T[];
  metrics: MetricValues;
  hasActiveFilters: boolean;
}

export function useListData<T>({
  data,
  config,
  searchQuery,
  sortBy,
  filters,
}: UseListDataProps<T>): UseListDataReturn<T> {
  // Apply search filter
  const searchFiltered = useMemo(() => {
    if (!searchQuery) return data;

    return data.filter((item) => {
      // Use custom filter if provided
      if (config.customFilter) {
        return config.customFilter(item, searchQuery, filters);
      }

      // Default search: check searchFields if defined
      if (config.searchFields && config.searchFields.length > 0) {
        return config.searchFields.some((field) => {
          const value = item[field];
          if (typeof value === "string") {
            return value.toLowerCase().includes(searchQuery.toLowerCase());
          }
          if (typeof value === "number") {
            return value.toString().includes(searchQuery);
          }
          return false;
        });
      }

      // Fallback: search all string fields
      return Object.values(item).some((value) => {
        if (typeof value === "string") {
          return value.toLowerCase().includes(searchQuery.toLowerCase());
        }
        if (typeof value === "number") {
          return value.toString().includes(searchQuery);
        }
        return false;
      });
    });
  }, [data, searchQuery, config, filters]);

  // Apply additional filters
  const filtered = useMemo(() => {
    if (!config.filters || config.filters.length === 0) return searchFiltered;

    return searchFiltered.filter((item) => {
      return config.filters!.every((filterConfig) => {
        const filterValue = filters[filterConfig.key];

        // No filter applied for this key
        if (
          filterValue === undefined ||
          filterValue === "all" ||
          (Array.isArray(filterValue) && filterValue.length === 0)
        ) {
          return true;
        }

        const itemValue = (item as any)[filterConfig.key];

        // Handle different filter types
        switch (filterConfig.type) {
          case "select":
            return itemValue === filterValue;

          case "multi-select":
            if (Array.isArray(filterValue)) {
              return filterValue.includes(itemValue);
            }
            return true;

          case "boolean":
            return itemValue === filterValue;

          case "month-select":
            // Assume item has a date field and filterValue is "YYYY-MM"
            if (typeof itemValue === "number") {
              const date = new Date(itemValue);
              const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
              return monthKey === filterValue;
            }
            return true;

          case "date-range":
            // Assume filterValue is [Date, Date]
            if (Array.isArray(filterValue) && filterValue.length === 2 && typeof itemValue === "number") {
              const itemDate = new Date(itemValue);
              const [start, end] = filterValue;
              return itemDate >= start && itemDate <= end;
            }
            return true;

          default:
            return true;
        }
      });
    });
  }, [searchFiltered, config.filters, filters]);

  // Apply sorting
  const sorted = useMemo(() => {
    const result = [...filtered];

    // Use custom sort if provided
    if (config.customSort) {
      return result.sort((a, b) => config.customSort!(a, b, sortBy));
    }

    // Default sorting logic
    const sortOption = config.sortOptions.find((opt) => opt.value === sortBy);
    if (!sortOption) return result;

    // Extract sort key and direction from sortBy value
    // Convention: "field-asc", "field-desc", or just "field" (defaults to desc)
    const parts = sortBy.split("-");
    const field = parts[0];
    const direction = parts[1] || "desc";

    result.sort((a, b) => {
      const aValue = (a as any)[field];
      const bValue = (b as any)[field];

      // Handle null/undefined
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      // Handle different types
      if (typeof aValue === "string" && typeof bValue === "string") {
        const comparison = aValue.localeCompare(bValue);
        return direction === "asc" ? comparison : -comparison;
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return direction === "asc" ? aValue - bValue : bValue - aValue;
      }

      // Default comparison
      return 0;
    });

    return result;
  }, [filtered, sortBy, config]);

  // Calculate metrics
  const metrics = useMemo(() => {
    if (!config.calculateMetrics) return {};
    return config.calculateMetrics(filtered);
  }, [filtered, config]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      searchQuery.length > 0 ||
      Object.entries(filters).some(([key, value]) => {
        if (value === undefined || value === "all") return false;
        if (Array.isArray(value) && value.length === 0) return false;
        return true;
      })
    );
  }, [searchQuery, filters]);

  return {
    filteredData: sorted,
    metrics,
    hasActiveFilters,
  };
}
