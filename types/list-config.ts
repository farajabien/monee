/**
 * Unified List Configuration System
 *
 * Defines the structure for configuring any list view in the app
 * (Expenses, Debts, Income, Budgets, Savings, etc.)
 */

import { LucideIcon } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

export type ViewMode = "list" | "grid" | "table";

export type FilterType = "select" | "multi-select" | "month-select" | "date-range" | "boolean";

export type MetricType = "currency" | "count" | "percentage" | "average";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: FilterType;
  options?: FilterOption[];  // For select/multi-select
  defaultValue?: string | string[];
}

export interface SortOption {
  value: string;
  label: string;
}

export interface MetricConfig {
  key: string;
  label: string;
  type: MetricType;
  icon?: LucideIcon | string;
  format?: (value: number) => string;
  className?: string;
}

export interface MetadataField {
  label: string;
  value: string | React.ReactNode;
  icon?: LucideIcon;
}

export interface CustomAction<T = any> {
  label: string;
  icon?: LucideIcon;
  onClick: (item: T) => void | Promise<void>;
  variant?: "default" | "outline" | "ghost" | "destructive";
  condition?: (item: T) => boolean;  // Show action conditionally
}

export interface ActionConfig {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
}

export interface ListActions<T = any> {
  create?: ActionConfig;
  edit?: (item: T) => void | Promise<void>;
  delete?: (id: string) => Promise<void>;
  custom?: CustomAction<T>[];
}

/**
 * Main List Configuration Interface
 *
 * Generic type T represents the entity type (Expense, Debt, Income, etc.)
 */
export interface ListConfig<T = any> {
  // Identity
  queryKey: string;                    // Entity name for InstantDB query

  // Display
  title: string;
  description?: string;
  emptyMessage: string;
  emptyMessageFiltered?: string;       // When filters are applied but no results
  searchPlaceholder: string;

  // Filters & Sort
  filters?: FilterConfig[];
  sortOptions: SortOption[];
  defaultSort: string;
  searchFields?: (keyof T)[];          // Fields to search in

  // Metrics (optional - displayed as badges at top)
  metrics?: MetricConfig[];
  calculateMetrics?: (items: T[]) => Record<string, number>;

  // Views
  availableViews: ViewMode[];
  defaultView?: ViewMode;

  // Rendering Functions
  renderListItem: (item: T, index: number, actions: {
    onEdit?: () => void;
    onDelete?: () => void;
    customActions?: CustomAction<T>[];
  }) => React.ReactNode;

  renderGridCard?: (item: T, index: number, actions: {
    onEdit?: () => void;
    onDelete?: () => void;
    customActions?: CustomAction<T>[];
  }) => React.ReactNode;

  tableColumns?: ColumnDef<T>[];      // For table view (optional)

  // Actions
  actions?: ListActions<T>;

  // Data transformation
  getItemId: (item: T) => string;

  // Custom filter function (if default search isn't enough)
  customFilter?: (item: T, searchQuery: string, filters: Record<string, any>) => boolean;

  // Custom sort function (if default sorting isn't enough)
  customSort?: (a: T, b: T, sortBy: string) => number;
}

/**
 * Helper type for extracting metric values from calculated metrics
 */
export type MetricValues = Record<string, number>;

/**
 * Filter state type
 */
export type FilterState = Record<string, string | string[] | boolean | [Date, Date]>;
